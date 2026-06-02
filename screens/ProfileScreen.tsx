import React from "react";
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRingOuter}>
            <View style={styles.avatarRingInner}>
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256" }}
                style={styles.avatar}
              />
            </View>
          </View>
          <Text style={styles.name}>Madhav Soni</Text>
          <Text style={styles.username}>@madhavsoni</Text>
          
          <View style={styles.badge}>
            <Text style={styles.badgeText}>👑 PREMIUM MEMBER</Text>
          </View>

          {/* Stat Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statGridCol}>
              <Text style={styles.statGridNum}>2,000</Text>
              <Text style={styles.statGridLabel}>KCAL GOAL</Text>
            </View>
            <View style={styles.statGridDivider} />
            <View style={styles.statGridCol}>
              <Text style={styles.statGridNum}>14</Text>
              <Text style={styles.statGridLabel}>STREAK</Text>
            </View>
            <View style={styles.statGridDivider} />
            <View style={styles.statGridCol}>
              <Text style={styles.statGridNum}>32</Text>
              <Text style={styles.statGridLabel}>LOGGED</Text>
            </View>
          </View>
        </View>

        {/* Account Details */}
        <Text style={styles.sectionTitle}>Goals & Plan</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Daily Calories Goal</Text>
            <Text style={styles.infoValue}>2,000 kcal</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Target Protein</Text>
            <Text style={styles.infoValue}>150g</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Target Carbs</Text>
            <Text style={styles.infoValue}>200g</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Target Fat</Text>
            <Text style={styles.infoValue}>65g</Text>
          </View>
        </View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>App Preferences</Text>
        <View style={styles.infoCard}>
          <TouchableOpacity style={styles.infoRow}>
            <Text style={styles.infoLabel}>AI Coach Personality</Text>
            <Text style={styles.actionText}>Encouraging ›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.infoRow}>
            <Text style={styles.infoLabel}>Notifications</Text>
            <Text style={styles.actionText}>Enabled ›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.infoRow}>
            <Text style={styles.infoLabel}>Units</Text>
            <Text style={styles.actionText}>Metric (g, kcal) ›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050510" },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 36, color: "#fff", fontWeight: "800", letterSpacing: -1 },

  profileCard: {
    backgroundColor: "#0D0D1A",
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(127, 119, 221, 0.18)",
    marginBottom: 28,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  avatarRingOuter: {
    padding: 4,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: "rgba(124, 58, 237, 0.25)",
    marginBottom: 16,
  },
  avatarRingInner: {
    padding: 4,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: "#7c3aed",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  name: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },
  username: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: "rgba(124, 58, 237, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  badgeText: {
    color: "#c084fc",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },

  sectionTitle: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.45)",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 12,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: "#0D0D1A",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(127, 119, 221, 0.18)",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  infoValue: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 14,
    fontWeight: "700",
  },
  actionText: {
    color: "#7c3aed",
    fontSize: 14,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(127, 119, 221, 0.12)",
  },
  logoutBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
    marginTop: 12,
  },
  logoutText: {
    color: "#f87171",
    fontSize: 15,
    fontWeight: "700",
  },

  statsGrid: {
    flexDirection: "row",
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(127, 119, 221, 0.18)",
    width: "100%",
  },
  statGridCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statGridDivider: {
    width: 1,
    backgroundColor: "rgba(127, 119, 221, 0.18)",
    marginVertical: 4,
  },
  statGridNum: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  statGridLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
