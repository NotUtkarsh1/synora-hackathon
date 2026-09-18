import React, { useState, useEffect } from 'react';
import {
  Heart,
  Moon,
  Activity,
  Droplets,
  Apple,
  ArrowUpRight,
  Sparkles,
  Plus,
  CheckCircle2,
  Sliders,
  X,
  Gauge,
  Zap,
  RotateCcw,
  Scale,
  ShieldCheck,
  TrendingUp,
  Radio,
} from 'lucide-react';
import { DailyHealthVitals } from '../types';
import { useTelemetry } from '../context/TelemetryContext';

const STORAGE_KEY = 'holistic_health_overview_vitals_v1';

const INITIAL_VITALS: DailyHealthVitals = {
  restingHeartRate: 68,
  hrvMs: 48,
  heartRateMin: 58,
  heartRateMax: 114,
  sleepHours: 7.75, // 7h 45m
  sleepScore: 88,
  deepSleepMinutes: 110,
  remSleepMinutes: 105,
  activeCaloriesBurned: 520,
  activeCaloriesTarget: 650,
  activeMinutes: 42,
  activeMinutesTarget: 45,
  waterIntakeMl: 2250,
  waterTargetMl: 3000,
  caloriesConsumed: 1840,
  caloriesTarget: 2200,
  proteinG: 115,
  carbsG: 215,
  fatG: 55,
  bloodPressureSystolic: 118,
  bloodPressureDiastolic: 76,
  readinessScore: 87,
  energyRating: 4,
  lastUpdated: 'Today at 08:30 AM',
};

// Calculate composite readiness score (0-100)
function calculateReadiness(v: DailyHealthVitals): number {
  const sleepFactor = Math.min(100, (v.sleepHours / 8) * 50 + (v.sleepScore / 100) * 50);
  const hrFactor = v.restingHeartRate <= 65 ? 95 : v.restingHeartRate <= 72 ? 88 : 74;
  const hydrationFactor = Math.min(100, (v.waterIntakeMl / v.waterTargetMl) * 100);
  const activityFactor = Math.min(100, (v.activeMinutes / v.activeMinutesTarget) * 100);

  const score = Math.round(
    sleepFactor * 0.35 + hrFactor * 0.3 + hydrationFactor * 0.15 + activityFactor * 0.2
  );
  return Math.min(99, Math.max(40, score));
}

