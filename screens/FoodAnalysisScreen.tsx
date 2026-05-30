import React, { useEffect, useRef } from "react";
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions, Animated, ActivityIndicator, StatusBar,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./AppNavigator";
import { useAnalyzeFood } from "../analyzeFoodService";
import type { FoodItem } from "../analyzeFoodService";
import { useMealStore } from "../useMealStore";

const { width } = Dimensions.get("window");

type RouteProps = RouteProp<RootStackParamList, "FoodAnalysis">;

export default function FoodAnalysisScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProps>();
  const { imageUri, analysisResult } = route.params || {};
  const insets = useSafeAreaInsets();
  const { state, analyze, setState } = useAnalyzeFood();
  const addMeal = useMealStore((s) => s.addMeal);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (analysisResult) {
      setState({ status: "success", data: analysisResult });
    } else if (imageUri) {
      analyze(imageUri);
    }
  }, [analysisResult, imageUri]);

  useEffect(() => {
    if (state.status === "loading") {
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
      ).start();
    }
    if (state.status === "success" || state.status === "error") {
      spinAnim.stopAnimation();
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [state.status]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const macroColor = (type: "protein" | "carbs" | "fat") =>
    ({ protein: "#34d399", carbs: "#60a5fa", fat: "#f472b6" }[type]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Image Header */}
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, { backgroundColor: "#1c1c1e", alignItems: "center", justifyContent: "center" }]}>
            <Text style={{ color: "rgba(255,255,255,0.4)" }}>No image selected</Text>
          </View>
        )}
        <View style={styles.imageOverlay} />
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 12 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        {state.status === "loading" && (
          <View style={styles.scanOverlay}>
            <Animated.View style={[styles.scanRing, { transform: [{ rotate: spin }] }]} />
            <Text style={styles.scanText}>Analysing...</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.sheet}
        contentContainerStyle={[styles.sheetContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {state.status === "loading" && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#fff" size="small" style={{ marginBottom: 12 }} />
            <Text style={styles.loadingTitle}>Identifying foods</Text>
            <Text style={styles.loadingSubtitle}>Estimating calories & macros...</Text>
          </View>
        )}

        {state.status === "error" && (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Analysis failed</Text>
            <Text style={styles.errorMsg}>{state.message}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => analyze(imageUri)}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {state.status === "success" && (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Totals */}
            <View style={styles.totalsRow}>
              <View style={styles.totalCard}>
                <Text style={styles.totalValue}>{state.data.totalCalories}</Text>
                <Text style={styles.totalLabel}>kcal</Text>
              </View>
              {(["protein", "carbs", "fat"] as const).map((m) => (
                <View key={m} style={styles.macroCard}>
                  <Text style={[styles.macroValue, { color: macroColor(m) }]}>
                    {state.data[`total${m.charAt(0).toUpperCase() + m.slice(1)}` as "totalProtein" | "totalCarbs" | "totalFat"]}g
                  </Text>
                  <Text style={styles.macroLabel}>{m}</Text>
                </View>
              ))}
            </View>

            {/* Food Items */}
            <Text style={styles.sectionTitle}>Foods Detected</Text>
            {state.data.foods.map((item: FoodItem, idx: number) => (
              <View key={idx} style={styles.foodCard}>
                <View style={styles.foodCardTop}>
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{item.name}</Text>
                    <Text style={styles.foodPortion}>{item.portion}</Text>
                  </View>
                  <Text style={styles.foodCalories}>{item.calories} kcal</Text>
                </View>
                <View style={styles.foodMacros}>
                  {(["protein", "carbs", "fat"] as const).map((m) => (
                    <View key={m} style={styles.foodMacroItem}>
                      <Text style={[styles.foodMacroVal, { color: macroColor(m) }]}>
                        {item[m]}g
                      </Text>
                      <Text style={styles.foodMacroLabel}>{m}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Log Button */}
            <TouchableOpacity
              style={styles.logBtn}
              onPress={() => {
                if (state.status === "success") {
                  const mealNames = state.data.foods.map((f) => f.name).join(", ");
                  addMeal({
                    name: mealNames || "AI Analyzed Food",
                    calories: state.data.totalCalories,
                    protein: state.data.totalProtein,
                    carbs: state.data.totalCarbs,
                    fat: state.data.totalFat,
                  });
                  Alert.alert("Success", "Meal logged to diary successfully!", [
                    { text: "OK", onPress: () => navigation.navigate("FoodDiary" as any) }
                  ]);
                }
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.logBtnText}>+ Log to Diary</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  imageContainer: { width, height: 280, position: "relative" },
  heroImage: { width, height: 280, resizeMode: "cover" },
  imageOverlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.3)" },
  backBtn: { position: "absolute", left: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  backBtnText: { color: "#fff", fontSize: 22, lineHeight: 26 },
  scanOverlay: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", gap: 12 },
  scanRing: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: "#fff", borderTopColor: "transparent" },
  scanText: { color: "rgba(255,255,255,0.8)", fontSize: 13, letterSpacing: 1.5, fontWeight: "600" },
  sheet: { flex: 1, backgroundColor: "#0a0a0a", borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20 },
  sheetContent: { padding: 24 },
  loadingBox: { alignItems: "center", paddingTop: 32 },
  loadingTitle: { color: "#fff", fontSize: 17, fontWeight: "600", marginBottom: 6 },
  loadingSubtitle: { color: "rgba(255,255,255,0.4)", fontSize: 13 },
  errorBox: { alignItems: "center", paddingTop: 32 },
  errorIcon: { fontSize: 36, marginBottom: 12 },
  errorTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 8 },
  errorMsg: { color: "rgba(255,255,255,0.45)", fontSize: 13, textAlign: "center", marginBottom: 24, lineHeight: 19 },
  retryBtn: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 28, paddingVertical: 12, borderRadius: 50, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  retryBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  totalsRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
  totalCard: { flex: 1.4, backgroundColor: "#fff", borderRadius: 16, padding: 14, alignItems: "center", justifyContent: "center" },
  totalValue: { color: "#000", fontSize: 28, fontWeight: "800" },
  totalLabel: { color: "rgba(0,0,0,0.5)", fontSize: 11, fontWeight: "600", letterSpacing: 1 },
  macroCard: { flex: 1, backgroundColor: "#161616", borderRadius: 16, padding: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#222" },
  macroValue: { fontSize: 18, fontWeight: "700" },
  macroLabel: { color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "600", letterSpacing: 0.8, textTransform: "capitalize", marginTop: 2 },
  sectionTitle: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 },
  foodCard: { backgroundColor: "#141414", borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#222" },
  foodCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  foodInfo: { flex: 1, marginRight: 12 },
  foodName: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 3 },
  foodPortion: { color: "rgba(255,255,255,0.4)", fontSize: 12 },
  foodCalories: { color: "#fff", fontSize: 16, fontWeight: "700" },
  foodMacros: { flexDirection: "row", gap: 16 },
  foodMacroItem: { alignItems: "center" },
  foodMacroVal: { fontSize: 13, fontWeight: "700" },
  foodMacroLabel: { color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "capitalize", marginTop: 1 },
  logBtn: { backgroundColor: "#fff", borderRadius: 50, paddingVertical: 16, alignItems: "center", marginTop: 24 },
  logBtnText: { color: "#000", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
});
