import type { StateCreator } from "zustand";
import type { AppStore, UISlice } from "../types";
import { toDateStr } from "../utils/helpers";
 
export const createUISlice: StateCreator<AppStore, [], [], UISlice> = (set) => ({
  selectedDate: toDateStr(),
  setSelectedDate: (date: string) => set({ selectedDate: date }),
});
