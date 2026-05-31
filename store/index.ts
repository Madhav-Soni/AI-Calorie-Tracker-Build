import { useAppStore } from "./store";

// ── Granular action hooks (avoid full-store re-renders) ───────────────────────

export const useAddMeal = () => useAppStore((s) => s.addMeal);
export const useRemoveMeal = () => useAppStore((s) => s.removeMeal);
export const useUpdateMeal = () => useAppStore((s) => s.updateMeal);
export const useClearDay = () => useAppStore((s) => s.clearDay);
export const useSetGoals = () => useAppStore((s) => s.setGoals);
export const useSelectedDate = () => useAppStore((s) => s.selectedDate);
export const useSetSelectedDate = () => useAppStore((s) => s.setSelectedDate);
export const useGoals = () => useAppStore((s) => s.goals);

export { useAppStore };

// Re-export selectors
export * from "./selectors/index";
export * from "./types";
export * from "./utils/helpers";
