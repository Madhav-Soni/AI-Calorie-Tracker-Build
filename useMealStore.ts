import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string; // ISO date string
  category?: string;
}

export interface UserGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface UserProfile {
  age: number;
  gender: string;
  height: number;
  weight: number;
  goal: string;
  activityLevel: string;
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
  goals: UserGoals;
  onboardingCompleted: boolean;
  userProfile: UserProfile | null;
  weightHistory: Array<{ date: string; weight: number }>;
  addMeal: (meal: Omit<Meal, "id" | "loggedAt">) => void;
  deleteMeal: (id: string) => void;
  getDailyTotals: (date?: string) => DailyTotals;
  completeOnboarding: (profile: UserProfile, calculatedGoals: UserGoals) => void;
  resetOnboarding: () => void;
  logWeight: (weight: number) => void;
  updateGoals: (goals: UserGoals) => void;
}

const toDateKey = (iso: string) => iso.slice(0, 10);

export const useMealStore = create<MealStore>()(
  persist(
    (set, get) => ({
      meals: [],
      goals: {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 65,
      },
      onboardingCompleted: false,
      userProfile: null,
      weightHistory: [],

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

      completeOnboarding: (profile, calculatedGoals) =>
        set({
          userProfile: profile,
          goals: calculatedGoals,
          onboardingCompleted: true,
          // Log initial weight into history
          weightHistory: [{ date: toDateKey(new Date().toISOString()), weight: profile.weight }],
        }),

      resetOnboarding: () =>
        set({
          userProfile: null,
          onboardingCompleted: false,
          meals: [],
          weightHistory: [],
          goals: {
            calories: 2000,
            protein: 150,
            carbs: 200,
            fat: 65,
          },
        }),

      logWeight: (weight) =>
        set((state) => {
          const date = toDateKey(new Date().toISOString());
          // Remove existing weight log for today to prevent duplicates
          const filtered = state.weightHistory.filter((w) => w.date !== date);
          // If userProfile exists, update current weight in profile too
          const updatedProfile = state.userProfile
            ? { ...state.userProfile, weight }
            : null;
          return {
            weightHistory: [...filtered, { date, weight }].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            ),
            userProfile: updatedProfile,
          };
        }),

      updateGoals: (goals) =>
        set({ goals }),
    }),
    {
      name: "meal-tracker-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
