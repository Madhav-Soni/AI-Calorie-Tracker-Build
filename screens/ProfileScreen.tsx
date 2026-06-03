import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Easing,
} from "react-native";

const CARD_BG = "#0D0D1A";
const BORDER = "rgba(127,119,221,0.18)";

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
    <TouchableOpacity style={s.prefRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={s.prefLabel}>{label}</Text>
      <Text style={s.prefValue}>{value} ›</Text>
    </TouchableOpacity>
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

  const avatarGlow = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <SafeAreaView style={s.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View style={[s.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <Text style={s.headerTitle}>Profile</Text>
          <TouchableOpacity style={s.settingsBtn} activeOpacity={0.7}>
            <Text style={{ fontSize: 18 }}>⚙️</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Profile Hero Card */}
        <View style={s.heroCard}>
          {/* Ambient glow behind avatar */}
          <Animated.View style={[s.avatarGlowOrb, { opacity: avatarGlow }]} />

          {/* Double ring avatar */}
          <View style={s.avatarOuterRing}>
            <View style={s.avatarInnerRing}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256" }}
                style={s.avatar}
              />
            </View>
          </View>
          <View style={s.onlineDot} />

          <Text style={s.name}>Madhav Soni</Text>
          <Text style={s.username}>@madhavsoni</Text>

          <View style={s.premiumBadge}>
            <Text style={s.premiumText}>👑  PREMIUM MEMBER</Text>
          </View>

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
            { icon: "🔥", label: "14 Day\nStreak", color: "#facc15" },
            { icon: "💪", label: "Protein\nGoal Hit", color: "#60a5fa" },
            { icon: "🎯", label: "5/7 Days\nOn Goal", color: "#34d399" },
            { icon: "🧬", label: "Fat-Burn\nZone", color: "#f472b6" },
            { icon: "⚡", label: "AI Scan\nPro", color: "#a855f7" },
          ].map((a, i) => (
            <View key={i} style={[s.achieveCard, { borderColor: a.color + "33" }]}>
              <Text style={{ fontSize: 24, marginBottom: 6 }}>{a.icon}</Text>
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

        <TouchableOpacity style={s.logoutBtn} activeOpacity={0.7}>
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050510" },
  scroll: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  headerTitle: { fontSize: 36, color: "#fff", fontWeight: "900", letterSpacing: -1 },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, alignItems: "center", justifyContent: "center" },

  heroCard: {
    backgroundColor: CARD_BG,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 28,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
    overflow: "hidden",
  },
  avatarGlowOrb: {
    position: "absolute",
    top: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#7c3aed",
    opacity: 0.06,
  },

  // Double ring avatar
  avatarOuterRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    borderColor: "#7c3aed",
    padding: 4,
    marginBottom: 14,
  },
  avatarInnerRing: {
    flex: 1,
    borderRadius: 44,
    borderWidth: 1.5,
    borderColor: "rgba(168,85,247,0.35)",
    overflow: "hidden",
  },
  avatar: { width: "100%", height: "100%", borderRadius: 42 },
  onlineDot: { position: "absolute", top: 90, left: "50%", marginLeft: 22, width: 13, height: 13, borderRadius: 7, backgroundColor: "#34d399", borderWidth: 2.5, borderColor: "#050510" },

  name: { fontSize: 22, color: "#fff", fontWeight: "900", letterSpacing: -0.5 },
  username: { fontSize: 13, color: "rgba(255, 255, 255, 0.35)", marginTop: 3, marginBottom: 14 },

  premiumBadge: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.3)",
    backgroundColor: "rgba(250,204,21,0.07)",
    marginBottom: 20,
  },
  premiumText: { fontSize: 11, color: "#facc15", fontWeight: "800", letterSpacing: 1.5 },

  statsRow: { flexDirection: "row", gap: 10, width: "100%" },
  statPill: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
  },
  statPillNum: { fontSize: 18, fontWeight: "900", letterSpacing: -0.5 },
  statPillLabel: { fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: "700", letterSpacing: 1, marginTop: 3, textAlign: "center" },

  sectionLabel: { fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: "800", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, marginTop: 4 },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 20,
    overflow: "hidden",
  },

  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderLeftWidth: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  goalLabel: { fontSize: 14, color: "rgba(255,255,255,0.65)", fontWeight: "600" },
  goalValue: { fontSize: 15, fontWeight: "900", letterSpacing: -0.3 },

  achieveScroll: { marginBottom: 20 },
  achieveCard: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    width: 90,
  },
  achieveLabel: { fontSize: 10, fontWeight: "700", textAlign: "center", lineHeight: 14 },

  prefRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, paddingHorizontal: 18 },
  prefLabel: { fontSize: 14, color: "rgba(255,255,255,0.65)", fontWeight: "600" },
  prefValue: { fontSize: 13, color: "#a855f7", fontWeight: "700" },
  prefDivider: { height: 0.5, backgroundColor: "rgba(255,255,255,0.05)", marginHorizontal: 18 },

  logoutBtn: {
    marginTop: 4,
    paddingVertical: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    backgroundColor: "rgba(239,68,68,0.05)",
    alignItems: "center",
  },
  logoutText: { color: "#ef4444", fontSize: 14, fontWeight: "800", letterSpacing: 0.5 },
});
