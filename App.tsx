import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import type { AnalysisResult } from "./services/foodAnalysis";

import HomeScreen from "./screens/HomeScreen";
import HistoryScreen from "./screens/HistoryScreen";
import ProfileScreen from "./screens/ProfileScreen";
import CameraScreen from "./screens/CameraScreen";
import FoodAnalysisScreen from "./screens/FoodAnalysisScreen";

// Auth screens
import SplashScreen from "./screens/auth/SplashScreen";
import WelcomeScreen from "./screens/auth/WelcomeScreen";
import LoginScreen from "./screens/auth/LoginScreen";
import RegisterScreen from "./screens/auth/RegisterScreen";
import ForgotPasswordScreen from "./screens/auth/ForgotPasswordScreen";

// Onboarding screens
import OnboardingStep1 from "./screens/onboarding/OnboardingStep1";
import OnboardingStep2 from "./screens/onboarding/OnboardingStep2";
import OnboardingStep3 from "./screens/onboarding/OnboardingStep3";
import OnboardingStep4 from "./screens/onboarding/OnboardingStep4";
import OnboardingStep5 from "./screens/onboarding/OnboardingStep5";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useUserProfileStore } from "./store/userProfileStore";
import { useMealStore, subscribeToUserMeals } from "./useMealStore";

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Onboarding: undefined;
  OnboardingStep1: { userData?: any };
  OnboardingStep2: { userData?: any };
  OnboardingStep3: { userData?: any };
  OnboardingStep4: { userData?: any };
  OnboardingStep5: { userData?: any };
  Tabs: undefined;
  Camera: undefined;
  FoodAnalysis: { imageUri: string; analysisResult?: AnalysisResult };
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressScale } from "./components/PressScale";
import { colors, radius, shadow } from "./components/DesignSystem";

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const renderTab = (index: number) => {
    const route = state.routes[index];
    const { options } = descriptors[route.key];
    const focused = state.index === index;
    const icons: Record<string, string> = {
      Home: "⌂",
      History: "◷",
      Profile: "◉",
    };

    return (
      <PressScale
        key={route.key}
        style={styles.tabItem}
        onPress={() => {
          if (!focused) navigation.navigate(route.name);
        }}
      >
        <View style={[styles.activeRail, focused && styles.activeRailVisible]} />
        <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
          {icons[route.name]}
        </Text>
        <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
          {route.name}
        </Text>
      </PressScale>
    );
  };

  return (
    <View style={[styles.tabBarContainer, { bottom: Math.max(insets.bottom, 10) + 8 }]}>
      <BlurView tint="dark" intensity={42} style={StyleSheet.absoluteFill} />
      <View style={styles.tabBar}>
        {renderTab(0)}
        <View style={styles.fabPlaceholder} />
        {renderTab(1)}
        {renderTab(2)}
      </View>

      {/* Center Floating Camera FAB - floats ABOVE nav and uses only shadow */}
      <PressScale
        style={styles.fab}
        onPress={() => rootNav?.navigate("Camera")}
      >
        <Text style={styles.fabIcon}>⌁</Text>
      </PressScale>
    </View>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      id="TabNavigator"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading: authLoading } = useAuth();
  const profile = useUserProfileStore((s) => s.profile);
  const loadingProfile = useUserProfileStore((s) => s.loading);
  const subscribeToProfile = useUserProfileStore((s) => s.subscribeToProfile);

  React.useEffect(() => {
    if (user) {
      useMealStore.getState().setUserId(user.uid);
      const unsubscribeProfile = subscribeToProfile(user.uid);
      const unsubscribeMeals = subscribeToUserMeals(user.uid, (meals) => {
        useMealStore.getState().syncMealsFromFirebase(meals);
      });
      return () => {
        unsubscribeProfile();
        unsubscribeMeals();
      };
    } else {
      useMealStore.getState().setUserId(null);
    }
  }, [user]);

  const onboardingCompleted = profile?.onboardingCompleted || false;

  console.log("AUTH STATE:", user ? `UID: ${user.uid}` : "Logged out");
  console.log("AUTH LOADING:", authLoading);
  console.log("PROFILE LOADING:", loadingProfile);
  console.log("ONBOARDING COMPLETE:", onboardingCompleted);

  if (authLoading || (user && loadingProfile)) {
    return <SplashScreen navigation={null as any} />;
  }

  return (
    <Stack.Navigator id="StackNavigator" screenOptions={{ headerShown: false, animation: "slide_from_bottom" }}>
      {!user ? (
        // Auth Stack
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : !onboardingCompleted ? (
        // Onboarding Stack
        <>
          <Stack.Screen name="Onboarding" component={OnboardingStep1} />
          <Stack.Screen name="OnboardingStep1" component={OnboardingStep1} />
          <Stack.Screen name="OnboardingStep2" component={OnboardingStep2} />
          <Stack.Screen name="OnboardingStep3" component={OnboardingStep3} />
          <Stack.Screen name="OnboardingStep4" component={OnboardingStep4} />
          <Stack.Screen name="OnboardingStep5" component={OnboardingStep5} />
          <Stack.Screen name="Tabs" component={TabNavigator} options={{ animation: "none" }} />
        </>
      ) : (
        // Main App Stack
        <>
          <Stack.Screen name="Tabs" component={TabNavigator} options={{ animation: "none" }} />
          <Stack.Screen name="Camera" component={CameraScreen} />
          <Stack.Screen
            name="FoodAnalysis"
            component={FoodAnalysisScreen}
            options={{ animation: "slide_from_right" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "rgba(8, 8, 19, 0.78)",
    borderWidth: 1,
    borderTopColor: colors.border,
    borderColor: "rgba(139, 126, 246, 0.16)",
    borderRadius: 28,
    overflow: "hidden",
    height: 80,
    ...shadow.card,
  },
  tabBar: {
    flexDirection: "row",
    height: "100%",
    paddingBottom: 4,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    height: "100%",
  },
  activeRail: {
    width: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: "transparent",
    marginBottom: 2,
  },
  activeRailVisible: {
    backgroundColor: colors.violet,
  },
  tabIcon: {
    fontSize: 20,
    color: colors.textDim,
    lineHeight: 22,
  },
  tabIconActive: {
    color: colors.violet,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textDim,
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    color: colors.violet,
  },
  fabPlaceholder: {
    width: 60,
    height: 60,
  },
  fab: {
    position: "absolute",
    top: -12,
    alignSelf: "center",
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.purpleDeep,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#080813",
    elevation: 8,
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  fabIcon: {
    fontSize: 28,
    lineHeight: 30,
    color: "#fff",
    fontWeight: "900",
  },
});
