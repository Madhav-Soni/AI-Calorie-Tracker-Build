import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────
interface EmptyStateProps {
  onAction?: () => void;
  actionLabel?: string;
}

// ─── NO MEALS LOGGED EMPTY STATE ─────────────────────────────────────────────
export function NoMealsState({ onAction, actionLabel = "Scan a Meal" }: EmptyStateProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>🍽️</Text>
      <Text style={styles.title}>Your diary is fresh & empty</Text>
      <Text style={styles.subtitle}>
        Let's begin your day! Scan what you eat and let our AI calculate your macros.
      </Text>
      {onAction && (
        <TouchableOpacity style={styles.primaryBtn} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── NO HISTORY DATA EMPTY STATE ──────────────────────────────────────────────
export function NoHistoryState() {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>📈</Text>
      <Text style={styles.title}>Insights will arrive soon</Text>
      <Text style={styles.subtitle}>
        Log your meals consistently for a couple of days to unlock AI coach insights and weekly statistics.
      </Text>
    </View>
  );
}

// ─── CAMERA PERMISSION DENIED EMPTY STATE ─────────────────────────────────────
export function CameraPermissionDeniedState({ onAction, actionLabel = "Grant Permission" }: EmptyStateProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>📷</Text>
      <Text style={styles.title}>Camera Access Required</Text>
      <Text style={styles.subtitle}>
        We need access to your camera to scan and analyze your food visually.
      </Text>
      {onAction && (
        <TouchableOpacity style={styles.primaryBtn} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── AI ANALYSIS FAILED EMPTY STATE ───────────────────────────────────────────
export function AnalysisFailedState({ onAction, actionLabel = "Try Scanning Again" }: EmptyStateProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>🤖</Text>
      <Text style={styles.title}>AI couldn't scan this meal</Text>
      <Text style={styles.subtitle}>
        Make sure the lighting is bright and the food is centered. We'd love to try again!
      </Text>
      {onAction && (
        <TouchableOpacity style={styles.primaryBtn} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0c0c1a",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  icon: {
    fontSize: 42,
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.45)",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: "#7c3aed",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  btnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
});
