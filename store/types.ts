export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  macros: Macros;
  servingSize: number;
  servingUnit: string;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface Meal {
  id: string;
  type: MealType;
  date: string; // ISO date string YYYY-MM-DD
  loggedAt: string; // ISO datetime
  items: FoodItem[];
  totalCalories: number;
  totalMacros: Macros;
  imageUri?: string;
  notes?: string;
}

export interface DailyLog {
  date: string;
  meals: Meal[];
  totalCalories: number;
  totalMacros: Macros;
}

export interface UserGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface StreakData {
  current: number;
  best: number;
  lastLoggedDate: string | null;
}

export interface WeeklyStats {
  weekStart: string;
  days: Array<{
    date: string;
    calories: number;
    macros: Macros;
    goalMet: boolean;
  }>;
  avgCalories: number;
  avgMacros: Macros;
  totalDaysLogged: number;
  totalDaysGoalMet: number;
}

// ── Store slices ──────────────────────────────────────────────────────────────

export interface MealsSlice {
  meals: Record<string, Meal>; // keyed by meal.id
  addMeal: (meal: Meal) => void;
  removeMeal: (id: string) => void;
  updateMeal: (id: string, patch: Partial<Meal>) => void;
  clearDay: (date: string) => void;
}

export interface GoalsSlice {
  goals: UserGoals;
  setGoals: (goals: UserGoals) => void;
}

export interface StreakSlice {
  streak: StreakData;
  _recalcStreak: () => void;
}

export interface UISlice {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

export type AppStore = MealsSlice & GoalsSlice & StreakSlice & UISlice;
