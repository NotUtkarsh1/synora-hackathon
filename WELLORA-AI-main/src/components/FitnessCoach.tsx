import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, MessageSquare, CornerDownLeft, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';
import { ChatMessage, UserHealthProfile } from '../types';
import { ChatBubble } from './ChatBubble';
import { useRateLimit } from '../context/RateLimitContext';

interface FitnessCoachProps {
  userProfile?: UserHealthProfile;
}

const SUGGESTED_QUERIES = [
  "Build a 3-day full body workout plan.",
  "How can I improve my squat form?",
  "What are the best exercises for core strength?",
  "Suggest a quick 15-minute HIIT routine.",
];

export const FitnessCoach: React.FC<FitnessCoachProps> = ({ userProfile }) => {
  const { attemptRequest, isCoolingDown, rateLimitWait } = useRateLimit();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const rawText = (queryText || inputText).trim();
    if (!rawText || isLoading) return;

    const req = attemptRequest();
    if (!req.allowed) return;

    setInputText('');
    setError(null);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: rawText,
      timestamp: now,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
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
              intentLabel: 'wellness',
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

      const apiPayloadMessages = updatedMessages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        text: m.rawText || m.text,
      }));

      const res = await fetch('/api/fitness-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiPayloadMessages,
          userProfile,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned error ${res.status}`);
      }

      const data = await res.json();
      let rawResponse: string = data.text || '';
      let textToDisplay = rawResponse;
      let adjustment;

      // Parse visible flagging constraint overrides
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
    } catch (err: any) {
      console.error('Failed to get fitness coach response:', err);
      setError(
        err?.message || 'Unable to connect to the fitness coach. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const lastAssistantIndex = messages.map((m) => m.role).lastIndexOf('assistant');

  return (
    <section id="fitness-coach-section" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-cream-soft">AI Fitness Coach</h3>
          <p className="text-xs text-beige-light/80">
            Personalized Workout Plans • Form Correction • Fitness Motivation
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {messages.length > 0 && (
            <button
              onClick={handleResetConversation}
              className="text-xs font-medium text-cream-soft px-3 py-1 rounded-full bg-olive-canvas/80 border border-olive-light/40 hover:bg-olive transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl bg-cream-soft border border-wellness-border/80 shadow-xs overflow-hidden flex flex-col h-[540px]">
        {/* Assistant Header */}
        <div className="px-6 py-4 border-b border-wellness-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-olive flex items-center justify-center text-cream-soft shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-wellness-dark flex items-center gap-2">
                <span>Personal Fitness Coach</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-xs text-wellness-muted">
                Always active • Tailored to your profile
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Chat Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 p-4 sm:p-6 overflow-y-auto bg-beige-cream/20 flex flex-col space-y-1 min-h-0"
        >
          {messages.length === 0 ? (
            <div className="my-auto flex flex-col items-center justify-center text-center py-6">
              <div className="w-16 h-16 rounded-3xl bg-cream-soft border border-wellness-border flex items-center justify-center text-olive mb-4 shadow-sm">
                <MessageSquare className="w-8 h-8 stroke-1 text-olive" />
              </div>
              <h4 className="text-base font-semibold text-wellness-dark">
                Ready to crush your fitness goals?
              </h4>
              <p className="text-xs text-wellness-muted max-w-md mt-1 mb-6">
                Ask for a workout plan, exercise modifications, or general fitness advice. I'll adjust recommendations based on your stored health profile constraints.
              </p>

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
            <div className="space-y-2">
              {messages.map((msg, index) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isLatestAssistantMessage={index === lastAssistantIndex}
                  onSelectSuggestion={(s) => handleSendMessage(s)}
                />
              ))}

              {isLoading && (
                <div className="flex items-center gap-2.5 my-3 text-wellness-muted text-xs">
                  <div className="w-7 h-7 rounded-xl bg-olive/20 text-olive flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cream-soft border border-wellness-border shadow-2xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-olive" />
                    <span>Coach is analyzing your request...</span>
                  </div>
                </div>
              )}
            </div>
          )}

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

        {/* Message Input */}
        <div className="p-4 sm:p-5 border-t border-wellness-border/60 bg-cream-soft shrink-0">
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
              placeholder="Ask your fitness coach..."
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
              AI Coach • Consult a professional before starting new fitness regimens
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
