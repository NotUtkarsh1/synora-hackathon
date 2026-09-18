import React, { useState } from 'react';
import {
  Heart,
  Activity,
  Play,
  Pause,
  Zap,
  RotateCcw,
  Radio,
  Clock,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { SensorReading } from '../types';

interface RealTimeHeartRateChartProps {
  history: SensorReading[];
  currentReading: SensorReading;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onTriggerSpike?: () => void;
  onResetNormal?: () => void;
}

export const RealTimeHeartRateChart: React.FC<RealTimeHeartRateChartProps> = ({
  history,
  currentReading,
  isStreaming,
  onToggleStreaming,
  onTriggerSpike,
  onResetNormal,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    reading: SensorReading;
    index: number;
  } | null>(null);

  // Fallback to currentReading if history is still warming up
  const data = history.length > 0 ? history : [currentReading];

  // SVG coordinate dimensions
  const svgWidth = 800;
  const svgHeight = 280;
  const padding = { top: 30, right: 40, bottom: 40, left: 55 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  // BPM scaling range: 40 to 140 bpm
  const minScaleBpm = 40;
  const maxScaleBpm = 140;

  const getY = (bpm: number) => {
    const clamped = Math.max(minScaleBpm, Math.min(maxScaleBpm, bpm));
    const normalized = (clamped - minScaleBpm) / (maxScaleBpm - minScaleBpm);
    return padding.top + innerHeight - normalized * innerHeight;
  };

  const getX = (index: number, total: number) => {
    if (total <= 1) return padding.left + innerWidth;
    return padding.left + (index / (total - 1)) * innerWidth;
  };

  // Dynamic session statistics
  const currentBpm = currentReading.heartRate;
  const bpmValues = data.map((d) => d.heartRate);
  const sessionMin = Math.min(...bpmValues);
  const sessionMax = Math.max(...bpmValues);
  const sessionAvg = Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length);

  // HRV estimate (RMSSD approximation)
  const rrIntervals = data.map((d) => 60000 / Math.max(35, d.heartRate));
  let sumSqDiff = 0;
  for (let i = 1; i < rrIntervals.length; i++) {
    const diff = rrIntervals[i] - rrIntervals[i - 1];
    sumSqDiff += diff * diff;
  }
  const rmssd =
    rrIntervals.length > 2
      ? Math.round(Math.sqrt(sumSqDiff / (rrIntervals.length - 1)))
      : 52;

  const isElevated = currentBpm > 100;
  const isBradycardia = currentBpm < 50;

  // Points coordinates for SVG path
  const points = data.map((d, i) => ({
    x: getX(i, data.length),
    y: getY(d.heartRate),
    reading: d,
    index: i,
  }));

  const lineD = points.length > 0 ? `M ${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}` : '';
  const areaD =
    points.length > 1
      ? `${lineD} L ${points[points.length - 1].x.toFixed(1)},${padding.top + innerHeight} L ${padding.left},${padding.top + innerHeight} Z`
      : '';

  // Baseline lines coordinates
  const y120 = getY(120);
  const y100 = getY(100);
  const y80 = getY(80);
  const y60 = getY(60);
  const y40 = getY(40);
  const yBaseline = getY(72);

  // Latest head point (real-time leading edge)
  const latestPoint = points[points.length - 1];

  return (
    <div className="space-y-4">
      {/* Real-Time Telemetry Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-cream-soft border border-wellness-border/70 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                isElevated
                  ? 'bg-rose-100 border-rose-300 text-rose-600'
                  : isBradycardia
                  ? 'bg-amber-100 border-amber-300 text-amber-600'
                  : 'bg-olive/15 border-olive/30 text-olive'
              }`}
            >
              <Heart
                className="w-5 h-5 fill-current animate-heartbeat"
                style={{
                  animationDuration: `${(60 / Math.max(40, currentBpm)).toFixed(2)}s`,
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

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-wellness-dark font-mono flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>Live Synced Telemetry</span>
              </span>
              <span className="text-[10px] text-emerald-800 bg-emerald-100/90 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                100% Synced with Overview
              </span>
            </div>
            <p className="text-[11px] text-wellness-muted">
              Live ECG rhythm • updates dynamically with wearable telemetry
            </p>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2">
          {onTriggerSpike && onResetNormal && (
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
              <button
                onClick={onTriggerSpike}
                title="Test real-time spike sync"
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer transition-all flex items-center gap-1"
              >
                <Zap className="w-3 h-3 text-rose-600" />
                <span>Simulate Spike</span>
              </button>
              <button
                onClick={onResetNormal}
                title="Reset to normal rhythm"
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-olive/10 text-olive-dark border border-olive/20 hover:bg-olive/20 cursor-pointer transition-all flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3 text-olive" />
                <span>Normal</span>
              </button>
            </div>
          )}

          <button
            onClick={onToggleStreaming}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              isStreaming
                ? 'bg-olive text-cream-soft hover:bg-olive-dark shadow-xs'
                : 'bg-amber-600 text-cream-soft hover:bg-amber-500 shadow-xs'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Feed</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Resume Feed</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Synchronized Metrics Quick Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
        {/* Live Current */}
        <div className="p-3 rounded-xl bg-cream-soft border border-wellness-border/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-wellness-muted block">
            Current Live
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`text-2xl font-black font-mono tracking-tight transition-colors ${
                isElevated ? 'text-rose-600' : isBradycardia ? 'text-amber-600' : 'text-wellness-dark'
              }`}
            >
              {currentBpm}
            </span>
            <span className="text-[10px] font-semibold text-wellness-muted">BPM</span>
          </div>
          <span className="text-[10px] font-medium text-emerald-700 block mt-0.5">
            {isElevated ? 'Above Resting Limit' : isBradycardia ? 'Below Normal' : 'Optimal Sinus Rhythm'}
          </span>
        </div>

        {/* Session Min */}
        <div className="p-3 rounded-xl bg-cream-soft border border-wellness-border/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-wellness-muted block">
            Session Min
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-black font-mono tracking-tight text-wellness-dark">
              {sessionMin}
            </span>
            <span className="text-[10px] font-semibold text-wellness-muted">BPM</span>
          </div>
          <span className="text-[10px] text-wellness-muted block mt-0.5">Trough Resting</span>
        </div>

        {/* Session Max */}
        <div className="p-3 rounded-xl bg-cream-soft border border-wellness-border/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-wellness-muted block">
            Session Peak
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`text-2xl font-black font-mono tracking-tight ${
                sessionMax > 100 ? 'text-rose-600' : 'text-wellness-dark'
              }`}
            >
              {sessionMax}
            </span>
            <span className="text-[10px] font-semibold text-wellness-muted">BPM</span>
          </div>
          <span className="text-[10px] text-wellness-muted block mt-0.5">Peak Observed</span>
        </div>

        {/* Session Average */}
        <div className="p-3 rounded-xl bg-cream-soft border border-wellness-border/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-wellness-muted block">
            Session Mean
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-black font-mono tracking-tight text-wellness-dark">
              {sessionAvg}
            </span>
            <span className="text-[10px] font-semibold text-wellness-muted">BPM</span>
          </div>
          <span className="text-[10px] text-wellness-muted block mt-0.5">Rolling Window</span>
        </div>

        {/* HRV Estimate */}
        <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-cream-soft border border-wellness-border/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-wellness-muted block">
            HRV (RMSSD)
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-black font-mono tracking-tight text-emerald-700">
              {rmssd}
            </span>
            <span className="text-[10px] font-semibold text-wellness-muted">ms</span>
          </div>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Autonomic Tone</span>
        </div>
      </div>

      {/* SVG Real-time Waveform Canvas Container */}
      <div className="relative w-full rounded-2xl bg-beige-card/90 border border-wellness-border/80 p-4 sm:p-5 overflow-hidden shadow-xs">
        {/* Graph Legend & Status bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-wellness-border/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-wellness-dark">
              Real-Time Heart Rate Waveform
            </span>
            <span className="text-[11px] text-wellness-muted">
              ({data.length} telemetry points, {isStreaming ? 'Streaming @ 1.2s' : 'Paused'})
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-wellness-muted font-mono">
              <span className="inline-block w-3 h-0.5 bg-emerald-600/70 border-t border-dashed" />
              <span>Target Baseline (72 BPM)</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-800 font-mono">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-400" />
              <span>Resting Zone (60–100 BPM)</span>
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 font-mono">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Elevated (&gt;100 BPM)</span>
            </span>
          </div>
        </div>

        {/* Real-Time SVG Stage */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-56 sm:h-64 overflow-visible select-none"
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              {/* Normal Olive/Emerald Area Gradient */}
              <linearGradient id="liveHrGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5F745B" stopOpacity="0.38" />
                <stop offset="60%" stopColor="#7B9177" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#FAF7F0" stopOpacity="0.0" />
              </linearGradient>

              {/* Elevated Alert Area Gradient */}
              <linearGradient id="alertHrGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e11d48" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#FAF7F0" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Resting Zone Safe Shading (60 to 100 bpm) */}
            <rect
              x={padding.left}
              y={y100}
              width={innerWidth}
              height={Math.abs(y60 - y100)}
              fill="#5F745B"
              fillOpacity="0.06"
            />

            {/* Y-Axis Horizontal Grid Lines */}
            {[
              { val: 140, y: getY(140) },
              { val: 120, y: y120 },
              { val: 100, y: y100 },
              { val: 80, y: y80 },
              { val: 60, y: y60 },
              { val: 40, y: y40 },
            ].map((grid) => (
              <g key={grid.val}>
                <line
                  x1={padding.left}
                  y1={grid.y}
                  x2={padding.left + innerWidth}
                  y2={grid.y}
                  stroke="#DDD4C1"
                  strokeWidth="1"
                  strokeDasharray={grid.val === 100 || grid.val === 60 ? '4 3' : '2 4'}
                  opacity={grid.val === 100 ? 0.9 : 0.6}
                />
                <text
                  x={padding.left - 10}
                  y={grid.y + 4}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-wellness-muted font-semibold"
                >
                  {grid.val}
                </text>
              </g>
            ))}

            {/* Target 72 BPM Baseline line */}
            <line
              x1={padding.left}
              y1={yBaseline}
              x2={padding.left + innerWidth}
              y2={yBaseline}
              stroke="#5F745B"
              strokeWidth="1.5"
              strokeDasharray="5 4"
              opacity="0.55"
            />
            <text
              x={padding.left + innerWidth - 6}
              y={yBaseline - 5}
              textAnchor="end"
              className="text-[9px] font-mono fill-olive font-bold"
            >
              Resting Baseline 72 BPM
            </text>

            {/* Area Fill Under Curve */}
            {areaD && (
              <path
                d={areaD}
                fill={isElevated ? 'url(#alertHrGradient)' : 'url(#liveHrGradient)'}
                className="transition-all duration-300"
              />
            )}

            {/* Heart Rate Waveform Curve */}
            {lineD && (
              <path
                d={lineD}
                fill="none"
                stroke={isElevated ? '#e11d48' : '#5F745B'}
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
            )}

            {/* Vertical Guide Line at Latest Real-Time Head */}
            {latestPoint && (
              <line
                x1={latestPoint.x}
                y1={padding.top}
                x2={latestPoint.x}
                y2={padding.top + innerHeight}
                stroke={isElevated ? '#e11d48' : '#5F745B'}
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.6"
              />
            )}

            {/* Interactive Data Point Dots */}
            {points.map((p, idx) => {
              const isPointElevated = p.reading.heartRate > 100;
              const isLatest = idx === points.length - 1;

              return (
                <g key={p.reading.id || idx}>
                  {/* Larger transparent hover hit area */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={12}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(p)}
                  />

                  {/* Visual point dot */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isLatest ? 5.5 : 3.5}
                    fill={isPointElevated ? '#e11d48' : isLatest ? '#445641' : '#5F745B'}
                    stroke="#FFFDF7"
                    strokeWidth={isLatest ? 2.5 : 1.5}
                    className="transition-all duration-200"
                  />

                  {/* Pulsing beacon on latest live head */}
                  {isLatest && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={10}
                      fill="none"
                      stroke={isElevated ? '#e11d48' : '#5F745B'}
                      strokeWidth="2"
                      opacity="0.75"
                      className="animate-ping"
                      style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                    />
                  )}
                </g>
              );
            })}

            {/* Hover Crosshair & Tooltip Overlay */}
            {hoveredPoint && (
              <g>
                <line
                  x1={hoveredPoint.x}
                  y1={padding.top}
                  x2={hoveredPoint.x}
                  y2={padding.top + innerHeight}
                  stroke="#222B1E"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity="0.7"
                />
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.y}
                  r={6.5}
                  fill="#FFFDF7"
                  stroke="#222B1E"
                  strokeWidth="3"
                />
              </g>
            )}

            {/* X-Axis Bottom Baseline */}
            <line
              x1={padding.left}
              y1={padding.top + innerHeight}
              x2={padding.left + innerWidth}
              y2={padding.top + innerHeight}
              stroke="#DDD4C1"
              strokeWidth="1.5"
            />
          </svg>

          {/* Hover Floating Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute z-20 pointer-events-none p-2 rounded-xl bg-wellness-dark text-cream-soft shadow-lg text-xs font-mono transform -translate-x-1/2 -translate-y-full mb-2"
              style={{
                left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                top: `${(hoveredPoint.y / svgHeight) * 100}%`,
              }}
            >
              <div className="font-bold flex items-center gap-1.5 text-cream-soft">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-current" />
                <span>{hoveredPoint.reading.heartRate} BPM</span>
              </div>
              <div className="text-[10px] text-beige-light/80 mt-0.5">
                {hoveredPoint.reading.timeFormatted} • {hoveredPoint.reading.activityState}
              </div>
            </div>
          )}

          {/* Live Head Cursor Tag (floating on top of latest point) */}
          {latestPoint && !hoveredPoint && (
            <div
              className="absolute z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2.5 transition-all duration-300"
              style={{
                left: `${(latestPoint.x / svgWidth) * 100}%`,
                top: `${(latestPoint.y / svgHeight) * 100}%`,
              }}
            >
              <div
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shadow-xs flex items-center gap-1 whitespace-nowrap ${
                  isElevated
                    ? 'bg-rose-600 text-white'
                    : 'bg-wellness-dark text-cream-soft'
                }`}
              >
                <span>{currentBpm} BPM</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* X-Axis Timeline Labels */}
        <div className="pt-2 flex justify-between text-[10px] font-mono font-semibold text-wellness-muted/80 px-2 sm:px-4">
          <span>-30s</span>
          <span>-25s</span>
          <span>-20s</span>
          <span>-15s</span>
          <span>-10s</span>
          <span>-5s</span>
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>NOW (Synchronized)</span>
          </span>
        </div>
      </div>
    </div>
  );
};
