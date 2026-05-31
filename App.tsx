import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
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

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

  const renderTab = (index: number) => {
    const route = state.routes[index];
    const { options } = descriptors[route.key];
    const focused = state.index === index;
    const icons: Record<string, string> = {
      Home: "🏠",
      History: "📅",
      Profile: "👤",
    };

    return (
      <TouchableOpacity
        key={route.key}
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => {
          if (!focused) navigation.navigate(route.name);
        }}
      >
        <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
          {icons[route.name]}
        </Text>
        <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
          {route.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {renderTab(0)}
        {renderTab(1)}
        <View style={styles.fabPlaceholder} />
        {renderTab(2)}
      </View>

      {/* Center Floating Camera FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => rootNav?.navigate("Camera")}
      >
        <Text style={styles.fabIcon}>📷</Text>
      </TouchableOpacity>
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
    position: "relative",
    backgroundColor: "#0a0a10",
    borderTopWidth: 1,
    borderTopColor: "rgba(124, 58, 237, 0.1)",
  },
  tabBar: {
    flexDirection: "row",
    paddingBottom: 24,
    paddingTop: 10,
    alignItems: "center",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  tabIcon: {
    fontSize: 20,
    color: "rgba(255, 255, 255, 0.35)",
  },
  tabIconActive: {
    color: "#7C3AED",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.35)",
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: "#7C3AED",
  },
  fabPlaceholder: {
    width: 62,
    height: 40,
  },
  fab: {
    position: "absolute",
    top: -24,
    alignSelf: "center",
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: "#0a0a10",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  fabIcon: {
    fontSize: 26,
  },
});
