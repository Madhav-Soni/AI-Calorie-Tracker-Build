import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Animated,
  Easing,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, shadow, spacing, typography, ui } from "../components/DesignSystem";
import { PressScale } from "../components/PressScale";
import { useUserProfileStore } from '../store/userProfileStore';
import { useAuth } from '../contexts/AuthContext';
import { useMealStore } from "../useMealStore";

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

function PrefRow({ label, value, onPress, isDestructive = false }: { label: string; value: string; onPress?: () => void; isDestructive?: boolean }) {
  return (
    <PressScale style={s.prefRow} onPress={onPress}>
      <Text style={[s.prefLabel, isDestructive ? { color: colors.red } : null]}>{label}</Text>
      <Text style={[s.prefValue, isDestructive ? { color: colors.red } : null]}>{value}  ›</Text>
    </PressScale>
  );
}

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const profile = useUserProfileStore((s) => s.profile);
  const loading = useUserProfileStore((s) => s.loading);
  
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

  // Fetch profile on mount
  useEffect(() => {
    if (user) {
      const unsubscribe = useUserProfileStore.getState().subscribeToProfile(user.uid);
      return () => unsubscribe();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e: any) {
      console.error("Logout Error:", e);
    }
  };

  const activityLevelLabel = profile?.activityLevel
    ? profile.activityLevel.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Not Set";

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
          <Animated.View style={[s.avatarGlowOrb, { opacity: avatarGlow }]} />

          <View style={s.illustrationWrapper}>
            <Text style={s.illustrationIcon}>⚡</Text>
          </View>

          <Text style={s.statusText}>
            {profile?.goal
              ? `${profile.goal.replace("_", " ").toUpperCase()} • ACTIVE JOURNEY`
              : "YOUR FITNESS JOURNEY"}
          </Text>

          {/* Stats row */}
          <View style={s.statsRow}>
            <StatPill value="0" label="STREAK" color={colors.amber} />
            <StatPill value="0" label="DAYS LOGGED" color={colors.purple} />
            <StatPill value={profile?.weight?.toString() || "--"} label="WEIGHT (KG)" color={colors.green} />
          </View>
        </View>

        {/* Goals & Plan */}
        <Text style={s.sectionLabel}>GOALS & PLAN</Text>
        <View style={s.card}>
          <GoalRow label="Daily Calories" value={`${profile?.calorieTarget?.toLocaleString() || '0'} kcal`} accent={colors.violet} />
          <GoalRow label="Target Protein" value={`${profile?.proteinTarget || '0'}g`} accent={colors.blue} />
          <GoalRow label="Target Carbs" value={`${profile?.carbTarget || '0'}g`} accent={colors.green} />
          <GoalRow label="Target Fat" value={`${profile?.fatTarget || '0'}g`} accent={colors.pink} />
        </View>

        {/* User Details */}
        <Text style={s.sectionLabel}>BIOMETRICS</Text>
        <View style={s.card}>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Age</Text>
            <Text style={s.detailValue}>{profile?.age ? `${profile.age} yrs` : "--"}</Text>
          </View>
          <View style={s.prefDivider} />
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Height</Text>
            <Text style={s.detailValue}>{profile?.height ? `${profile.height} cm` : "--"}</Text>
          </View>
          <View style={s.prefDivider} />
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Activity Level</Text>
            <Text style={s.detailValue}>{activityLevelLabel}</Text>
          </View>
        </View>

        {/* App Preferences */}
        <Text style={s.sectionLabel}>APP PREFERENCES</Text>
        <View style={s.card}>
          <PrefRow label="Diet Preference" value={profile?.dietPreference ? profile.dietPreference.replace('_', ' ').toUpperCase() : 'NO RESTRICTION'} />
          <View style={s.prefDivider} />
          <PrefRow label="Units" value="Metric (g, kcal, kg)" />
          <View style={s.prefDivider} />
          <TouchableOpacity onPress={handleLogout} style={s.logoutButton}>
            <Text style={s.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: ui.screen,
  scroll: { paddingHorizontal: spacing.xl, paddingTop: 20, paddingBottom: 40 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { ...typography.hero, fontSize: 30 },

  heroCard: {
    backgroundColor: colors.panelDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 24,
    paddingHorizontal: 20,
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

  illustrationWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
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
    fontSize: 28,
    color: colors.purple,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: colors.violet,
    textTransform: "uppercase",
    marginBottom: 18,
    zIndex: 1,
  },

  statsRow: { flexDirection: "row", gap: 8, width: "100%" },
  statPill: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  statPillNum: { fontSize: 16, fontWeight: "900", letterSpacing: -0.5 },
  statPillLabel: { fontSize: 9, color: colors.textDim, fontWeight: "700", letterSpacing: 0.5, marginTop: 3, textAlign: "center" },

  sectionLabel: { ...typography.sectionLabel, marginBottom: 10, marginTop: 4 },

  card: {
    backgroundColor: colors.panelDeep,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
    overflow: "hidden",
    ...shadow.card,
  },

  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderLeftWidth: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  goalLabel: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  goalValue: { fontSize: 14, fontWeight: "800" },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  detailLabel: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  detailValue: { fontSize: 14, color: colors.text, fontWeight: "700" },

  prefRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16 },
  prefLabel: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  prefValue: { fontSize: 13, color: colors.violet, fontWeight: "700" },
  prefDivider: { height: 0.5, backgroundColor: "rgba(255,255,255,0.04)", marginHorizontal: 16 },
  logoutButton: { paddingVertical: 14, paddingHorizontal: 16, alignItems: "center" },
  logoutText: { fontSize: 14, color: colors.red, fontWeight: "700" },
});
