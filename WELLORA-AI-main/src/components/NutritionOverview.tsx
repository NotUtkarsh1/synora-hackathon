import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Beef,
  Wheat,
  Cookie,
  Droplets,
  PieChart,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Info,
  X,
  Sliders,
  ChevronRight,
  CupSoda,
  Utensils,
  Smile,
} from 'lucide-react';
import { LoggedMeal, MealType, NutritionGoals } from '../types';

const STORAGE_KEY = 'holistic_nutrition_overview_v1';

const DEFAULT_GOALS: NutritionGoals = {
  calories: 2200,
  proteinG: 110,
  carbsG: 260,
  fatG: 65,
  waterGlasses: 8,
};

const INITIAL_MEALS: LoggedMeal[] = [
  {
    id: 'meal-1',
    type: 'Breakfast',
    name: 'Oats + Banana + Peanut Butter',
    foodItems: 'Rolled oats (60g), 1 sliced banana, 1 tbsp peanut butter',
    quantity: '1 bowl',
    calories: 450,
    proteinG: 18,
    carbsG: 68,
    fatG: 14,
    timestamp: '08:15 AM',
  },
  {
    id: 'meal-2',
    type: 'Lunch',
    name: 'Rice + Dal + Vegetables',
    foodItems: 'Steamed basmati rice, yellow lentil dal, sautéed spinach & carrots',
    quantity: '1 plate',
    calories: 620,
    proteinG: 22,
    carbsG: 98,
    fatG: 15,
    timestamp: '01:00 PM',
  },
  {
    id: 'meal-3',
    type: 'Snacks',
    name: 'Greek Yogurt + Mixed Berries',
    foodItems: 'Plain Greek yogurt (150g), blueberries & strawberries, honey drizzle',
    quantity: '1 cup',
    calories: 190,
    proteinG: 16,
    carbsG: 24,
    fatG: 3,
    timestamp: '04:30 PM',
  },
  {
    id: 'meal-4',
    type: 'Dinner',
    name: 'Grilled Tofu + Quinoa + Steamed Greens',
    foodItems: 'Herb-marinated grilled tofu (120g), quinoa (1 cup), broccoli & zucchini',
    quantity: '1 bowl',
    calories: 510,
    proteinG: 26,
    carbsG: 58,
    fatG: 16,
    timestamp: '07:45 PM',
  },
];

interface StoredNutritionState {
  meals: LoggedMeal[];
  goals: NutritionGoals;
  waterGlasses: number;
}

