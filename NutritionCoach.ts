interface DailyMacros {
  protein: { consumed: number; goal: number };
  carbs: { consumed: number; goal: number };
  fat: { consumed: number; goal: number };
}

export function getCoachRecommendation(macros: DailyMacros): string {
  const pDiff = macros.protein.goal - macros.protein.consumed;
  const cDiff = macros.carbs.goal - macros.carbs.consumed;
  const fDiff = macros.fat.goal - macros.fat.consumed;

  const tips: string[] = [];

  if (pDiff > 25)
    tips.push(`${pDiff}g short on protein — try Greek yogurt, eggs, or chicken`);
  if (cDiff > 40)
    tips.push(`${cDiff}g short on carbs — oatmeal, sweet potatoes, or brown rice`);
  if (fDiff > 15)
    tips.push(`${fDiff}g short on fats — avocado, nuts, or olive oil`);

  if (tips.length === 0) {
    if (pDiff <= 0 && cDiff <= 0 && fDiff <= 0)
      return "Perfect balance! You've hit all macro targets today. 🎉";
    return "You're on track with nutrition today! Stay hydrated. 💧";
  }

  return tips.join('\n');
}
