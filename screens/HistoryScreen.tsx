import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  Animated,
  Dimensions,
  StyleSheet,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 48;

// ─── Mock Data ───────────────────────────────────────────────────────────────
const WEEKLY_CALORIES = [
  { day: "Mon", value: 1840, goal: 2000 },
  { day: "Tue", value: 2210, goal: 2000 },
  { day: "Wed", value: 1650, goal: 2000 },
  { day: "Thu", value: 1990, goal: 2000 },
  { day: "Fri", value: 2340, goal: 2000 },
  { day: "Sat", value: 1720, goal: 2000 },
  { day: "Sun", value: 1580, goal: 2000 },
];

const WEEKLY_PROTEIN = [
  { day: "Mon", value: 142 },
  { day: "Tue", value: 98 },
  { day: "Wed", value: 165 },
  { day: "Thu", value: 130 },
  { day: "Fri", value: 88 },
  { day: "Sat", value: 155 },
  { day: "Sun", value: 112 },
];

const STREAK = {
  current: 14,
  longest: 21,
  thisWeekDays: [true, true, true, true, true, false, false],
  totalDaysLogged: 47,
  avgCalories: 1904,
};

// ─── Animated Bar ────────────────────────────────────────────────────────────
function AnimatedBar({
  heightPercent,
  color,
  delay,
  maxHeight,
}: {
  heightPercent: number;
  color: string;
  delay: number;
  maxHeight: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 600,
      delay,
      useNativeDriver: false,
    }).start();
  }, []);

  const barHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxHeight * heightPercent],
  });

  return (
    <Animated.View
      style={[
        styles.bar,
        { height: barHeight, backgroundColor: color, borderRadius: 6 },
      ]}
    />
  );
}

