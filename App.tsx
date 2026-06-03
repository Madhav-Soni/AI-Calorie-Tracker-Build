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

export type RootStackParamList = {
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
        {renderTab(1)}
        <View style={styles.fabPlaceholder} />
        {renderTab(2)}
      </View>

      {/* Center Floating Camera FAB */}
      <PressScale
        style={styles.fab}
        onPress={() => rootNav?.navigate("Camera")}
      >
        <Text style={styles.fabIcon}>⌁</Text>
        <View style={styles.fabPulse} />
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

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator id="StackNavigator" screenOptions={{ headerShown: false, animation: "slide_from_bottom" }}>
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ animation: "none" }} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen
          name="FoodAnalysis"
          component={FoodAnalysisScreen}
          options={{ animation: "slide_from_right" }}
        />
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
    ...shadow.card,
  },
  tabBar: {
    flexDirection: "row",
    minHeight: 68,
    paddingBottom: 9,
    paddingTop: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 48,
  },
  activeRail: {
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: "transparent",
    marginBottom: 1,
  },
  activeRailVisible: {
    backgroundColor: colors.violet,
    shadowColor: colors.violet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  tabIcon: {
    fontSize: 19,
    color: colors.textDim,
    lineHeight: 20,
  },
  tabIconActive: {
    color: colors.violet,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textDim,
    letterSpacing: 0,
  },
  tabLabelActive: {
    color: colors.violet,
  },
  fabPlaceholder: {
    width: 74,
    height: 44,
  },
  fab: {
    position: "absolute",
    top: -18,
    alignSelf: "center",
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    backgroundColor: colors.purpleDeep,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.ink,
    ...shadow.glowPurple,
  },
  fabIcon: {
    fontSize: 26,
    lineHeight: 28,
    color: "#fff",
    fontWeight: "900",
  },
  fabPulse: {
    position: "absolute",
    top: 8,
    right: 8,
    bottom: 8,
    left: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
});
