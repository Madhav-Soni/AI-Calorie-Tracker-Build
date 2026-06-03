import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import type { AnalysisResult } from "./services/foodAnalysis";
import { useMealStore } from "./useMealStore";

import HomeScreen from "./screens/HomeScreen";
import ProgressScreen from "./screens/ProgressScreen";
import HistoryScreen from "./screens/HistoryScreen";
import ProfileScreen from "./screens/ProfileScreen";
import CameraScreen from "./screens/CameraScreen";
import FoodAnalysisScreen from "./screens/FoodAnalysisScreen";
import OnboardingScreen from "./screens/OnboardingScreen";

export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: undefined;
  Camera: undefined;
  FoodAnalysis: { imageUri: string; analysisResult?: AnalysisResult };
};

export type TabParamList = {
  Home: undefined;
  Progress: undefined;
  ScanPlaceholder: undefined;
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
      Progress: "📈",
      History: "◷",
      Profile: "◉",
    };

    if (route.name === "ScanPlaceholder") {
      return <View key={route.key} style={styles.fabPlaceholder} />;
    }

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
        {renderTab(1)}
        {renderTab(2)}
        {renderTab(3)}
        {renderTab(4)}
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
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="ScanPlaceholder" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const onboardingCompleted = useMealStore((s) => s.onboardingCompleted);

  return (
    <NavigationContainer>
      <Stack.Navigator id="StackNavigator" screenOptions={{ headerShown: false, animation: "slide_from_bottom" }}>
        {!onboardingCompleted ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
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
    </NavigationContainer>
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
