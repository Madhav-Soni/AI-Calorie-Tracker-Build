export interface StreakResult {
  current: number;
  best: number;
}

export const toLocalDateKey = (iso: string): string => {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function calculateStreaks(dates: string[]): StreakResult {
  if (!dates.length) return { current: 0, best: 0 };

  const unique = Array.from(
    new Set(dates.map((d) => toLocalDateKey(d)))
  ).sort();

  const today = toLocalDateKey(new Date().toISOString());
  const yesterday = toLocalDateKey(
    new Date(Date.now() - 864e5).toISOString()
  );

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
