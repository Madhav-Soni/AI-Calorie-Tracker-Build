import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "./firebase/config";

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
  age: number;
  gender: string;
  height: number;
  weight: number;
  goal: string;
  activityLevel: string;
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
  
  // Actions
  setUserId: (userId: string | null) => void;
  clearForSignOut: () => void;
  addMeal: (meal: Omit<Meal, "id" | "loggedAt">) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  getDailyTotals: (date?: string) => DailyTotals;
  completeOnboarding: (profile: UserProfile, calculatedGoals: UserGoals) => void;
  resetOnboarding: () => void;
  logWeight: (weight: number) => void;
  updateGoals: (goals: UserGoals) => void;
  syncMealsFromFirebase: (meals: Meal[]) => void;
}

const toDateKey = (iso: string) => iso.slice(0, 10);

export const selectDailyTotals = (date?: string) => (state: MealStore) => {
  const key = date ?? toDateKey(new Date().toISOString());
  const daily = state.meals.filter((m) => toDateKey(m.loggedAt) === key);
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
      goals: {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 65,
      },
      onboardingCompleted: false,
      userProfile: null,
      weightHistory: [],
      userId: null,

      setUserId: (userId) => {
        set({ userId });
      },

      clearForSignOut: () => {
        set({
          meals: [],
          goals: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
          onboardingCompleted: false,
          userProfile: null,
          weightHistory: [],
          userId: null,
        });
      },

      addMeal: async (meal) => {
        const uid = get().userId;
        const newMeal: Meal = {
          ...meal,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
            console.error("Error writing meal to Firestore:", e);
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
        if (uid) {
          try {
            // Delete from Firebase Firestore
            const mealRef = doc(db, "users", uid, "meals", id);
            await deleteDoc(mealRef);
            // Firestore listener will sync the deletion automatically
          } catch (e) {
            console.error("Error deleting meal from Firestore:", e);
            // Fallback to local update on error
            set((state) => ({
              meals: state.meals.filter((m) => m.id !== id),
            }));
          }
        } else {
          // Local fallback
          set((state) => ({
            meals: state.meals.filter((m) => m.id !== id),
          }));
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
          weightHistory: [{ date: toDateKey(new Date().toISOString()), weight: profile.weight }],
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

      logWeight: (weight) =>
        set((state) => {
          const date = toDateKey(new Date().toISOString());
          const filtered = state.weightHistory.filter((w) => w.date !== date);
          const updatedProfile = state.userProfile
            ? { ...state.userProfile, weight }
            : null;
          return {
            weightHistory: [...filtered, { date, weight }].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            ),
            userProfile: updatedProfile,
          };
        }),

      updateGoals: (goals) =>
        set({ goals }),

      syncMealsFromFirebase: (meals) => {
        set({ meals });
      },
    }),
    {
      name: "meal-tracker-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        // DO NOT persist meals or onboardingCompleted
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
  const q = query(mealsCol, orderBy("loggedAt", "desc"));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const meals: Meal[] = [];
      snapshot.forEach((doc) => {
        meals.push(doc.data() as Meal);
      });
      onUpdate(meals);
    },
    (err) => {
      console.error("Error subscribing to meals:", err);
    }
  );
}
