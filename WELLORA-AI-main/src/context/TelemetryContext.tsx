import React, { createContext, useContext } from 'react';
import { useWearableSimulator } from '../hooks/useWearableSimulator';
import { SensorReading, AnomalyAlert, AnomalyThresholds } from '../types';

export interface TelemetryContextValue {
  isStreaming: boolean;
  setIsStreaming: React.Dispatch<React.SetStateAction<boolean>>;
  intervalMs: number;
  setIntervalMs: React.Dispatch<React.SetStateAction<number>>;
  audioEnabled: boolean;
  setAudioEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  currentReading: SensorReading;
  history: SensorReading[];
  alerts: AnomalyAlert[];
  activeAlert: AnomalyAlert | null;
  thresholds: AnomalyThresholds;
  lastPipelineLatencyMs: number;
  triggerSpikeHR: (bpm?: number) => void;
  triggerDropHR: (bpm?: number) => void;
  triggerDropSpO2: (spO2?: number) => void;
  triggerRapidDelta: (delta?: number) => void;
  resetToNormal: () => void;
  acknowledgeActiveAlert: (id: string) => void;
  clearAlertHistory: () => void;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const telemetry = useWearableSimulator(1200);

  return (
    <TelemetryContext.Provider value={telemetry}>
      {children}
    </TelemetryContext.Provider>
  );
};

export function useTelemetry(): TelemetryContextValue {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
}
