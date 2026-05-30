import { create } from "zustand";

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string; // ISO date string
}

interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
}

interface MealStore {
  meals: Meal[];
  addMeal: (meal: Omit<Meal, "id" | "loggedAt">) => void;
  deleteMeal: (id: string) => void;
  getDailyTotals: (date?: string) => DailyTotals;
}

const toDateKey = (iso: string) => iso.slice(0, 10);

export const useMealStore = create<MealStore>((set, get) => ({
  meals: [],

  addMeal: (meal) =>
    set((state) => ({
      meals: [
        ...state.meals,
        {
          ...meal,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          loggedAt: new Date().toISOString(),
        },
      ],
    })),

  deleteMeal: (id) =>
    set((state) => ({
      meals: state.meals.filter((m) => m.id !== id),
    })),

  getDailyTotals: (date) => {
    const key = date ?? toDateKey(new Date().toISOString());
    const daily = get().meals.filter((m) => toDateKey(m.loggedAt) === key);
    return daily.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
        mealCount: acc.mealCount + 1,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 }
    );
  },
}));
