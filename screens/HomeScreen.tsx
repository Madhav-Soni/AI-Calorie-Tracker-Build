import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
  StatusBar,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { useMealStore } from "../useMealStore";
import { getCoachRecommendation } from "../NutritionCoach";
import { calculateStreaks } from "../streak";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;

// ─── Initial Mock Data fallback if store is empty ──────────────────────────
const MOCK_INITIAL_MEALS = [
  { id: "1", name: "Oats & Banana", calories: 380, protein: 12, carbs: 68, fat: 6, loggedAt: new Date().toISOString() },
  { id: "2", name: "Grilled Salmon Bowl", calories: 542, protein: 38, carbs: 41, fat: 22, loggedAt: new Date().toISOString() },
  { id: "3", name: "Greek Yogurt", calories: 120, protein: 18, carbs: 9, fat: 2, loggedAt: new Date().toISOString() },
];

const GOAL = { calories: 2000, protein: 150, carbs: 200, fat: 65 };

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // Zustand Store
  const meals = useMealStore((s) => s.meals);
  const deleteMeal = useMealStore((s) => s.deleteMeal);
  const getDailyTotals = useMealStore((s) => s.getDailyTotals);

  // If store is empty, fall back to initial mock meals for demonstration
  const displayMeals = meals.length === 0 ? MOCK_INITIAL_MEALS : meals;
  
  // Totals calculations
  const totals = meals.length === 0 
    ? {
        calories: MOCK_INITIAL_MEALS.reduce((sum, m) => sum + m.calories, 0),
        protein: MOCK_INITIAL_MEALS.reduce((sum, m) => sum + m.protein, 0),
        carbs: MOCK_INITIAL_MEALS.reduce((sum, m) => sum + m.carbs, 0),
        fat: MOCK_INITIAL_MEALS.reduce((sum, m) => sum + m.fat, 0),
      }
    : getDailyTotals();

  // Streak calculations
  const dates = meals.map((m) => m.loggedAt);
  const streakResult = calculateStreaks(dates);
  const currentStreak = meals.length === 0 ? 14 : streakResult.current;

  // AI Coach recommendation
  const coachTip = getCoachRecommendation({
    protein: { consumed: totals.protein, goal: GOAL.protein },
    carbs: { consumed: totals.carbs, goal: GOAL.carbs },
    fat: { consumed: totals.fat, goal: GOAL.fat },
  });

  // Time-aware greeting
  const [greeting, setGreeting] = useState("Good morning");
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs < 12) setGreeting("Good morning");
    else if (hrs < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    // Format current date: Sunday, May 31
    const options: Intl.DateTimeFormatOptions = { weekday: "long", month: "short", day: "numeric" };
    setFormattedDate(new Date().toLocaleDateString("en-US", options));
  }, [meals]);

  // ─── Animations ──────────────────────────────────────────────────────────
  const ringAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const listSlideAnim = useRef(new Animated.Value(30)).current;
  const listFadeAnim = useRef(new Animated.Value(0)).current;

  const calPct = totals.calories > 0 ? totals.calories / GOAL.calories : 0;
  const ringColor = calPct < 0.8 ? "#34d399" : calPct <= 1.0 ? "#facc15" : "#ef4444";

  useEffect(() => {
    // Ring fill animation on mount/update
    Animated.parallel([
      Animated.timing(ringAnim, {
        toValue: calPct,
        duration: 1200,
        useNativeDriver: false,
      }),
      // Entrance animation for content
      Animated.timing(listFadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(listSlideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [calPct]);

  useEffect(() => {
    // Continuous pulsing animation for CTA button
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const size = 180;
  const strokeWidth = 14;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;

  const ringOffset = ringAnim.interpolate({
    inputRange: [0, Math.max(1, calPct)],
    outputRange: [circ, circ * (1 - Math.min(1, calPct))],
  });

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>{formattedDate}</Text>
            <Text style={styles.headerTitle}>{greeting}, Madhav 👋</Text>
          </View>
          <Image
            source={{ uri: "https://i.pravatar.cc/100?img=33" }}
            style={styles.avatar}
          />
        </View>

        {/* Dynamic Calorie Progress Ring */}
        <View style={styles.ringCard}>
          <View style={{ width: size, height: size, alignSelf: "center", position: "relative" }}>
            <Svg width={size} height={size}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <AnimatedCircle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={ringColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circ}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${size / 2}, ${size / 2}`}
              />
            </Svg>
            <View style={styles.ringLabelContainer}>
              <Text style={styles.caloriesCount}>{totals.calories.toLocaleString()}</Text>
              <Text style={styles.caloriesGoal}>/ {GOAL.calories.toLocaleString()} kcal</Text>
              <Text style={[styles.caloriesRemaining, { color: ringColor }]}>
                {totals.calories >= GOAL.calories 
                  ? "Goal Exceeded" 
                  : `${(GOAL.calories - totals.calories).toLocaleString()} remaining`}
              </Text>
            </View>
          </View>
        </View>

        {/* Macros Badges Row */}
        <View style={styles.macrosRow}>
          {[
            { label: "Protein", color: "#3b82f6", consumed: totals.protein, target: GOAL.protein },
            { label: "Carbs", color: "#34d399", consumed: totals.carbs, target: GOAL.carbs },
            { label: "Fat", color: "#f472b6", consumed: totals.fat, target: GOAL.fat },
          ].map((macro) => {
            const pct = Math.min(1, macro.consumed / macro.target);
            return (
              <View key={macro.label} style={styles.macroPill}>
                <View style={styles.macroPillHeader}>
                  <Text style={styles.macroLabel}>{macro.label}</Text>
                  <Text style={styles.macroValue}>
                    {macro.consumed}g / {macro.target}g
                  </Text>
                </View>
                <View style={styles.macroTrack}>
                  <View style={[styles.macroBar, { width: `${pct * 100}%`, backgroundColor: macro.color }]} />
                </View>
              </View>
            );
          })}
        </View>

        {/* AI Camera CTA Button */}
        <View style={styles.cameraContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.cameraBtn}
              activeOpacity={0.88}
              onPress={() => navigation.navigate("Camera")}
            >
              <Text style={styles.cameraBtnText}>Scan Meal 📷</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Today's Meals Section */}
        <Animated.View style={{ opacity: listFadeAnim, transform: [{ translateY: listSlideAnim }] }}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          {displayMeals.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No meals logged yet. Tap Scan Meal to start!</Text>
            </View>
          ) : (
            displayMeals.map((meal) => {
              const time = meal.loggedAt ? new Date(meal.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now";
              return (
                <View key={meal.id} style={styles.mealCard}>
                  <View style={styles.mealLeft}>
                    <View style={styles.mealIcon}>
                      <Text style={{ fontSize: 18 }}>🍽️</Text>
                    </View>
                    <View>
                      <Text style={styles.mealName} numberOfLines={1}>{meal.name}</Text>
                      <Text style={styles.mealDetails}>
                        P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fat}g
                      </Text>
                    </View>
                  </View>
                  <View style={styles.mealRight}>
                    <Text style={styles.mealCal}>{meal.calories} kcal</Text>
                    <Text style={styles.mealTime}>{time}</Text>
                    
                    {/* Delete button (wired directly instead of swipe for reliability) */}
                    <TouchableOpacity
                      onPress={() => deleteMeal(meal.id)}
                      style={styles.deleteBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.deleteText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* Streak Badge */}
          <TouchableOpacity
            style={styles.streakBadge}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Tabs", { screen: "History" } as any)}
          >
            <Text style={styles.streakText}>🔥 {currentStreak} day streak</Text>
            <Text style={styles.streakArrow}>›</Text>
          </TouchableOpacity>

          {/* AI Coach recommendation tip card */}
          <View style={styles.coachCard}>
            <Text style={styles.coachTitle}>💡 AI Nutrition Coach</Text>
            <Text style={styles.coachText}>{coachTip}</Text>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#080810" },
  scroll: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 100 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#4b5563",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "800",
    marginTop: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#1f1f35",
  },

  // Ring Card
  ringCard: {
    backgroundColor: "#0f0f1a",
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1f1f35",
    alignItems: "center",
  },
  ringLabelContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  caloriesCount: {
    fontSize: 36,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
  },
  caloriesGoal: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "600",
    marginTop: 2,
  },
  caloriesRemaining: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 8,
  },

  // Macros pills
  macrosRow: {
    gap: 10,
    marginBottom: 20,
  },
  macroPill: {
    backgroundColor: "#0f0f1a",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1f1f35",
  },
  macroPillHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  macroLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "600",
  },
  macroValue: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "700",
  },
  macroTrack: {
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 3,
    overflow: "hidden",
  },
  macroBar: {
    height: "100%",
    borderRadius: 3,
  },

  // CTA
  cameraContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  cameraBtn: {
    backgroundColor: "#7c3aed",
    paddingHorizontal: 36,
    paddingVertical: 15,
    borderRadius: 50,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  cameraBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // Meals List
  sectionTitle: {
    fontSize: 12,
    color: "#4b5563",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: "#0f0f1a",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1f1f35",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 13,
    textAlign: "center",
  },
  mealCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0f0f1a",
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1f1f35",
  },
  mealLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  mealName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  mealDetails: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
  },
  mealRight: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  mealCal: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  mealTime: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 10,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Streak
  streakBadge: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#161301",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#facc1530",
    marginBottom: 16,
  },
  streakText: {
    color: "#fbbf24",
    fontSize: 14,
    fontWeight: "700",
  },
  streakArrow: {
    color: "#fbbf24",
    fontSize: 18,
    fontWeight: "bold",
  },

  // AI Coach Card
  coachCard: {
    backgroundColor: "#0d0d1f",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f1f35",
  },
  coachTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#60a5fa",
    marginBottom: 6,
  },
  coachText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    lineHeight: 19,
  },
});
