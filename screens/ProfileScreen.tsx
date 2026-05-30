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
          <Image
            source={{ uri: "https://i.pravatar.cc/120?img=33" }}
            style={styles.avatar}
          />
          <Text style={styles.name}>Madhav Soni</Text>
          <Text style={styles.username}>@madhavsoni</Text>
          
          <View style={styles.badge}>
            <Text style={styles.badgeText}>👑 PREMIUM MEMBER</Text>
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
  screen: { flex: 1, backgroundColor: "#080810" },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 100 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 36, color: "#f9fafb", fontWeight: "800", letterSpacing: -1 },

  profileCard: {
    backgroundColor: "#0f0f1a",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1f1f35",
    marginBottom: 28,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: "#7c3aed",
    marginBottom: 16,
  },
  name: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  username: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: "rgba(124, 58, 237, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
  },
  badgeText: {
    color: "#a78bfa",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  sectionTitle: {
    fontSize: 12,
    color: "#4b5563",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: "#0f0f1a",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1f1f35",
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
    color: "rgba(255, 255, 255, 0.5)",
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
    backgroundColor: "#1f1f35",
  },
  logoutBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    marginTop: 12,
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "700",
  },
});
