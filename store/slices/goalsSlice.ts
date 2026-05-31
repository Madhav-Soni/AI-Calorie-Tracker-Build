import type { StateCreator } from "zustand";
import type { AppStore, GoalsSlice, UserGoals } from "../types";

export const DEFAULT_GOALS: UserGoals = {
  calories: 2000,
  protein: 150,
  carbs: 225,
  fat: 65,
};

export const createGoalsSlice: StateCreator<AppStore, [], [], GoalsSlice> = (set) => ({
  goals: DEFAULT_GOALS,
  setGoals: (goals: UserGoals) => set({ goals }),
});
