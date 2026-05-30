import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import HomeScreen from "./screens/HomeScreen";
import FoodDiaryScreen from "./screens/FoodDiaryScreen";
import FoodAnalysisScreen from "./screens/FoodAnalysisScreen";
import HistoryScreen from "./screens/HistoryScreen";
import CameraScreen from "./screens/CameraScreen";

export type RootStackParamList = {
  Tabs: undefined;
  FoodAnalysis: { imageUri: string; analysisResult?: any };
  Camera: undefined;
};

export type TabParamList = {
  Home: undefined;
  Diary: undefined;
  History: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const icons: Record<string, string> = {
            Home: "🏠",
            Diary: "📋",
            History: "📅",
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
              <Text style={styles.tabIcon}>{icons[route.name]}</Text>
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                {route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

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
      <Tab.Screen name="Diary" component={FoodDiaryScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator id="StackNavigator" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen
          name="FoodAnalysis"
          component={FoodAnalysisScreen}
          options={{ presentation: "modal" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "relative",
    backgroundColor: "#13131A",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  tabBar: {
    flexDirection: "row",
    paddingBottom: 24,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.35)",
  },
  tabLabelActive: {
    color: "#7C3AED",
  },
  fab: {
    position: "absolute",
    top: -28,
    alignSelf: "center",
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#13131A",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 10,
  },
  fabIcon: {
    fontSize: 26,
  },
});
