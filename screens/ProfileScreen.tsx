import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Animated,
  Easing,
} from "react-native";
import { colors, radius, shadow, spacing, typography, ui } from "../components/DesignSystem";
import { PressScale } from "../components/PressScale";

const CARD_BG = colors.panelSolid;
const BORDER = colors.border;

function StatPill({ value, label, color }: { value: string; label: string; color: string }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[s.statPill, { borderColor: color + "33", opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <Text style={[s.statPillNum, { color }]}>{value}</Text>
      <Text style={s.statPillLabel}>{label}</Text>
    </Animated.View>
  );
}

function GoalRow({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={[s.goalRow, { borderLeftColor: accent }]}>
      <Text style={s.goalLabel}>{label}</Text>
      <Text style={[s.goalValue, { color: accent }]}>{value}</Text>
    </View>
  );
}

function PrefRow({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <PressScale style={s.prefRow} onPress={onPress}>
      <Text style={s.prefLabel}>{label}</Text>
      <Text style={s.prefValue}>{value}  ›</Text>
    </PressScale>
  );
}

export default function ProfileScreen() {
  const headerAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const avatarGlow = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0.3] });

  return (
    <SafeAreaView style={s.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View style={[s.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <Text style={s.headerTitle}>Preferences & Goals</Text>
        </Animated.View>

        {/* Overview Hero Card */}
        <View style={s.heroCard}>
          {/* Ambient glow behind activity orb */}
          <Animated.View style={[s.avatarGlowOrb, { opacity: avatarGlow }]} />

          {/* Activity Orb Illustration */}
          <View style={s.illustrationWrapper}>
            <Text style={s.illustrationIcon}>⚡</Text>
          </View>

          <Text style={s.statusText}>STAY CONSISTENT • ACTIVE JOURNEY</Text>

          {/* Stats row */}
          <View style={s.statsRow}>
            <StatPill value="14" label="STREAK" color="#facc15" />
            <StatPill value="47" label="DAYS LOGGED" color="#a855f7" />
            <StatPill value="1,904" label="AVG KCAL" color="#34d399" />
          </View>
        </View>

        {/* Goals & Plan */}
        <Text style={s.sectionLabel}>GOALS & PLAN</Text>
        <View style={s.card}>
          <GoalRow label="Daily Calories" value="2,000 kcal" accent="#a855f7" />
          <GoalRow label="Target Protein" value="150g" accent="#60a5fa" />
          <GoalRow label="Target Carbs" value="200g" accent="#34d399" />
          <GoalRow label="Target Fat" value="65g" accent="#f472b6" />
        </View>

        {/* Achievements strip */}
        <Text style={s.sectionLabel}>ACHIEVEMENTS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.achieveScroll} contentContainerStyle={{ gap: 10, paddingRight: 20 }}>
          {[
            { icon: "14", label: "Day\nStreak", color: colors.amber },
            { icon: "P", label: "Protein\nGoal Hit", color: colors.blue },
            { icon: "5/7", label: "Days\nOn Goal", color: colors.green },
            { icon: "Z", label: "Fat-Burn\nZone", color: colors.pink },
            { icon: "AI", label: "Scan\nPro", color: colors.violet },
          ].map((a, i) => (
            <View key={i} style={[s.achieveCard, { borderColor: a.color + "33" }]}>
              <Text style={[s.achieveGlyph, { color: a.color }]}>{a.icon}</Text>
              <Text style={[s.achieveLabel, { color: a.color }]}>{a.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* App Preferences */}
        <Text style={s.sectionLabel}>APP PREFERENCES</Text>
        <View style={s.card}>
          <PrefRow label="AI Coach Personality" value="Encouraging" />
          <View style={s.prefDivider} />
          <PrefRow label="Notifications" value="Enabled" />
          <View style={s.prefDivider} />
          <PrefRow label="Units" value="Metric (g, kcal)" />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: ui.screen,
  scroll: { paddingHorizontal: spacing.xl, paddingTop: 24, paddingBottom: 40 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { ...typography.hero, fontSize: 32 },

  heroCard: {
    backgroundColor: colors.panelDeep,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 24,
    paddingHorizontal: 22,
    alignItems: "center",
    marginBottom: 20,
    ...shadow.card,
    overflow: "hidden",
  },
  avatarGlowOrb: {
    position: "absolute",
    top: -34,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.purple,
    opacity: 0.06,
  },

  // Illustration orb wrapper
  illustrationWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(124, 58, 237, 0.24)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    position: "relative",
    zIndex: 1,
  },
  illustrationIcon: {
    fontSize: 32,
    color: colors.purple,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: colors.violet,
    textTransform: "uppercase",
    marginBottom: 18,
    zIndex: 1,
  },

  statsRow: { flexDirection: "row", gap: 10, width: "100%" },
  statPill: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.026)",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  statPillNum: { fontSize: 18, fontWeight: "900", letterSpacing: 0 },
  statPillLabel: { fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: "700", letterSpacing: 1, marginTop: 3, textAlign: "center" },

  sectionLabel: { ...typography.sectionLabel, marginBottom: 10, marginTop: 4 },

  card: {
    backgroundColor: colors.panelDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 18,
    overflow: "hidden",
    ...shadow.card,
  },

  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderLeftWidth: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  goalLabel: { fontSize: 14, color: "rgba(255,255,255,0.65)", fontWeight: "600" },
  goalValue: { fontSize: 15, fontWeight: "900", letterSpacing: 0 },

  achieveScroll: { marginBottom: 18 },
  achieveCard: {
    backgroundColor: colors.panelDeep,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 15,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    width: 92,
    minHeight: 92,
  },
  achieveGlyph: { fontSize: 18, marginBottom: 7, fontWeight: "900", letterSpacing: 0 },
  achieveLabel: { fontSize: 10, fontWeight: "700", textAlign: "center", lineHeight: 14 },

  prefRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 15, paddingHorizontal: 18 },
  prefLabel: { fontSize: 14, color: "rgba(255,255,255,0.65)", fontWeight: "600" },
  prefValue: { fontSize: 13, color: "#a855f7", fontWeight: "700" },
  prefDivider: { height: 0.5, backgroundColor: "rgba(255,255,255,0.05)", marginHorizontal: 18 },
});
