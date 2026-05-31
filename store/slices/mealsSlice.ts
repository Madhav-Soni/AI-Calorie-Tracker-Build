import type { StateCreator } from "zustand";
import type { AppStore, MealsSlice, Meal } from "../types";
import { calcMealTotals } from "../utils/helpers";

export const createMealsSlice: StateCreator<AppStore, [], [], MealsSlice> = (
  set,
  get
) => ({
  meals: {},

  addMeal: (meal: Meal) => {
    const { totalCalories, totalMacros } = calcMealTotals(meal.items);
    const enriched: Meal = { ...meal, totalCalories, totalMacros };

    set((s) => ({ meals: { ...s.meals, [meal.id]: enriched } }));
    get()._recalcStreak();
  },

  removeMeal: (id: string) => {
    set((s) => {
      const { [id]: _, ...rest } = s.meals;
      return { meals: rest };
    });
    get()._recalcStreak();
  },

  updateMeal: (id: string, patch: Partial<Meal>) => {
    set((s) => {
      const existing = s.meals[id];
      if (!existing) return s;
      const updated = { ...existing, ...patch };
      if (patch.items) {
        const { totalCalories, totalMacros } = calcMealTotals(patch.items);
        updated.totalCalories = totalCalories;
        updated.totalMacros = totalMacros;
      }
      return { meals: { ...s.meals, [id]: updated } };
    });
  },

  clearDay: (date: string) => {
    set((s) => {
      const meals = Object.fromEntries(
        Object.entries(s.meals).filter(([, m]) => m.date !== date)
      );
      return { meals };
    });
    get()._recalcStreak();
  },
});
