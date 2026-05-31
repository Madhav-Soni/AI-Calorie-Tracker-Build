import type { Macros, Meal, FoodItem } from "../types";

export const toDateStr = (d: Date = new Date()): string =>
  d.toISOString().slice(0, 10);

export const addDays = (date: string, n: number): string =>
  toDateStr(new Date(new Date(date).getTime() + n * 864e5));

export const diffDays = (a: string, b: string): number =>
  Math.round(
    (new Date(a).getTime() - new Date(b).getTime()) / 864e5
  );

export const zeroMacros = (): Macros => ({ protein: 0, carbs: 0, fat: 0 });

export const addMacros = (a: Macros, b: Macros): Macros => ({
  protein: a.protein + b.protein,
  carbs: a.carbs + b.carbs,
  fat: a.fat + b.fat,
});

export const scaleMacros = (m: Macros, factor: number): Macros => ({
  protein: m.protein * factor,
  carbs: m.carbs * factor,
  fat: m.fat * factor,
});

export const roundMacros = (m: Macros): Macros => ({
  protein: Math.round(m.protein * 10) / 10,
  carbs: Math.round(m.carbs * 10) / 10,
  fat: Math.round(m.fat * 10) / 10,
});

export const calcMealTotals = (
  items: FoodItem[]
): { totalCalories: number; totalMacros: Macros } => {
  let totalCalories = 0;
  let totalMacros = zeroMacros();
  for (const item of items) {
    totalCalories += item.calories;
    totalMacros = addMacros(totalMacros, item.macros);
  }
  return { totalCalories, totalMacros: roundMacros(totalMacros) };
};

export const getMealsForDate = (
  meals: Record<string, Meal>,
  date: string
): Meal[] =>
  Object.values(meals)
    .filter((m) => m.date === date)
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));

export const getLoggedDates = (meals: Record<string, Meal>): string[] =>
  Array.from(new Set(Object.values(meals).map((m) => m.date))).sort();

export const calcStreak = (
  loggedDates: string[],
  today: string = toDateStr()
): { current: number; best: number } => {
  if (!loggedDates.length) return { current: 0, best: 0 };

  const sorted = [...new Set(loggedDates)].sort();
  const yesterday = addDays(today, -1);
  const last = sorted[sorted.length - 1];
  const isActive = last === today || last === yesterday;

  let best = 1, run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = diffDays(sorted[i], sorted[i - 1]) === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }

  let current = 0;
  if (isActive) {
    current = 1;
    for (let i = sorted.length - 2; i >= 0; i--) {
      if (diffDays(sorted[i + 1], sorted[i]) === 1) current++;
      else break;
    }
  }

  return { current, best };
};

export const getWeekStart = (date: string): string => {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return toDateStr(d);
};

export const uid = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