// ─── Calorie Chart ───────────────────────────────────────────────────────────
function CalorieChart() {
  const MAX_HEIGHT = 110;
  const maxVal = Math.max(...WEEKLY_CALORIES.map((d) => d.value), 2400);
  const today = new Date().getDay(); // 0=Sun
  const dayIndex = today === 0 ? 6 : today - 1;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Weekly Calories</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>2,000 goal</Text>
        </View>
      </View>

      {/* Goal line label */}
      <View style={{ position: "relative", height: MAX_HEIGHT + 32 }}>
        {/* Goal dashed line */}
        <View
          style={[
            styles.goalLine,
            {
              bottom:
                32 + (WEEKLY_CALORIES[0].goal / maxVal) * MAX_HEIGHT - 0.5,
            },
          ]}
        />
        <Text
          style={[
            styles.goalLabel,
            {
              bottom:
                32 + (WEEKLY_CALORIES[0].goal / maxVal) * MAX_HEIGHT + 3,
            },
          ]}
        >
          goal
        </Text>

        {/* Bars */}
        <View style={styles.barsRow}>
          {WEEKLY_CALORIES.map((d, i) => {
            const isOver = d.value > d.goal;
            const isToday = i === dayIndex;
            const color = isToday
              ? "#facc15"
              : isOver
              ? "#f87171"
              : "#34d399";
            return (
              <View key={d.day} style={styles.barCol}>
                <AnimatedBar
                  heightPercent={d.value / maxVal}
                  color={color}
                  delay={i * 60}
                  maxHeight={MAX_HEIGHT}
                />
                <Text style={[styles.dayLabel, isToday && { color: "#facc15" }]}>
                  {d.day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { color: "#34d399", label: "Under goal" },
          { color: "#f87171", label: "Over goal" },
          { color: "#facc15", label: "Today" },
        ].map((l) => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.color }]} />
            <Text style={styles.legendText}>{l.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Protein Chart (line-style dots) ─────────────────────────────────────────
function ProteinChart() {
  const MAX_HEIGHT = 80;
  const maxVal = Math.max(...WEEKLY_PROTEIN.map((d) => d.value));
  const anims = WEEKLY_PROTEIN.map((_, i) => {
    const a = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.timing(a, {
        toValue: 1,
        duration: 500,
        delay: 300 + i * 70,
        useNativeDriver: false,
      }).start();
    }, []);
    return a;
  });

  const BAR_W = (CHART_WIDTH - 32) / WEEKLY_PROTEIN.length;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Protein Intake</Text>
        <View style={[styles.badge, { backgroundColor: "#1e3a5f" }]}>
          <Text style={[styles.badgeText, { color: "#60a5fa" }]}>
            avg {Math.round(WEEKLY_PROTEIN.reduce((s, d) => s + d.value, 0) / 7)}g
          </Text>
        </View>
      </View>

      <View style={{ height: MAX_HEIGHT + 28, position: "relative" }}>
        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75, 1].map((p) => (
          <View
            key={p}
            style={[styles.gridLine, { bottom: 28 + p * MAX_HEIGHT }]}
          />
        ))}

        {/* Bars */}
        <View style={styles.barsRow}>
          {WEEKLY_PROTEIN.map((d, i) => (
            <View key={d.day} style={styles.barCol}>
              <Animated.View
                style={{
                  height: anims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, (d.value / maxVal) * MAX_HEIGHT],
                  }),
                  width: BAR_W * 0.45,
                  backgroundColor: "#3b82f6",
                  borderRadius: 4,
                  opacity: anims[i].interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0.3, 0.7, 1],
                  }),
                }}
              />
              <Text style={styles.dayLabel}>{d.day}</Text>
            </View>
          ))}
        </View>

        {/* Value labels */}
        <View
          style={[StyleSheet.absoluteFill, { bottom: 28, top: 0 }]}
          pointerEvents="none"
        >
          {WEEKLY_PROTEIN.map((d, i) => (
            <Animated.Text
              key={d.day}
              style={{
                position: "absolute",
                left: i * BAR_W + BAR_W * 0.05,
                bottom: anims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [28, 28 + (d.value / maxVal) * MAX_HEIGHT + 4],
                }),
                fontSize: 9,
                color: "#60a5fa",
                fontWeight: "700",
                width: BAR_W,
                textAlign: "center",
              }}
            >
              {d.value}g
            </Animated.Text>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Streak Card ─────────────────────────────────────────────────────────────
function StreakCard() {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.streakCard,
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
      ]}
    >
      {/* Glow */}
      <View style={styles.streakGlow} />

      <View style={styles.streakTop}>
        <View>
          <Text style={styles.streakLabel}>Current Streak</Text>
          <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
            <Text style={styles.streakNumber}>{STREAK.current}</Text>
            <Text style={styles.streakUnit}> days 🔥</Text>
          </View>
        </View>
        <View style={styles.streakBest}>
          <Text style={styles.streakBestLabel}>Best</Text>
          <Text style={styles.streakBestVal}>{STREAK.longest}d</Text>
        </View>
      </View>

      {/* Week dots */}
      <View style={styles.weekDots}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <View key={i} style={styles.dotCol}>
            <View
              style={[
                styles.dot,
                STREAK.thisWeekDays[i]
                  ? styles.dotActive
                  : styles.dotInactive,
              ]}
            >
              {STREAK.thisWeekDays[i] && (
                <Text style={{ fontSize: 8, color: "#0a0a0a" }}>✓</Text>
              )}
            </View>
            <Text style={styles.dotDay}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Stats row */}
      <View style={styles.streakStats}>
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{STREAK.totalDaysLogged}</Text>
          <Text style={styles.statLbl}>Days Logged</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{STREAK.avgCalories}</Text>
          <Text style={styles.statLbl}>Avg Calories</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statVal}>
            {WEEKLY_CALORIES.filter((d) => d.value <= d.goal).length}/7
          </Text>
          <Text style={styles.statLbl}>On Goal</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerSub}>Weekly Overview</Text>
          <Text style={styles.headerTitle}>History</Text>
        </View>

        <StreakCard />
        <CalorieChart />
        <ProteinChart />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050510" },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24 },

  header: { marginBottom: 24 },
  headerSub: { fontSize: 10, color: "rgba(255, 255, 255, 0.4)", letterSpacing: 2, textTransform: "uppercase", fontWeight: "700" },
  headerTitle: { fontSize: 36, color: "#fff", fontWeight: "800", letterSpacing: -1, marginTop: 2 },

  // Card
  card: {
    backgroundColor: "#0D0D1A",
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(127, 119, 221, 0.18)",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  cardTitle: { fontSize: 15, color: "#e5e7eb", fontWeight: "700", letterSpacing: 0.2 },
  badge: { backgroundColor: "rgba(52, 211, 153, 0.08)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, color: "#34d399", fontWeight: "600" },

  // Bars
  barsRow: { flexDirection: "row", alignItems: "flex-end", position: "absolute", bottom: 0, left: 0, right: 0, height: "100%" },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", paddingBottom: 0 },
  bar: { width: "55%", shadowColor: "#34d399", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  dayLabel: { fontSize: 10, color: "rgba(255, 255, 255, 0.4)", marginTop: 6, fontWeight: "600" },

  // Goal line
  goalLine: { position: "absolute", left: 0, right: 0, height: 1, borderStyle: "dashed", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)" },
  goalLabel: { position: "absolute", right: 0, fontSize: 9, color: "rgba(255, 255, 255, 0.3)", fontWeight: "600" },

  // Grid
  gridLine: { position: "absolute", left: 0, right: 0, height: 0.5, backgroundColor: "rgba(255, 255, 255, 0.05)" },

  // Legend
  legend: { flexDirection: "row", gap: 16, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 10, color: "rgba(255, 255, 255, 0.35)" },

  // Streak card
  streakCard: {
    backgroundColor: "#0D0D1A",
    borderRadius: 22,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.35)",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#facc15",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  streakGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(250, 204, 21, 0.12)",
  },
  streakTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  streakLabel: { fontSize: 10, color: "rgba(255, 255, 255, 0.4)", letterSpacing: 2, textTransform: "uppercase", fontWeight: "700", marginBottom: 4 },
  streakNumber: { fontSize: 56, color: "#facc15", fontWeight: "900", lineHeight: 60 },
  streakUnit: { fontSize: 18, color: "#fbbf24", fontWeight: "700", marginBottom: 8 },
  streakBest: {
    backgroundColor: "rgba(250, 204, 21, 0.08)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.35)",
  },
  streakBestLabel: { fontSize: 10, color: "rgba(255, 255, 255, 0.4)", fontWeight: "600" },
  streakBestVal: { fontSize: 20, color: "#fbbf24", fontWeight: "800", marginTop: 2 },

  // Week dots
  weekDots: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  dotCol: { alignItems: "center", gap: 5 },
  dot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  dotActive: { backgroundColor: "#facc15" },
  dotInactive: { backgroundColor: "rgba(255, 255, 255, 0.05)", borderWidth: 1, borderColor: "rgba(127, 119, 221, 0.18)" },
  dotDay: { fontSize: 9, color: "rgba(255, 255, 255, 0.4)", fontWeight: "700" },

  // Stats
  streakStats: {
    flexDirection: "row",
    backgroundColor: "rgba(127, 119, 221, 0.05)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(127, 119, 221, 0.18)",
  },
  statItem: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 18, color: "#fff", fontWeight: "800" },
  statLbl: { fontSize: 10, color: "rgba(255, 255, 255, 0.4)", marginTop: 2, fontWeight: "500" },
  statDivider: { width: 1, backgroundColor: "rgba(127, 119, 221, 0.15)", marginVertical: 4 },
});
