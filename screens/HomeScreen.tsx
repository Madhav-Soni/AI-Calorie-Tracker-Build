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
  Easing,
} from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { useMealStore } from "../useMealStore";
import { getCoachRecommendation } from "../NutritionCoach";
import { calculateStreaks } from "../streak";
import Reanimated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  interpolateColor,
} from "react-native-reanimated";
import { PressScale } from "../components/PressScale";

const { width: W } = Dimensions.get("window");
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const ReanimatedCircle = Reanimated.createAnimatedComponent(Circle);

const GOAL = { calories: 2000, protein: 150, carbs: 200, fat: 65 };

const MOCK_MEALS = [
  { id: "1", name: "Oats & Banana Bowl", calories: 380, protein: 12, carbs: 68, fat: 6, loggedAt: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: "2", name: "Grilled Salmon Bowl", calories: 542, protein: 38, carbs: 41, fat: 22, loggedAt: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: "3", name: "Greek Yogurt + Berries", calories: 120, protein: 18, carbs: 9, fat: 2, loggedAt: new Date(Date.now() - 1800000).toISOString() },
];
const MOCK_TOTALS = { calories: 1042, protein: 68, carbs: 118, fat: 30 };

const WEEKLY = [1820, 2150, 1680, 1950, 2200, 1450, 1850];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function ring(pct: number, size: number, stroke: number) {
  const r = (size - stroke) / 2;
  return { r, circ: 2 * Math.PI * r };
}

// ─── Macro Pill ────────────────────────────────────────────────────────────────
interface MacroPillProps {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
  anim: Animated.Value;
}

