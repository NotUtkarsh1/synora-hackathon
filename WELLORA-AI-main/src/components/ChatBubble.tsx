import React from 'react';
import { ChatMessage } from '../types';
import { UrgencyBadge } from './UrgencyBadge';
import { Bot, User, AlertOctagon, HelpCircle, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { EMERGENCY_WARNING_TEXT } from '../utils/healthFilter';

interface ChatBubbleProps {
  message: ChatMessage;
  onSelectSuggestion?: (suggestion: string) => void;
  isLatestAssistantMessage?: boolean;
  showDebugIntent?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onSelectSuggestion,
  isLatestAssistantMessage = false,
  showDebugIntent = false,
}) => {
  const isUser = message.role === 'user';
  const isEmergency = message.isEmergency || message.urgency === 'EMERGENCY';
  const isSolution = message.phase === 'solution' || message.text.includes('Holistic Solution');
  const isCrossQuestion =
    message.phase === 'cross-questioning' ||
    message.text.toLowerCase().includes('cross-question') ||
    (message.questionCountInMessage && message.questionCountInMessage > 0);

  if (isUser) {
    return (
      <div className="flex justify-end gap-2.5 my-3.5 group">
        <div className="max-w-xl flex flex-col items-end">
          <div className="px-4 py-3 rounded-2xl rounded-tr-xs bg-olive text-cream-soft text-sm leading-relaxed shadow-xs border border-olive-light/20">
            <p className="whitespace-pre-wrap">{message.text}</p>
          </div>
          <div className="flex items-center gap-2 mt-1 px-1">
            {showDebugIntent && message.intentLabel && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                Detected: {message.intentLabel}
              </span>
            )}
            <span className="text-[10px] text-wellness-muted/80">
              {message.timestamp}
            </span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-xl bg-olive-canvas text-cream-soft flex items-center justify-center shrink-0 mt-0.5 border border-olive-light/20">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  // Assistant response
  const hasEmergencyWarning = message.text.includes(EMERGENCY_WARNING_TEXT);

  // Split out emergency warning if present
  let displayBody = message.text;
  if (hasEmergencyWarning) {
    displayBody = message.text.replace(EMERGENCY_WARNING_TEXT, '').trim();
  }

  return (
    <div className="flex justify-start gap-2.5 my-4 group">
      <div className="w-8 h-8 rounded-xl bg-olive text-cream-soft flex items-center justify-center shrink-0 mt-6 shadow-xs border border-olive/30">
        <Bot className="w-4 h-4" />
      </div>

      <div className="max-w-2xl flex flex-col items-start min-w-0 w-full">
        {/* Badges container: Urgency + Intent Debug + Cross-Questioning / Solution Phase */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {message.urgency && <UrgencyBadge urgency={message.urgency} />}

          {/* Sub-feature 2.1 / 2.4: Optional Debug Intent Tag Toggle */}
          {showDebugIntent && message.intentLabel && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border shadow-2xs ${
                message.intentLabel === 'wellness'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : message.intentLabel === 'triage'
                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              <span>Detected: {message.intentLabel}</span>
            </span>
          )}

          {message.isClarifyingQuestion ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-300/80 shadow-2xs">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Ambiguous Input — Clarification</span>
            </span>
          ) : isEmergency ? (
            <span className="text-[11px] font-semibold text-red-700 tracking-wide">
              Immediate attention recommended
            </span>
          ) : isSolution ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-olive/10 text-olive border border-olive/20 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-olive" />
              <span>Holistic Solution & Care Plan</span>
            </span>
          ) : isCrossQuestion ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200/80 shadow-2xs">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {message.crossQuestionNumber
                  ? `Cross-Question (${message.crossQuestionNumber}/3)`
                  : 'Cross-Questioning'}
              </span>
            </span>
          ) : message.intentLabel === 'wellness' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Wellness Coach</span>
            </span>
          ) : null}
        </div>

        {/* Chat Bubble Container */}
        <div
          className={`w-full px-5 py-4 rounded-2xl rounded-tl-xs bg-cream-soft text-wellness-dark text-sm leading-relaxed shadow-xs transition-all ${
            isEmergency
              ? 'border-2 border-red-600 bg-red-50/30 ring-1 ring-red-500/20'
              : isSolution
              ? 'border-2 border-olive/40 bg-cream-soft shadow-xs'
              : 'border border-wellness-border/80'
          }`}
        >
          {/* Sub-feature 4.4: Visible adjustment banner */}
          {message.adjustment && (
            <div className="mb-3.5 p-3 rounded-xl bg-orange-100 text-orange-900 border border-orange-200 text-xs flex items-start gap-2 shadow-2xs">
              <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-orange-700" />
              <div>
                <span className="font-bold">⚠️ Adjusted for your {message.adjustment.condition}: </span>
                {message.adjustment.reason}
              </div>
            </div>
          )}

          {/* Visually Prominent Emergency Warning */}
          {hasEmergencyWarning && (
            <div className="mb-3.5 p-3.5 rounded-xl bg-red-600 text-white font-semibold text-sm flex items-start gap-2.5 shadow-xs border border-red-700">
              <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="leading-snug">{EMERGENCY_WARNING_TEXT}</div>
            </div>
          )}

          {/* Solution Banner for Solution Phase */}
          {isSolution && !isEmergency && (
            <div className="mb-3 p-2.5 rounded-xl bg-olive/10 border border-olive/20 flex items-center justify-between text-xs font-semibold text-olive">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-olive" />
                <span>Personalized Holistic Plan & Guidance</span>
              </div>
              <span className="text-[11px] font-normal text-wellness-muted">
                Based on your answers
              </span>
            </div>
          )}

          {/* Response Text */}
          <div className="space-y-2 whitespace-pre-wrap font-normal text-wellness-dark">
            {displayBody}
          </div>
        </div>

        {/* Quick Answer Suggestion Chips for Cross-Questioning */}
        {isLatestAssistantMessage &&
          !isEmergency &&
          message.suggestedAnswers &&
          message.suggestedAnswers.length > 0 &&
          onSelectSuggestion && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 w-full">
              <span className="text-[11px] font-medium text-wellness-muted mr-1">
                Quick reply:
              </span>
              {message.suggestedAnswers.map((suggestion, idx) => {
                const isSkip = suggestion.toLowerCase().includes('solution now');
                return (
                  <button
                    key={idx}
                    onClick={() => onSelectSuggestion(suggestion)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 cursor-pointer shadow-2xs ${
                      isSkip
                        ? 'bg-olive text-cream-soft border-olive hover:bg-olive-light font-medium'
                        : 'bg-cream-soft text-wellness-dark border-wellness-border/80 hover:border-olive hover:bg-beige-cream/50'
                    }`}
                  >
                    <span>{suggestion}</span>
                    <ChevronRight className="w-3 h-3 opacity-60" />
                  </button>
                );
              })}
            </div>
          )}

        <span className="text-[10px] text-wellness-muted/80 mt-1 px-1">
          {message.timestamp}
        </span>
      </div>
    </div>
  );
};