export const NutritionOverview: React.FC = () => {
  // Load saved state or default
  const [data, setData] = useState<StoredNutritionState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Error loading nutrition data', err);
    }
    return {
      meals: INITIAL_MEALS,
      goals: DEFAULT_GOALS,
      waterGlasses: 6,
    };
  });

  // Modal states
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [isEditGoalsOpen, setIsEditGoalsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Meal Form State
  const [mealType, setMealType] = useState<MealType>('Breakfast');
  const [mealName, setMealName] = useState('');
  const [mealItems, setMealItems] = useState('');
  const [mealQuantity, setMealQuantity] = useState('1 serving');
  const [mealCalories, setMealCalories] = useState<string>('');
  const [mealProtein, setMealProtein] = useState<string>('');
  const [mealCarbs, setMealCarbs] = useState<string>('');
  const [mealFat, setMealFat] = useState<string>('');

  // Goals Form State
  const [goalCalories, setGoalCalories] = useState<string>(String(data.goals.calories));
  const [goalProtein, setGoalProtein] = useState<string>(String(data.goals.proteinG));
  const [goalCarbs, setGoalCarbs] = useState<string>(String(data.goals.carbsG));
  const [goalFat, setGoalFat] = useState<string>(String(data.goals.fatG));
  const [goalWater, setGoalWater] = useState<string>(String(data.goals.waterGlasses));

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Error saving nutrition data', err);
    }
  }, [data]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Aggregated totals
  const totals = useMemo(() => {
    return data.meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        proteinG: acc.proteinG + (meal.proteinG || 0),
        carbsG: acc.carbsG + (meal.carbsG || 0),
        fatG: acc.fatG + (meal.fatG || 0),
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
    );
  }, [data.meals]);

  // Calorie remaining
  const remainingCalories = Math.max(0, data.goals.calories - totals.calories);
  const isCalorieExceeded = totals.calories > data.goals.calories;

  // Percentage calculations
  const caloriePercent = Math.min(100, Math.round((totals.calories / (data.goals.calories || 1)) * 100));
  const proteinPercent = Math.min(100, Math.round((totals.proteinG / (data.goals.proteinG || 1)) * 100));
  const carbsPercent = Math.min(100, Math.round((totals.carbsG / (data.goals.carbsG || 1)) * 100));
  const fatPercent = Math.min(100, Math.round((totals.fatG / (data.goals.fatG || 1)) * 100));
  const waterPercent = Math.min(100, Math.round((data.waterGlasses / (data.goals.waterGlasses || 1)) * 100));

  // Macronutrient calorie distribution
  const proteinCals = totals.proteinG * 4;
  const carbsCals = totals.carbsG * 4;
  const fatCals = totals.fatG * 9;
  const totalMacroCals = proteinCals + carbsCals + fatCals || 1;

  const proteinRatio = Math.round((proteinCals / totalMacroCals) * 100);
  const carbsRatio = Math.round((carbsCals / totalMacroCals) * 100);
  const fatRatio = Math.max(0, 100 - proteinRatio - carbsRatio);

  // Status message logic
  const statusMessage = useMemo(() => {
    if (totals.calories === 0) {
      return 'Start logging your meals to track your daily macronutrients and energy balance.';
    }
    if (proteinPercent >= 85 && proteinPercent <= 110) {
      return 'Protein intake is well on track today, supporting muscle recovery.';
    }
    if (remainingCalories > 0 && remainingCalories <= 350) {
      return `You're close to your daily calorie target with ${remainingCalories} kcal remaining.`;
    }
    if (proteinPercent < 60 && totals.calories > data.goals.calories * 0.6) {
      return 'Try adding a protein-rich food like eggs, tofu, lentils, or Greek yogurt to your next meal.';
    }
    if (data.waterGlasses >= data.goals.waterGlasses) {
      return 'Daily hydration target accomplished! Great job staying hydrated.';
    }
    if (isCalorieExceeded) {
      return `Daily calorie target reached (${totals.calories} kcal consumed). Focus on light hydration for the rest of the day.`;
    }
    return 'Your daily nutrition intake is balanced across carbohydrates, protein, and healthy fats.';
  }, [totals, remainingCalories, proteinPercent, data.goals, data.waterGlasses, isCalorieExceeded]);

  // Water tracking actions
  const handleAddGlass = () => {
    setData((prev) => ({
      ...prev,
      waterGlasses: prev.waterGlasses + 1,
    }));
    showToast('+1 glass of water logged!');
  };

  const handleRemoveGlass = () => {
    setData((prev) => ({
      ...prev,
      waterGlasses: Math.max(0, prev.waterGlasses - 1),
    }));
  };

  const handleResetWater = () => {
    setData((prev) => ({
      ...prev,
      waterGlasses: 0,
    }));
    showToast('Water tracker reset for the day.');
  };

  // Reset entire day
  const handleResetDay = () => {
    setData({
      meals: [],
      goals: DEFAULT_GOALS,
      waterGlasses: 0,
    });
    showToast('Nutrition day cleared and reset to fresh state.');
  };

  // Restore default sample meals
  const handleRestoreDefaults = () => {
    setData({
      meals: INITIAL_MEALS,
      goals: DEFAULT_GOALS,
      waterGlasses: 6,
    });
    showToast('Restored default student-friendly meals.');
  };

  // Add meal submission
  const handleAddMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim()) {
      showToast('Please enter a meal or food name.');
      return;
    }

    const cals = Number(mealCalories) || 0;
    const protein = Number(mealProtein) || 0;
    const carbs = Number(mealCarbs) || 0;
    const fat = Number(mealFat) || 0;

    const newMeal: LoggedMeal = {
      id: `meal-${Date.now()}`,
      type: mealType,
      name: mealName.trim(),
      foodItems: mealItems.trim() || mealName.trim(),
      quantity: mealQuantity.trim() || '1 serving',
      calories: cals,
      proteinG: protein,
      carbsG: carbs,
      fatG: fat,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setData((prev) => ({
      ...prev,
      meals: [...prev.meals, newMeal],
    }));

    // Reset form & close
    setMealName('');
    setMealItems('');
    setMealCalories('');
    setMealProtein('');
    setMealCarbs('');
    setMealFat('');
    setIsAddMealOpen(false);
    showToast(`Added ${newMeal.name} to ${newMeal.type}!`);
  };

  // Delete a meal
  const handleDeleteMeal = (id: string, name: string) => {
    setData((prev) => ({
      ...prev,
      meals: prev.meals.filter((m) => m.id !== id),
    }));
    showToast(`Removed ${name}`);
  };

  // Save goals
  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedGoals: NutritionGoals = {
      calories: Math.max(800, Number(goalCalories) || DEFAULT_GOALS.calories),
      proteinG: Math.max(20, Number(goalProtein) || DEFAULT_GOALS.proteinG),
      carbsG: Math.max(50, Number(goalCarbs) || DEFAULT_GOALS.carbsG),
      fatG: Math.max(10, Number(goalFat) || DEFAULT_GOALS.fatG),
      waterGlasses: Math.max(1, Number(goalWater) || DEFAULT_GOALS.waterGlasses),
    };

    setData((prev) => ({
      ...prev,
      goals: updatedGoals,
    }));
    setIsEditGoalsOpen(false);
    showToast('Daily nutrition goals updated successfully!');
  };

  const mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];

  return (
    <section id="nutrition-overview-section" className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-cream-soft px-4 py-3 rounded-2xl shadow-xl border border-emerald-500/40 flex items-center gap-2.5 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-cream-soft">Nutrition Overview</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Daily Tracking Active
            </span>
          </div>
          <p className="text-xs text-beige-light/80 mt-0.5">
            Real-time macronutrient breakdown, caloric progress, and meal logging
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsAddMealOpen(true)}
            className="px-4 py-2 rounded-xl bg-olive text-cream-soft hover:bg-olive-light text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Meal</span>
          </button>

          <button
            onClick={() => {
              setGoalCalories(String(data.goals.calories));
              setGoalProtein(String(data.goals.proteinG));
              setGoalCarbs(String(data.goals.carbsG));
              setGoalFat(String(data.goals.fatG));
              setGoalWater(String(data.goals.waterGlasses));
              setIsEditGoalsOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-olive-canvas/80 text-cream-soft hover:bg-olive border border-olive-light/40 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Goals</span>
          </button>

          <button
            onClick={handleRestoreDefaults}
            title="Restore sample meals"
            className="p-2 rounded-xl bg-olive-canvas/60 text-cream-soft hover:bg-olive border border-olive-light/30 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      </div>

      {/* 8. Nutrition Status Message Banner */}
      <div className="p-4 rounded-2xl bg-cream-soft border border-wellness-border/80 shadow-xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-olive/15 text-olive flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-olive" />
        </div>
        <div className="flex-1 text-xs">
          <span className="font-bold text-wellness-dark block">Daily Nutrition Insight</span>
          <span className="text-wellness-muted">{statusMessage}</span>
        </div>
        <span className="text-[10px] font-mono font-semibold text-wellness-muted uppercase px-2 py-1 rounded-lg bg-beige-cream/60 shrink-0">
          Informational
        </span>
      </div>

      {/* 1. Daily Nutrition Summary (5 Summary Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
        {/* Summary Card 1: Calories */}
        <div
          id="nutrition-card-calories"
          className="p-5 rounded-2xl bg-cream-soft border border-wellness-border/70 shadow-xs hover:border-olive/40 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <Flame className="w-5 h-5 fill-amber-500/20" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              {caloriePercent}%
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-wellness-muted uppercase tracking-wider block">
              Calories
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-wellness-dark">
                {totals.calories.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-wellness-muted">/ {data.goals.calories.toLocaleString()} kcal</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 mt-3 border-t border-wellness-border/50">
            <div className="h-2 w-full bg-beige-cream rounded-full overflow-hidden border border-wellness-border/40">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${caloriePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-wellness-muted font-medium">
              <span>Target: {data.goals.calories} kcal</span>
              <span>{caloriePercent}% Completed</span>
            </div>
          </div>
        </div>

        {/* Summary Card 2: Protein */}
        <div
          id="nutrition-card-protein"
          className="p-5 rounded-2xl bg-cream-soft border border-wellness-border/70 shadow-xs hover:border-olive/40 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600">
              <Beef className="w-5 h-5 fill-rose-500/20" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
              {proteinPercent}%
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-wellness-muted uppercase tracking-wider block">
              Protein
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-wellness-dark">
                {totals.proteinG}
              </span>
              <span className="text-xs font-semibold text-wellness-muted">/ {data.goals.proteinG}g</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 mt-3 border-t border-wellness-border/50">
            <div className="h-2 w-full bg-beige-cream rounded-full overflow-hidden border border-wellness-border/40">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${proteinPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-wellness-muted font-medium">
              <span>Target: {data.goals.proteinG}g</span>
              <span>{proteinPercent}% Completed</span>
            </div>
          </div>
        </div>

        {/* Summary Card 3: Carbohydrates */}
        <div
          id="nutrition-card-carbs"
          className="p-5 rounded-2xl bg-cream-soft border border-wellness-border/70 shadow-xs hover:border-olive/40 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/10 border border-amber-600/20 flex items-center justify-center text-amber-700">
              <Wheat className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              {carbsPercent}%
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-wellness-muted uppercase tracking-wider block">
              Carbohydrates
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-wellness-dark">
                {totals.carbsG}
              </span>
              <span className="text-xs font-semibold text-wellness-muted">/ {data.goals.carbsG}g</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 mt-3 border-t border-wellness-border/50">
            <div className="h-2 w-full bg-beige-cream rounded-full overflow-hidden border border-wellness-border/40">
              <div
                className="h-full bg-amber-600 rounded-full transition-all duration-500"
                style={{ width: `${carbsPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-wellness-muted font-medium">
              <span>Target: {data.goals.carbsG}g</span>
              <span>{carbsPercent}% Completed</span>
            </div>
          </div>
        </div>

        {/* Summary Card 4: Fats */}
        <div
          id="nutrition-card-fats"
          className="p-5 rounded-2xl bg-cream-soft border border-wellness-border/70 shadow-xs hover:border-olive/40 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-600/20 flex items-center justify-center text-emerald-700">
              <Cookie className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
              {fatPercent}%
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-wellness-muted uppercase tracking-wider block">
              Fats
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-wellness-dark">
                {totals.fatG}
              </span>
              <span className="text-xs font-semibold text-wellness-muted">/ {data.goals.fatG}g</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 mt-3 border-t border-wellness-border/50">
            <div className="h-2 w-full bg-beige-cream rounded-full overflow-hidden border border-wellness-border/40">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${fatPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-wellness-muted font-medium">
              <span>Target: {data.goals.fatG}g</span>
              <span>{fatPercent}% Completed</span>
            </div>
          </div>
        </div>

        {/* Summary Card 5: Water */}
        <div
          id="nutrition-card-water"
          className="p-5 rounded-2xl bg-cream-soft border border-wellness-border/70 shadow-xs hover:border-olive/40 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600">
              <Droplets className="w-5 h-5 fill-cyan-500/20" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-300">
              {waterPercent}%
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-wellness-muted uppercase tracking-wider block">
              Water
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-wellness-dark">
                {data.waterGlasses}
              </span>
              <span className="text-xs font-semibold text-wellness-muted">/ {data.goals.waterGlasses} glasses</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 mt-3 border-t border-wellness-border/50">
            <div className="h-2 w-full bg-beige-cream rounded-full overflow-hidden border border-wellness-border/40">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${waterPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-wellness-muted font-medium">
              <span>Target: {data.goals.waterGlasses} glasses</span>
              <span>{waterPercent}% Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2 & 3: Daily Calorie Progress & Macronutrient Breakdown (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 2. Daily Calorie Progress (Larger Card - 7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-cream-soft border border-wellness-border/80 shadow-xs flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-wellness-border/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-700">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-wellness-dark">Daily Calorie Progress</h4>
                <p className="text-xs text-wellness-muted">Energy consumption vs. daily maintenance target</p>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                isCalorieExceeded
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {isCalorieExceeded ? 'Target Exceeded' : `${remainingCalories} kcal remaining`}
            </span>
          </div>

          {/* Big Calorie Numbers Display */}
          <div className="grid grid-cols-3 gap-4 text-center py-2">
            <div className="p-3 rounded-2xl bg-beige-cream/40 border border-wellness-border/60">
              <span className="text-[10px] uppercase font-bold tracking-wider text-wellness-muted block">
                Consumed
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-wellness-dark block mt-1">
                {totals.calories.toLocaleString()}
              </span>
              <span className="text-[10px] text-wellness-muted font-medium">kcal total</span>
            </div>

            <div className="p-3 rounded-2xl bg-beige-cream/40 border border-wellness-border/60">
              <span className="text-[10px] uppercase font-bold tracking-wider text-wellness-muted block">
                Target
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-wellness-dark block mt-1">
                {data.goals.calories.toLocaleString()}
              </span>
              <span className="text-[10px] text-wellness-muted font-medium">daily goal</span>
            </div>

            <div className="p-3 rounded-2xl bg-beige-cream/40 border border-wellness-border/60">
              <span className="text-[10px] uppercase font-bold tracking-wider text-wellness-muted block">
                Remaining
              </span>
              <span
                className={`text-2xl sm:text-3xl font-black font-mono block mt-1 ${
                  isCalorieExceeded ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {remainingCalories.toLocaleString()}
              </span>
              <span className="text-[10px] text-wellness-muted font-medium">
                {isCalorieExceeded ? 'over limit' : 'kcal left'}
              </span>
            </div>
          </div>

          {/* Calorie Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-wellness-muted font-medium">
              <span>Progress towards daily budget</span>
              <span className="font-mono font-bold text-wellness-dark">
                {caloriePercent}% ({totals.calories} / {data.goals.calories} kcal)
              </span>
            </div>
            <div className="h-3 w-full bg-beige-cream rounded-full overflow-hidden border border-wellness-border/60 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCalorieExceeded ? 'bg-rose-500' : 'bg-gradient-to-r from-olive to-amber-500'
                }`}
                style={{ width: `${caloriePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. Macronutrient Breakdown (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-cream-soft border border-wellness-border/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-wellness-border/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-olive/15 flex items-center justify-center text-olive">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-wellness-dark">Macronutrient Ratio</h4>
                <p className="text-xs text-wellness-muted">Caloric energy share per macronutrient</p>
              </div>
            </div>
          </div>

          {/* Segmented Horizontal Progress Bar */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-beige-cream rounded-xl overflow-hidden flex border border-wellness-border/60">
              <div
                style={{ width: `${proteinRatio}%` }}
                className="bg-rose-500 transition-all duration-500"
                title={`Protein: ${proteinRatio}%`}
              />
              <div
                style={{ width: `${carbsRatio}%` }}
                className="bg-amber-600 transition-all duration-500"
                title={`Carbohydrates: ${carbsRatio}%`}
              />
              <div
                style={{ width: `${fatRatio}%` }}
                className="bg-emerald-600 transition-all duration-500"
                title={`Fat: ${fatRatio}%`}
              />
            </div>

            <div className="flex justify-between text-[11px] font-mono text-wellness-muted">
              <span className="text-rose-700 font-bold">{proteinRatio}% Protein</span>
              <span className="text-amber-800 font-bold">{carbsRatio}% Carbs</span>
              <span className="text-emerald-800 font-bold">{fatRatio}% Fat</span>
            </div>
          </div>

          {/* Breakdown Detail Cards */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-200/80">
              <span className="text-[10px] font-bold text-rose-800 uppercase block">Protein</span>
              <span className="text-base font-black font-mono text-rose-900 block mt-0.5">
                {totals.proteinG}g
              </span>
              <span className="text-[10px] text-rose-700 font-mono">{proteinCals} kcal</span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Carbs</span>
              <span className="text-base font-black font-mono text-amber-900 block mt-0.5">
                {totals.carbsG}g
              </span>
              <span className="text-[10px] text-amber-700 font-mono">{carbsCals} kcal</span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Fats</span>
              <span className="text-base font-black font-mono text-emerald-900 block mt-0.5">
                {totals.fatG}g
              </span>
              <span className="text-[10px] text-emerald-700 font-mono">{fatCals} kcal</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 & 7: Today's Meals and Water Tracking (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 4. Today's Meals Section (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-cream-soft border border-wellness-border/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-wellness-border/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-olive/15 flex items-center justify-center text-olive">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-wellness-dark">Today's Meals</h4>
                <p className="text-xs text-wellness-muted">
                  Logged breakfast, lunch, snacks, and dinner with nutrient details
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAddMealOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-olive text-cream-soft hover:bg-olive-light text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Meal</span>
            </button>
          </div>

          {data.meals.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center text-wellness-muted">
              <div className="w-12 h-12 rounded-2xl bg-beige-cream border border-wellness-border flex items-center justify-center text-olive mb-2">
                <Utensils className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-wellness-dark">No meals logged today yet</span>
              <span className="text-xs text-wellness-muted mt-1 max-w-sm">
                Click "Add Meal" to start recording breakfast, lunch, snacks, or dinner.
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {mealTypes.map((type) => {
                const mealsForType = data.meals.filter((m) => m.type === type);
                if (mealsForType.length === 0) return null;

                return (
                  <div key={type} className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-olive font-mono">
                        {type}
                      </span>
                      <div className="h-px flex-1 bg-wellness-border/50" />
                      <span className="text-[11px] font-mono text-wellness-muted">
                        {mealsForType.reduce((s, m) => s + m.calories, 0)} kcal
                      </span>
                    </div>

                    <div className="space-y-2">
                      {mealsForType.map((meal) => (
                        <div
                          key={meal.id}
                          className="p-4 rounded-2xl bg-beige-cream/30 border border-wellness-border/60 hover:border-olive/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-bold text-wellness-dark">{meal.name}</h5>
                              <span className="text-[10px] font-mono text-wellness-muted">
                                • {meal.timestamp}
                              </span>
                            </div>
                            <p className="text-xs text-wellness-muted">{meal.foodItems}</p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                            <div className="flex items-center gap-2 text-xs font-mono">
                              <span className="font-bold text-wellness-dark bg-white/80 px-2 py-1 rounded-lg border border-wellness-border/60">
                                {meal.calories} kcal
                              </span>
                              <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                                {meal.proteinG}g protein
                              </span>
                              {meal.carbsG > 0 && (
                                <span className="hidden sm:inline font-medium text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 text-[11px]">
                                  {meal.carbsG}g C
                                </span>
                              )}
                              {meal.fatG > 0 && (
                                <span className="hidden sm:inline font-medium text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 text-[11px]">
                                  {meal.fatG}g F
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => handleDeleteMeal(meal.id, meal.name)}
                              title="Delete meal"
                              className="p-1.5 rounded-lg text-wellness-muted hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 6 & 7. Water Tracking & Nutrition Goals (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* 7. Water Tracking Card */}
          <div className="p-6 rounded-3xl bg-cream-soft border border-wellness-border/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-wellness-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-600">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-wellness-dark">Daily Water Tracker</h4>
                  <p className="text-xs text-wellness-muted">Hydration goal & glass counter</p>
                </div>
              </div>

              <button
                onClick={handleResetWater}
                title="Reset water count"
                className="text-[11px] text-wellness-muted hover:text-wellness-dark font-medium transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Display: 6 / 8 glasses */}
            <div className="text-center py-2">
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-4xl font-black font-mono tracking-tight text-wellness-dark">
                  {data.waterGlasses}
                </span>
                <span className="text-lg font-bold text-wellness-muted font-mono">
                  / {data.goals.waterGlasses}
                </span>
                <span className="text-xs font-semibold text-wellness-muted ml-1">glasses</span>
              </div>
              <span className="text-xs text-wellness-muted block mt-1">
                Approx. {(data.waterGlasses * 250).toLocaleString()} ml logged today
              </span>
            </div>

            {/* Visual Glass Indicator Grid */}
            <div className="grid grid-cols-4 gap-2 py-1">
              {Array.from({ length: Math.max(8, data.goals.waterGlasses) }).map((_, idx) => {
                const isFilled = idx < data.waterGlasses;
                return (
                  <div
                    key={idx}
                    className={`h-10 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      isFilled
                        ? 'bg-cyan-500 text-white border-cyan-600 shadow-2xs'
                        : 'bg-beige-cream/50 text-wellness-muted/40 border-wellness-border/60'
                    }`}
                  >
                    <Droplets className={`w-4 h-4 ${isFilled ? 'fill-white' : ''}`} />
                    <span className="text-[9px] font-mono font-bold leading-none mt-0.5">
                      #{idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons: + Add Glass / - Remove Glass */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleAddGlass}
                className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Glass</span>
              </button>
              {data.waterGlasses > 0 && (
                <button
                  onClick={handleRemoveGlass}
                  className="px-3 py-2 rounded-xl bg-beige-cream hover:bg-beige-light text-wellness-dark border border-wellness-border text-xs font-semibold transition-colors cursor-pointer"
                  title="Remove 1 glass"
                >
                  -1
                </button>
              )}
            </div>
          </div>

          {/* 6. Nutrition Goals Overview Card */}
          <div className="p-6 rounded-3xl bg-cream-soft border border-wellness-border/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-wellness-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-olive/15 flex items-center justify-center text-olive">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-wellness-dark">Daily Nutrition Goals</h4>
                  <p className="text-xs text-wellness-muted">Custom targets & thresholds</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setGoalCalories(String(data.goals.calories));
                  setGoalProtein(String(data.goals.proteinG));
                  setGoalCarbs(String(data.goals.carbsG));
                  setGoalFat(String(data.goals.fatG));
                  setGoalWater(String(data.goals.waterGlasses));
                  setIsEditGoalsOpen(true);
                }}
                className="text-xs text-olive hover:text-olive-light font-bold transition-colors cursor-pointer"
              >
                Edit Goals
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-beige-cream/40 border border-wellness-border/50">
                <span className="text-wellness-muted font-medium">Calorie Goal</span>
                <span className="font-mono font-bold text-wellness-dark">
                  {data.goals.calories.toLocaleString()} kcal
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-beige-cream/40 border border-wellness-border/50">
                <span className="text-wellness-muted font-medium">Protein Goal</span>
                <span className="font-mono font-bold text-rose-700">
                  {data.goals.proteinG} g
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-beige-cream/40 border border-wellness-border/50">
                <span className="text-wellness-muted font-medium">Water Goal</span>
                <span className="font-mono font-bold text-cyan-700">
                  {data.goals.waterGlasses} glasses
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Add Meal Interface (Modal Form) */}
      {isAddMealOpen && (
        <div
          className="fixed inset-0 bg-wellness-dark/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setIsAddMealOpen(false)}
        >
          <div
            className="bg-cream-soft rounded-3xl border border-wellness-border shadow-2xl max-w-md w-full p-6 space-y-5 text-wellness-dark animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-wellness-border/60">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-olive text-cream-soft">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-wellness-dark">Add Today's Meal</h4>
                  <p className="text-xs text-wellness-muted">Log food items and macronutrients</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddMealOpen(false)}
                className="p-1.5 rounded-xl hover:bg-beige-cream text-wellness-muted hover:text-wellness-dark transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMealSubmit} className="space-y-4 text-xs">
              {/* Meal Type Selection */}
              <div>
                <label className="font-semibold block mb-1">Meal Type</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {mealTypes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMealType(t)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        mealType === t
                          ? 'bg-olive text-cream-soft shadow-xs'
                          : 'bg-beige-cream/50 border border-wellness-border text-wellness-muted hover:text-wellness-dark'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Food Name */}
              <div>
                <label className="font-semibold block mb-1">Food / Meal Name *</label>
                <input
                  type="text"
                  required
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  placeholder="e.g. Oats + Banana + Peanut Butter"
                  className="w-full px-3 py-2 rounded-xl bg-beige-cream/40 border border-wellness-border text-wellness-dark text-xs focus:outline-hidden focus:border-olive"
                />
              </div>

              {/* Food Details / Ingredients */}
              <div>
                <label className="font-semibold block mb-1">Food Items / Ingredients</label>
                <input
                  type="text"
                  value={mealItems}
                  onChange={(e) => setMealItems(e.target.value)}
                  placeholder="e.g. Rolled oats (60g), sliced banana, 1 tbsp peanut butter"
                  className="w-full px-3 py-2 rounded-xl bg-beige-cream/40 border border-wellness-border text-wellness-dark text-xs focus:outline-hidden focus:border-olive"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="font-semibold block mb-1">Quantity / Portion</label>
                <input
                  type="text"
                  value={mealQuantity}
                  onChange={(e) => setMealQuantity(e.target.value)}
                  placeholder="e.g. 1 bowl, 250g, 2 slices"
                  className="w-full px-3 py-2 rounded-xl bg-beige-cream/40 border border-wellness-border text-wellness-dark text-xs focus:outline-hidden focus:border-olive"
                />
              </div>

              {/* Macro & Calorie Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div>
                  <label className="font-semibold block mb-1 text-[11px]">Calories (kcal) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={mealCalories}
                    onChange={(e) => setMealCalories(e.target.value)}
                    placeholder="450"
                    className="w-full px-3 py-2 rounded-xl bg-beige-cream/40 border border-wellness-border text-wellness-dark font-mono text-xs focus:outline-hidden focus:border-olive"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-[11px]">Protein (g) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={mealProtein}
                    onChange={(e) => setMealProtein(e.target.value)}
                    placeholder="18"
                    className="w-full px-3 py-2 rounded-xl bg-beige-cream/40 border border-wellness-border text-wellness-dark font-mono text-xs focus:outline-hidden focus:border-olive"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-[11px]">Carbs (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={mealCarbs}
                    onChange={(e) => setMealCarbs(e.target.value)}
                    placeholder="65"
                    className="w-full px-3 py-2 rounded-xl bg-beige-cream/40 border border-wellness-border text-wellness-dark font-mono text-xs focus:outline-hidden focus:border-olive"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-[11px]">Fats (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={mealFat}
                    onChange={(e) => setMealFat(e.target.value)}
                    placeholder="14"
                    className="w-full px-3 py-2 rounded-xl bg-beige-cream/40 border border-wellness-border text-wellness-dark font-mono text-xs focus:outline-hidden focus:border-olive"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-wellness-border/60 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMealOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-olive hover:bg-olive-light text-cream-soft text-xs font-bold shadow-xs cursor-pointer transition-all"
                >
                  Add Meal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Goals Modal */}
      {isEditGoalsOpen && (
        <div
          className="fixed inset-0 bg-wellness-dark/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setIsEditGoalsOpen(false)}
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
                  <h4 className="text-base font-bold text-wellness-dark">Edit Nutrition Goals</h4>
                  <p className="text-xs text-wellness-muted">Adjust daily calorie, protein, and water targets</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditGoalsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-beige-cream text-wellness-muted hover:text-wellness-dark transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoals} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Daily Calorie Target (kcal)</label>
                <input
                  type="number"
                  required
                  min="800"
                  max="6000"
                  value={goalCalories}
                  onChange={(e) => setGoalCalories(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-beige-cream/40 border border-wellness-border text-wellness-dark font-mono text-xs focus:outline-hidden focus:border-olive"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Daily Protein Target (grams)</label>
                <input
                  type="number"
                  required
                  min="20"
                  max="400"
                  value={goalProtein}
                  onChange={(e) => setGoalProtein(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-beige-cream/40 border border-wellness-border text-wellness-dark font-mono text-xs focus:outline-hidden focus:border-olive"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Carbs Target (g)</label>
                  <input
                    type="number"
                    min="30"
                    max="800"
                    value={goalCarbs}
                    onChange={(e) => setGoalCarbs(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-beige-cream/40 border border-wellness-border text-wellness-dark font-mono text-xs focus:outline-hidden focus:border-olive"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Fat Target (g)</label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={goalFat}
                    onChange={(e) => setGoalFat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-beige-cream/40 border border-wellness-border text-wellness-dark font-mono text-xs focus:outline-hidden focus:border-olive"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Daily Water Goal (glasses)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="30"
                  value={goalWater}
                  onChange={(e) => setGoalWater(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-beige-cream/40 border border-wellness-border text-wellness-dark font-mono text-xs focus:outline-hidden focus:border-olive"
                />
              </div>

              <div className="pt-3 border-t border-wellness-border/60 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditGoalsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-olive hover:bg-olive-light text-cream-soft text-xs font-bold shadow-xs cursor-pointer transition-all"
                >
                  Save Goals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
