import React, { useEffect, useRef } from "react";
import {
  View, Text, ScrollView, StatusBar, Animated,
  Dimensions, StyleSheet, SafeAreaView, Easing, TouchableOpacity,
} from "react-native";

const { width: W } = Dimensions.get("window");
const CARD_BG = "#0D0D1A";
const BORDER = "rgba(127,119,221,0.18)";

const WEEKLY_CALORIES = [
  { day: "Mon", value: 1840 }, { day: "Tue", value: 2210 },
  { day: "Wed", value: 1650 }, { day: "Thu", value: 1990 },
  { day: "Fri", value: 2340 }, { day: "Sat", value: 1720 },
  { day: "Sun", value: 1580 },
];
const WEEKLY_PROTEIN = [
  { day: "Mon", value: 142 }, { day: "Tue", value: 98 },
  { day: "Wed", value: 165 }, { day: "Thu", value: 130 },
  { day: "Fri", value: 88 },  { day: "Sat", value: 155 },
  { day: "Sun", value: 112 },
];
const GOAL = 2000;
const STREAK = { current: 14, longest: 21, thisWeek: [true,true,true,true,true,false,false], total: 47, avg: 1904 };
const DAYS = ["M","T","W","T","F","S","S"];
const TODAY_IDX = (new Date().getDay() + 6) % 7;

// ── Animated bar ──────────────────────────────────────────────────────────────
function AnimBar({ value, max, goal, delay, isToday }: {
  value: number; max: number; goal: number; delay: number; isToday: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 700, delay,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, []);
  const MAX_H = 88;
  const h = anim.interpolate({ inputRange: [0, 1], outputRange: [0, (value / max) * MAX_H] });
  const color = isToday ? "#a855f7" : value > goal ? "#f87171" : "#34d399";
  return (
    <Animated.View style={{
      height: h, width: "72%", borderRadius: 7, backgroundColor: color,
      shadowColor: color, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isToday ? 0.6 : 0.2, shadowRadius: 6,
    }} />
  );
}

