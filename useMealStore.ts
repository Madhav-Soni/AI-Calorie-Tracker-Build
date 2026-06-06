import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "./firebase/config";
import * as Crypto from "expo-crypto";
import { useUserProfileStore } from "./store/userProfileStore";

export const toLocalDateKey = (iso: string): string => {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string; // ISO date string
  category?: string;
}

export interface UserGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface UserProfile {
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  goal?: string;
  activityLevel?: string;
}

interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
}

interface MealStore {
  meals: Meal[];
  goals: UserGoals;
  onboardingCompleted: boolean;
  userProfile: UserProfile | null;
  weightHistory: Array<{ date: string; weight: number }>;
  userId: string | null;
  mealsLoading: boolean;
  mealsError: string | null;
  
  // Actions
  setUserId: (userId: string | null) => void;
  clearForSignOut: () => void;
  resetStore: () => void;
  addMeal: (meal: Omit<Meal, "id" | "loggedAt">) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  getDailyTotals: (date?: string) => DailyTotals;
  completeOnboarding: (profile: UserProfile, calculatedGoals: UserGoals) => void;
  resetOnboarding: () => void;
  logWeight: (weight: number) => Promise<void>;
  updateGoals: (goals: UserGoals) => void;
  syncMealsFromFirebase: (meals: Meal[]) => void;
}

const defaultGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
};

let currentUserId: string | null = null;

const customUserStorage = createJSONStorage(() => ({
  getItem: (key) => {
    const uid = currentUserId || 'anon';
    return AsyncStorage.getItem(`${uid}:${key}`);
  },
  setItem: (key, value) => {
    const uid = currentUserId || 'anon';
    return AsyncStorage.setItem(`${uid}:${key}`, value);
  },
  removeItem: (key) => {
    const uid = currentUserId || 'anon';
    return AsyncStorage.removeItem(`${uid}:${key}`);
  }
}));

export const selectDailyTotals = (date?: string) => (state: MealStore) => {
  const key = date ?? toLocalDateKey(new Date().toISOString());
  const daily = state.meals.filter((m) => toLocalDateKey(m.loggedAt) === key);
  return daily.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + (m.protein || 0),
      carbs: acc.carbs + (m.carbs || 0),
      fat: acc.fat + (m.fat || 0),
      mealCount: acc.mealCount + 1,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 }
  );
};

export const useMealStore = create<MealStore>()(
  persist(
    (set, get) => ({
      meals: [],
      goals: defaultGoals,
    onboardingCompleted: false,
    userProfile: null,
    weightHistory: [],
    userId: null,
    mealsLoading: false,
    mealsError: null,

    setUserId: (userId) => {
      currentUserId = userId;
      set({ userId });
      useMealStore.persist.rehydrate();
    },

    clearForSignOut: () => {
      currentUserId = null;
      set({
        meals: [],
        goals: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
        onboardingCompleted: false,
        userProfile: null,
        weightHistory: [],
        userId: null,
        mealsLoading: false,
        mealsError: null,
      });
      AsyncStorage.removeItem("anon:meal-tracker-store").catch(() => {});
    },

    addMeal: async (meal) => {
      // Sanity check to prevent AI hallucinations or invalid manual logs from breaking dashboard
      if (!meal.name || meal.name.trim().length === 0 || meal.name.length > 100) {
        throw new Error("Meal name must be between 1 and 100 characters.");
      }
      if (
        meal.calories < 0 || meal.calories > 5000 ||
        meal.protein < 0 || meal.protein > 500 ||
        meal.carbs < 0 || meal.carbs > 500 ||
        meal.fat < 0 || meal.fat > 300
      ) {
        throw new Error("Invalid nutrition values detected. Please verify inputs.");
      }

      const uid = get().userId;
      const newMeal: Meal = {
        ...meal,
        id: Crypto.randomUUID(),
        loggedAt: new Date().toISOString(),
      };

      // Optimistic update — show immediately in UI
      set((state) => ({ meals: [newMeal, ...state.meals] }));

      if (uid) {
        try {
          // Save to Firebase Firestore
          const mealRef = doc(db, "users", uid, "meals", newMeal.id);
          await setDoc(mealRef, newMeal);
        } catch (e) {
          if (__DEV__) console.error("Error writing meal to Firestore:", e);
          // Rollback on failure
          set((state) => ({
            meals: state.meals.filter((m) => m.id !== newMeal.id),
          }));
          throw e;
        }
      }
    },

    deleteMeal: async (id) => {
      const uid = get().userId;
      // Optimistic remove
      set((state) => ({ meals: state.meals.filter((m) => m.id !== id) }));

      if (uid) {
        try {
          await deleteDoc(doc(db, "users", uid, "meals", id));
        } catch (e) {
          if (__DEV__) console.error("[deleteMeal] failed:", e);
        }
      }
    },

    getDailyTotals: (date) => {
      return selectDailyTotals(date)(get());
    },

    completeOnboarding: (profile, calculatedGoals) =>
      set({
        userProfile: profile,
        goals: calculatedGoals,
        onboardingCompleted: true,
        weightHistory: [{ date: toLocalDateKey(new Date().toISOString()), weight: profile.weight || 0 }],
      }),

    resetOnboarding: () =>
      set({
        userProfile: null,
        onboardingCompleted: false,
        meals: [],
        weightHistory: [],
        goals: {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fat: 65,
        },
      }),

    logWeight: async (weight: number) => {
      const uid = get().userId;
      const date = toLocalDateKey(new Date().toISOString());
      const existing = get().weightHistory.filter((w) => w.date !== date);
      const newHistory = [...existing, { date, weight }].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const updatedProfile = get().userProfile
        ? { ...get().userProfile, weight }
        : null;

      set({
        weightHistory: newHistory,
        userProfile: updatedProfile,
      });

      if (uid) {
        try {
          await setDoc(
            doc(db, "users", uid),
            { weightHistory: newHistory, weight },
            { merge: true }
          );
        } catch (e) {
          if (__DEV__) console.error("[logWeight] Firestore write failed:", e);
          throw e;
        }
      }
    },
    resetStore: () => set({
      meals: [],
      goals: defaultGoals,
      onboardingCompleted: false,
      userProfile: null,
      weightHistory: [],
      userId: null,
      mealsLoading: false,
      mealsError: null,
    }),

    updateGoals: (goals) =>
      set({ goals }),

    syncMealsFromFirebase: (meals) => {
      set({ meals });
    },
  }),
  {
    name: "meal-tracker-store",
    storage: customUserStorage,
    partialize: (s) => ({
      goals: s.goals,
      userProfile: s.userProfile,
      weightHistory: s.weightHistory,
    }),
  }
)
);

// Listener setup for Firestore meals sync
export function subscribeToUserMeals(userId: string, onUpdate: (meals: Meal[]) => void) {
  const mealsCol = collection(db, "users", userId, "meals");
  
  // Only fetch last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const q = query(
    mealsCol,
    where("loggedAt", ">=", thirtyDaysAgo.toISOString()),
    orderBy("loggedAt", "desc")
  );
  
  useMealStore.setState({ mealsLoading: true, mealsError: null });

  return onSnapshot(
    q,
    (snapshot) => {
      const meals: Meal[] = [];
      snapshot.forEach((doc) => {
        meals.push(doc.data() as Meal);
      });
      useMealStore.setState({ mealsLoading: false, mealsError: null });
      onUpdate(meals);
    },
    (err) => {
      if (__DEV__) console.error("Error subscribing to meals:", err);
      useMealStore.setState({ mealsLoading: false, mealsError: err.message });
    }
  );
}
