import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { useMealStore } from "../useMealStore";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  checkOnboardingComplete: (userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("AUTH STATE: Timeout fallback triggered");
      setLoading(false);
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timer);
      setUser(currentUser);
      setLoading(false);
      console.log("AUTH STATE:", currentUser ? `Logged in: ${currentUser.uid}` : "Logged out");
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, fullName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name
    await updateProfile(userCredential.user, { displayName: fullName });
    
    // Create user document in Firestore
    const userRef = doc(db, "users", userCredential.user.uid);
    await setDoc(userRef, {
      id: userCredential.user.uid,
      name: fullName,
      email: email,
      createdAt: serverTimestamp(),
      onboardingCompleted: false,
    });
  };

  const logout = async () => {
    try {
      // 1. Reset Zustand store state
      useMealStore.getState().resetOnboarding();
      useMealStore.getState().setUserId(null);
      
      // 2. Wipe persisted AsyncStorage for this store
      await AsyncStorage.removeItem('meal-tracker-store');
      
      // 3. Sign out of Firebase
      await signOut(auth);
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const checkOnboardingComplete = async (userId: string): Promise<boolean> => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        return userDoc.data().onboardingCompleted || false;
      }
      return false;
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
    checkOnboardingComplete,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
