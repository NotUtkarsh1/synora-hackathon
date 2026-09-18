import React, { useState } from 'react';
import {
  Footprints,
  Dumbbell,
  Flame,
  Activity as ActivityIcon,
  Heart,
  Wind,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Volume2,
  VolumeX,
  History,
  CheckCircle2,
  Clock,
  Radio,
  Sparkles,
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';
import { SensorAnomalyBanner } from './SensorAnomalyBanner';
import { SensorWaveformChart } from './SensorWaveformChart';
import { AnomalyAlert } from '../types';

interface FitnessOverviewProps {
  onNavigateToChat?: () => void;
}

export const FitnessOverview: React.FC<FitnessOverviewProps> = ({ onNavigateToChat }) => {
  const {
    isStreaming,
    setIsStreaming,
    intervalMs,
    setIntervalMs,
    audioEnabled,
    setAudioEnabled,
    currentReading,
    history,
    alerts,
    activeAlert,
    thresholds,
    lastPipelineLatencyMs,
    triggerSpikeHR,
    triggerDropHR,
    triggerDropSpO2,
    triggerRapidDelta,
    resetToNormal,
    acknowledgeActiveAlert,
    clearAlertHistory,
  } = useTelemetry();

  const [showThresholdConfig, setShowThresholdConfig] = useState(false);

  // Handle escalating an alert to AI Health Guide
  const handleEscalateToTriage = (alert: AnomalyAlert) => {
    if (onNavigateToChat) {
      onNavigateToChat();
    } else {
      const el = document.getElementById('ai-health-guide-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const isHrAnomaly =
    currentReading.heartRate > thresholds.hrMax || currentReading.heartRate < thresholds.hrMin;
  const isSpO2Anomaly = currentReading.spO2 < thresholds.spO2Min;

  return (
    <section id="fitness-overview-section" className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-cream-soft">
              Sensor Anomaly Detection & Fitness Telemetry
            </h3>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
              <span>Simulated Wearable</span>
            </span>
          </div>
          <p className="text-xs text-beige-light/80 mt-0.5">
            Real-time physiological streaming, sub-millisecond anomaly rule evaluation, and instant triage escalation
          </p>
        </div>

        {/* Global stream controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              isStreaming
                ? 'bg-olive-canvas/80 text-cream-soft border border-olive-light/40 hover:bg-olive'
                : 'bg-amber-600 text-cream-soft hover:bg-amber-500'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Stream</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Resume Stream</span>
              </>
            )}
          </button>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-1.5 rounded-xl text-xs transition-colors cursor-pointer border ${
              audioEnabled
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-olive-canvas/60 text-stone-300 border-olive-light/30 hover:bg-olive-canvas'
            }`}
            title={audioEnabled ? 'Anomaly audio chime ON' : 'Anomaly audio chime MUTED'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-1 bg-olive-canvas/70 border border-olive-light/30 rounded-xl p-0.5 text-xs text-cream-soft">
            <button
              onClick={() => setIntervalMs(1000)}
              className={`px-2 py-1 rounded-lg transition-all ${
                intervalMs === 1000 ? 'bg-olive font-bold text-white' : 'opacity-70 hover:opacity-100'
              }`}
            >
              1.0s
            </button>
            <button
              onClick={() => setIntervalMs(1500)}
              className={`px-2 py-1 rounded-lg transition-all ${
                intervalMs === 1500 ? 'bg-olive font-bold text-white' : 'opacity-70 hover:opacity-100'
              }`}
            >
              1.5s
            </button>
            <button
              onClick={() => setIntervalMs(2000)}
              className={`px-2 py-1 rounded-lg transition-all ${
                intervalMs === 2000 ? 'bg-olive font-bold text-white' : 'opacity-70 hover:opacity-100'
              }`}
            >
              2.0s
            </button>
          </div>
        </div>
      </div>

      {/* Top Slide-in Alert Banner for Low-Latency Immediate Visibility */}
      {activeAlert && (
        <SensorAnomalyBanner
          alert={activeAlert}
          onAcknowledge={() => activeAlert && acknowledgeActiveAlert(activeAlert.id)}
          onRouteToTriage={handleEscalateToTriage}
          audioEnabled={audioEnabled}
          onToggleAudio={() => setAudioEnabled(!audioEnabled)}
        />
      )}

      {/* Hackathon Judge Demo Testbed Injection Panel */}
      <div className="p-4 sm:p-5 rounded-2xl bg-stone-900 border border-amber-500/30 shadow-md space-y-3 text-stone-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-amber-500 text-black">
              <Zap className="w-4 h-4 fill-black" />
            </div>
            <div>
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                Hackathon Live Anomaly Injection Controls
              </span>
              <span className="text-[11px] text-stone-400 block">
                Force real-time physiological excursions to demonstrate sub-millisecond detection & triage
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-stone-300">
            <span className="px-2 py-0.5 rounded bg-stone-800 border border-stone-700">
              Pipeline Latency: <strong className="text-emerald-400">{lastPipelineLatencyMs.toFixed(2)} ms</strong>
            </span>
          </div>
        </div>

        {/* Action Injection Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            onClick={() => triggerSpikeHR(142)}
            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Spike HR (142 bpm)</span>
          </button>

          <button
            onClick={() => triggerDropHR(38)}
            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Drop HR (38 bpm)</span>
          </button>

          <button
            onClick={() => triggerDropSpO2(88)}
            className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Drop SpO2 (88%)</span>
          </button>

          <button
            onClick={() => triggerRapidDelta()}
            className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Rapid Delta (+36 bpm)</span>
          </button>

          <button
            onClick={resetToNormal}
            className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 border border-stone-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reset Normal (72 bpm, 98%)</span>
          </button>
        </div>
      </div>

      {/* Live Updating Sensor Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Heart Rate with Pulsing Beat & Anomaly Glow */}
        <div
          id="fitness-card-heart-rate"
          className={`p-5 rounded-2xl bg-cream-soft border transition-all duration-300 shadow-xs flex flex-col justify-between relative overflow-hidden ${
            isHrAnomaly
              ? 'border-rose-500 ring-4 ring-rose-500/25 bg-rose-50/70 shadow-lg'
              : 'border-wellness-border/70 hover:border-olive/40'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                isHrAnomaly
                  ? 'bg-rose-500 text-white animate-bounce'
                  : 'bg-beige-cream border border-wellness-border text-olive'
              }`}
            >
              <Heart
                className={`w-5 h-5 ${
                  currentReading.heartRate > 100
                    ? 'animate-ping duration-500'
                    : 'animate-pulse'
                }`}
              />
            </div>
            <span
              className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isHrAnomaly
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {isHrAnomaly ? 'ANOMALY ALERT' : 'NORMAL RESTING'}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-wellness-muted uppercase tracking-wider block">
              Heart Rate
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-black font-mono tracking-tight transition-colors ${
                  isHrAnomaly ? 'text-rose-700' : 'text-wellness-dark'
                }`}
              >
                {currentReading.heartRate}
              </span>
              <span className="text-xs font-semibold text-wellness-muted">bpm</span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-wellness-border/50 text-[11px] text-wellness-muted flex items-center justify-between">
            <span>Threshold: 45 - 120 bpm</span>
            <span className="font-mono text-[10px] font-semibold">
              {currentReading.heartRate > thresholds.hrMax
                ? '▲ Resting Tachycardia'
                : currentReading.heartRate < thresholds.hrMin
                ? '▼ Severe Bradycardia'
                : '✓ Eucardia'}
            </span>
          </div>
        </div>

        {/* Card 2: SpO2 Blood Oxygen */}
        <div
          id="fitness-card-spo2"
          className={`p-5 rounded-2xl bg-cream-soft border transition-all duration-300 shadow-xs flex flex-col justify-between relative overflow-hidden ${
            isSpO2Anomaly
              ? 'border-rose-500 ring-4 ring-rose-500/25 bg-rose-50/70 shadow-lg'
              : 'border-wellness-border/70 hover:border-olive/40'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                isSpO2Anomaly
                  ? 'bg-rose-500 text-white animate-bounce'
                  : 'bg-beige-cream border border-wellness-border text-olive'
              }`}
            >
              <Wind className="w-5 h-5" />
            </div>
            <span
              className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isSpO2Anomaly
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {isSpO2Anomaly ? 'HYPOXEMIA ALERT' : 'OPTIMAL'}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-wellness-muted uppercase tracking-wider block">
              Blood Oxygen (SpO2)
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-black font-mono tracking-tight transition-colors ${
                  isSpO2Anomaly ? 'text-rose-700' : 'text-wellness-dark'
                }`}
              >
                {currentReading.spO2}
              </span>
              <span className="text-xs font-semibold text-wellness-muted">%</span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-wellness-border/50 text-[11px] text-wellness-muted flex items-center justify-between">
            <span>Clinical Floor: &ge; 92%</span>
            <span className="font-mono text-[10px] font-semibold">
              {currentReading.spO2 < 92 ? 'Critical &lt; 92%' : 'Normal Range'}
            </span>
          </div>
        </div>

        {/* Card 3: Step Count & Cadence */}
        <div
          id="fitness-card-steps"
          className="p-5 rounded-2xl bg-cream-soft border border-wellness-border/70 shadow-xs hover:border-olive/40 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-beige-cream border border-wellness-border flex items-center justify-center text-olive">
              <Footprints className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              {currentReading.activityState}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-wellness-muted uppercase tracking-wider block">
              Step Accumulator
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono tracking-tight text-wellness-dark">
                {currentReading.steps.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-wellness-muted">steps</span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-wellness-border/50 text-[11px] text-wellness-muted flex items-center justify-between">
            <span>Cadence: {currentReading.cadence} spm</span>
            <span className="font-mono text-[10px] font-semibold">
              +{currentReading.stepDelta}/tick
            </span>
          </div>
        </div>

        {/* Card 4: Anomaly Engine Latency SLA */}
        <div
          id="fitness-card-sla"
          className="p-5 rounded-2xl bg-cream-soft border border-wellness-border/70 shadow-xs hover:border-olive/40 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-beige-cream border border-wellness-border flex items-center justify-center text-olive">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>SLA Pass</span>
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-wellness-muted uppercase tracking-wider block">
              Engine Latency
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono tracking-tight text-emerald-700">
                {lastPipelineLatencyMs.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-wellness-muted">ms</span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-wellness-border/50 text-[11px] text-wellness-muted flex items-center justify-between">
            <span>Benchmark: &lt; 5.0 ms</span>
            <span className="font-mono text-[10px] text-emerald-700 font-bold">
              Sub-millisecond
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Physiological Waveform Stream */}
      <SensorWaveformChart
        history={history}
        currentReading={currentReading}
        thresholds={thresholds}
        isStreaming={isStreaming}
      />

      {/* Real-Time Anomaly Audit Log & Escalation Routing Table */}
      <div className="p-6 rounded-3xl bg-cream-soft border border-wellness-border/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-wellness-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-olive/15 text-olive">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-wellness-dark">
                Anomaly Audit Log & Triage Routing History
              </h4>
              <p className="text-xs text-wellness-muted">
                Immutable trace of detected physiological anomalies, rule violations, and downstream escalation routes
              </p>
            </div>
          </div>

          {alerts.length > 0 && (
            <button
              onClick={clearAlertHistory}
              className="text-xs text-wellness-muted hover:text-wellness-dark font-medium transition-colors cursor-pointer"
            >
              Clear Log
            </button>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center text-wellness-muted">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-wellness-dark">
              No anomalies detected in the current stream session
            </span>
            <span className="text-[11px] text-wellness-muted mt-0.5">
              Click any injection button above (e.g., "Spike HR 142 bpm") to test real-time alert generation.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-wellness-border/60 text-wellness-muted uppercase font-mono text-[10px]">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Metric & Value</th>
                  <th className="py-2.5 px-3">Violated Rule</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3">Escalation Route</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wellness-border/40">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-beige-cream/30 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-wellness-dark whitespace-nowrap">
                      {alert.timeFormatted}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-bold text-wellness-dark">
                      <span>{alert.metric}: </span>
                      <span
                        className={
                          alert.severity === 'CRITICAL' ? 'text-rose-700 font-mono' : 'text-amber-700 font-mono'
                        }
                      >
                        {alert.currentValue} {alert.unit}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-wellness-muted whitespace-nowrap">
                      {alert.thresholdRule}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-emerald-700 whitespace-nowrap">
                      {alert.detectionLatencyMs.toFixed(2)} ms
                    </td>
                    <td className="py-3 px-3 text-wellness-dark max-w-xs truncate" title={alert.triageRoute}>
                      {alert.triageRoute}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleEscalateToTriage(alert)}
                        className="px-2.5 py-1 rounded-lg bg-olive text-cream-soft hover:bg-olive-light text-[11px] font-semibold transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <span>Triage in AI Guide</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
