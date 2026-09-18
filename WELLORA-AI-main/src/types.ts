export type NavigationTab =
  | 'dashboard'
  | 'intent-routing'
  | 'ai-guide'
  | 'monitor'
  | 'meal-scanner'
  | 'fitness'
  | 'fitness-coach'
  | 'nutrition'
  | 'settings';

export interface OverviewMetricSlot {
  id: string;
  title: string;
  unitSlot: string;
}

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export type ConsultationPhase = 'cross-questioning' | 'solution' | 'emergency';

export type IntentLabel = 'wellness' | 'triage' | 'ambiguous';

export interface UserHealthProfile {
  name: string;
  age: number;
  activityLevel: string;
  conditions: string[]; // Replaces knownConditions, pre-filled for demo
  allergies: string[];
  dietaryPreferences: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  rawText?: string;
  urgency?: UrgencyLevel;
  isEmergency?: boolean;
  questionCountInMessage?: number;
  phase?: ConsultationPhase;
  suggestedAnswers?: string[];
  crossQuestionNumber?: number;
  intentLabel?: IntentLabel;
  isClarifyingQuestion?: boolean;
  adjustment?: { condition: string; reason: string };
  timestamp: string;
}

export interface RoutingAuditEntry {
  id: string;
  timestamp: string;
  inputMessage: string;
  intentLabel: IntentLabel;
  isFollowUp?: boolean;
  downstreamRoute: 'wellness-coach' | 'clinical-triage' | 'clarifying-flow';
}

export interface FoodItem {
  name: string;
  estimated_portion: string;
  preparation_method: string | null;
}

export type ScanConfidence = 'high' | 'medium' | 'low';

export interface MealScanResult {
  food_items: FoodItem[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: ScanConfidence;
  notes: string;
  allergyAlert?: string;
  conditionAlert?: string;
}

// Sensor Anomaly Detection Types
export type AnomalySeverity = 'CRITICAL' | 'HIGH' | 'WARNING';

export interface SensorReading {
  id: string;
  timestamp: number;
  timeFormatted: string;
  heartRate: number; // bpm
  spO2: number; // blood oxygen %
  steps: number; // cumulative steps
  stepDelta: number; // steps in current interval
  cadence: number; // steps/min
  activityState: 'Resting' | 'Light Walking' | 'Active Walking';
  isAnomalyInjected?: boolean;
}

export interface AnomalyAlert {
  id: string;
  timestamp: number;
  timeFormatted: string;
  severity: AnomalySeverity;
  metric: 'Heart Rate' | 'SpO2' | 'Heart Rate Spike';
  currentValue: number;
  unit: string;
  thresholdRule: string;
  explanation: string;
  triageRoute: string;
  detectionLatencyMs: number;
  acknowledged: boolean;
}

export interface AnomalyThresholds {
  hrMin: number; // e.g. 45 bpm
  hrMax: number; // e.g. 120 bpm
  spO2Min: number; // e.g. 92%
  rapidHrDelta: number; // e.g. 30 bpm
}

export interface DailyHealthVitals {
  restingHeartRate: number;
  hrvMs: number;
  heartRateMin: number;
  heartRateMax: number;
  sleepHours: number;
  sleepScore: number;
  deepSleepMinutes: number;
  remSleepMinutes: number;
  activeCaloriesBurned: number;
  activeCaloriesTarget: number;
  activeMinutes: number;
  activeMinutesTarget: number;
  waterIntakeMl: number;
  waterTargetMl: number;
  caloriesConsumed: number;
  caloriesTarget: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  readinessScore: number;
  energyRating: number;
  lastUpdated: string;
}

// Nutrition Overview Types
export type MealType = 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';

export interface LoggedMeal {
  id: string;
  type: MealType;
  name: string;
  foodItems: string;
  quantity?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  timestamp: string;
}

export interface NutritionGoals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterGlasses: number;
}



