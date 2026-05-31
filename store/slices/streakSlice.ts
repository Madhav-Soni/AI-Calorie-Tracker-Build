import type { StateCreator } from "zustand";
import type { AppStore, StreakSlice } from "../types";
import { calcStreak, getLoggedDates, toDateStr } from "../utils/helpers";

export const createStreakSlice: StateCreator<AppStore, [], [], StreakSlice> = (
  set,
  get
) => ({
  streak: { current: 0, best: 0, lastLoggedDate: null },

  _recalcStreak: () => {
    const dates = getLoggedDates(get().meals);
    const { current, best } = calcStreak(dates, toDateStr());
    const lastLoggedDate = dates.length ? dates[dates.length - 1] : null;
    set({ streak: { current, best, lastLoggedDate } });
  },
});
