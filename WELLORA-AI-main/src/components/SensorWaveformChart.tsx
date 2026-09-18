import React from 'react';
import { SensorReading, AnomalyThresholds } from '../types';
import { Activity, Zap } from 'lucide-react';

interface SensorWaveformChartProps {
  history: SensorReading[];
  currentReading: SensorReading;
  thresholds: AnomalyThresholds;
  isStreaming: boolean;
}

export const SensorWaveformChart: React.FC<SensorWaveformChartProps> = ({
  history,
  currentReading,
  thresholds,
  isStreaming,
}) => {
  // Ensure at least a few points for rendering
  const data = history.length > 0 ? history : [currentReading];

  const width = 640;
  const height = 180;
  const padding = { top: 25, right: 35, bottom: 25, left: 45 };

  const minBpm = 30;
  const maxBpm = 160;

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const getY = (bpm: number) => {
    const clamped = Math.max(minBpm, Math.min(maxBpm, bpm));
    const normalized = (clamped - minBpm) / (maxBpm - minBpm);
    return padding.top + innerHeight - normalized * innerHeight;
  };

  const getX = (index: number, total: number) => {
    if (total <= 1) return padding.left + innerWidth;
    return padding.left + (index / (total - 1)) * innerWidth;
  };

  // Generate SVG path for Heart Rate
  const points = data.map((d, i) => `${getX(i, data.length)},${getY(d.heartRate)}`);
  const hrPathD = points.length > 0 ? `M ${points.join(' L ')}` : '';

  // Area under curve for heart rate
  const areaD =
    points.length > 1
      ? `${hrPathD} L ${getX(data.length - 1, data.length)},${padding.top + innerHeight} L ${padding.left},${padding.top + innerHeight} Z`
      : '';

  const upperLimitY = getY(thresholds.hrMax);
  const lowerLimitY = getY(thresholds.hrMin);

  return (
    <div className="w-full rounded-2xl bg-stone-900/90 border border-stone-800 p-4 sm:p-5 text-stone-100 shadow-inner">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-stone-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-stone-200">Real-Time Physiological Telemetry Stream</span>
            <span className="text-stone-400 text-[11px] block">
              Rolling 25-reading window with sub-second threshold detection
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Normal Zone (50-100 bpm)</span>
          </span>
          <span className="flex items-center gap-1 text-rose-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Spike Threshold (&gt;{thresholds.hrMax} bpm)</span>
          </span>
          <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-mono border border-stone-700">
            {isStreaming ? 'STREAMING ACTIVE' : 'PAUSED'}
          </span>
        </div>
      </div>

      {/* SVG Waveform Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 sm:h-52 overflow-visible select-none"
        >
          <defs>
            <linearGradient id="hrGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="alertGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Safe Green Zone Rectangle */}
          <rect
            x={padding.left}
            y={getY(100)}
            width={innerWidth}
            height={getY(50) - getY(100)}
            fill="#10b981"
            fillOpacity="0.06"
          />

          {/* Grid lines */}
          {[40, 60, 80, 100, 120, 140].map((bpm) => {
            const y = getY(bpm);
            return (
              <g key={bpm}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + innerWidth}
                  y2={y}
                  stroke="#374151"
                  strokeDasharray="3 3"
                  strokeWidth="0.8"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  fill="#9ca3af"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {bpm}
                </text>
              </g>
            );
          })}

          {/* Upper Threshold Line (> 120 bpm) */}
          <line
            x1={padding.left}
            y1={upperLimitY}
            x2={padding.left + innerWidth}
            y2={upperLimitY}
            stroke="#f43f5e"
            strokeDasharray="4 3"
            strokeWidth="1.5"
          />
          <text
            x={padding.left + innerWidth + 6}
            y={upperLimitY + 3.5}
            fill="#f43f5e"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {thresholds.hrMax} max
          </text>

          {/* Lower Threshold Line (< 45 bpm) */}
          <line
            x1={padding.left}
            y1={lowerLimitY}
            x2={padding.left + innerWidth}
            y2={lowerLimitY}
            stroke="#f43f5e"
            strokeDasharray="4 3"
            strokeWidth="1.5"
          />
          <text
            x={padding.left + innerWidth + 6}
            y={lowerLimitY + 3.5}
            fill="#f43f5e"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {thresholds.hrMin} min
          </text>

          {/* Heart Rate Area fill */}
          {areaD && (
            <path
              d={areaD}
              fill={currentReading.heartRate > thresholds.hrMax ? 'url(#alertGradient)' : 'url(#hrGradient)'}
            />
          )}

          {/* Heart Rate Waveform Polyline */}
          {hrPathD && (
            <path
              d={hrPathD}
              fill="none"
              stroke={
                currentReading.heartRate > thresholds.hrMax || currentReading.heartRate < thresholds.hrMin
                  ? '#f43f5e'
                  : '#10b981'
              }
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points on the line */}
          {data.map((d, idx) => {
            const cx = getX(idx, data.length);
            const cy = getY(d.heartRate);
            const isAnomaly = d.heartRate > thresholds.hrMax || d.heartRate < thresholds.hrMin;
            const isLatest = idx === data.length - 1;

            return (
              <g key={d.id || idx}>
                {isAnomaly && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="8"
                    fill="#f43f5e"
                    fillOpacity="0.4"
                    className="animate-ping"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isLatest ? '5' : isAnomaly ? '4' : '2.5'}
                  fill={isAnomaly ? '#f43f5e' : isLatest ? '#34d399' : '#10b981'}
                  stroke="#111827"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* Latest Current Value Callout Badge */}
          {data.length > 0 && (
            <g transform={`translate(${getX(data.length - 1, data.length)}, ${getY(currentReading.heartRate) - 18})`}>
              <rect
                x="-24"
                y="-14"
                width="48"
                height="18"
                rx="4"
                fill={
                  currentReading.heartRate > thresholds.hrMax || currentReading.heartRate < thresholds.hrMin
                    ? '#e11d48'
                    : '#047857'
                }
              />
              <text
                x="0"
                y="-2"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {currentReading.heartRate} bpm
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
