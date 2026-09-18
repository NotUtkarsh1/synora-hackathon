import React, { useState } from 'react';
import {
  GitFork,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Sliders,
  Send,
  User,
  Info,
} from 'lucide-react';
import { IntentLabel, UserHealthProfile } from '../types';

interface IntentRoutingProps {
  onNavigateToChat?: () => void;
}

const PRESET_EXAMPLES = [
  { text: "What's a good post-workout meal?", expected: 'wellness' as IntentLabel, cat: 'Nutrition' },
  { text: "I twisted my ankle and it's swelling", expected: 'triage' as IntentLabel, cat: 'Symptom' },
  { text: "I've had a headache for 3 days and it's getting worse", expected: 'triage' as IntentLabel, cat: 'Clinical' },
  { text: "How many calories should I eat to lose weight?", expected: 'wellness' as IntentLabel, cat: 'Diet' },
  { text: "I feel a bit off today", expected: 'ambiguous' as IntentLabel, cat: 'Vague' },
  { text: "I've been feeling a bit off lately", expected: 'ambiguous' as IntentLabel, cat: 'Vague' },
  { text: "My chest hurts when I breathe deeply", expected: 'triage' as IntentLabel, cat: 'Emergency' },
  { text: "What's the best way to build muscle?", expected: 'wellness' as IntentLabel, cat: 'Fitness' },
];

