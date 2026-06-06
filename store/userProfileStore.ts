import { create } from 'zustand';
import { doc, getDoc, onSnapshot, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { User } from 'firebase/auth';
import { useMealStore } from '../useMealStore';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  goal?: string;
  activityLevel?: string;
  activityMultiplier?: number;
  dietPreference?: string;
  calorieTarget?: number;
  proteinTarget?: number;
  carbTarget?: number;
  fatTarget?: number;
  onboardingCompleted: boolean;
  weightHistory?: Array<{ date: string; weight: number }>;
  photoURL?: string;
  displayName?: string;
  provider?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface UserProfileStore {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  fetchProfile: (userId: string) => Promise<void>;
  subscribeToProfile: (userId: string) => () => void;
  updateProfile: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
  clearProfile: () => void;
}

export const useUserProfileStore = create<UserProfileStore>((set, get) => ({
  profile: null,
  loading: true,
  error: null,

  fetchProfile: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        set({ 
          profile: { id: userId, ...docSnap.data() } as UserProfile,
          loading: false 
        });
      } else {
        set({ 
          profile: null, 
          loading: false,
          error: 'Profile not found'
        });
      }
    } catch (error: any) {
      set({ 
        error: error.message,
        loading: false 
      });
    }
  },

  subscribeToProfile: (userId: string) => {
    set({ loading: true, error: null });

    // Safety timeout to prevent infinite loading state
    const timer = setTimeout(() => {
      if (__DEV__) console.log("PROFILE STATE: Timeout fallback triggered");
      if (get().loading) {
        set({ loading: false });
      }
    }, 3000);

    const docRef = doc(db, 'users', userId);
    
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        clearTimeout(timer);
        if (docSnap.exists()) {
          const profileData = { id: userId, ...docSnap.data() } as UserProfile;
          set({ 
            profile: profileData,
            loading: false 
          });
          
          // Sync to useMealStore
          useMealStore.setState({
            userProfile: {
              age: profileData.age || 0,
              gender: profileData.gender || '',
              height: profileData.height || 0,
              weight: profileData.weight || 0,
              goal: profileData.goal || '',
              activityLevel: profileData.activityLevel || '',
            },
            goals: {
              calories: profileData.calorieTarget || 2000,
              protein: profileData.proteinTarget || 150,
              carbs: profileData.carbTarget || 200,
              fat: profileData.fatTarget || 65,
            },
            onboardingCompleted: profileData.onboardingCompleted,
            weightHistory: profileData.weightHistory || [],
          });

          if (__DEV__) {
            console.log("PROFILE STATE: Profile loaded successfully, onboardingCompleted:", profileData.onboardingCompleted);
          }
        } else {
          set({ 
            profile: null, 
            loading: false 
          });
          if (__DEV__) console.log("PROFILE STATE: Profile does not exist");
        }
      },
      (error) => {
        clearTimeout(timer);
        set({ 
          error: error.message,
          loading: false 
        });
        if (__DEV__) console.error("PROFILE STATE: Fetch error:", error);
      }
    );

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  },

  updateProfile: async (userId: string, updates: Partial<UserProfile>) => {
    set({ error: null });
    try {
      const docRef = doc(db, 'users', userId);
      // Use setDoc + merge: true to create the document if it doesn't exist
      await setDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      // Update local state immediately
      const currentProfile = get().profile;
      set({ 
        profile: { ...(currentProfile ?? { id: userId } as any), ...updates }
      });
    } catch (error: any) {
      set({ 
        error: error.message
      });
      throw error;
    }
  },

  clearProfile: () => {
    set({ 
      profile: null, 
      loading: false, 
      error: null 
    });
  },
}));