export default function HistoryScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const streakGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(streakGlow, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(streakGlow, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ])).start();
  }, []);

  const glowOpacity = streakGlow.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
  const maxCal = Math.max(...WEEKLY_CALORIES.map(d => d.value));
  const maxPro = Math.max(...WEEKLY_PROTEIN.map(d => d.value));
  const avgCal = Math.round(WEEKLY_CALORIES.reduce((a, b) => a + b.value, 0) / 7);

  return (
    <SafeAreaView style={s.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={s.pageTitle}>History</Text>

          {/* ── Streak Card ── */}
          <Animated.View style={[s.streakCard, { shadowOpacity: glowOpacity as any }]}>
            {/* Gold glow orb */}
            <Animated.View style={[s.streakOrb, { opacity: glowOpacity }]} />

            <View style={s.streakHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.streakSublabel}>CURRENT STREAK</Text>
                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
                  <Text style={s.streakNum}>{STREAK.current}</Text>
                  <Text style={s.streakDays}>days 🔥</Text>
                </View>
              </View>
              <View style={s.streakBest}>
                <Text style={s.streakBestLabel}>Best</Text>
                <Text style={s.streakBestNum}>{STREAK.longest}d</Text>
              </View>
            </View>

            {/* Week dots */}
            <View style={s.weekDots}>
              {STREAK.thisWeek.map((done, i) => (
                <View key={i} style={s.weekDotWrap}>
                  <View style={[s.weekDot, done ? s.weekDotActive : s.weekDotInactive,
                    i === TODAY_IDX && done && s.weekDotToday]}>
                    {done && <Text style={{ fontSize: 9, color: "#050510" }}>✓</Text>}
                  </View>
                  <Text style={[s.weekDotLabel, done && { color: "#facc15" }]}>{DAYS[i]}</Text>
                </View>
              ))}
            </View>

            {/* Stats strip */}
            <View style={s.statsStrip}>
              <View style={s.statItem}>
                <Text style={s.statNum}>{STREAK.total}</Text>
                <Text style={s.statLabel}>Days Logged</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statNum}>{STREAK.avg.toLocaleString()}</Text>
                <Text style={s.statLabel}>Avg Calories</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statNum}>5/7</Text>
                <Text style={s.statLabel}>On Goal</Text>
              </View>
            </View>
          </Animated.View>

          {/* ── Weekly Calories Chart ── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Weekly Calories</Text>
              <View style={s.goalChip}>
                <Text style={s.goalChipText}>{GOAL.toLocaleString()} goal</Text>
              </View>
            </View>

            {/* Goal line label */}
            <View style={s.chartWrap}>
              <View style={s.goalLineWrap} pointerEvents="none">
                <View style={s.goalLine} />
                <Text style={s.goalLineLabel}>goal</Text>
              </View>

              <View style={s.chartBars}>
                {WEEKLY_CALORIES.map((d, i) => (
                  <View key={i} style={s.barCol}>
                    <AnimBar value={d.value} max={maxCal} goal={GOAL} delay={i * 60} isToday={i === TODAY_IDX} />
                    <Text style={[s.barDay, i === TODAY_IDX && s.barDayToday]}>{d.day.charAt(0)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={s.chartLegend}>
              <View style={s.legendRow}>
                <View style={[s.legendDot, { backgroundColor: "#34d399" }]} /><Text style={s.legendText}>Under goal</Text>
              </View>
              <View style={s.legendRow}>
                <View style={[s.legendDot, { backgroundColor: "#f87171" }]} /><Text style={s.legendText}>Over goal</Text>
              </View>
              <View style={s.legendRow}>
                <View style={[s.legendDot, { backgroundColor: "#a855f7" }]} /><Text style={s.legendText}>Today</Text>
              </View>
            </View>

            <View style={s.chartFooter}>
              <Text style={s.chartFooterAvg}>Avg {avgCal.toLocaleString()} kcal/day</Text>
              <View style={s.onTrackBadge}>
                <Text style={s.onTrackText}>✓ On Track</Text>
              </View>
            </View>
          </View>

          {/* ── Protein Intake Chart ── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>Protein Intake</Text>
              <View style={[s.goalChip, { borderColor: "rgba(52,211,153,0.3)", backgroundColor: "rgba(52,211,153,0.08)" }]}>
                <Text style={[s.goalChipText, { color: "#34d399" }]}>
                  avg {Math.round(WEEKLY_PROTEIN.reduce((a,b)=>a+b.value,0)/7)}g
                </Text>
              </View>
            </View>

            <View style={s.chartBars}>
              {WEEKLY_PROTEIN.map((d, i) => {
                const anim = useRef(new Animated.Value(0)).current;
                useEffect(() => {
                  Animated.timing(anim, { toValue: 1, duration: 700, delay: 300 + i * 60, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
                }, []);
                const MAX_H = 80;
                const barH = anim.interpolate({ inputRange: [0, 1], outputRange: [0, (d.value / maxPro) * MAX_H] });
                return (
                  <View key={i} style={[s.barCol, { height: MAX_H + 20 }]}>
                    <Animated.View style={{ height: barH, width: "72%", borderRadius: 7, backgroundColor: "#34d399", opacity: 0.85 }} />
                    <Text style={s.barDay}>{d.day.charAt(0)}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Macro Split ── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Today's Macro Split</Text>
            <View style={s.macroSplit}>
              {[
                { label: "Protein", value: 68, goal: 150, color: "#60a5fa", pct: 45 },
                { label: "Carbs",   value: 118, goal: 200, color: "#34d399", pct: 59 },
                { label: "Fat",     value: 30,  goal: 65,  color: "#f472b6", pct: 46 },
              ].map((m) => {
                const anim = useRef(new Animated.Value(0)).current;
                useEffect(() => {
                  Animated.timing(anim, { toValue: 1, duration: 900, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
                }, []);
                const w = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${m.pct}%`] });
                return (
                  <View key={m.label} style={s.macroSplitRow}>
                    <Text style={s.macroSplitLabel}>{m.label}</Text>
                    <View style={s.macroSplitTrack}>
                      <Animated.View style={{ width: w, height: "100%", backgroundColor: m.color, borderRadius: 4 }} />
                    </View>
                    <Text style={[s.macroSplitVal, { color: m.color }]}>{m.value}<Text style={s.macroSplitGoal}>/{m.goal}g</Text></Text>
                  </View>
                );
              })}
            </View>
          </View>

        </Animated.View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050510" },
  scroll: { paddingHorizontal: 20, paddingTop: 28 },
  pageTitle: { fontSize: 36, color: "#fff", fontWeight: "900", letterSpacing: -1, marginBottom: 20 },

  // Streak
  streakCard: {
    backgroundColor: "#110D00",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(250,204,21,0.3)",
    padding: 22,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#facc15",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 10,
  },
  streakOrb: { position: "absolute", top: -60, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "#facc15", opacity: 0.04 },
  streakHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  streakSublabel: { fontSize: 9, color: "rgba(250,204,21,0.5)", fontWeight: "800", letterSpacing: 2, marginBottom: 4 },
  streakNum: { fontSize: 52, color: "#facc15", fontWeight: "900", letterSpacing: -2, lineHeight: 54 },
  streakDays: { fontSize: 18, color: "rgba(255,255,255,0.6)", fontWeight: "700", paddingBottom: 8 },
  streakBest: { backgroundColor: "rgba(250,204,21,0.1)", borderWidth: 1, borderColor: "rgba(250,204,21,0.25)", borderRadius: 14, padding: 12, alignItems: "center" },
  streakBestLabel: { fontSize: 9, color: "rgba(250,204,21,0.55)", fontWeight: "700", letterSpacing: 1 },
  streakBestNum: { fontSize: 20, color: "#facc15", fontWeight: "900" },

  weekDots: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  weekDotWrap: { alignItems: "center", gap: 5 },
  weekDot: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  weekDotActive: { backgroundColor: "#facc15" },
  weekDotInactive: { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  weekDotToday: { shadowColor: "#facc15", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8 },
  weekDotLabel: { fontSize: 10, color: "rgba(255,255,255,0.25)", fontWeight: "700" },

  statsStrip: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 14 },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 18, color: "#fff", fontWeight: "900" },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: "600", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.07)" },

  // Card
  card: { backgroundColor: CARD_BG, borderRadius: 22, borderWidth: 1, borderColor: BORDER, padding: 18, marginBottom: 14 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  cardTitle: { fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: "800", letterSpacing: 2, textTransform: "uppercase" },
  goalChip: { backgroundColor: "rgba(168,85,247,0.1)", borderWidth: 1, borderColor: "rgba(168,85,247,0.25)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  goalChipText: { color: "#a855f7", fontSize: 11, fontWeight: "800" },

  // Chart
  chartWrap: { position: "relative", height: 108, marginBottom: 12 },
  goalLineWrap: { position: "absolute", top: 8, left: 0, right: 0, flexDirection: "row", alignItems: "center" },
  goalLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  goalLineLabel: { fontSize: 9, color: "rgba(255,255,255,0.2)", marginLeft: 6, fontWeight: "600" },
  chartBars: { flexDirection: "row", alignItems: "flex-end", height: 108, gap: 4 },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", height: 108 },
  barDay: { fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 6, fontWeight: "600" },
  barDayToday: { color: "#a855f7", fontWeight: "900" },

  chartLegend: { flexDirection: "row", gap: 14, marginBottom: 12 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: "600" },

  chartFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 0.5, borderTopColor: BORDER, paddingTop: 12 },
  chartFooterText: { fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: "600" },
  chartFooterAvg: { fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: "600" },
  onTrackBadge: { backgroundColor: "rgba(52,211,153,0.1)", borderWidth: 1, borderColor: "rgba(52,211,153,0.25)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  onTrackText: { color: "#34d399", fontSize: 11, fontWeight: "700" },

  // Macro split
  macroSplit: { gap: 12, marginTop: 10 },
  macroSplitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  macroSplitLabel: { width: 52, fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: "700" },
  macroSplitTrack: { flex: 1, height: 8, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" },
  macroSplitVal: { width: 60, fontSize: 12, fontWeight: "900", textAlign: "right" },
  macroSplitGoal: { fontSize: 10, color: "rgba(255,255,255,0.25)", fontWeight: "500" },
});
