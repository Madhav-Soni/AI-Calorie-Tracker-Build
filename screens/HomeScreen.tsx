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
} from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { useMealStore } from "../useMealStore";
import { getCoachRecommendation } from "../NutritionCoach";
import { calculateStreaks } from "../streak";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;

const GOAL = { calories: 2000, protein: 150, carbs: 200, fat: 65 };

const WEEKLY_DATA = [
  { day: "M", kcal: 1820 },
  { day: "T", kcal: 2150 },
  { day: "W", kcal: 1680 },
  { day: "T", kcal: 1950 },
  { day: "F", kcal: 2200 },
  { day: "S", kcal: 1450 },
  { day: "S", kcal: 1850 },
];

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const meals = useMealStore((s) => s.meals);
  const deleteMeal = useMealStore((s) => s.deleteMeal);
  const getDailyTotals = useMealStore((s) => s.getDailyTotals);

  const totals = meals.length === 0 
    ? { calories: 1042, protein: 68, carbs: 118, fat: 30 } 
    : getDailyTotals();

  const displayMeals = meals.length === 0 
    ? [
        { id: "1", name: "Oats & Banana Bowl", calories: 380, protein: 12, carbs: 68, fat: 6, loggedAt: new Date(Date.now() - 3600000 * 4).toISOString() },
        { id: "2", name: "Grilled Salmon Bowl", calories: 542, protein: 38, carbs: 41, fat: 22, loggedAt: new Date(Date.now() - 3600000 * 2).toISOString() },
        { id: "3", name: "Greek Yogurt", calories: 120, protein: 18, carbs: 9, fat: 2, loggedAt: new Date().toISOString() },
      ]
    : meals;

  const dates = meals.map((m) => m.loggedAt);
  const streakResult = calculateStreaks(dates);
  const currentStreak = meals.length === 0 ? 14 : streakResult.current;

  const coachTip = getCoachRecommendation({
    protein: { consumed: totals.protein, goal: GOAL.protein },
    carbs: { consumed: totals.carbs, goal: GOAL.carbs },
    fat: { consumed: totals.fat, goal: GOAL.fat },
  });

  const [greeting, setGreeting] = useState("Good morning");
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs < 12) setGreeting("Good Morning");
    else if (hrs < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    const options: Intl.DateTimeFormatOptions = { weekday: "long", month: "short", day: "numeric" };
    setFormattedDate(new Date().toLocaleDateString("en-US", options));
  }, [meals]);

  // Animations
  const mainRingAnim = useRef(new Animated.Value(0)).current;
  const pRingAnim = useRef(new Animated.Value(0)).current;
  const cRingAnim = useRef(new Animated.Value(0)).current;
  const fRingAnim = useRef(new Animated.Value(0)).current;
  
  const meshAnim1 = useRef(new Animated.Value(0)).current;
  const meshAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(25)).current;

  const calPct = Math.min(1.2, totals.calories / GOAL.calories);
  const pPct = Math.min(1, totals.protein / GOAL.protein);
  const cPct = Math.min(1, totals.carbs / GOAL.carbs);
  const fPct = Math.min(1, totals.fat / GOAL.fat);

  const ringColor = calPct < 0.8 ? "#10b981" : calPct <= 1.0 ? "#f59e0b" : "#ef4444";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(mainRingAnim, { toValue: calPct, duration: 1400, useNativeDriver: false }),
      Animated.timing(pRingAnim, { toValue: pPct, duration: 1200, useNativeDriver: false }),
      Animated.timing(cRingAnim, { toValue: cPct, duration: 1200, useNativeDriver: false }),
      Animated.timing(fRingAnim, { toValue: fPct, duration: 1200, useNativeDriver: false }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    // Pulse loops
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Mesh backgrounds loops
    Animated.loop(
      Animated.sequence([
        Animated.timing(meshAnim1, { toValue: 1, duration: 8000, useNativeDriver: true }),
        Animated.timing(meshAnim1, { toValue: 0, duration: 8000, useNativeDriver: true }),
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(meshAnim2, { toValue: 1, duration: 6000, useNativeDriver: true }),
        Animated.timing(meshAnim2, { toValue: 0, duration: 6000, useNativeDriver: true }),
      ])
    ).start();
  }, [calPct, pPct, cPct, fPct]);

  // Mesh translations
  const meshTranslateX1 = meshAnim1.interpolate({ inputRange: [0, 1], outputRange: [-20, 50] });
  const meshTranslateY1 = meshAnim1.interpolate({ inputRange: [0, 1], outputRange: [-30, 20] });
  const meshTranslateX2 = meshAnim2.interpolate({ inputRange: [0, 1], outputRange: [40, -30] });
  const meshTranslateY2 = meshAnim2.interpolate({ inputRange: [0, 1], outputRange: [10, -40] });

  // Ring Svg Calculations
  const mainSize = 200;
  const mainStroke = 16;
  const mainR = (mainSize - mainStroke) / 2;
  const mainCirc = 2 * Math.PI * mainR;
  const mainOffset = mainRingAnim.interpolate({
    inputRange: [0, 1.2],
    outputRange: [mainCirc, mainCirc * (1 - Math.min(1, calPct))],
  });

  const miniSize = 54;
  const miniStroke = 6;
  const miniR = (miniSize - miniStroke) / 2;
  const miniCirc = 2 * Math.PI * miniR;

  const renderMiniRing = (anim: Animated.Value, pct: number, color: string, label: string, val: string, goal: string) => {
    const offset = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [miniCirc, miniCirc * (1 - pct)],
    });
    return (
      <View style={styles.miniMacroCard}>
        <View style={{ width: miniSize, height: miniSize, position: "relative", marginBottom: 10 }}>
          <Svg width={miniSize} height={miniSize}>
            <Circle cx={miniSize / 2} cy={miniSize / 2} r={miniR} stroke="rgba(255,255,255,0.04)" strokeWidth={miniStroke} fill="none" />
            <AnimatedCircle
              cx={miniSize / 2}
              cy={miniSize / 2}
              r={miniR}
              stroke={color}
              strokeWidth={miniStroke}
              fill="none"
              strokeDasharray={miniCirc}
              strokeDashoffset={offset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${miniSize / 2}, ${miniSize / 2}`}
            />
          </Svg>
          <View style={styles.miniRingLabelBox}>
            <Text style={[styles.miniRingPctText, { color }]}>{Math.round(pct * 100)}%</Text>
          </View>
        </View>
        <Text style={styles.miniRingLabel}>{label}</Text>
        <Text style={styles.miniRingVal}>{val}</Text>
        <Text style={styles.miniRingGoal}>/ {goal}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Futuristic Background Mesh */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View
          style={[
            styles.meshBlob,
            {
              backgroundColor: "#7c3aed",
              opacity: 0.15,
              width: 320,
              height: 320,
              borderRadius: 160,
              transform: [{ translateX: meshTranslateX1 }, { translateY: meshTranslateY1 }],
              top: -80,
              right: -80,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.meshBlob,
            {
              backgroundColor: "#2563eb",
              opacity: 0.12,
              width: 280,
              height: 280,
              borderRadius: 140,
              transform: [{ translateX: meshTranslateX2 }, { translateY: meshTranslateY2 }],
              top: 220,
              left: -100,
            },
          ]}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* HERO HEADER */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View>
            <Text style={styles.dateLabel}>{formattedDate}</Text>
            <Text style={styles.greetingText}>{greeting}, Madhav</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.7} onPress={() => navigation.navigate("Tabs", { screen: "Profile" } as any)}>
              <Text style={{ fontSize: 18 }}>⚙️</Text>
            </TouchableOpacity>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop" }}
              style={styles.avatar}
            />
          </View>
        </Animated.View>

        {/* CALORIE PROGRESS CARD */}
        <Animated.View style={[styles.calorieCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.calorieCardLayout}>
            {/* Svg Circle Container */}
            <View style={{ width: mainSize, height: mainSize, position: "relative" }}>
              <Svg width={mainSize} height={mainSize}>
                <Defs>
                  <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor={ringColor} stopOpacity={0.8} />
                    <Stop offset="100%" stopColor="#c084fc" stopOpacity={1} />
                  </LinearGradient>
                </Defs>
                <Circle cx={mainSize / 2} cy={mainSize / 2} r={mainR} stroke="rgba(255,255,255,0.03)" strokeWidth={mainStroke} fill="none" />
                <AnimatedCircle
                  cx={mainSize / 2}
                  cy={mainSize / 2}
                  r={mainR}
                  stroke="url(#ringGrad)"
                  strokeWidth={mainStroke}
                  fill="none"
                  strokeDasharray={mainCirc}
                  strokeDashoffset={mainOffset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${mainSize / 2}, ${mainSize / 2}`}
                />
              </Svg>
              <View style={styles.ringLabelContainer}>
                <Text style={styles.caloriesNumber}>{totals.calories.toLocaleString()}</Text>
                <Text style={styles.caloriesTarget}>of {GOAL.calories.toLocaleString()} kcal</Text>
                <View style={[styles.pillBadge, { backgroundColor: "rgba(255,255,255,0.06)", marginTop: 10 }]}>
                  <Text style={styles.percentText}>{Math.round((totals.calories / GOAL.calories) * 100)}% Active</Text>
                </View>
              </View>
            </View>

            {/* Side Calories Details */}
            <View style={styles.calorieDetails}>
              <View>
                <Text style={styles.detailLabel}>REMAINING</Text>
                <Text style={[styles.detailValue, { color: ringColor, fontSize: 32 }]}>
                  {Math.max(0, GOAL.calories - totals.calories).toLocaleString()}
                </Text>
                <Text style={styles.detailSub}>kcal left</Text>
              </View>
              <View style={styles.detailDivider} />
              <View>
                <Text style={styles.detailLabel}>METABOLIC STATUS</Text>
                <Text style={[styles.detailValue, { color: "#c084fc" }]}>Optimal</Text>
                <Text style={styles.detailSub}>Fat-burn active</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* QUICK AI ACTIONS */}
        <Animated.View style={[styles.actionsContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity style={styles.actionItem} activeOpacity={0.8} onPress={() => {}}>
            <Text style={styles.actionIcon}>🎙️</Text>
            <Text style={styles.actionLabel}>Voice Log</Text>
          </TouchableOpacity>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.actionPrimary}
              activeOpacity={0.9}
              onPress={() => navigation.navigate("Camera")}
            >
              <Text style={styles.actionPrimaryIcon}>📷</Text>
              <Text style={styles.actionPrimaryLabel}>Scan Meal</Text>
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity style={styles.actionItem} activeOpacity={0.8} onPress={() => {}}>
            <Text style={styles.actionIcon}>🏷️</Text>
            <Text style={styles.actionLabel}>Barcode</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* MACRO TRACKER */}
        <Animated.View style={[styles.sectionHeader, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Macronutrients</Text>
        </Animated.View>
        <Animated.View style={[styles.macrosContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {renderMiniRing(pRingAnim, pPct, "#60a5fa", "Protein", `${totals.protein}g`, `${GOAL.protein}g`)}
          {renderMiniRing(cRingAnim, cPct, "#34d399", "Carbs", `${totals.carbs}g`, `${GOAL.carbs}g`)}
          {renderMiniRing(fRingAnim, fPct, "#f472b6", "Fat", `${totals.fat}g`, `${GOAL.fat}g`)}
        </Animated.View>

        {/* WEEKLY INSIGHTS CHART */}
        <Animated.View style={[styles.sectionHeader, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Weekly Insights</Text>
          <Text style={styles.trendArrow}>Average: 1,842 kcal</Text>
        </Animated.View>
        <Animated.View style={[styles.insightsCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.chartContainer}>
            {WEEKLY_DATA.map((item, idx) => {
              const maxKcal = Math.max(...WEEKLY_DATA.map(d => d.kcal), 2500);
              const barHeight = (item.kcal / maxKcal) * 80;
              const isToday = idx === new Date().getDay() - 1;
              return (
                <View key={idx} style={styles.chartCol}>
                  <View style={styles.chartBarTrack}>
                    <View style={[styles.chartBarFill, { height: barHeight, backgroundColor: isToday ? "#c084fc" : "rgba(255,255,255,0.15)" }]} />
                  </View>
                  <Text style={[styles.chartLabel, isToday && { color: "#c084fc", fontWeight: "800" }]}>{item.day}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.insightsStats}>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightStatTitle}>Weekly consistency is up 12%</Text>
              <Text style={styles.insightStatSub}>You logged meals on 6 out of 7 days this week.</Text>
            </View>
            <View style={[styles.pillBadge, { backgroundColor: "rgba(52, 211, 153, 0.1)" }]}>
              <Text style={{ color: "#34d399", fontSize: 11, fontWeight: "700" }}>✓ Steady</Text>
            </View>
          </View>
        </Animated.View>

        {/* TODAY'S MEALS */}
        <Animated.View style={[styles.sectionHeader, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          <TouchableOpacity style={styles.streakBadge} activeOpacity={0.7} onPress={() => navigation.navigate("Tabs", { screen: "History" } as any)}>
            <Text style={styles.streakText}>🔥 {currentStreak} day streak</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={[styles.mealsList, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {displayMeals.map((meal) => {
            const time = meal.loggedAt ? new Date(meal.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now";
            return (
              <View key={meal.id} style={styles.mealCard}>
                <View style={styles.mealIconBox}>
                  <Text style={{ fontSize: 20 }}>🍽️</Text>
                </View>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <Text style={styles.mealName} numberOfLines={1}>{meal.name}</Text>
                  <Text style={styles.mealTimeText}>{time}</Text>
                  {/* Macro mini bars */}
                  <View style={styles.macroMiniRow}>
                    <View style={[styles.macroMiniBar, { width: "30%", backgroundColor: "#60a5fa" }]} />
                    <View style={[styles.macroMiniBar, { width: "45%", backgroundColor: "#34d399" }]} />
                    <View style={[styles.macroMiniBar, { width: "15%", backgroundColor: "#f472b6" }]} />
                  </View>
                </View>
                <View style={{ alignItems: "flex-end", marginRight: 8 }}>
                  <Text style={styles.mealCalText}>{meal.calories}</Text>
                  <Text style={styles.mealCalUnit}>kcal</Text>
                </View>
                <TouchableOpacity style={styles.trashBtn} activeOpacity={0.7} onPress={() => deleteMeal(meal.id)}>
                  <Text style={{ fontSize: 15, color: "#ef4444" }}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </Animated.View>

        {/* AI COACH PANEL */}
        <Animated.View style={[styles.coachCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.coachHeader}>
            <View style={styles.coachAvatarGlow}>
              <Text style={{ fontSize: 16 }}>🤖</Text>
            </View>
            <Text style={styles.coachTitle}>AI Health Coach</Text>
          </View>
          <Text style={styles.coachRecommendationText}>{coachTip}</Text>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#05050a" },
  scroll: { paddingHorizontal: 16, paddingTop: 30 },

  meshBlob: {
    position: "absolute",
    filter: "blur(60px)",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  greetingText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#7c3aed",
  },

  // Calorie Card
  calorieCard: {
    backgroundColor: "#0d0d18",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    marginBottom: 20,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  calorieCardLayout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
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
  caloriesNumber: {
    fontSize: 40,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
  },
  caloriesTarget: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "600",
  },
  percentText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  pillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "center",
  },
  calorieDetails: {
    flex: 1,
    paddingLeft: 24,
    gap: 16,
  },
  detailLabel: {
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  detailValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginTop: 2,
  },
  detailSub: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.35)",
    fontWeight: "500",
  },
  detailDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  // Actions
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  actionItem: {
    width: (SCREEN_WIDTH - 32) * 0.26,
    aspectRatio: 1.25,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "700",
  },
  actionPrimary: {
    width: (SCREEN_WIDTH - 32) * 0.38,
    aspectRatio: 1.5,
    backgroundColor: "#7c3aed",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  actionPrimaryIcon: {
    fontSize: 22,
  },
  actionPrimaryLabel: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  trendArrow: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },

  // Macros
  macrosContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  miniMacroCard: {
    width: (SCREEN_WIDTH - 32 - 20) / 3,
    backgroundColor: "#0d0d18",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  miniRingLabelBox: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  miniRingPctText: {
    fontSize: 11,
    fontWeight: "900",
  },
  miniRingLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "600",
    marginBottom: 4,
  },
  miniRingVal: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "800",
  },
  miniRingGoal: {
    fontSize: 9,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "600",
    marginTop: 2,
  },

  // Weekly insights
  insightsCard: {
    backgroundColor: "#0d0d18",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    padding: 20,
    marginBottom: 24,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    paddingBottom: 4,
  },
  chartCol: {
    alignItems: "center",
    width: (SCREEN_WIDTH - 72) / 7,
  },
  chartBarTrack: {
    height: 80,
    width: 6,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 3,
    justifyContent: "flex-end",
  },
  chartBarFill: {
    width: "100%",
    borderRadius: 3,
  },
  chartLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    marginTop: 6,
    fontWeight: "600",
  },
  insightsStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  insightStatTitle: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "700",
  },
  insightStatSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    marginTop: 2,
  },

  // Streak
  streakBadge: {
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  streakText: {
    color: "#facc15",
    fontSize: 11,
    fontWeight: "800",
  },

  // Meals List
  mealsList: {
    gap: 10,
    marginBottom: 24,
  },
  mealCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d0d18",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  mealIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  mealName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  mealTimeText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    marginTop: 2,
  },
  macroMiniRow: {
    flexDirection: "row",
    gap: 3,
    marginTop: 6,
    height: 3,
    width: 60,
    borderRadius: 1.5,
    overflow: "hidden",
  },
  macroMiniBar: {
    height: "100%",
  },
  mealCalText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
  },
  mealCalUnit: {
    fontSize: 9,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
  },
  trashBtn: {
    padding: 10,
    marginLeft: 8,
  },

  // Coach Card
  coachCard: {
    backgroundColor: "rgba(124, 58, 237, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.2)",
    borderRadius: 24,
    padding: 18,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  coachHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  coachAvatarGlow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(124, 58, 237, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  coachTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#c084fc",
    letterSpacing: 0.5,
  },
  coachRecommendationText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 20,
    fontWeight: "500",
  },
});
