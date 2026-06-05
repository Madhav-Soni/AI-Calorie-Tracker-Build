interface DailyMacros {
  protein: { consumed: number; goal: number };
  carbs: { consumed: number; goal: number };
  fat: { consumed: number; goal: number };
}

export function getCoachRecommendation(macros: DailyMacros): string {
  const pDiff = macros.protein.goal - macros.protein.consumed;
  const cDiff = macros.carbs.goal - macros.carbs.consumed;
  const fDiff = macros.fat.goal - macros.fat.consumed;
  const messages: string[] = [];

  if (pDiff > 25) {
    messages.push(`You are ${pDiff}g short on protein today. Add Greek yogurt, eggs, or grilled chicken to hit your target.`);
  }
  if (cDiff > 40) {
    messages.push(`You are ${cDiff}g short on carbohydrates. Fuel up with oatmeal, sweet potatoes, or brown rice.`);
  }
  if (fDiff > 15) {
    messages.push(`You are ${fDiff}g short on healthy fats. Try adding some avocado, nuts, or olive oil to your next meal.`);
  }

  if (messages.length === 0) {
    if (pDiff <= 0 && cDiff <= 0 && fDiff <= 0) {
      return "Perfect balance! You've met all your macro targets for today. Keep up the amazing work! 🎉";
    }
    return "You are on track with your nutrition goals today! Keep focus and stay hydrated. 💧";
  }

  return messages.join(" • ");
}
