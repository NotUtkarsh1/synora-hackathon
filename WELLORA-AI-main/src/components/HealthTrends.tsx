import React, { useState } from 'react';
import {
  LineChart,
  Heart,
  Moon,
  Footprints,
  Droplets,
  Apple,
  Radio,
  Sparkles,
  ArrowUpRight,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';
import { RealTimeHeartRateChart } from './RealTimeHeartRateChart';

const METRIC_OPTIONS = ['Heart Rate', 'Sleep Quality', 'Daily Activity', 'Hydration', 'Nutrition'];
const TIMEFRAME_OPTIONS = ['Live Stream', 'Day', 'Week', 'Month'];

export const HealthTrends: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState(METRIC_OPTIONS[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAME_OPTIONS[0]);

  const {
    currentReading,
    history,
    isStreaming,
    setIsStreaming,
    triggerSpikeHR,
    resetToNormal,
  } = useTelemetry();

  return (
    <section id="health-trends-section" className="space-y-4">
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-cream-soft">Health Trends</h3>
            {selectedMetric === 'Heart Rate' && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Stream Synced</span>
              </span>
            )}
          </div>
          <p className="text-xs text-beige-light/80">
            {selectedMetric === 'Heart Rate'
              ? 'Real-time telemetry waveform synchronized with above heart rate monitor'
              : 'Longitudinal wellness metrics & trend analysis'}
          </p>
        </div>

        {/* Metric selection controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Metric Selector Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-cream-soft border border-wellness-border overflow-x-auto shadow-xs">
            {METRIC_OPTIONS.map((metric) => {
              const isSelected = selectedMetric === metric;
              return (
                <button
                  key={metric}
                  onClick={() => {
                    setSelectedMetric(metric);
                    if (metric === 'Heart Rate') {
                      setSelectedTimeframe('Live Stream');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-olive text-cream-soft shadow-xs font-semibold'
                      : 'text-wellness-muted hover:text-wellness-dark'
                  }`}
                >
                  {metric === 'Heart Rate' && (
                    <Heart className={`w-3.5 h-3.5 ${isSelected ? 'fill-current' : 'text-rose-500'}`} />
                  )}
                  {metric === 'Sleep Quality' && <Moon className="w-3.5 h-3.5" />}
                  {metric === 'Daily Activity' && <Footprints className="w-3.5 h-3.5" />}
                  {metric === 'Hydration' && <Droplets className="w-3.5 h-3.5" />}
                  {metric === 'Nutrition' && <Apple className="w-3.5 h-3.5" />}
                  <span>{metric}</span>
                </button>
              );
            })}
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center p-1 rounded-xl bg-cream-soft border border-wellness-border shadow-xs">
            {TIMEFRAME_OPTIONS.map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedTimeframe === tf
                    ? 'bg-cream-soft text-wellness-dark shadow-xs font-bold border border-wellness-border/70'
                    : 'text-wellness-muted hover:text-wellness-dark'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Trends Display Container */}
      <div className="p-5 sm:p-7 rounded-3xl bg-cream-soft border border-wellness-border/80 shadow-xs space-y-5">
        {/* Metric Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-wellness-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-olive/15 flex items-center justify-center text-olive border border-olive/20">
              {selectedMetric === 'Heart Rate' ? (
                <Heart
                  className="w-5 h-5 text-rose-600 fill-rose-600 animate-heartbeat"
                  style={{
                    animationDuration: `${(60 / Math.max(40, currentReading.heartRate)).toFixed(2)}s`,
                  }}
                />
              ) : selectedMetric === 'Sleep Quality' ? (
                <Moon className="w-5 h-5 text-indigo-600" />
              ) : selectedMetric === 'Daily Activity' ? (
                <Footprints className="w-5 h-5 text-emerald-600" />
              ) : selectedMetric === 'Hydration' ? (
                <Droplets className="w-5 h-5 text-sky-600" />
              ) : (
                <Apple className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div>
              <div className="text-base font-bold text-wellness-dark flex items-center gap-2">
                <span>{selectedMetric} Trend</span>
                {selectedMetric === 'Heart Rate' && selectedTimeframe === 'Live Stream' && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                    Synced: {currentReading.heartRate} BPM
                  </span>
                )}
              </div>
              <div className="text-xs text-wellness-muted">
                {selectedMetric === 'Heart Rate' && selectedTimeframe === 'Live Stream'
                  ? 'Streaming live from physiological sensor pipeline • in sync with Health Overview'
                  : `${selectedTimeframe} view • Consolidated telemetry & biometric benchmarks`}
              </div>
            </div>
          </div>

          {selectedMetric === 'Heart Rate' ? (
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  document.getElementById('card-heart-rate')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs text-olive hover:text-olive-dark font-medium flex items-center gap-1 hover:underline cursor-pointer bg-beige-cream/80 px-2.5 py-1 rounded-lg border border-wellness-border/70"
              >
                <span>Jump to Top Vitals</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-wellness-muted">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-olive/40" />
              <span>Target</span>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-olive ml-2" />
              <span>Observed</span>
            </div>
          )}
        </div>

        {/* Dynamic Metric View */}
        {selectedMetric === 'Heart Rate' ? (
          selectedTimeframe === 'Live Stream' ? (
            /* REAL-TIME SYNCHRONIZED GRAPH */
            <RealTimeHeartRateChart
              history={history}
              currentReading={currentReading}
              isStreaming={isStreaming}
              onToggleStreaming={() => setIsStreaming(!isStreaming)}
              onTriggerSpike={() => triggerSpikeHR(136)}
              onResetNormal={resetToNormal}
            />
          ) : (
            /* Historical Trend View for Day/Week/Month */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-beige-cream/60 border border-wellness-border/60 text-xs">
                <div className="flex items-center gap-2 text-wellness-dark">
                  <Clock className="w-4 h-4 text-olive" />
                  <span>Showing {selectedTimeframe}ly aggregate heart rate curve.</span>
                </div>
                <button
                  onClick={() => setSelectedTimeframe('Live Stream')}
                  className="px-3 py-1 rounded-lg bg-olive text-cream-soft font-medium text-xs hover:bg-olive-dark cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Radio className="w-3 h-3 text-emerald-300 animate-pulse" />
                  <span>Switch to Real-Time Feed</span>
                </button>
              </div>

              {/* 24-Hour Diurnal Heart Rate Chart */}
              <div className="h-64 w-full relative p-4 rounded-2xl bg-beige-card border border-wellness-border/70 flex flex-col justify-between">
                <div className="w-full flex justify-between text-[10px] font-mono text-wellness-muted border-b border-dashed border-wellness-border/60 pb-1">
                  <span>Peak Exertion (112 BPM)</span>
                  <span>Max Limit</span>
                </div>
                <div className="w-full flex justify-between text-[10px] font-mono text-wellness-muted border-b border-dashed border-wellness-border/60 pb-1">
                  <span>Daytime Resting Average (71 BPM)</span>
                  <span>Baseline</span>
                </div>
                <div className="w-full flex justify-between text-[10px] font-mono text-wellness-muted border-b border-dashed border-wellness-border/60 pb-1">
                  <span>Nocturnal Basal (56 BPM)</span>
                  <span>Deep Sleep</span>
                </div>

                <svg viewBox="0 0 700 160" className="w-full h-36 overflow-visible" preserveAspectRatio="none">
                  <path
                    d="M 20,130 C 80,135 140,120 200,85 C 260,60 320,35 380,45 C 440,55 500,90 560,70 C 620,85 660,110 680,125"
                    fill="none"
                    stroke="#5F745B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Scatter key milestone dots */}
                  {[
                    { x: 50, y: 132, label: '04:00 • 56 bpm' },
                    { x: 200, y: 85, label: '09:30 • 72 bpm' },
                    { x: 380, y: 45, label: '14:15 • 112 bpm (Active)' },
                    { x: 560, y: 70, label: '19:00 • 68 bpm' },
                  ].map((p, idx) => (
                    <g key={idx}>
                      <circle cx={p.x} cy={p.y} r={4.5} fill="#5F745B" stroke="#FFFDF7" strokeWidth="2" />
                      <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[9px] font-mono fill-wellness-dark font-bold">
                        {p.label}
                      </text>
                    </g>
                  ))}
                </svg>

                <div className="pt-2 border-t border-wellness-border flex justify-between text-[10px] font-mono text-wellness-muted px-2">
                  <span>00:00 (Sleep)</span>
                  <span>06:00 (Wake)</span>
                  <span>12:00 (Noon)</span>
                  <span>18:00 (Evening)</span>
                  <span>23:59 (Rest)</span>
                </div>
              </div>
            </div>
          )
        ) : selectedMetric === 'Sleep Quality' ? (
          /* Sleep Architecture & 7-Day Trend */
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-beige-card border border-wellness-border/70">
                <span className="text-[10px] font-bold text-wellness-muted uppercase">Duration</span>
                <div className="text-xl font-mono font-black text-wellness-dark mt-0.5">7h 45m</div>
                <span className="text-[10px] text-emerald-700 font-medium">97% of 8h goal</span>
              </div>
              <div className="p-3 rounded-xl bg-beige-card border border-wellness-border/70">
                <span className="text-[10px] font-bold text-wellness-muted uppercase">Sleep Score</span>
                <div className="text-xl font-mono font-black text-indigo-700 mt-0.5">88%</div>
                <span className="text-[10px] text-wellness-muted font-medium">Restorative Grade A</span>
              </div>
              <div className="p-3 rounded-xl bg-beige-card border border-wellness-border/70">
                <span className="text-[10px] font-bold text-wellness-muted uppercase">Deep & REM</span>
                <div className="text-xl font-mono font-black text-wellness-dark mt-0.5">3h 35m</div>
                <span className="text-[10px] text-wellness-muted font-medium">46% of Total Sleep</span>
              </div>
              <div className="p-3 rounded-xl bg-beige-card border border-wellness-border/70">
                <span className="text-[10px] font-bold text-wellness-muted uppercase">Latency</span>
                <div className="text-xl font-mono font-black text-wellness-dark mt-0.5">14 min</div>
                <span className="text-[10px] text-emerald-700 font-medium">Optimal onset</span>
              </div>
            </div>

            <div className="h-48 w-full p-4 rounded-2xl bg-beige-card border border-wellness-border/70 flex flex-col justify-between">
              <div className="flex justify-between text-xs text-wellness-muted font-mono">
                <span>7-Day Sleep Score Distribution</span>
                <span className="text-olive font-semibold">Weekly Avg: 86.4%</span>
              </div>
              <div className="flex items-end justify-between gap-2 h-28 pt-2">
                {[
                  { day: 'Mon', score: 82, dur: '7.2h' },
                  { day: 'Tue', score: 85, dur: '7.5h' },
                  { day: 'Wed', score: 79, dur: '6.8h' },
                  { day: 'Thu', score: 88, dur: '7.8h' },
                  { day: 'Fri', score: 91, dur: '8.1h' },
                  { day: 'Sat', score: 86, dur: '7.6h' },
                  { day: 'Sun', score: 88, dur: '7.75h' },
                ].map((s) => (
                  <div key={s.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[9px] font-mono text-wellness-dark font-bold">{s.score}%</span>
                    <div
                      className="w-full max-w-[36px] rounded-t-lg bg-indigo-500/80 hover:bg-indigo-600 transition-all cursor-pointer"
                      style={{ height: `${(s.score / 100) * 80}px` }}
                      title={`${s.day}: ${s.dur} (${s.score}%)`}
                    />
                    <span className="text-[10px] font-mono text-wellness-muted">{s.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : selectedMetric === 'Daily Activity' ? (
          /* Daily Activity Trend */
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-beige-card border border-wellness-border/70">
                <span className="text-[10px] font-bold text-wellness-muted uppercase">Active Calories</span>
                <div className="text-xl font-mono font-black text-wellness-dark mt-0.5">520 kcal</div>
                <span className="text-[10px] text-emerald-700 font-medium">80% of 650 kcal target</span>
              </div>
              <div className="p-3 rounded-xl bg-beige-card border border-wellness-border/70">
                <span className="text-[10px] font-bold text-wellness-muted uppercase">Steps Logged</span>
                <div className="text-xl font-mono font-black text-wellness-dark mt-0.5">
                  {currentReading.steps.toLocaleString()}
                </div>
                <span className="text-[10px] text-wellness-muted font-medium">Wearable Synced</span>
              </div>
              <div className="p-3 rounded-xl bg-beige-card border border-wellness-border/70">
                <span className="text-[10px] font-bold text-wellness-muted uppercase">Active Minutes</span>
                <div className="text-xl font-mono font-black text-wellness-dark mt-0.5">42 min</div>
                <span className="text-[10px] text-emerald-700 font-medium">Target: 45 min</span>
              </div>
            </div>

            <div className="h-48 w-full p-4 rounded-2xl bg-beige-card border border-wellness-border/70 flex flex-col justify-between">
              <div className="flex justify-between text-xs text-wellness-muted font-mono">
                <span>Hourly Calorie Burn Trajectory</span>
                <span className="text-olive font-semibold">Target: 650 kcal</span>
              </div>
              <svg viewBox="0 0 700 120" className="w-full h-28" preserveAspectRatio="none">
                <path
                  d="M 20,110 Q 150,105 250,75 T 450,35 T 680,25"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                />
                <line x1="20" y1="35" x2="680" y2="35" stroke="#DDD4C1" strokeWidth="1" strokeDasharray="4 4" />
              </svg>
              <div className="flex justify-between text-[10px] font-mono text-wellness-muted px-2">
                <span>06:00</span>
                <span>09:00</span>
                <span>12:00</span>
                <span>15:00</span>
                <span>18:00</span>
                <span>21:00</span>
              </div>
            </div>
          </div>
        ) : selectedMetric === 'Hydration' ? (
          /* Hydration Timeline */
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-beige-card border border-wellness-border/70">
                <span className="text-[10px] font-bold text-wellness-muted uppercase">Total Logged</span>
                <div className="text-xl font-mono font-black text-wellness-dark mt-0.5">2,250 ml</div>
                <span className="text-[10px] text-sky-700 font-medium">75% of 3,000 ml goal</span>
              </div>
              <div className="p-3 rounded-xl bg-beige-card border border-wellness-border/70">
                <span className="text-[10px] font-bold text-wellness-muted uppercase">Remaining</span>
                <div className="text-xl font-mono font-black text-wellness-dark mt-0.5">750 ml</div>
                <span className="text-[10px] text-wellness-muted font-medium">3 glasses before bed</span>
              </div>
              <div className="p-3 rounded-xl bg-beige-card border border-wellness-border/70">
                <span className="text-[10px] font-bold text-wellness-muted uppercase">Hourly Pace</span>
                <div className="text-xl font-mono font-black text-wellness-dark mt-0.5">250 ml/h</div>
                <span className="text-[10px] text-emerald-700 font-medium">Consistent intake</span>
              </div>
            </div>

            <div className="h-44 w-full p-4 rounded-2xl bg-beige-card border border-wellness-border/70 flex flex-col justify-between">
              <div className="flex justify-between text-xs text-wellness-muted font-mono">
                <span>Cumulative Hydration Progression (ml)</span>
                <span className="text-sky-700 font-semibold">Target: 3,000 ml</span>
              </div>
              <div className="w-full bg-beige-light/70 h-5 rounded-full overflow-hidden p-0.5 border border-wellness-border/80 my-auto">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all duration-500"
                  style={{ width: '75%' }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-wellness-muted px-2">
                <span>08:00 (500ml)</span>
                <span>11:00 (1100ml)</span>
                <span>14:00 (1650ml)</span>
                <span>17:00 (2250ml)</span>
                <span>21:00 (3000ml Goal)</span>
              </div>
            </div>
          </div>
        ) : (
          /* Nutrition Overview */
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-beige-card border border-wellness-border/70">
                <span className="text-[10px] font-bold text-wellness-muted uppercase">Consumed</span>
                <div className="text-xl font-mono font-black text-wellness-dark mt-0.5">1,840 kcal</div>
                <span className="text-[10px] text-wellness-muted font-medium">Target: 2,100 kcal</span>
              </div>
              <div className="p-3 rounded-xl bg-beige-card border border-wellness-border/70">
                <span className="text-[10px] font-bold text-wellness-muted uppercase">Protein</span>
                <div className="text-xl font-mono font-black text-amber-800 mt-0.5">128g</div>
                <span className="text-[10px] text-emerald-700 font-medium">Goal: 130g</span>
              </div>
              <div className="p-3 rounded-xl bg-beige-card border border-wellness-border/70">
                <span className="text-[10px] font-bold text-wellness-muted uppercase">Carbs</span>
                <div className="text-xl font-mono font-black text-wellness-dark mt-0.5">195g</div>
                <span className="text-[10px] text-wellness-muted font-medium">Goal: 220g</span>
              </div>
              <div className="p-3 rounded-xl bg-beige-card border border-wellness-border/70">
                <span className="text-[10px] font-bold text-wellness-muted uppercase">Healthy Fats</span>
                <div className="text-xl font-mono font-black text-wellness-dark mt-0.5">58g</div>
                <span className="text-[10px] text-wellness-muted font-medium">Goal: 65g</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-beige-card border border-wellness-border/70 text-xs flex flex-col gap-2">
              <div className="flex justify-between font-mono text-wellness-dark font-semibold">
                <span>Macronutrient Ratio Breakdown</span>
                <span>Calorie Deficit: -260 kcal</span>
              </div>
              <div className="w-full flex h-4 rounded-full overflow-hidden border border-wellness-border/80">
                <div style={{ width: '30%' }} className="bg-amber-600" title="Protein 30%" />
                <div style={{ width: '45%' }} className="bg-emerald-600" title="Carbs 45%" />
                <div style={{ width: '25%' }} className="bg-sky-600" title="Fats 25%" />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-wellness-muted">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-600" /> Protein (30%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" /> Carbs (45%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-600" /> Healthy Fats (25%)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