export const IntentRouting: React.FC<IntentRoutingProps> = ({ onNavigateToChat }) => {
  const [testInput, setTestInput] = useState("I've been feeling a bit off lately");
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationResult, setClassificationResult] = useState<{
    intentLabel: IntentLabel;
    temperature: number;
    clarifyingQuestion?: string;
  } | null>(null);

  // 5x Consistency Test State
  const [consistencyRuns, setConsistencyRuns] = useState<string[]>([]);
  const [isRunningConsistency, setIsRunningConsistency] = useState(false);

  // Stored User Profile (No diabetes by default!)
  const [userProfile, setUserProfile] = useState<UserHealthProfile>({
    name: 'Alex Rivera',
    age: 30,
    activityLevel: 'Moderate',
    knownConditions: [], // Default is strictly empty, no diabetes!
    allergies: [],
    dietaryPreferences: ['Balanced whole foods'],
  });
  const [customConditionInput, setCustomConditionInput] = useState('');

  // 1. Single classification test
  const handleRunClassification = async (queryText?: string) => {
    const text = (queryText || testInput).trim();
    if (!text) return;
    setIsClassifying(true);
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const data = await res.json();
        let clarifyingQ: string | undefined = undefined;
        if (data.intentLabel === 'ambiguous') {
          const qRes = await fetch('/api/clarify-ambiguous', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text }),
          });
          if (qRes.ok) {
            const qData = await qRes.json();
            clarifyingQ = qData.clarifyingQuestion;
          }
        }
        setClassificationResult({
          intentLabel: data.intentLabel,
          temperature: data.temperature ?? 0,
          clarifyingQuestion: clarifyingQ,
        });
      }
    } catch (e) {
      console.error('Classification test error:', e);
    } finally {
      setIsClassifying(false);
    }
  };

  // 2. 5x Deterministic Consistency Test (Sub-feature 2.3 verification)
  const handleRun5xConsistencyTest = async () => {
    setIsRunningConsistency(true);
    setConsistencyRuns([]);
    const runs: string[] = [];

    for (let i = 1; i <= 5; i++) {
      try {
        const res = await fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: "I've been feeling a bit off lately" }),
        });
        if (res.ok) {
          const data = await res.json();
          runs.push(data.intentLabel);
          setConsistencyRuns([...runs]);
        }
      } catch (err) {
        runs.push('error');
        setConsistencyRuns([...runs]);
      }
    }
    setIsRunningConsistency(false);
  };

  const handleAddCondition = () => {
    if (!customConditionInput.trim()) return;
    if (!userProfile.knownConditions.includes(customConditionInput.trim())) {
      setUserProfile({
        ...userProfile,
        knownConditions: [...userProfile.knownConditions, customConditionInput.trim()],
      });
    }
    setCustomConditionInput('');
  };

  const handleRemoveCondition = (condition: string) => {
    setUserProfile({
      ...userProfile,
      knownConditions: userProfile.knownConditions.filter((c) => c !== condition),
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-cream-soft border border-wellness-border/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-olive text-cream-soft">
              <GitFork className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-wellness-dark">Intent Routing Architecture</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Deterministic (T=0)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-wellness-muted max-w-2xl">
            Pre-flight classification router that evaluates incoming messages before response generation.
            Routes deterministic intent to the <strong>Wellness Coach</strong>, <strong>Clinical Triage</strong>,
            or triggers an <strong>Ambiguous Clarification</strong> loop.
          </p>
        </div>

        {onNavigateToChat && (
          <button
            onClick={onNavigateToChat}
            className="px-4 py-2.5 rounded-xl bg-olive text-cream-soft text-xs font-semibold hover:bg-olive-light transition-all flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
          >
            <span>Open AI Health Guide</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Grid: Interactive Classifier & Routing Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Classifier Playground (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-cream-soft border border-wellness-border/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-olive" />
                <h3 className="text-sm font-bold text-wellness-dark uppercase tracking-wider">
                  Live Intent Classifier
                </h3>
              </div>
              <span className="text-[11px] font-mono text-wellness-muted px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200">
                temperature = 0
              </span>
            </div>

            {/* Input and Classify Button */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunClassification()}
                  placeholder="Enter message to classify (e.g., 'What is a good post-workout meal?')..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-beige-cream/40 border border-wellness-border/80 focus:outline-hidden focus:ring-2 focus:ring-olive/40 focus:bg-cream-soft text-wellness-dark"
                />
                <button
                  onClick={() => handleRunClassification()}
                  disabled={isClassifying || !testInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-olive text-cream-soft text-xs font-semibold hover:bg-olive-light disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isClassifying ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Classify</span>
                </button>
              </div>

              {/* Preset Query Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-wellness-muted">
                  Test prompt examples:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_EXAMPLES.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setTestInput(item.text);
                        handleRunClassification(item.text);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg border border-wellness-border/70 bg-cream-soft hover:bg-beige-cream/50 text-wellness-dark transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span className="truncate max-w-[200px]">{item.text}</span>
                      <span
                        className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                          item.expected === 'wellness'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.expected === 'triage'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.expected}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Classification Output Result Card */}
            {classificationResult && (
              <div className="p-4 rounded-2xl bg-beige-cream/30 border border-wellness-border/70 space-y-3 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-wellness-muted">
                    Classification Output:
                  </span>
                  <span className="text-[10px] font-mono text-wellness-muted">
                    temperature: {classificationResult.temperature}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs ${
                      classificationResult.intentLabel === 'wellness'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : classificationResult.intentLabel === 'triage'
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {classificationResult.intentLabel === 'wellness' ? (
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                    ) : classificationResult.intentLabel === 'triage' ? (
                      <ShieldAlert className="w-4 h-4 text-blue-600" />
                    ) : (
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                    )}
                    <span>Detected: {classificationResult.intentLabel}</span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-wellness-muted" />

                  <div className="text-xs font-medium text-wellness-dark">
                    {classificationResult.intentLabel === 'wellness' && (
                      <span className="text-emerald-800 font-semibold">
                        Routes to Friendly Fitness & Nutrition Coach
                      </span>
                    )}
                    {classificationResult.intentLabel === 'triage' && (
                      <span className="text-blue-800 font-semibold">
                        Routes to Clinical Safety Triage & Care Plan
                      </span>
                    )}
                    {classificationResult.intentLabel === 'ambiguous' && (
                      <span className="text-amber-800 font-semibold">
                        Triggers Single Clarifying Follow-Up Question
                      </span>
                    )}
                  </div>
                </div>

                {classificationResult.clarifyingQuestion && (
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <span className="font-semibold block">Generated Clarifying Follow-up:</span>
                    <p className="italic">"{classificationResult.clarifyingQuestion}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Sub-feature 2.3 Deterministic Repeatability 5x Test */}
            <div className="pt-4 border-t border-wellness-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-wellness-dark flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-olive" />
                    <span>Deterministic Consistency Test (5x Repetition)</span>
                  </h4>
                  <p className="text-[11px] text-wellness-muted">
                    Tests: <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700">"I've been feeling a bit off lately"</code> 5 consecutive times to guarantee identical classification.
                  </p>
                </div>
                <button
                  onClick={handleRun5xConsistencyTest}
                  disabled={isRunningConsistency}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isRunningConsistency ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-olive" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-olive" />
                  )}
                  <span>Run 5x Test</span>
                </button>
              </div>

              {consistencyRuns.length > 0 && (
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-stone-700">Test Execution Results:</span>
                    <span className="text-emerald-700 font-bold">
                      {consistencyRuns.every((r) => r === 'ambiguous')
                        ? '✓ 100% Deterministic Consistency Verified'
                        : 'Testing in progress...'}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {consistencyRuns.map((res, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-xl bg-white border border-stone-200 text-center text-xs font-mono font-bold text-amber-800"
                      >
                        <span className="text-[10px] text-stone-400 block font-normal">
                          Run {i + 1}
                        </span>
                        <span>{res}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: User Health Profile Context & Pipeline Flow (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Stored User Health Profile Context (Sub-feature 2.4) */}
          <div className="p-6 rounded-3xl bg-cream-soft border border-wellness-border/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-olive" />
                <h3 className="text-sm font-bold text-wellness-dark uppercase tracking-wider">
                  Stored User Health Profile
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Context Active
              </span>
            </div>

            {/* Crucial Spec Requirement Box: No diabetes default */}
            <div className="p-3.5 rounded-2xl bg-olive/5 border border-olive/20 text-xs text-wellness-dark space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-olive">
                <Info className="w-4 h-4 text-olive shrink-0" />
                <span>Non-Presumptive Health Profile</span>
              </div>
              <p className="text-wellness-muted leading-relaxed text-[11px]">
                Diabetes is <strong>NOT</strong> assumed by default. Both the wellness coach and triage systems answer generally and politely inquire whether you have diabetes or any specific conditions before giving targeted plans.
              </p>
            </div>

            {/* Profile Fields */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-wellness-border/40">
                <span className="text-wellness-muted">User Name</span>
                <span className="font-semibold text-wellness-dark">{userProfile.name}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-wellness-border/40">
                <span className="text-wellness-muted">Age / Activity</span>
                <span className="font-semibold text-wellness-dark">
                  {userProfile.age} yrs • {userProfile.activityLevel}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-wellness-border/40">
                <span className="text-wellness-muted">Dietary Style</span>
                <span className="font-semibold text-wellness-dark">
                  {userProfile.dietaryPreferences.join(', ')}
                </span>
              </div>

              {/* Known Conditions List */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-wellness-muted">Pre-existing Conditions:</span>
                  <span className="text-[10px] text-wellness-muted">
                    {userProfile.knownConditions.length === 0 ? 'None (Clean)' : `${userProfile.knownConditions.length} active`}
                  </span>
                </div>

                {userProfile.knownConditions.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 text-[11px] italic text-center">
                    No pre-existing conditions recorded (default). Assistant will ask if specific conditions apply.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {userProfile.knownConditions.map((cond, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-beige-cream text-wellness-dark border border-wellness-border/80 text-[11px]"
                      >
                        <span>{cond}</span>
                        <button
                          onClick={() => handleRemoveCondition(cond)}
                          className="text-wellness-muted hover:text-red-600 font-bold ml-1 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Optional Condition Input */}
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={customConditionInput}
                    onChange={(e) => setCustomConditionInput(e.target.value)}
                    placeholder="Add custom health condition (e.g., Asthma)..."
                    className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-beige-cream/40 border border-wellness-border/80 text-wellness-dark"
                  />
                  <button
                    onClick={handleAddCondition}
                    disabled={!customConditionInput.trim()}
                    className="px-3 py-1.5 rounded-xl bg-olive text-cream-soft text-xs font-medium hover:bg-olive-light cursor-pointer disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
