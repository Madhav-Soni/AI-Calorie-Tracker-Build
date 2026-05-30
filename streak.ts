export interface StreakResult {
  current: number;
  best: number;
}

export function calculateStreaks(dates: string[]): StreakResult {
  if (!dates.length) return { current: 0, best: 0 };

  const unique = Array.from(
    new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)))
  ).sort();

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);

  let best = 1, run = 1;

  for (let i = 1; i < unique.length; i++) {
    const diff =
      (new Date(unique[i]).getTime() - new Date(unique[i - 1]).getTime()) / 864e5;
    run = diff === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }

  const last = unique[unique.length - 1];
  const isActive = last === today || last === yesterday;

  let current = isActive ? 1 : 0;
  if (isActive) {
    for (let i = unique.length - 2; i >= 0; i--) {
      const diff =
        (new Date(unique[i + 1]).getTime() - new Date(unique[i]).getTime()) / 864e5;
      if (diff === 1) current++;
      else break;
    }
  }

  return { current, best };
}
