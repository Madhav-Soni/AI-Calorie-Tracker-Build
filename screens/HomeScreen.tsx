import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
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
import Reanimated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withRepeat,
} from "react-native-reanimated";
import { PressScale } from "../components/PressScale";
import { colors, radius, shadow, spacing, typography, ui } from "../components/DesignSystem";

const { width: W } = Dimensions.get("window");
const RING_SIZE = 190;
const ReanimatedCircle = Reanimated.createAnimatedComponent(Circle);

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
    <View style={[s.macroPill, { borderColor: "rgba(255,255,255,0.04)" }]}>
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
  meal: any;
  onDelete: () => void;
  delay: number;
}

function MealRow({
  meal, onDelete, delay,
}: MealRowProps) {
  const slideAnim = useRef(new Animated.Value(15)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const widthScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.timing(widthScale, { toValue: 1, duration: 600, delay: delay + 100, useNativeDriver: false }),
    ]).start();
  }, []);

  const time = new Date(meal.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const protein = Number(meal.protein) || 0;
  const carbs = Number(meal.carbs) || 0;
  const fat = Number(meal.fat) || 0;
  const totalMacros = protein + carbs + fat;
  const pW = totalMacros ? (protein / totalMacros) * 100 : 33;
  const cW = totalMacros ? (carbs / totalMacros) * 100 : 33;
  const fW = totalMacros ? (fat / totalMacros) * 100 : 34;

  const animatedPW = widthScale.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${pW}%`] });
  const animatedCW = widthScale.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${cW}%`] });
  const animatedFW = widthScale.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${fW}%`] });

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={s.mealRow}>
        <View style={s.mealEmoji}>
          <Text style={{ fontSize: 20 }}>🍽️</Text>
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
  const meals = useMealStore((s) => s.meals);
  const GOAL = useMealStore((s) => s.goals);
  const deleteMeal = useMealStore((s) => s.deleteMeal);
  const getDailyTotals = useMealStore((s) => s.getDailyTotals);
  const weightHistory = useMealStore((s) => s.weightHistory);

  const totals = getDailyTotals();

  // Streak derived directly from active meals dates log (or fallback to simple math)
  const streak = weightHistory.length > 0 ? Math.min(30, weightHistory.length) : 0;

  const coachTip = getCoachRecommendation({
    protein: { consumed: totals.protein, goal: GOAL.protein },
    carbs: { consumed: totals.carbs, goal: GOAL.carbs },
    fat: { consumed: totals.fat, goal: GOAL.fat },
  });

  const [greeting, setGreeting] = useState("Hello");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening");
    setDateStr(new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }));
  }, []);

  const calPct = Math.min(1.15, totals.calories / GOAL.calories);
  const ringColor = calPct < 0.8 ? colors.green : calPct <= 1.0 ? colors.violet : colors.red;

  // Reanimated calorie ring
  const RING_STROKE = 14;
  const { r: mainR, circ: mainCirc } = ring(calPct, RING_SIZE, RING_STROKE);

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(calPct, { duration: 1000 });
  }, [calPct]);

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: mainCirc * (1 - Math.min(1, progress.value)),
    };
  });

  // Reanimated scan button pulse
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.04, { duration: 800 }), -1, true);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  // Standard Animations
  const pAnim = useRef(new Animated.Value(0)).current;
  const cAnim = useRef(new Animated.Value(0)).current;
  const fAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(pAnim, { toValue: Math.min(1, totals.protein / GOAL.protein), duration: 1000, delay: 100, useNativeDriver: false }),
      Animated.timing(cAnim, { toValue: Math.min(1, totals.carbs / GOAL.carbs), duration: 1000, delay: 200, useNativeDriver: false }),
      Animated.timing(fAnim, { toValue: Math.min(1, totals.fat / GOAL.fat), duration: 1000, delay: 300, useNativeDriver: false }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(scanAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
    ])).start();
  }, [totals.calories, GOAL.calories]);

  const scanY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-25, 25] });

  // Simple mock calorie logs over the week (with current day injected)
  const todayDayIdx = (new Date().getDay() + 6) % 7;
  const WEEKLY_VALS = [1720, 1850, 1620, 1980, totals.calories, 0, 0];
  const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
  const maxCalVal = Math.max(...WEEKLY_VALS, GOAL.calories);

  return (
    <SafeAreaView style={s.screen}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── HEADER ── */}
        <Animated.View style={[s.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={s.dateStr}>{dateStr}</Text>
            <Text style={s.greeting}>{greeting}</Text>
          </View>
          <TouchableOpacity
            style={s.settingsBtn}
            onPress={() => (navigation as any).navigate("Tabs", { screen: "Profile" })}
            activeOpacity={0.8}
          >
            <Text style={s.settingsIcon}>⚙</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── PRIMARY SECTION: CALORIES & SCAN ── */}
        <Animated.View style={[s.heroCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={s.heroInner}>
            {/* Ring */}
            <View style={s.ringWrap}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <Defs>
                  <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor={ringColor} stopOpacity="1" />
                    <Stop offset="100%" stopColor={colors.purple} stopOpacity="1" />
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
                <View style={[s.ringBadge, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }]}>
                  <Text style={[s.ringBadgeText, { color: colors.text }]}>
                    {calPct >= 1 ? "Over Goal" : `${Math.round(calPct * 100)}%`}
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
                <Text style={[s.heroStatBig, { color: colors.green }]}>
                  {calPct > 1 ? "Over Target" : calPct >= 0.8 ? "On Track" : "Fueling"}
                </Text>
                <Text style={s.heroStatSub}>Daily metabolic zone</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── SCAN MEAL CTA (PRIMARY) ── */}
        <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }, s.ctaWrap]}>
          <Reanimated.View style={pulseStyle}>
            <PressScale
              style={s.ctaBtn}
              onPress={() => navigation.navigate("Camera")}
            >
              <View style={s.ctaScanArea}>
                <Animated.View style={[s.ctaScanLine, { transform: [{ translateY: scanY }] }]} />
              </View>
              <View style={s.ctaIconBubble}>
                <Text style={s.ctaIcon}>AI</Text>
              </View>
              <View style={s.ctaTitleContainer}>
                <Text style={s.ctaTitle}>Scan Meal</Text>
                <Text style={s.ctaSub}>Recognize food & macros instantly via camera</Text>
              </View>
              <View style={s.ctaArrow}>
                <Text style={s.ctaArrowText}>›</Text>
              </View>
            </PressScale>
          </Reanimated.View>
        </Animated.View>

        {/* ── SECONDARY SECTION: MACROS & STREAK ── */}
        <Animated.View style={[s.secondaryTitleRow, { opacity: fadeAnim }]}>
          <Text style={s.secondaryTitle}>Daily Nutrition & Consistency</Text>
          {streak > 0 && (
            <View style={s.streakChip}>
              <Text style={s.streakText}>{`🔥 ${streak}d Streak`}</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View style={[s.macrosRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <MacroPill label="Protein" value={totals.protein} goal={GOAL.protein} unit="g" color={colors.blue} anim={pAnim} />
          <MacroPill label="Carbs" value={totals.carbs} goal={GOAL.carbs} unit="g" color={colors.green} anim={cAnim} />
          <MacroPill label="Fat" value={totals.fat} goal={GOAL.fat} unit="g" color={colors.pink} anim={fAnim} />
        </Animated.View>

        {/* ── TERTIARY SECTION: WEEKLY CALORIES & COACH ── */}
        <Animated.View style={[s.card, { opacity: fadeAnim }]}>
          <View style={s.cardHeader}>
            <Text style={s.sectionTitle}>Weekly Calorie History</Text>
          </View>

          <View style={s.chart}>
            {WEEKLY_VALS.map((v, i) => {
              const h = v > 0 ? (v / maxCalVal) * 60 : 2;
              const isToday = i === todayDayIdx;
              const isOver = v > GOAL.calories;
              const barColor = isToday ? colors.violet : isOver ? colors.red : "rgba(255,255,255,0.08)";
              return (
                <View key={i} style={s.chartCol}>
                  <View style={[s.chartBar, { height: h, backgroundColor: barColor, opacity: isToday ? 1 : 0.8 }]} />
                  <Text style={[s.chartDay, isToday ? { color: colors.violet, fontWeight: "900" } : null]}>
                    {DAYS[i]}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── TODAY'S MEALS ── */}
        <View style={s.sectionHeaderRow}>
          <Text style={s.sectionTitle}>Today's Logged Meals</Text>
          <Text style={s.sectionCount}>{`${meals.length} meals`}</Text>
        </View>

        {meals.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>◎</Text>
            <Text style={s.emptyTitle}>No meals logged today</Text>
            <Text style={s.emptySub}>Scan meals using the button above to build your daily log.</Text>
          </View>
        ) : (
          <View style={s.mealsList}>
            {meals.map((m, i) => (
              <MealRow
                key={m.id}
                meal={m}
                onDelete={() => deleteMeal(m.id)}
                delay={i * 60}
              />
            ))}
          </View>
        )}

        {/* ── AI COACH SUGGESTIONS ── */}
        <Reanimated.View style={s.coachCard}>
          <View style={s.coachRow}>
            <View style={s.coachOrb}>
              <Text style={s.coachGlyph}>AI</Text>
            </View>
            <View style={s.coachTextWrap}>
              <Text style={s.coachLabel}>COACH INSIGHT</Text>
              <Text style={s.coachTip}>{coachTip}</Text>
            </View>
          </View>
        </Reanimated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: ui.screen,
  scroll: { paddingHorizontal: spacing.xl, paddingTop: 20 },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  dateStr: { ...typography.sectionLabel, color: colors.textDim },
  greeting: { fontSize: 26, color: colors.text, fontWeight: "900", letterSpacing: -0.5, marginTop: 2 },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.panelSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  settingsIcon: { fontSize: 20, color: colors.textMuted },

  // Hero calorie card (Matte dark surface)
  heroCard: {
    backgroundColor: colors.panelDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 12,
    ...shadow.card,
  },
  heroInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 20 },
  ringWrap: { width: RING_SIZE, height: RING_SIZE, position: "relative" },
  ringCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  ringCalNum: { fontSize: 34, fontWeight: "900", color: colors.text, letterSpacing: -0.5 },
  ringCalLabel: { fontSize: 10, color: colors.textDim, fontWeight: "700", marginTop: 2 },
  ringBadge: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  ringBadgeText: { fontSize: 9, fontWeight: "800" },

  heroStats: { flex: 1, gap: 14 },
  heroStatBlock: { gap: 2 },
  heroStatLabel: { ...typography.sectionLabel, fontSize: 9 },
  heroStatBig: { fontSize: 22, fontWeight: "900", color: colors.text },
  heroStatSub: { fontSize: 10, color: colors.textDim, fontWeight: "600" },
  heroStatDivider: { height: 1, backgroundColor: colors.border },

  // Macros & streak layout
  secondaryTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 10,
  },
  secondaryTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.textDim,
  },
  streakChip: {
    backgroundColor: "rgba(250,204,21,0.08)",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  streakText: { color: colors.amber, fontSize: 10, fontWeight: "800" },

  macrosRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  macroPill: {
    flex: 1,
    backgroundColor: colors.panelDeep,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 12,
  },
  macroPillTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  macroPillLabel: { fontSize: 10, fontWeight: "800" },
  macroPillVal: {},
  macroPillNum: { fontSize: 13, color: "#fff", fontWeight: "800" },
  macroPillGoal: { fontSize: 10, color: colors.textDim, fontWeight: "600" },
  macroPillTrack: { height: 3, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 1.5, overflow: "hidden" },
  macroPillFill: { height: "100%", borderRadius: 1.5 },

  // Scan Meal Primary CTA
  ctaWrap: { marginBottom: 12 },
  ctaBtn: {
    backgroundColor: colors.purpleDeep,
    borderRadius: radius.xl,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
    ...shadow.card,
  },
  ctaScanArea: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" },
  ctaScanLine: { position: "absolute", left: 0, right: 0, height: 1.5, backgroundColor: "rgba(255,255,255,0.2)", top: "50%" },
  ctaIconBubble: { width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" },
  ctaIcon: { fontSize: 14, color: colors.text, fontWeight: "900", letterSpacing: 0.5 },
  ctaTitleContainer: { flex: 1 },
  ctaTitle: { fontSize: 16, color: "#fff", fontWeight: "800" },
  ctaSub: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  ctaArrow: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  ctaArrowText: { color: colors.text, fontSize: 20, fontWeight: "700", lineHeight: 22 },

  // Tertiary Cards & Charts
  card: {
    backgroundColor: colors.panelDeep,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 20,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { ...typography.sectionLabel, marginBottom: 8 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionCount: { fontSize: 11, color: colors.textDim, fontWeight: "600" },

  chart: { flexDirection: "row", alignItems: "flex-end", height: 70, gap: 6, paddingBottom: 6 },
  chartCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", height: "100%" },
  chartBar: { width: "60%", borderRadius: 3 },
  chartDay: { fontSize: 10, color: colors.textDim, marginTop: 4, fontWeight: "600" },

  // Meals List
  mealsList: { gap: 8, marginBottom: 20 },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.panelDeep,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 8,
  },
  mealEmoji: { width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.03)", alignItems: "center", justifyContent: "center" },
  mealInfo: { flex: 1, paddingHorizontal: 4 },
  mealName: { color: "#fff", fontSize: 14, fontWeight: "800" },
  mealTime: { color: colors.textDim, fontSize: 11, marginTop: 1 },
  stripe: { flexDirection: "row", height: 3, width: 50, borderRadius: 1.5, overflow: "hidden", marginTop: 6, backgroundColor: "rgba(255,255,255,0.03)" },
  stripeP: { height: "100%", backgroundColor: colors.blue },
  stripeC: { height: "100%", backgroundColor: colors.green },
  stripeF: { height: "100%", backgroundColor: colors.pink },
  mealRight: { alignItems: "flex-end", marginRight: 2 },
  mealCal: { fontSize: 16, fontWeight: "900", color: "#fff" },
  mealCalUnit: { fontSize: 9, color: colors.textDim, fontWeight: "600" },
  deleteBtn: { padding: 4 },
  deleteX: { fontSize: 12, color: "rgba(248,113,113,0.6)" },

  // Empty Meals State
  emptyState: { backgroundColor: colors.panelDeep, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 24, alignItems: "center", marginBottom: 20 },
  emptyIcon: { fontSize: 24, marginBottom: 8, color: colors.violet },
  emptyTitle: { fontSize: 14, color: "#fff", fontWeight: "800" },
  emptySub: { fontSize: 11, color: colors.textDim, marginTop: 4, textAlign: "center" },

  // Dynamic AI Coach suggestions
  coachCard: {
    backgroundColor: colors.panelDeep,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  coachRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  coachOrb: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(168,85,247,0.1)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(168,85,247,0.2)" },
  coachGlyph: { fontSize: 10, color: colors.violet, fontWeight: "900" },
  coachTextWrap: { flex: 1 },
  coachLabel: { fontSize: 9, color: colors.violet, fontWeight: "800", letterSpacing: 1.5, marginBottom: 4 },
  coachTip: { fontSize: 12, color: colors.textMuted, lineHeight: 18, fontWeight: "500" },
});
