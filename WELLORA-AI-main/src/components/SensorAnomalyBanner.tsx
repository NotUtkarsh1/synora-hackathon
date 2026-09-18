import React from 'react';
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  X,
  ArrowRight,
  Zap,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AnomalyAlert } from '../types';

interface SensorAnomalyBannerProps {
  alert: AnomalyAlert | null;
  onAcknowledge: () => void;
  onRouteToTriage?: (alert: AnomalyAlert) => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
}

export const SensorAnomalyBanner: React.FC<SensorAnomalyBannerProps> = ({
  alert,
  onAcknowledge,
  onRouteToTriage,
  audioEnabled,
  onToggleAudio,
}) => {
  if (!alert) return null;

  const isCritical = alert.severity === 'CRITICAL';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-lg ${
        isCritical
          ? 'bg-rose-950/90 text-rose-50 border-rose-500 shadow-rose-900/30'
          : 'bg-amber-950/90 text-amber-50 border-amber-500 shadow-amber-900/30'
      }`}
    >
      {/* Visual pulse line on the top border */}
      <div
        className={`h-1.5 w-full animate-pulse ${
          isCritical ? 'bg-rose-500' : 'bg-amber-400'
        }`}
      />

      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left info block */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
              isCritical
                ? 'bg-rose-600 text-white animate-bounce'
                : 'bg-amber-500 text-white animate-pulse'
            }`}
          >
            {isCritical ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider ${
                  isCritical
                    ? 'bg-rose-500 text-white'
                    : 'bg-amber-400 text-amber-950'
                }`}
              >
                {alert.severity} ANOMALY DETECTED
              </span>
              <span className="text-xs font-mono opacity-80 flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded">
                <Zap className="w-3 h-3 text-amber-300" />
                <span>Latency: {alert.detectionLatencyMs.toFixed(2)} ms</span>
              </span>
              <span className="text-xs opacity-75 font-mono">{alert.timeFormatted}</span>
            </div>

            <h4 className="text-base font-bold leading-tight">
              {alert.explanation}
            </h4>

            <p className="text-xs opacity-90 max-w-2xl leading-relaxed text-beige-light">
              <span className="font-semibold text-white">Escalation Route: </span>
              {alert.triageRoute}
            </p>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          <button
            onClick={onToggleAudio}
            title={audioEnabled ? 'Mute anomaly audio' : 'Enable anomaly alert audio'}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-white transition-colors cursor-pointer"
          >
            {audioEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-300" />
            ) : (
              <VolumeX className="w-4 h-4 opacity-70" />
            )}
          </button>

          {onRouteToTriage && (
            <button
              onClick={() => onRouteToTriage(alert)}
              className="px-4 py-2 rounded-xl bg-white text-rose-950 hover:bg-rose-100 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Escalate to AI Triage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onAcknowledge}
            className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