function MacroPill({
  label, value, goal, unit, color, anim,
}: MacroPillProps) {
  const pct = Math.min(1, value / goal);
  const barW = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${pct * 100}%`] });

  return (
    <View style={[s.macroPill, { borderColor: color + "22" }]}>
      <View style={s.macroPillTop}>
        <Text style={[s.macroPillLabel, { color }]}>{label}</Text>
        <Text style={s.macroPillVal}>
          <Text style={s.macroPillNum}>{value}</Text>
          <Text style={s.macroPillGoal}>{`/${goal}${unit}`}</Text>
        </Text>
      </View>
      <View style={s.macroPillTrack}>
        <Animated.View style={[s.macroPillFill, { width: barW, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ─── Meal Row ──────────────────────────────────────────────────────────────────
interface MealRowProps {
  meal: typeof MOCK_MEALS[0];
  onDelete: () => void;
  delay: number;
}

function MealRow({
  meal, onDelete, delay,
}: MealRowProps) {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const widthScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(widthScale, { toValue: 1, duration: 800, delay: delay + 150, useNativeDriver: false }),
    ]).start();
  }, []);

  const time = new Date(meal.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const totalMacros = meal.protein + meal.carbs + meal.fat;
  const pW = totalMacros ? (meal.protein / totalMacros) * 100 : 33;
  const cW = totalMacros ? (meal.carbs / totalMacros) * 100 : 33;
  const fW = totalMacros ? (meal.fat / totalMacros) * 100 : 34;

  const animatedPW = widthScale.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${pW}%`] });
  const animatedCW = widthScale.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${cW}%`] });
  const animatedFW = widthScale.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${fW}%`] });

  const mealEmojis: Record<string, string> = {
    "Oats & Banana Bowl": "🥣",
    "Grilled Salmon Bowl": "🐟",
    "Greek Yogurt + Berries": "🫐",
  };
  const emoji = mealEmojis[meal.name] ?? "🍽️";

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={s.mealRow}>
        <View style={s.mealEmoji}>
          <Text style={{ fontSize: 22 }}>{emoji}</Text>
        </View>
        <View style={s.mealInfo}>
          <Text style={s.mealName} numberOfLines={1}>{meal.name}</Text>
          <Text style={s.mealTime}>{time}</Text>
          {/* macro stripe */}
          <View style={s.stripe}>
            <Animated.View style={[s.stripeP, { width: animatedPW }]} />
            <Animated.View style={[s.stripeC, { width: animatedCW }]} />
            <Animated.View style={[s.stripeF, { width: animatedFW }]} />
          </View>
        </View>
        <View style={s.mealRight}>
          <Text style={s.mealCal}>{meal.calories}</Text>
          <Text style={s.mealCalUnit}>kcal</Text>
        </View>
        <TouchableOpacity onPress={onDelete} style={s.deleteBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.deleteX}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─── Home Screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const storeMeals = useMealStore((s) => s.meals);
  const deleteMeal = useMealStore((s) => s.deleteMeal);
  const getDailyTotals = useMealStore((s) => s.getDailyTotals);

  const meals = storeMeals.length > 0 ? storeMeals : MOCK_MEALS;
  const totals = storeMeals.length > 0 ? getDailyTotals() : MOCK_TOTALS;

  const dates = storeMeals.map((m) => m.loggedAt);
  const streak = storeMeals.length > 0 ? calculateStreaks(dates).current : 14;

  const coachTip = getCoachRecommendation({
    protein: { consumed: totals.protein, goal: GOAL.protein },
    carbs: { consumed: totals.carbs, goal: GOAL.carbs },
    fat: { consumed: totals.fat, goal: GOAL.fat },
  });

  const [greeting, setGreeting] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening");
    setDateStr(new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }));
  }, []);

  const calPct = Math.min(1.15, totals.calories / GOAL.calories);
  const ringColor = calPct < 0.8 ? "#34d399" : calPct <= 1 ? "#f59e0b" : "#ef4444";

  // Reanimated calorie ring
  const RING_SIZE = 210;
  const RING_STROKE = 14;
  const { r: mainR, circ: mainCirc } = ring(calPct, RING_SIZE, RING_STROKE);

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(calPct, { duration: 1200 });
  }, [calPct]);

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: mainCirc * (1 - Math.min(1, progress.value)),
    };
  });

  // Reanimated scan button pulse
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.08, { duration: 900 }), -1, true);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  // Reanimated Coach Card gradient glow pulse
  const coachGlow = useSharedValue(0);
  const coachOpacity = useSharedValue(0);
  useEffect(() => {
    coachGlow.value = withRepeat(withTiming(1, { duration: 2500 }), -1, true);
    coachOpacity.value = withTiming(1, { duration: 700 });
  }, []);

  const coachStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      coachGlow.value,
      [0, 1],
      ["rgba(124, 58, 237, 0.2)", "rgba(236, 72, 153, 0.5)"]
    );
    const shadowColor = interpolateColor(
      coachGlow.value,
      [0, 1],
      ["#7c3aed", "#ec4899"]
    );
    return {
      borderColor,
      shadowColor,
      opacity: coachOpacity.value,
    };
  });

  // Standard Animations
  const pAnim = useRef(new Animated.Value(0)).current;
  const cAnim = useRef(new Animated.Value(0)).current;
  const fAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(pAnim, { toValue: Math.min(1, totals.protein / GOAL.protein), duration: 1200, delay: 200, useNativeDriver: false }),
      Animated.timing(cAnim, { toValue: Math.min(1, totals.carbs / GOAL.carbs), duration: 1200, delay: 300, useNativeDriver: false }),
      Animated.timing(fAnim, { toValue: Math.min(1, totals.fat / GOAL.fat), duration: 1200, delay: 400, useNativeDriver: false }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ])).start();

    // Scan line animation inside camera button
    Animated.loop(Animated.sequence([
      Animated.timing(scanAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
      Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
    ])).start();
  }, []);


  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  const scanY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 30] });

  const todayIdx = ((new Date().getDay() + 6) % 7); // Mon=0
  const maxW = Math.max(...WEEKLY);

  return (
    <SafeAreaView style={s.screen}>
      <StatusBar barStyle="light-content" />

      {/* Ambient background orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View style={[s.orb, { width: 300, height: 300, borderRadius: 150, backgroundColor: "#7c3aed", top: -100, right: -80, opacity: glowOpacity }]} />
        <View style={[s.orb, { width: 220, height: 220, borderRadius: 110, backgroundColor: "#0ea5e9", top: 280, left: -100, opacity: 0.06 }]} />
        <View style={[s.orb, { width: 180, height: 180, borderRadius: 90, backgroundColor: "#10b981", bottom: 200, right: -60, opacity: 0.05 }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── HEADER ── */}
        <Animated.View style={[s.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={s.dateStr}>{dateStr}</Text>
            <Text style={s.greeting}>{`${greeting}, Madhav 👋`}</Text>
          </View>
          <TouchableOpacity
            onPress={() => (navigation as any).navigate("Tabs", { screen: "Profile" })}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256" }}
              style={s.avatar}
            />
            <View style={s.avatarBadge} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── CALORIE RING HERO CARD ── */}
        <Animated.View style={[s.heroCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* subtle grid lines */}
          <View style={s.gridLines} pointerEvents="none">
            {[0, 1, 2, 3].map(i => <View key={i} style={[s.gridLine, { top: i * 50 }]} />)}
          </View>

          <View style={s.heroInner}>
            {/* Ring */}
            <View style={{ width: RING_SIZE, height: RING_SIZE, position: "relative" }}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <Defs>
                  <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor={ringColor} stopOpacity="1" />
                    <Stop offset="100%" stopColor="#a855f7" stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                {/* Track */}
                <Circle
                  cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={mainR}
                  stroke="rgba(255,255,255,0.04)" strokeWidth={RING_STROKE} fill="none"
                />
                {/* Progress */}
                <ReanimatedCircle
                  cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={mainR}
                  stroke={"url(#grad)"} strokeWidth={RING_STROKE} fill="none"
                  strokeDasharray={mainCirc}
                  animatedProps={animatedProps}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                />
              </Svg>

              {/* Center content */}
              <View style={s.ringCenter}>
                <Text style={s.ringCalNum}>{totals.calories.toLocaleString()}</Text>
                <Text style={s.ringCalLabel}>{`of ${GOAL.calories.toLocaleString()} kcal`}</Text>
                <View style={[s.ringBadge, { backgroundColor: ringColor + "22", borderColor: ringColor + "55" }]}>
                  <Text style={[s.ringBadgeText, { color: ringColor }]}>
                    {calPct >= 1 ? "Over Limit" : `${Math.round(calPct * 100)}%`}
                  </Text>
                </View>
              </View>

            </View>

            <View style={s.heroStats}>
              <View style={s.heroStatBlock}>
                <Text style={s.heroStatLabel}>REMAINING</Text>
                <Text style={s.heroStatBig}>{Math.max(0, GOAL.calories - totals.calories).toLocaleString()}</Text>
                <Text style={s.heroStatSub}>kcal left</Text>
              </View>
              <View style={s.heroStatDivider} />
              <View style={s.heroStatBlock}>
                <Text style={s.heroStatLabel}>STATUS</Text>
                <Text style={[s.heroStatBig, { color: "#c084fc", fontSize: 16 }]}>Optimal</Text>
                <Text style={s.heroStatSub}>Fat-burn zone</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── MACROS ── */}
        <Animated.View style={[s.macrosRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <MacroPill label="Protein" value={totals.protein} goal={GOAL.protein} unit="g" color="#60a5fa" anim={pAnim} />
          <MacroPill label="Carbs" value={totals.carbs} goal={GOAL.carbs} unit="g" color="#34d399" anim={cAnim} />
          <MacroPill label="Fat" value={totals.fat} goal={GOAL.fat} unit="g" color="#f472b6" anim={fAnim} />
        </Animated.View>

        {/* ── SCAN MEAL CTA ── */}
        <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }, s.ctaWrap]}>
          <Reanimated.View style={pulseStyle}>
            <PressScale
              style={s.ctaBtn}
              onPress={() => navigation.navigate("Camera")}
            >
              {/* Scan line animation */}
              <View style={s.ctaScanArea}>
                <Animated.View style={[s.ctaScanLine, { transform: [{ translateY: scanY }] }]} />
              </View>
              <Text style={s.ctaIcon}>📷</Text>
              <View style={s.ctaTitleContainer}>
                <Text style={s.ctaTitle}>Scan Meal</Text>
                <Text style={s.ctaSub}>AI identifies food instantly</Text>
              </View>
              <View style={s.ctaArrow}>
                <Text style={s.ctaArrowText}>→</Text>
              </View>
            </PressScale>
          </Reanimated.View>

          {/* Secondary actions */}
          <View style={s.secondaryRow}>
            <PressScale style={s.secondaryBtn}>
              <Text style={s.secondaryIcon}>🎙️</Text>
              <Text style={s.secondaryLabel}>Voice Log</Text>
            </PressScale>
            <PressScale style={s.secondaryBtn}>
              <Text style={s.secondaryIcon}>🏷️</Text>
              <Text style={s.secondaryLabel}>Barcode</Text>
            </PressScale>
            <PressScale style={s.secondaryBtn}>
              <Text style={s.secondaryIcon}>✏️</Text>
              <Text style={s.secondaryLabel}>Manual</Text>
            </PressScale>
          </View>
        </Animated.View>

        {/* ── WEEKLY CHART ── */}
        <Animated.View style={[s.card, { opacity: fadeAnim }]}>
          <View style={s.cardHeader}>
            <Text style={s.sectionTitle}>Weekly Calories</Text>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate("Tabs", { screen: "History" })}
              style={s.streakChip}
            >
              <Text style={s.streakText}>{`🔥 ${streak}d streak`}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.chart}>
            {WEEKLY.map((v, i) => {
              const h = (v / maxW) * 72;
              const isToday = i === todayIdx;
              const isOver = v > GOAL.calories;
              const barColor = isToday ? "#a855f7" : isOver ? "#f87171" : "rgba(255,255,255,0.14)";
              return (
                <View key={i} style={s.chartCol}>
                  <View style={[s.chartBar, { height: h, backgroundColor: barColor, opacity: isToday ? 1 : 0.9 }]}>
                    {isToday && <View style={[s.chartDot, { backgroundColor: "#a855f7" }]} />}
                  </View>
                  <Text style={[s.chartDay, isToday ? { color: "#a855f7", fontWeight: "800" } : null]}>
                    {DAYS[i]}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={s.chartFooter}>
            <Text style={s.chartFooterText}>{`Avg ${Math.round(WEEKLY.reduce((a, b) => a + b, 0) / 7).toLocaleString()} kcal/day`}</Text>
            <View style={s.onTrackBadge}>
              <Text style={s.onTrackText}>✓ On Track</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── TODAY'S MEALS ── */}
        <View style={s.sectionHeaderRow}>
          <Text style={s.sectionTitle}>Today's Meals</Text>
          <Text style={s.sectionCount}>{`${meals.length} logged`}</Text>
        </View>

        {meals.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>🍽️</Text>
            <Text style={s.emptyTitle}>No meals logged yet</Text>
            <Text style={s.emptySub}>Tap Scan Meal above to get started</Text>
          </View>
        ) : (
          <View style={s.mealsList}>
            {meals.map((m, i) => (
              <MealRow
                key={m.id}
                meal={m}
                onDelete={() => deleteMeal(m.id)}
                delay={i * 80}
              />
            ))}
          </View>
        )}

        {/* ── AI COACH ── */}
        <Reanimated.View style={[s.coachCard, coachStyle]}>
          <View style={s.coachRow}>
            <View style={s.coachOrb}>
              <Text style={{ fontSize: 14 }}>🤖</Text>
            </View>
            <View style={s.coachTextWrap}>
              <Text style={s.coachLabel}>AI NUTRITION COACH</Text>
              <Text style={s.coachTip}>{coachTip}</Text>
            </View>
          </View>
        </Reanimated.View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const CARD_BG = "#0D0D1A";
const BORDER = "rgba(127,119,221,0.18)";

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050510" },
  scroll: { paddingHorizontal: 20, paddingTop: 28 },

  orb: { position: "absolute" },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  dateStr: { fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },
  greeting: { fontSize: 26, color: "#fff", fontWeight: "900", letterSpacing: -0.5, marginTop: 3 },
  avatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: "#7c3aed" },
  avatarBadge: { position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: "#34d399", borderWidth: 2, borderColor: "#050510" },

  // Hero card
  heroCard: {
    backgroundColor: CARD_BG,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  gridLines: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  gridLine: { position: "absolute", left: 0, right: 0, height: 0.5, backgroundColor: "rgba(255,255,255,0.025)" },
  heroInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ringCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  ringCalNum: { fontSize: 38, fontWeight: "900", color: "#fff", letterSpacing: -1.5 },
  ringCalLabel: { fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: "600", marginTop: 1 },
  ringBadge: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  ringBadgeText: { fontSize: 10, fontWeight: "800" },

  heroStats: { flex: 1, paddingLeft: 20, gap: 14 },
  heroStatBlock: { gap: 2 },
  heroStatLabel: { fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" },
  heroStatBig: { fontSize: 28, fontWeight: "900", letterSpacing: -1 },
  heroStatSub: { fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: "500" },
  heroStatDivider: { height: 1, backgroundColor: BORDER },

  // Macros
  macrosRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  macroPill: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
  },
  macroPillTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  macroPillLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  macroPillVal: {},
  macroPillNum: { fontSize: 14, color: "#fff", fontWeight: "800" },
  macroPillGoal: { fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: "500" },
  macroPillTrack: { height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" },
  macroPillFill: { height: "100%", borderRadius: 2 },

  // CTA
  ctaWrap: { marginBottom: 14 },
  ctaBtn: {
    backgroundColor: "#7c3aed",
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    overflow: "hidden",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 10,
  },
  ctaScanArea: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    overflow: "hidden",
  },
  ctaScanLine: {
    position: "absolute", left: 0, right: 0, height: 1.5,
    backgroundColor: "rgba(255,255,255,0.15)",
    top: "50%",
  },
  ctaIcon: { fontSize: 28 },
  ctaTitle: { fontSize: 18, color: "#fff", fontWeight: "900", letterSpacing: -0.5 },
  ctaSub: { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  ctaArrow: { marginLeft: "auto", width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  ctaArrowText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  secondaryRow: { flexDirection: "row", gap: 8 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  secondaryIcon: { fontSize: 20 },
  secondaryLabel: { fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: "700" },

  // Card
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },

  // Section headers
  sectionTitle: { fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: "800", textTransform: "uppercase", letterSpacing: 2 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionCount: { fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: "600" },

  // Streak chip
  streakChip: { backgroundColor: "rgba(250,204,21,0.1)", borderWidth: 1, borderColor: "rgba(250,204,21,0.25)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  streakText: { color: "#facc15", fontSize: 11, fontWeight: "800" },

  // Chart
  chart: { flexDirection: "row", alignItems: "flex-end", height: 88, gap: 4, marginBottom: 14, paddingBottom: 16 },
  chartCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", height: "100%" },
  chartBar: { width: "70%", borderRadius: 5, position: "relative", overflow: "visible" },
  chartDot: { position: "absolute", top: -4, alignSelf: "center", width: 6, height: 6, borderRadius: 3 },
  chartDay: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 6, fontWeight: "600" },
  chartFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 12 },
  chartFooterText: { fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: "600" },
  onTrackBadge: { backgroundColor: "rgba(52,211,153,0.1)", borderWidth: 1, borderColor: "rgba(52,211,153,0.25)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  onTrackText: { color: "#34d399", fontSize: 11, fontWeight: "700" },

  // Meals
  mealsList: { gap: 8, marginBottom: 14 },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    gap: 4,
  },
  mealEmoji: { width: 46, height: 46, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center" },
  mealInfo: { flex: 1, paddingHorizontal: 10 },
  mealName: { color: "#fff", fontSize: 14, fontWeight: "800" },
  mealTime: { color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 },
  stripe: { flexDirection: "row", height: 3, width: 64, borderRadius: 2, overflow: "hidden", marginTop: 7, backgroundColor: "rgba(255,255,255,0.05)" },
  stripeP: { height: "100%", backgroundColor: "#60a5fa" },
  stripeC: { height: "100%", backgroundColor: "#34d399" },
  stripeF: { height: "100%", backgroundColor: "#f472b6" },
  mealRight: { alignItems: "flex-end", marginRight: 4 },
  mealCal: { fontSize: 18, fontWeight: "900", color: "#fff" },
  mealCalUnit: { fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: "600" },
  deleteBtn: { padding: 6 },
  deleteX: { fontSize: 13, color: "#ef444488" },

  // Empty
  emptyState: { backgroundColor: CARD_BG, borderRadius: 22, borderWidth: 1, borderColor: BORDER, padding: 32, alignItems: "center", marginBottom: 14 },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: { fontSize: 15, color: "#fff", fontWeight: "800" },
  emptySub: { fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 },

  // Coach
  coachCard: {
    backgroundColor: "rgba(124,58,237,0.07)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.2)",
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  coachRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  coachOrb: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(124,58,237,0.25)", alignItems: "center", justifyContent: "center" },
  coachTextWrap: { flex: 1 },
  coachLabel: { fontSize: 9, color: "#a855f7", fontWeight: "800", letterSpacing: 2, marginBottom: 5 },
  coachTip: { fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 20, fontWeight: "500" },
  ctaTitleContainer: { flex: 1 },
});