export const HealthOverview: React.FC = () => {
  const { currentReading, history, isStreaming } = useTelemetry();

  const [vitals, setVitals] = useState<DailyHealthVitals>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_VITALS;
  });

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick log form states
  const [logWater, setLogWater] = useState<string>('250');
  const [logSystolic, setLogSystolic] = useState<string>(String(vitals.bloodPressureSystolic));
  const [logDiastolic, setLogDiastolic] = useState<string>(String(vitals.bloodPressureDiastolic));
  const [logSleepHours, setLogSleepHours] = useState<string>(String(vitals.sleepHours));
  const [logRestingHr, setLogRestingHr] = useState<string>(String(vitals.restingHeartRate));
  const [logEnergy, setLogEnergy] = useState<number>(vitals.energyRating);

  // Live heart rate from real-time telemetry stream
  const liveHeartRate = currentReading?.heartRate ?? vitals.restingHeartRate;
  const isHrElevated = liveHeartRate > 100;
  const isHrBradycardia = liveHeartRate < 50;
  const recentHr = history.length > 0 ? history.slice(-8) : [];
  const minSparkHr = 45;
  const maxSparkHr = 135;

  // Save to local storage whenever vitals change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vitals));
    } catch (e) {
      console.error(e);
    }
  }, [vitals]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Quick tap hydration increment directly on the card
  const handleQuickAddWater = (ml: number) => {
    setVitals((prev) => {
      const updated = {
        ...prev,
        waterIntakeMl: prev.waterIntakeMl + ml,
        lastUpdated: 'Just now',
      };
      updated.readinessScore = calculateReadiness(updated);
      return updated;
    });
    showToast(`+${ml} ml added to daily hydration!`);
  };

  // Submit manual log modal
  const handleSaveVitalsModal = (e: React.FormEvent) => {
    e.preventDefault();
    const waterNum = Number(logWater) || 0;
    const sysNum = Number(logSystolic) || vitals.bloodPressureSystolic;
    const diaNum = Number(logDiastolic) || vitals.bloodPressureDiastolic;
    const sleepNum = Number(logSleepHours) || vitals.sleepHours;
    const hrNum = Number(logRestingHr) || vitals.restingHeartRate;

    setVitals((prev) => {
      const updated: DailyHealthVitals = {
        ...prev,
        waterIntakeMl: prev.waterIntakeMl + waterNum,
        bloodPressureSystolic: sysNum,
        bloodPressureDiastolic: diaNum,
        sleepHours: sleepNum,
        restingHeartRate: hrNum,
        energyRating: logEnergy,
        lastUpdated: 'Just now',
      };
      updated.readinessScore = calculateReadiness(updated);
      return updated;
    });

    setIsLogModalOpen(false);
    showToast('Daily health vitals updated successfully!');
  };

  const handleResetDefaults = () => {
    setVitals(INITIAL_VITALS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    showToast('Vitals reset to default healthy baseline');
  };

  const sleepHoursInt = Math.floor(vitals.sleepHours);
  const sleepMinutesInt = Math.round((vitals.sleepHours - sleepHoursInt) * 60);

  const hydrationPercent = Math.min(100, Math.round((vitals.waterIntakeMl / vitals.waterTargetMl) * 100));
  const activityPercent = Math.min(100, Math.round((vitals.activeMinutes / vitals.activeMinutesTarget) * 100));
  const caloriePercent = Math.min(100, Math.round((vitals.caloriesConsumed / vitals.caloriesTarget) * 100));

  return (
    <section id="health-overview-section" className="space-y-5">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-cream-soft px-4 py-3 rounded-2xl shadow-xl border border-emerald-500/40 flex items-center gap-2.5 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-cream-soft">Health Overview</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Live Holistic Synced
            </span>
          </div>
          <p className="text-xs text-beige-light/80 mt-0.5">
            Key physiological wellness metrics, holistic readiness index, and daily vitals log
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-olive text-cream-soft hover:bg-olive-light text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Daily Vitals</span>
          </button>

          <button
            onClick={handleResetDefaults}
            title="Reset to default healthy profile"
            className="p-2 rounded-xl bg-olive-canvas/70 text-cream-soft hover:bg-olive-canvas border border-olive-light/30 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      </div>

      {/* Readiness & Holistic Status Hero Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-cream-soft border border-wellness-border/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left score dial */}
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-olive to-olive-dark flex flex-col items-center justify-center text-cream-soft shadow-md shrink-0">
            <span className="text-2xl sm:text-3xl font-black font-mono leading-none tracking-tight">
              {vitals.readinessScore}
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-beige-light/90 mt-1">
              / 100
            </span>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-cream-soft" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-olive">
                Holistic Readiness Score
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                {vitals.readinessScore >= 85 ? 'Optimal Recovery' : 'Moderate Strain'}
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-wellness-dark leading-tight">
              {vitals.readinessScore >= 85
                ? 'Body primed for moderate to high physical activity'
                : 'Prioritize restorative hydration and light mobility today'}
            </h4>
            <p className="text-xs text-wellness-muted max-w-xl">
              Composite index calculated from resting autonomic tone (HRV {vitals.hrvMs}ms), sleep depth ({vitals.sleepScore}% restorative), and hydration balance.
            </p>
          </div>
        </div>

        {/* Right Clinical Vitals Strip */}
        <div className="flex flex-wrap items-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-wellness-border/60 lg:pl-6 text-xs shrink-0">
          <div className="p-3 rounded-2xl bg-beige-cream/50 border border-wellness-border/70 min-w-[110px]">
            <span className="text-[10px] font-semibold text-wellness-muted uppercase block">
              Blood Pressure
            </span>
            <span className="text-sm font-bold font-mono text-wellness-dark block mt-0.5">
              {vitals.bloodPressureSystolic}/{vitals.bloodPressureDiastolic}
            </span>
            <span className="text-[10px] font-medium text-emerald-700">Normal Range</span>
          </div>

          <div className="p-3 rounded-2xl bg-beige-cream/50 border border-wellness-border/70 min-w-[110px]">
            <span className="text-[10px] font-semibold text-wellness-muted uppercase block">
              Resting HRV
            </span>
            <span className="text-sm font-bold font-mono text-wellness-dark block mt-0.5">
              {vitals.hrvMs} ms
            </span>
            <span className="text-[10px] font-medium text-emerald-700">High Parasympathetic</span>
          </div>

          <div className="p-3 rounded-2xl bg-beige-cream/50 border border-wellness-border/70 min-w-[110px]">
            <span className="text-[10px] font-semibold text-wellness-muted uppercase block">
              Energy Feeling
            </span>
            <div className="flex items-center gap-0.5 mt-0.5 text-amber-500">
              {'★'.repeat(vitals.energyRating)}
              {'☆'.repeat(5 - vitals.energyRating)}
            </div>
            <span className="text-[10px] font-medium text-wellness-muted">
              {vitals.energyRating >= 4 ? 'Energized' : 'Resting'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of 5 Comprehensive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
        {/* Card 1: Heart Rate (Real-time Live Heartbeat Monitoring) */}
        <div
          id="card-heart-rate"
          className="p-5 rounded-2xl bg-cream-soft border border-wellness-border/70 shadow-xs hover:shadow-md hover:border-olive/40 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="relative">
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                  isHrElevated
                    ? 'bg-rose-100/90 border-rose-300 text-rose-600 shadow-xs'
                    : isHrBradycardia
                    ? 'bg-amber-100/90 border-amber-300 text-amber-600 shadow-xs'
                    : 'bg-rose-50/90 border-rose-200/80 text-rose-600 shadow-xs'
                }`}
              >
                <Heart
                  className="w-5 h-5 fill-rose-600 animate-heartbeat transition-transform"
                  style={{
                    animationDuration: `${(60 / Math.max(40, liveHeartRate)).toFixed(2)}s`,
                  }}
                />
              </div>
              {isStreaming && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-cream-soft"></span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  isHrElevated
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : isHrBradycardia
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                {isHrElevated ? 'Elevated' : isHrBradycardia ? 'Low' : 'Optimal'}
              </span>
            </div>
          </div>

          <div className="space-y-1 my-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-wellness-muted uppercase tracking-wider block">
                Live Heartbeat
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50/80 px-1.5 py-0.5 rounded border border-emerald-200/60 font-medium">
                Live Telemetry
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black font-mono tracking-tight text-wellness-dark transition-all duration-200">
                {liveHeartRate}
              </span>
              <span className="text-xs font-semibold text-wellness-muted">BPM</span>
              <span className="text-[11px] text-wellness-muted/80 ml-auto font-medium">
                {currentReading?.activityState ?? 'Resting'}
              </span>
            </div>
          </div>

          {/* Mini Live Real-time Sparkline Wave */}
          {recentHr.length > 1 && (
            <div className="h-6 w-full my-1 overflow-hidden opacity-85">
              <svg viewBox="0 0 100 24" className="w-full h-full" preserveAspectRatio="none">
                <path
                  d={`M ${recentHr
                    .map((pt, idx) => {
                      const x = (idx / (recentHr.length - 1)) * 100;
                      const norm = Math.max(0, Math.min(1, (pt.heartRate - minSparkHr) / (maxSparkHr - minSparkHr)));
                      const y = 22 - norm * 20;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' L ')}`}
                  fill="none"
                  stroke={isHrElevated ? '#e11d48' : '#5F745B'}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}

          <div className="pt-2.5 mt-1 border-t border-wellness-border/50 text-[11px] text-wellness-muted flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                document.getElementById('health-trends-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[11px] text-olive hover:text-olive-dark font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Sync with Trend</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
            <span className="font-mono text-[10px] font-semibold text-wellness-dark">
              {vitals.heartRateMin} - {Math.max(vitals.heartRateMax, liveHeartRate)} bpm
            </span>
          </div>
        </div>

        {/* Card 2: Sleep */}
        <div
          id="card-sleep"
          className="p-5 rounded-2xl bg-cream-soft border border-wellness-border/70 shadow-xs hover:shadow-md hover:border-olive/40 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-beige-cream border border-wellness-border flex items-center justify-center text-indigo-600">
              <Moon className="w-5 h-5 fill-indigo-600/15" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
              {vitals.sleepScore}% Score
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-wellness-muted uppercase tracking-wider block">
              Sleep Duration
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black font-mono tracking-tight text-wellness-dark">
                {sleepHoursInt}
              </span>
              <span className="text-xs font-semibold text-wellness-muted">h</span>
              <span className="text-2xl font-black font-mono tracking-tight text-wellness-dark ml-1">
                {sleepMinutesInt}
              </span>
              <span className="text-xs font-semibold text-wellness-muted">m</span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-wellness-border/50 text-[11px] text-wellness-muted flex items-center justify-between">
            <span>Deep &amp; REM</span>
            <span className="font-mono text-[10px] font-semibold text-wellness-dark">
              {Math.round((vitals.deepSleepMinutes + vitals.remSleepMinutes) / 60 * 10) / 10} hrs restorative
            </span>
          </div>
        </div>

        {/* Card 3: Activity */}
        <div
          id="card-activity"
          className="p-5 rounded-2xl bg-cream-soft border border-wellness-border/70 shadow-xs hover:shadow-md hover:border-olive/40 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-beige-cream border border-wellness-border flex items-center justify-center text-amber-600">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              {activityPercent}% Goal
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-wellness-muted uppercase tracking-wider block">
              Active Burn
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black font-mono tracking-tight text-wellness-dark">
                {vitals.activeCaloriesBurned}
              </span>
              <span className="text-xs font-semibold text-wellness-muted">/ {vitals.activeCaloriesTarget} kcal</span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-wellness-border/50 text-[11px] text-wellness-muted flex items-center justify-between">
            <span>Active Time</span>
            <span className="font-mono text-[10px] font-semibold text-wellness-dark">
              {vitals.activeMinutes} / {vitals.activeMinutesTarget} min
            </span>
          </div>
        </div>

        {/* Card 4: Hydration (With Direct Quick Log Buttons) */}
        <div
          id="card-hydration"
          className="p-5 rounded-2xl bg-cream-soft border border-wellness-border/70 shadow-xs hover:shadow-md hover:border-olive/40 transition-all duration-300 flex flex-col justify-between relative"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-beige-cream border border-wellness-border flex items-center justify-center text-cyan-600">
              <Droplets className="w-5 h-5 fill-cyan-600/15" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-300">
              {hydrationPercent}% Daily
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-wellness-muted uppercase tracking-wider block">
              Water Intake
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black font-mono tracking-tight text-wellness-dark">
                {(vitals.waterIntakeMl / 1000).toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-wellness-muted">/ {(vitals.waterTargetMl / 1000).toFixed(1)} L</span>
            </div>
          </div>

          {/* Quick 1-tap hydration buttons */}
          <div className="pt-3 mt-3 border-t border-wellness-border/50 flex items-center justify-between gap-1.5">
            <button
              onClick={() => handleQuickAddWater(250)}
              className="flex-1 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 text-[10px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>250ml</span>
            </button>
            <button
              onClick={() => handleQuickAddWater(500)}
              className="flex-1 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 text-[10px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>500ml</span>
            </button>
          </div>
        </div>

        {/* Card 5: Nutrition */}
        <div
          id="card-nutrition"
          className="p-5 rounded-2xl bg-cream-soft border border-wellness-border/70 shadow-xs hover:shadow-md hover:border-olive/40 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-beige-cream border border-wellness-border flex items-center justify-center text-emerald-600">
              <Apple className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              {caloriePercent}% Budget
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-wellness-muted uppercase tracking-wider block">
              Energy Intake
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black font-mono tracking-tight text-wellness-dark">
                {vitals.caloriesConsumed}
              </span>
              <span className="text-xs font-semibold text-wellness-muted">/ {vitals.caloriesTarget} kcal</span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-wellness-border/50 text-[10px] font-mono text-wellness-muted flex items-center justify-between">
            <span>P: {vitals.proteinG}g</span>
            <span>C: {vitals.carbsG}g</span>
            <span>F: {vitals.fatG}g</span>
          </div>
        </div>
      </div>

      {/* Manual Daily Vitals Logger Modal */}
      {isLogModalOpen && (
        <div
          className="fixed inset-0 bg-wellness-dark/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setIsLogModalOpen(false)}
        >
          <div
            className="bg-cream-soft rounded-3xl border border-wellness-border shadow-2xl max-w-md w-full p-6 space-y-5 text-wellness-dark animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-wellness-border/60">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-olive text-cream-soft">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-wellness-dark">Log Daily Health Vitals</h4>
                  <p className="text-xs text-wellness-muted">Update clinical measurements & recovery indicators</p>
                </div>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-beige-cream text-wellness-muted hover:text-wellness-dark transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVitalsModal} className="space-y-4 text-xs">
              {/* Blood pressure */}
              <div>
                <label className="font-semibold block mb-1">
                  Blood Pressure (Systolic / Diastolic mmHg)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={logSystolic}
                    onChange={(e) => setLogSystolic(e.target.value)}
                    placeholder="120"
                    className="w-full px-3 py-2 rounded-xl bg-beige-cream/40 border border-wellness-border text-wellness-dark font-mono text-xs focus:outline-hidden focus:border-olive"
                  />
                  <input
                    type="number"
                    value={logDiastolic}
                    onChange={(e) => setLogDiastolic(e.target.value)}
                    placeholder="80"
                    className="w-full px-3 py-2 rounded-xl bg-beige-cream/40 border border-wellness-border text-wellness-dark font-mono text-xs focus:outline-hidden focus:border-olive"
                  />
                </div>
              </div>

              {/* Hydration addition */}
              <div>
                <label className="font-semibold block mb-1">
                  Add Water Intake (ml)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={logWater}
                    onChange={(e) => setLogWater(e.target.value)}
                    placeholder="250"
                    step="50"
                    className="flex-1 px-3 py-2 rounded-xl bg-beige-cream/40 border border-wellness-border text-wellness-dark font-mono text-xs focus:outline-hidden focus:border-olive"
                  />
                  <button
                    type="button"
                    onClick={() => setLogWater('250')}
                    className="px-2.5 py-1.5 rounded-lg bg-beige-cream text-wellness-dark border border-wellness-border font-medium text-[11px]"
                  >
                    Glass (250)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogWater('500')}
                    className="px-2.5 py-1.5 rounded-lg bg-beige-cream text-wellness-dark border border-wellness-border font-medium text-[11px]"
                  >
                    Bottle (500)
                  </button>
                </div>
              </div>

              {/* Sleep Hours */}
              <div>
                <label className="font-semibold block mb-1">
                  Sleep Duration (Hours)
                </label>
                <input
                  type="number"
                  step="0.25"
                  value={logSleepHours}
                  onChange={(e) => setLogSleepHours(e.target.value)}
                  placeholder="7.5"
                  className="w-full px-3 py-2 rounded-xl bg-beige-cream/40 border border-wellness-border text-wellness-dark font-mono text-xs focus:outline-hidden focus:border-olive"
                />
              </div>

              {/* Resting HR */}
              <div>
                <label className="font-semibold block mb-1">
                  Resting Heart Rate (BPM)
                </label>
                <input
                  type="number"
                  value={logRestingHr}
                  onChange={(e) => setLogRestingHr(e.target.value)}
                  placeholder="68"
                  className="w-full px-3 py-2 rounded-xl bg-beige-cream/40 border border-wellness-border text-wellness-dark font-mono text-xs focus:outline-hidden focus:border-olive"
                />
              </div>

              {/* Subjective energy level */}
              <div>
                <label className="font-semibold block mb-1">
                  Subjective Energy Level (1 to 5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setLogEnergy(num)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        logEnergy === num
                          ? 'bg-olive text-cream-soft shadow-xs'
                          : 'bg-beige-cream/50 border border-wellness-border text-wellness-muted hover:text-wellness-dark'
                      }`}
                    >
                      {num} ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-wellness-border/60 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-olive hover:bg-olive-light text-cream-soft text-xs font-bold shadow-xs cursor-pointer transition-all"
                >
                  Save &amp; Recalculate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
