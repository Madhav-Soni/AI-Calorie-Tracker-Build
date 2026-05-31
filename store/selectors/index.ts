import { useMemo } from "react";
import { useAppStore } from "../index";
import type { DailyLog, WeeklyStats, Macros } from "../types";
import {
  getMealsForDate,
  addMacros,
  zeroMacros,
  toDateStr,
  addDays,
  getWeekStart,
  roundMacros,
} from "../utils/helpers";

// ── Daily ─────────────────────────────────────────────────────────────────────

export const useDailyLog = (date?: string): DailyLog => {
  const meals = useAppStore((s) => s.meals);
  const selectedDate = useAppStore((s) => s.selectedDate);
  const target = date ?? selectedDate;

  return useMemo(() => {
    const dayMeals = getMealsForDate(meals, target);
    let totalCalories = 0;
    let totalMacros = zeroMacros();
    for (const m of dayMeals) {
      totalCalories += m.totalCalories;
      totalMacros = addMacros(totalMacros, m.totalMacros);
    }
    return { date: target, meals: dayMeals, totalCalories, totalMacros: roundMacros(totalMacros) };
  }, [meals, target]);
};

export const useCaloriesForDate = (date?: string) => {
  const log = useDailyLog(date);
  return log.totalCalories;
};

export const useMacrosForDate = (date?: string): Macros => {
  const log = useDailyLog(date);
  return log.totalMacros;
};

export const useRemainingCalories = (date?: string): number => {
  const goals = useAppStore((s) => s.goals);
  const consumed = useCaloriesForDate(date);
  return Math.max(0, goals.calories - consumed);
};

export const useMacroProgress = (date?: string) => {
  const goals = useAppStore((s) => s.goals);
  const macros = useMacrosForDate(date);
  return {
    protein: { consumed: macros.protein, goal: goals.protein, pct: macros.protein / goals.protein },
    carbs: { consumed: macros.carbs, goal: goals.carbs, pct: macros.carbs / goals.carbs },
    fat: { consumed: macros.fat, goal: goals.fat, pct: macros.fat / goals.fat },
  };
};

export const useCalorieProgress = (date?: string) => {
  const goals = useAppStore((s) => s.goals);
  const consumed = useCaloriesForDate(date);
  return { consumed, goal: goals.calories, pct: consumed / goals.calories };
};

// ── Streak ────────────────────────────────────────────────────────────────────

export const useStreak = () => useAppStore((s) => s.streak);

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const useDashboard = () => {
  const today = toDateStr();
  const log = useDailyLog(today);
  const goals = useAppStore((s) => s.goals);
  const streak = useAppStore((s) => s.streak);

  return useMemo(() => {
    const calPct = log.totalCalories / goals.calories;
    const proteinPct = log.totalMacros.protein / goals.protein;
    const carbsPct = log.totalMacros.carbs / goals.carbs;
    const fatPct = log.totalMacros.fat / goals.fat;
    const remaining = Math.max(0, goals.calories - log.totalCalories);
    const onTrack = calPct <= 1.05;

    return {
      date: today,
      meals: log.meals,
      calories: { consumed: log.totalCalories, goal: goals.calories, pct: calPct, remaining },
      macros: {
        protein: { consumed: log.totalMacros.protein, goal: goals.protein, pct: proteinPct },
        carbs: { consumed: log.totalMacros.carbs, goal: goals.carbs, pct: carbsPct },
        fat: { consumed: log.totalMacros.fat, goal: goals.fat, pct: fatPct },
      },
      streak,
      onTrack,
    };
  }, [log, goals, streak, today]);
};

// ── Weekly ────────────────────────────────────────────────────────────────────

export const useWeeklyStats = (weekStartOverride?: string): WeeklyStats => {
  const meals = useAppStore((s) => s.meals);
  const goals = useAppStore((s) => s.goals);
  const today = toDateStr();
  const weekStart = weekStartOverride ?? getWeekStart(today);

  return useMemo(() => {
    let totalCal = 0;
    let totalMacros = zeroMacros();
    let daysLogged = 0;
    let daysGoalMet = 0;

    const days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dayMeals = getMealsForDate(meals, date);
      let cal = 0;
      let macros = zeroMacros();
      for (const m of dayMeals) {
        cal += m.totalCalories;
        macros = addMacros(macros, m.totalMacros);
      }
      const goalMet = cal >= goals.calories * 0.8 && cal <= goals.calories * 1.1;
      if (dayMeals.length > 0) daysLogged++;
      if (goalMet && dayMeals.length > 0) daysGoalMet++;
      totalCal += cal;
      totalMacros = addMacros(totalMacros, macros);
      return { date, calories: cal, macros: roundMacros(macros), goalMet };
    });

    return {
      weekStart,
      days,
      avgCalories: daysLogged ? Math.round(totalCal / daysLogged) : 0,
      avgMacros: daysLogged
        ? roundMacros({
            protein: totalMacros.protein / daysLogged,
            carbs: totalMacros.carbs / daysLogged,
            fat: totalMacros.fat / daysLogged,
          })
        : zeroMacros(),
      totalDaysLogged: daysLogged,
      totalDaysGoalMet: daysGoalMet,
    };
  }, [meals, goals, weekStart]);
};
