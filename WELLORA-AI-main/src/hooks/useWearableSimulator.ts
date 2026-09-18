import { useState, useEffect, useRef, useCallback } from 'react';
import { SensorReading, AnomalyAlert, AnomalyThresholds } from '../types';

const DEFAULT_THRESHOLDS: AnomalyThresholds = {
  hrMin: 45, // bpm
  hrMax: 120, // bpm (resting)
  spO2Min: 92, // %
  rapidHrDelta: 28, // bpm jump in 1 interval
};

// Safe web audio beep for anomaly notification
const playAnomalySound = (severity: 'CRITICAL' | 'HIGH' | 'WARNING') => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (severity === 'CRITICAL') {
      // Urgent double high pitch
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(740, now + 0.1);
      osc.frequency.setValueAtTime(880, now + 0.2);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // AudioContext blocked or not allowed prior to user gesture
  }
};

export function useWearableSimulator(initialInterval: number = 1200) {
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [intervalMs, setIntervalMs] = useState<number>(initialInterval);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [thresholds] = useState<AnomalyThresholds>(DEFAULT_THRESHOLDS);

  // Current live reading
  const [currentReading, setCurrentReading] = useState<SensorReading>(() => {
    const now = Date.now();
    return {
      id: `reading-${now}`,
      timestamp: now,
      timeFormatted: new Date(now).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      heartRate: 72,
      spO2: 98,
      steps: 4210,
      stepDelta: 0,
      cadence: 0,
      activityState: 'Resting',
    };
  });

  // Rolling history of last 25 readings for waveform display
  const [history, setHistory] = useState<SensorReading[]>(() => {
    const initial: SensorReading[] = [];
    const now = Date.now();
    const baseHr = 71;
    for (let i = 24; i >= 0; i--) {
      const t = now - i * initialInterval;
      // Gentle natural physiological variation between 68 and 75 bpm
      const variation = Math.sin(i * 0.45) * 2.5 + Math.cos(i * 0.8) * 1.5;
      const hr = Math.round(baseHr + variation);
      initial.push({
        id: `init-${t}`,
        timestamp: t,
        timeFormatted: new Date(t).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        heartRate: hr,
        spO2: 98,
        steps: 4200 + (24 - i),
        stepDelta: 0,
        cadence: 0,
        activityState: 'Resting',
      });
    }
    return initial;
  });

  // Alert storage & latest active alert
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [activeAlert, setActiveAlert] = useState<AnomalyAlert | null>(null);

  // Benchmark stats for UI
  const [lastPipelineLatencyMs, setLastPipelineLatencyMs] = useState<number>(0.38);

  // Forced override flag for manual hackathon triggers
  const forcedAnomalyRef = useRef<{
    type: 'tachycardia' | 'bradycardia' | 'hypoxemia' | 'spike';
    value: number;
    ticksRemaining: number;
  } | null>(null);

  const prevHrRef = useRef<number>(72);
  const totalStepsRef = useRef<number>(4210);

  // Low-latency rules-based anomaly detection engine
  const evaluateAnomalyRules = useCallback(
    (reading: SensorReading, prevHr: number): AnomalyAlert | null => {
      const startTime = performance.now();
      let alert: AnomalyAlert | null = null;
      const now = Date.now();
      const timeStr = new Date(now).toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      // Rule 1: High Heart Rate (Tachycardia at rest)
      if (reading.heartRate > thresholds.hrMax) {
        const latency = Number((performance.now() - startTime).toFixed(3));
        alert = {
          id: `alert-hr-high-${now}`,
          timestamp: now,
          timeFormatted: timeStr,
          severity: reading.heartRate >= 135 ? 'CRITICAL' : 'HIGH',
          metric: 'Heart Rate',
          currentValue: reading.heartRate,
          unit: 'bpm',
          thresholdRule: `> ${thresholds.hrMax} bpm (Resting Limit)`,
          explanation: `Resting heart rate spiked to ${reading.heartRate} bpm while sedentary.`,
          triageRoute: 'Clinical Safety Triage: Immediate rest advised; evaluate for arrhythmia or exertion.',
          detectionLatencyMs: latency,
          acknowledged: false,
        };
      }
      // Rule 2: Low Heart Rate (Bradycardia)
      else if (reading.heartRate < thresholds.hrMin) {
        const latency = Number((performance.now() - startTime).toFixed(3));
        alert = {
          id: `alert-hr-low-${now}`,
          timestamp: now,
          timeFormatted: timeStr,
          severity: reading.heartRate <= 38 ? 'CRITICAL' : 'HIGH',
          metric: 'Heart Rate',
          currentValue: reading.heartRate,
          unit: 'bpm',
          thresholdRule: `< ${thresholds.hrMin} bpm (Resting Floor)`,
          explanation: `Heart rate severely dropped to ${reading.heartRate} bpm.`,
          triageRoute: 'Clinical Safety Triage: Assess for dizziness, syncope, or conduction delay.',
          detectionLatencyMs: latency,
          acknowledged: false,
        };
      }
      // Rule 3: Low Blood Oxygen (SpO2 Hypoxemia)
      else if (reading.spO2 < thresholds.spO2Min) {
        const latency = Number((performance.now() - startTime).toFixed(3));
        alert = {
          id: `alert-spo2-${now}`,
          timestamp: now,
          timeFormatted: timeStr,
          severity: reading.spO2 <= 88 ? 'CRITICAL' : 'HIGH',
          metric: 'SpO2',
          currentValue: reading.spO2,
          unit: '%',
          thresholdRule: `< ${thresholds.spO2Min}% (Clinical Baseline)`,
          explanation: `Peripheral oxygen saturation dropped critically to ${reading.spO2}%.`,
          triageRoute: 'Clinical Safety Triage: Potential hypoxemia detected; verify sensor contact and breathing.',
          detectionLatencyMs: latency,
          acknowledged: false,
        };
      }
      // Rule 4: Sudden Rate-of-Change Spike (Delta > 28 bpm in 1 interval)
      else if (Math.abs(reading.heartRate - prevHr) >= thresholds.rapidHrDelta) {
        const latency = Number((performance.now() - startTime).toFixed(3));
        alert = {
          id: `alert-hr-delta-${now}`,
          timestamp: now,
          timeFormatted: timeStr,
          severity: 'HIGH',
          metric: 'Heart Rate Spike',
          currentValue: reading.heartRate,
          unit: 'bpm',
          thresholdRule: `Delta ≥ ±${thresholds.rapidHrDelta} bpm/tick`,
          explanation: `Abrupt cardiac excursion: changed by ${reading.heartRate - prevHr > 0 ? '+' : ''}${reading.heartRate - prevHr} bpm in ${intervalMs / 1000}s.`,
          triageRoute: 'Clinical Safety Triage: Acute rate acceleration detected without gradual warm-up.',
          detectionLatencyMs: latency,
          acknowledged: false,
        };
      }

      const totalLatency = Number((performance.now() - startTime).toFixed(3));
      setLastPipelineLatencyMs(Math.max(0.12, totalLatency));
      return alert;
    },
    [thresholds, intervalMs]
  );

  // Stream generator tick
  useEffect(() => {
    if (!isStreaming) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const timeStr = new Date(now).toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      let nextHr = prevHrRef.current;
      let nextSpO2 = 98;
      let isAnomalyInjected = false;

      // 1. Check if user clicked a hackathon forced demo anomaly
      if (forcedAnomalyRef.current && forcedAnomalyRef.current.ticksRemaining > 0) {
        forcedAnomalyRef.current.ticksRemaining -= 1;
        isAnomalyInjected = true;

        if (forcedAnomalyRef.current.type === 'tachycardia') {
          nextHr = forcedAnomalyRef.current.value + (Math.floor(Math.random() * 5) - 2);
          nextSpO2 = 97;
        } else if (forcedAnomalyRef.current.type === 'bradycardia') {
          nextHr = forcedAnomalyRef.current.value + (Math.floor(Math.random() * 3) - 1);
          nextSpO2 = 96;
        } else if (forcedAnomalyRef.current.type === 'hypoxemia') {
          nextSpO2 = forcedAnomalyRef.current.value;
          nextHr = 88; // elevated compensatory HR
        } else if (forcedAnomalyRef.current.type === 'spike') {
          nextHr = forcedAnomalyRef.current.value;
        }

        if (forcedAnomalyRef.current.ticksRemaining <= 0) {
          forcedAnomalyRef.current = null;
        }
      } else {
        // 2. Normal synthetic wearable physiological model
        // Natural resting fluctuation: HR 66 - 82 bpm
        const hrDrift = (Math.random() - 0.5) * 3;
        nextHr = Math.round(Math.min(88, Math.max(64, prevHrRef.current + hrDrift)));

        // SpO2 normal resting 97-99%
        nextSpO2 = Math.random() > 0.85 ? 97 : Math.random() > 0.4 ? 98 : 99;

        // Occasional natural rare spike (approx 4% chance) to simulate real-world wearable anomalies
        const randomRoll = Math.random();
        if (randomRoll < 0.025) {
          // Natural resting tachycardia blip
          nextHr = 126 + Math.floor(Math.random() * 12);
          isAnomalyInjected = true;
        } else if (randomRoll > 0.98) {
          // Natural momentary hypoxemia dip
          nextSpO2 = 90;
          isAnomalyInjected = true;
        }
      }

      // Step simulation: resting or light walking
      const stepDelta = Math.random() > 0.65 ? Math.floor(Math.random() * 3) + 1 : 0;
      totalStepsRef.current += stepDelta;
      const cadence = stepDelta > 0 ? stepDelta * Math.round(60 / (intervalMs / 1000)) : 0;
      const activityState =
        cadence > 80 ? 'Active Walking' : cadence > 0 ? 'Light Walking' : 'Resting';

      const reading: SensorReading = {
        id: `reading-${now}`,
        timestamp: now,
        timeFormatted: timeStr,
        heartRate: nextHr,
        spO2: nextSpO2,
        steps: totalStepsRef.current,
        stepDelta,
        cadence,
        activityState,
        isAnomalyInjected,
      };

      // Real-time evaluation
      const detectedAlert = evaluateAnomalyRules(reading, prevHrRef.current);
      prevHrRef.current = nextHr;

      setCurrentReading(reading);
      setHistory((prev) => [...prev.slice(-24), reading]);

      if (detectedAlert) {
        setAlerts((prev) => [detectedAlert, ...prev.slice(0, 30)]);
        setActiveAlert(detectedAlert);
        if (audioEnabled) {
          playAnomalySound(detectedAlert.severity);
        }
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isStreaming, intervalMs, audioEnabled, evaluateAnomalyRules]);

  // Hackathon demo triggers
  const triggerSpikeHR = useCallback((targetBpm: number = 138) => {
    forcedAnomalyRef.current = {
      type: 'tachycardia',
      value: targetBpm,
      ticksRemaining: 3,
    };
  }, []);

  const triggerDropHR = useCallback((targetBpm: number = 38) => {
    forcedAnomalyRef.current = {
      type: 'bradycardia',
      value: targetBpm,
      ticksRemaining: 3,
    };
  }, []);

  const triggerDropSpO2 = useCallback((targetSpO2: number = 88) => {
    forcedAnomalyRef.current = {
      type: 'hypoxemia',
      value: targetSpO2,
      ticksRemaining: 3,
    };
  }, []);

  const triggerRapidDelta = useCallback(() => {
    forcedAnomalyRef.current = {
      type: 'spike',
      value: prevHrRef.current + 36,
      ticksRemaining: 2,
    };
  }, []);

  const resetToNormal = useCallback(() => {
    forcedAnomalyRef.current = null;
    prevHrRef.current = 72;
    setActiveAlert(null);
    setCurrentReading((prev) => ({
      ...prev,
      heartRate: 72,
      spO2: 98,
      isAnomalyInjected: false,
    }));
  }, []);

  const acknowledgeActiveAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  const clearAlertHistory = useCallback(() => {
    setAlerts([]);
    setActiveAlert(null);
  }, []);

  return {
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
  };
}
