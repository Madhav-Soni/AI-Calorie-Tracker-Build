import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CameraScreen from "./CameraScreen";
import FoodAnalysisScreen from "./FoodAnalysisScreen";
import FoodDiaryScreen from "./FoodDiaryScreen";

export type RootStackParamList = {
  FoodDiary: undefined;
  Camera: undefined;
  FoodAnalysis: { imageUri: string; analysisResult?: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator id="RootStackNavigator" screenOptions={{ headerShown: false }} initialRouteName="FoodDiary">
        <Stack.Screen name="FoodDiary" component={FoodDiaryScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="FoodAnalysis" component={FoodAnalysisScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
