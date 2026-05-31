import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AppStore } from "./types";
import { createMealsSlice } from "./slices/mealsSlice";
import { createGoalsSlice } from "./slices/goalsSlice";
import { createStreakSlice } from "./slices/streakSlice";
import { createUISlice } from "./slices/uiSlice";

export const useAppStore = create<AppStore>()(
  persist(
    (...a) => ({
      ...createMealsSlice(...a),
      ...createGoalsSlice(...a),
      ...createStreakSlice(...a),
      ...createUISlice(...a),
    }),
    {
      name: "calai-store",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist data; UI and derived state is re-derived on load
      partialize: (s) => ({
        meals: s.meals,
        goals: s.goals,
        streak: s.streak,
      }),
      onRehydrateStorage: () => (state) => {
        // Re-run streak calc after hydration to fix any edge cases
        if (state) {
          state._recalcStreak();
        }
      },
    }
  )
);

// ── Granular action hooks (avoid full-store re-renders) ───────────────────────

export const useAddMeal = () => useAppStore((s) => s.addMeal);
export const useRemoveMeal = () => useAppStore((s) => s.removeMeal);
export const useUpdateMeal = () => useAppStore((s) => s.updateMeal);
export const useClearDay = () => useAppStore((s) => s.clearDay);
export const useSetGoals = () => useAppStore((s) => s.setGoals);
export const useSelectedDate = () => useAppStore((s) => s.selectedDate);
export const useSetSelectedDate = () => useAppStore((s) => s.setSelectedDate);
export const useGoals = () => useAppStore((s) => s.goals);

// Re-export selectors
export * from "./selectors/index";
export * from "./types";
export * from "./utils/helpers";
