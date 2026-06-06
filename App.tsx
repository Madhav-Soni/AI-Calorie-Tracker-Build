import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import type { AnalysisResult } from "./services/foodAnalysis";

import HomeScreen from "./screens/HomeScreen";
import ProgressScreen from "./screens/ProgressScreen";
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
  Progress: undefined;
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
    const icons: Record<string, { name: keyof typeof Ionicons.glyphMap; activeName: keyof typeof Ionicons.glyphMap }> = {
      Home:     { name: 'home-outline',    activeName: 'home' },
      Progress: { name: 'bar-chart-outline', activeName: 'bar-chart' },
      History:  { name: 'time-outline',    activeName: 'time' },
      Profile:  { name: 'person-outline',  activeName: 'person' },
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
        <Ionicons
          name={focused ? icons[route.name].activeName : icons[route.name].name}
          size={22}
          color={focused ? colors.violet : colors.textDim}
        />
        <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
          {route.name}
        </Text>
      </PressScale>
    );
  };

  const bottomOffset = Platform.OS === "android"
    ? Math.max(insets.bottom, 16)
    : Math.max(insets.bottom, 12);

  return (
    <View style={[styles.tabBarContainer, { bottom: bottomOffset }]}>
      <BlurView tint="dark" intensity={42} style={StyleSheet.absoluteFill} />
      <View style={styles.tabBar}>
        {renderTab(0)}
        {renderTab(1)}
        <View style={styles.fabPlaceholder} />
        {renderTab(2)}
        {renderTab(3)}
      </View>

      {/* Center Floating Camera FAB - floats ABOVE nav and uses only shadow */}
      <PressScale
        style={styles.fab}
        onPress={() => rootNav?.navigate("Camera")}
      >
        <Ionicons name="camera" size={26} color="#fff" />
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
      <Tab.Screen name="Progress" component={ProgressScreen} />
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
      useMealStore.getState().clearForSignOut();
      useUserProfileStore.setState({ profile: null, loading: true, error: null });
      useMealStore.getState().setUserId(user.uid);
      const unsubscribeProfile = subscribeToProfile(user.uid);
      const unsubscribeMeals = subscribeToUserMeals(user.uid, (meals) => {
        useMealStore.getState().syncMealsFromFirebase(meals);
      });
      return () => {
        if (typeof unsubscribeProfile === "function") {
          unsubscribeProfile();
        }
        if (typeof unsubscribeMeals === "function") {
          unsubscribeMeals();
        }
        useMealStore.getState().resetStore();
        useMealStore.getState().setUserId(null);
        useUserProfileStore.getState().clearProfile();
      };
    } else {
      // Full wipe on logout — prevents cross-account bleed
      useMealStore.getState().resetStore();
      useMealStore.getState().setUserId(null);
      useUserProfileStore.getState().clearProfile();
    }
  }, [user?.uid]);

  const onboardingCompleted = profile?.onboardingCompleted || false;

  if (__DEV__) console.log("[Auth]", user ? "logged in" : "logged out");

  if (authLoading || (user && loadingProfile)) {
    return <SplashScreen navigation={null as any} />;
  }

  return (
    <Stack.Navigator id="StackNavigator" screenOptions={{ headerShown: false }}>
      {!user ? (
        // Auth Stack
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: "fade" }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ animation: "slide_from_right" }} />
        </>
      ) : !onboardingCompleted ? (
        // Onboarding Stack
        <>
          <Stack.Screen name="OnboardingStep1" component={OnboardingStep1} options={{ animation: "slide_from_right", gestureEnabled: false }} />
          <Stack.Screen name="OnboardingStep2" component={OnboardingStep2} options={{ animation: "slide_from_right", gestureEnabled: false }} />
          <Stack.Screen name="OnboardingStep3" component={OnboardingStep3} options={{ animation: "slide_from_right", gestureEnabled: false }} />
          <Stack.Screen name="OnboardingStep4" component={OnboardingStep4} options={{ animation: "slide_from_right", gestureEnabled: false }} />
          <Stack.Screen name="OnboardingStep5" component={OnboardingStep5} options={{ animation: "slide_from_right", gestureEnabled: false }} />
          <Stack.Screen name="Tabs" component={TabNavigator} options={{ animation: "none" }} />
        </>
      ) : (
        // Main App Stack
        <>
          <Stack.Screen name="Tabs" component={TabNavigator} options={{ animation: "none" }} />
          <Stack.Screen name="Camera" component={CameraScreen} options={{ animation: "slide_from_bottom" }} />
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "rgba(10, 10, 22, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(139, 126, 246, 0.22)",
    borderRadius: 22,
    overflow: "hidden",
    height: 64,
    ...shadow.card,
  },
  tabBar: {
    flexDirection: "row",
    height: "100%",
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  activeRail: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "transparent",
    marginBottom: 4,
  },
  activeRailVisible: {
    backgroundColor: colors.violet,
  },
  tabIcon: {
    fontSize: 18,
    color: colors.textDim,
  },
  tabIconActive: {
    color: colors.violet,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.textDim,
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.violet,
  },
  fabPlaceholder: {
    width: 56,
    height: 56,
  },
  fab: {
    position: "absolute",
    top: -18,
    alignSelf: "center",
    width: 56,
    height: 56,
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
    fontSize: 26,
    lineHeight: 28,
    color: "#fff",
    fontWeight: "900",
  },
});
