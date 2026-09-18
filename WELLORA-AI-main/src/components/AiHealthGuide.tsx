import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  MessageSquare,
  CornerDownLeft,
  Loader2,
  RotateCcw,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  GitFork,
  Tag,
} from 'lucide-react';
import { ChatMessage, ConsultationPhase, IntentLabel, UserHealthProfile } from '../types';
import { ChatBubble } from './ChatBubble';
import { useRateLimit } from '../context/RateLimitContext';
import {
  detectEmergencyTrigger,
  buildEmergencyResponse,
  parseUrgency,
  ensureDisclaimer,
  countClarifyingQuestions,
  isNewSymptomReport,
  detectPhase,
  generateSuggestedAnswers,
} from '../utils/healthFilter';

const SUGGESTED_QUERIES = [
  "What's a good post-workout meal?",
  "I've had a headache for two days.",
  "I feel a bit off today.",
  "I have chest pain and I'm having trouble breathing.",
];

interface AiHealthGuideProps {
  onNavigateToIntentRouting?: () => void;
  userProfile?: UserHealthProfile;
}

export const AiHealthGuide: React.FC<AiHealthGuideProps> = ({ onNavigateToIntentRouting, userProfile }) => {
  const { attemptRequest, isCoolingDown, rateLimitWait } = useRateLimit();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sub-feature 2.1 & 2.4: Small toggle for debug intent tag (default OFF as requested)
  const [showDebugIntent, setShowDebugIntent] = useState<boolean>(false);

  // Sub-feature 2.2: Ambiguous clarification memory
  const [pendingAmbiguousClarification, setPendingAmbiguousClarification] = useState<{
    originalMessage: string;
  } | null>(null);

  // Track the number of cross-questions asked for the current symptom report (max 3)
  const [clarifyingQuestionCount, setClarifyingQuestionCount] = useState<number>(0);
  // Track user queries belonging to the current symptom report
  const [currentSymptomMessages, setCurrentSymptomMessages] = useState<string[]>([]);
  // Current consultation phase
  const [consultationPhase, setConsultationPhase] = useState<ConsultationPhase>('cross-questioning');

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat history to the bottom whenever messages change or loading state toggles
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  const handleResetConversation = () => {
    setMessages([]);
    setClarifyingQuestionCount(0);
    setCurrentSymptomMessages([]);
    setConsultationPhase('cross-questioning');
    setPendingAmbiguousClarification(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  /**
   * Main submission handler implementing:
   * 1. Emergency trigger screening (patient safety first)
   * 2. Sub-feature 2.1 & 2.3: Separate Gemini classifier call at temperature: 0
   * 3. Sub-feature 2.2: Ambiguous clarification flow (asks 1 question, re-classifies follow-up)
   * 4. Sub-feature 2.4: Route handoff (wellness coach vs clinical safety triage + profile context)
   * 5. Cross-questioning feature (few questions only: 1 to 3) & Holistic Solution delivery
   */
  const handleSendMessage = async (queryText?: string, forceSolution = false) => {
    const rawText = (queryText || inputText).trim();
    if (!rawText || isLoading) return;

    const req = attemptRequest();
    if (!req.allowed) return;

    // Check if user is asking for the solution directly
    const userWantsSolution =
      forceSolution ||
      /give solution|solution now|skip to solution|skip questions|what is the solution|give me the solution/i.test(
        rawText
      );

    setInputText('');
    setError(null);

    const isFollowUpToAmbiguous = Boolean(pendingAmbiguousClarification);
    const originalAmbiguousText = pendingAmbiguousClarification?.originalMessage || '';

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: rawText,
      timestamp: now,
    };

    // Check if user is starting a substantially new symptom report
    const isNewReport = isNewSymptomReport(rawText, currentSymptomMessages);
    let activeQuestionCount = clarifyingQuestionCount;
    let activeSymptomMsgs = [...currentSymptomMessages, rawText];

    if (isNewReport && !isFollowUpToAmbiguous) {
      activeQuestionCount = 0;
      activeSymptomMsgs = [rawText];
      setConsultationPhase('cross-questioning');
    }

    setClarifyingQuestionCount(activeQuestionCount);
    setCurrentSymptomMessages(activeSymptomMsgs);

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    // Step 1: Emergency trigger screening BEFORE normal classification
    if (detectEmergencyTrigger(rawText)) {
      const rawEmergency = buildEmergencyResponse();
      const { urgency, cleanText } = parseUrgency(rawEmergency);
      const withDisclaimer = ensureDisclaimer(cleanText);

      const emergencyAssistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: withDisclaimer,
        rawText: rawEmergency,
        urgency: 'EMERGENCY',
        isEmergency: true,
        intentLabel: 'triage',
        phase: 'emergency',
        questionCountInMessage: 0,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConsultationPhase('emergency');
      setPendingAmbiguousClarification(null);
      setMessages([...updatedMessages, emergencyAssistantMsg]);
      return;
    }

    setIsLoading(true);

    try {
      // Lightweight Health Pre-check
      try {
        const precheckRes = await fetch('/api/precheck', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: rawText }),
        });
        if (precheckRes.ok) {
          const precheckData = await precheckRes.json();
          if (precheckData.isHealthRelated === false) {
            const redirectMsg: ChatMessage = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              text: "I'm a health and wellness assistant, so I'm not able to help with that. Is there anything about your health, fitness, nutrition, or wellbeing I can help with instead?",
              intentLabel: 'wellness', // Safe fallback intent
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages([...updatedMessages, redirectMsg]);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Precheck failed, proceeding:', err);
      }

      // Sub-feature 2.1 & 2.3: Separate Gemini classifier call at temperature: 0
      let intentLabel: IntentLabel = 'wellness';
      try {
        const classRes = await fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: rawText,
            isFollowUp: isFollowUpToAmbiguous,
            originalMessage: originalAmbiguousText,
          }),
        });
        if (classRes.ok) {
          const classData = await classRes.json();
          intentLabel = classData.intentLabel || 'wellness';
        }
      } catch (err) {
        console.warn('Classifier fetch error, falling back:', err);
      }

      // Tag user message with detected intent
      userMsg.intentLabel = intentLabel;

      // Sub-feature 2.2: Ambiguous handling
      // When classified as ambiguous and not yet a follow-up answer, do NOT guess — ask ONE short clarifying question first
      if (intentLabel === 'ambiguous' && !isFollowUpToAmbiguous) {
        const clarifyRes = await fetch('/api/clarify-ambiguous', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: rawText }),
        });

        let clarifyingQ =
          "Are you experiencing any other symptoms along with this, or is this affecting your daily activities?";
        if (clarifyRes.ok) {
          const clarifyData = await clarifyRes.json();
          if (clarifyData.clarifyingQuestion) {
            clarifyingQ = clarifyData.clarifyingQuestion;
          }
        }

        const ambiguousAssistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: clarifyingQ,
          rawText: clarifyingQ,
          intentLabel: 'ambiguous',
          isClarifyingQuestion: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        // Store state so when the user replies, we combine both messages and re-classify
        setPendingAmbiguousClarification({ originalMessage: rawText });
        setMessages([...updatedMessages, ambiguousAssistantMsg]);
        setIsLoading(false);
        return;
      }

      // If we got here, this is either direct wellness/triage or a follow-up clarification reply
      // Clear pending ambiguous state
      setPendingAmbiguousClarification(null);

      // Sub-feature 2.4: Route handoff
      // Prepare message history for downstream call
      const apiPayloadMessages = updatedMessages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        text: m.rawText || m.text,
      }));

      const shouldForceSolution = userWantsSolution || activeQuestionCount >= 3;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiPayloadMessages,
          intentLabel,
          isClarificationReply: isFollowUpToAmbiguous,
          originalAmbiguousMessage: originalAmbiguousText,
          userProfile,
          forceNoQuestions: shouldForceSolution,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned error ${res.status}`);
      }

      const data = await res.json();
      let rawResponse: string = data.text || '';
      const resolvedIntent: IntentLabel = data.intentLabel || intentLabel;

      // ROUTE A: WELLNESS COACH (Friendly fitness & nutrition coach)
      if (resolvedIntent === 'wellness') {
        let textToDisplay = rawResponse;
        let adjustment;

        // Sub-feature 4.4: Parse visible flagging
        const adjustmentMatch = textToDisplay.match(/^\[ADJUSTED for (.*?): (.*?)\]\s*/i);
        if (adjustmentMatch) {
          adjustment = { condition: adjustmentMatch[1], reason: adjustmentMatch[2] };
          textToDisplay = textToDisplay.replace(/^\[ADJUSTED for (.*?): (.*?)\]\s*/i, '').trim();
        }

        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: textToDisplay,
          rawText: rawResponse,
          intentLabel: 'wellness',
          adjustment,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages([...updatedMessages, assistantMsg]);
        setIsLoading(false);
        return;
      }

      // ROUTE B: CLINICAL SAFETY TRIAGE (Feature 1 Clinical System Instruction)
      const questionsInResponse = countClarifyingQuestions(rawResponse);
      const totalQuestionsAfter = activeQuestionCount + questionsInResponse;

      // Three-Question Safety Enforcement
      if (
        !shouldForceSolution &&
        (totalQuestionsAfter > 3 || (activeQuestionCount >= 3 && questionsInResponse > 0))
      ) {
        const enforcementPrompt =
          'The cross-questioning phase is now complete. Do not ask any more questions. Provide your best-effort urgency classification and comprehensive ### 🌿 Holistic Solution & Care Plan now using only the information already provided.';

        const followUpPayload = [
          ...apiPayloadMessages,
          { role: 'user', text: enforcementPrompt },
        ];

        const followUpRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: followUpPayload,
            intentLabel: 'triage',
            userProfile,
            forceNoQuestions: true,
          }),
        });

        if (followUpRes.ok) {
          const followUpData = await followUpRes.json();
          if (followUpData.text) {
            rawResponse = followUpData.text;
          }
        }
        activeQuestionCount = 3;
      } else if (!shouldForceSolution && questionsInResponse > 0) {
        activeQuestionCount = Math.min(3, activeQuestionCount + 1);
      } else if (shouldForceSolution) {
        activeQuestionCount = 3;
      }

      setClarifyingQuestionCount(activeQuestionCount);

      // Extract urgency classification and clean text
      const { urgency, cleanText } = parseUrgency(rawResponse);
      const isEmergency = urgency === 'EMERGENCY' || detectEmergencyTrigger(cleanText);
      const finalVerifiedText = ensureDisclaimer(cleanText);

      // Detect Phase: cross-questioning vs solution
      const phase = detectPhase(finalVerifiedText, isEmergency, activeQuestionCount);
      setConsultationPhase(phase);

      // Generate context-aware quick answer chips for cross-questioning
      const suggestedAnswers =
        phase === 'cross-questioning' ? generateSuggestedAnswers(finalVerifiedText) : [];

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: finalVerifiedText,
        rawText: rawResponse,
        urgency,
        isEmergency,
        intentLabel: 'triage',
        phase,
        suggestedAnswers,
        crossQuestionNumber: activeQuestionCount,
        questionCountInMessage: questionsInResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages([...updatedMessages, assistantMsg]);
    } catch (err: any) {
      console.error('Failed to get health guide response:', err);
      setError(
        err?.message || 'Unable to connect to the wellness assistant. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    if (suggestion.toLowerCase().includes('solution now')) {
      handleSendMessage(suggestion, true);
    } else {
      handleSendMessage(suggestion);
    }
  };

  // Find index of the latest assistant message to attach quick reply buttons to it
  const lastAssistantIndex = messages.map((m) => m.role).lastIndexOf('assistant');

  return (
    <section id="ai-health-guide-section" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-cream-soft">AI Health Guide</h3>
          <p className="text-xs text-beige-light/80">
            Pre-flight Intent Classification • Holistic Care Planning • Clinical Triage Safety
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sub-feature 2.4: Small toggle for debug intent tag */}
          <button
            onClick={() => setShowDebugIntent(!showDebugIntent)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              showDebugIntent
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                : 'bg-olive-canvas/80 text-cream-soft/80 border-olive-light/40 hover:text-cream-soft'
            }`}
            title="Toggle debug intent classification tags on messages"
          >
            <Tag className="w-3 h-3" />
            <span>Debug Intent: {showDebugIntent ? 'ON' : 'OFF'}</span>
          </button>

          {onNavigateToIntentRouting && (
            <button
              onClick={onNavigateToIntentRouting}
              className="text-xs font-medium text-cream-soft px-3 py-1 rounded-full bg-olive-canvas/80 border border-olive-light/40 hover:bg-olive transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Open Intent Routing Architecture section"
            >
              <GitFork className="w-3 h-3 text-olive-light" />
              <span>Intent Routing Engine</span>
            </button>
          )}

          {messages.length > 0 && (
            <button
              onClick={handleResetConversation}
              className="text-xs font-medium text-cream-soft px-3 py-1 rounded-full bg-olive-canvas/80 border border-olive-light/40 hover:bg-olive transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Reset conversation and question counter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Large AI Assistant Container */}
      <div className="rounded-3xl bg-cream-soft border border-wellness-border/80 shadow-xs overflow-hidden flex flex-col h-[540px]">
        {/* Assistant Header */}
        <div className="px-6 py-4 border-b border-wellness-border/60 bg-cream-soft flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-olive flex items-center justify-center text-cream-soft shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-wellness-dark flex items-center gap-2">
                <span>Holistic AI Guide</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {showDebugIntent && (
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Debug Tags Active
                  </span>
                )}
              </div>
              <div className="text-xs text-wellness-muted">
                Pre-flight classifier active • Targeted cross-questioning • Holistic solutions
              </div>
            </div>
          </div>

          {/* Cross-Questioning Progress Indicator or Ambiguous Status */}
          <div className="flex items-center gap-2 text-xs">
            {pendingAmbiguousClarification ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 font-medium text-[11px] shadow-2xs">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Clarification in Progress</span>
              </span>
            ) : consultationPhase === 'solution' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-medium text-[11px] shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Solution Phase</span>
              </span>
            ) : clarifyingQuestionCount > 0 ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-medium text-[11px] shadow-2xs">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Cross-Questioning: {clarifyingQuestionCount}/3</span>
                </span>
                <button
                  onClick={() => handleSendMessage('Give Solution Now', true)}
                  disabled={isLoading}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-olive/10 text-olive hover:bg-olive hover:text-cream-soft border border-olive/20 font-medium text-[11px] transition-all cursor-pointer shadow-2xs"
                  title="Skip further questions and get the solution immediately"
                >
                  <span>Skip to Solution</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Scrollable Chat Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 p-4 sm:p-6 overflow-y-auto bg-beige-cream/20 flex flex-col space-y-1 min-h-0"
        >
          {messages.length === 0 ? (
            /* Empty State with Suggested Queries */
            <div className="my-auto flex flex-col items-center justify-center text-center py-6">
              <div className="w-16 h-16 rounded-3xl bg-cream-soft border border-wellness-border flex items-center justify-center text-olive mb-4 shadow-sm">
                <MessageSquare className="w-8 h-8 stroke-1 text-olive" />
              </div>
              <h4 className="text-base font-semibold text-wellness-dark">
                How can I guide your health & wellness today?
              </h4>
              <p className="text-xs text-wellness-muted max-w-md mt-1 mb-6">
                Ask a fitness/nutrition question or describe your symptoms. The system classifies intent deterministically, asks quick cross-questions when needed, and routes to the right advice.
              </p>

              {/* Clickable Suggested Queries */}
              <div className="w-full max-w-lg space-y-2 text-left">
                <div className="text-[11px] font-semibold text-wellness-muted uppercase tracking-wider">
                  Suggested Inquiries:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_QUERIES.map((query, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(query)}
                      className="px-3.5 py-2.5 rounded-xl bg-cream-soft border border-wellness-border/80 text-xs text-wellness-dark/80 hover:border-olive hover:text-wellness-dark hover:bg-beige-cream/40 transition-all text-left flex items-center justify-between cursor-pointer shadow-xs group"
                    >
                      <span className="truncate mr-1.5">{query}</span>
                      <Sparkles className="w-3 h-3 text-olive/50 group-hover:text-olive shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Active Message List */
            <div className="space-y-2">
              {messages.map((msg, index) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isLatestAssistantMessage={index === lastAssistantIndex}
                  onSelectSuggestion={handleSelectSuggestion}
                  showDebugIntent={showDebugIntent}
                />
              ))}

              {/* Live Loading State */}
              {isLoading && (
                <div className="flex items-center gap-2.5 my-3 text-wellness-muted text-xs">
                  <div className="w-7 h-7 rounded-xl bg-olive/20 text-olive flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cream-soft border border-wellness-border shadow-2xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-olive" />
                    <span>
                      {pendingAmbiguousClarification
                        ? 'Evaluating clarification & determining final route...'
                        : consultationPhase === 'solution' || clarifyingQuestionCount >= 2
                        ? 'Synthesizing answers and preparing holistic care plan...'
                        : 'Classifying intent (T=0) & routing downstream...'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between my-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-[11px] underline font-medium hover:text-red-900 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Rate Limit Spam Banner */}
          {rateLimitWait > 0 && (
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-xs flex items-center justify-between my-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-orange-600" />
                <span className="font-medium">You're sending messages too quickly. Please wait a moment before trying again. ({rateLimitWait}s)</span>
              </div>
            </div>
          )}
        </div>

        {/* Message Input & Send Button Footer */}
        <div className="p-4 sm:p-5 border-t border-wellness-border/60 bg-cream-soft shrink-0">
          {/* Quick solution shortcut when in cross-questioning phase */}
          {clarifyingQuestionCount > 0 && consultationPhase === 'cross-questioning' && (
            <div className="mb-2 flex items-center justify-between text-xs px-1">
              <span className="text-[11px] text-wellness-muted">
                Cross-questioning in progress (max 3 questions)
              </span>
              <button
                onClick={() => handleSendMessage('Give Solution Now', true)}
                disabled={isLoading || isCoolingDown || rateLimitWait > 0}
                className="text-[11px] font-semibold text-olive hover:text-olive-light flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Ready for solution? Give Solution Now</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex items-center gap-2 bg-beige-cream/50 rounded-2xl border border-wellness-border p-1.5 focus-within:border-olive/60 focus-within:bg-cream-soft focus-within:shadow-xs transition-all"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (isCoolingDown || rateLimitWait > 0) return;
                  handleSendMessage();
                }
              }}
              disabled={isLoading || isCoolingDown || rateLimitWait > 0}
              placeholder={
                pendingAmbiguousClarification
                  ? 'Provide a quick follow-up detail to clarify...'
                  : clarifyingQuestionCount > 0 && consultationPhase === 'cross-questioning'
                  ? "Answer the question, or click 'Give Solution Now'..."
                  : 'Describe your symptoms or wellness question...'
              }
              className="flex-1 px-4 py-2.5 text-sm bg-transparent text-wellness-dark placeholder:text-wellness-muted focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim() || isCoolingDown || rateLimitWait > 0}
              aria-label="Send message"
              className="px-4 py-2.5 rounded-xl bg-olive text-cream-soft font-medium text-xs flex items-center gap-1.5 shadow-xs hover:bg-olive-light transition-all disabled:opacity-40 disabled:hover:bg-olive cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-between mt-2 px-2 text-[11px] text-wellness-muted">
            <span className="truncate">
              Non-diagnostic assistant • In life-threatening emergencies, call 911 or local emergency services
            </span>
            <span className="hidden sm:flex items-center gap-1 shrink-0 ml-2">
              <span>Press Enter</span>
              <CornerDownLeft className="w-3 h-3 opacity-60" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
