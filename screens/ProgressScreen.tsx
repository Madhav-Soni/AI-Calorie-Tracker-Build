import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Keyboard,
  Dimensions,
} from "react-native";
import { colors, radius, spacing, typography, ui } from "../components/DesignSystem";
import { useMealStore } from "../useMealStore";
import { PressScale } from "../components/PressScale";

const { width: W } = Dimensions.get("window");

export default function ProgressScreen() {
  const userProfile = useMealStore((s) => s.userProfile);
  const weightHistory = useMealStore((s) => s.weightHistory);
  const logWeight = useMealStore((s) => s.logWeight);

  const [inputWeight, setInputWeight] = useState("");

  const handleLogWeight = () => {
    const wVal = parseFloat(inputWeight);
    if (isNaN(wVal) || wVal < 20 || wVal > 350) {
      alert("Please enter a valid weight in kg.");
      return;
    }
    logWeight(wVal);
    setInputWeight("");
    Keyboard.dismiss();
  };

  const currentWeight = userProfile?.weight || (weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : null);
  const startWeight = weightHistory.length > 0 ? weightHistory[0].weight : currentWeight;
  const weightChange = currentWeight && startWeight ? (currentWeight - startWeight).toFixed(1) : "0.0";

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Progress Lab</Text>
        <Text style={s.subtitle}>Track weight changes and baseline analytics.</Text>

        {/* Overview Stats */}
        <View style={s.statsCard}>
          <View style={s.statBox}>
            <Text style={s.statLabel}>CURRENT</Text>
            <Text style={s.statValue}>
              {currentWeight ? `${currentWeight} kg` : "--"}
            </Text>
          </View>
          <View style={s.divider} />
          <View style={s.statBox}>
            <Text style={s.statLabel}>TOTAL CHANGE</Text>
            <Text style={[s.statValue, { color: parseFloat(weightChange) <= 0 ? colors.green : colors.violet }]}>
              {parseFloat(weightChange) > 0 ? `+${weightChange}` : weightChange} kg
            </Text>
          </View>
        </View>

        {/* Weight Logger */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Log Weight</Text>
          <Text style={s.cardSubtitle}>Keep your calculations updated with your latest weight.</Text>
          <View style={s.logRow}>
            <TextInput
              style={s.input}
              value={inputWeight}
              onChangeText={setInputWeight}
              keyboardType="numeric"
              placeholder="e.g. 72.5"
              placeholderTextColor="rgba(255,255,255,0.2)"
            />
            <Text style={s.kgLabel}>kg</Text>
            <TouchableOpacity style={s.btnLog} onPress={handleLogWeight}>
              <Text style={s.btnLogText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* History Timeline */}
        <Text style={s.sectionLabel}>WEIGHT TIMELINE</Text>
        {weightHistory.length === 0 ? (
          <View style={s.emptyTimeline}>
            <Text style={s.emptyText}>No weight records logged yet.</Text>
          </View>
        ) : (
          <View style={s.timelineCard}>
            {weightHistory.slice().reverse().map((entry, idx) => {
              const dateObj = new Date(entry.date);
              const formattedDate = dateObj.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <View key={entry.date} style={[s.timelineRow, idx === weightHistory.length - 1 ? { borderBottomWidth: 0 } : null]}>
                  <Text style={s.timelineDate}>{formattedDate}</Text>
                  <Text style={s.timelineVal}>{entry.weight} kg</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: ui.screen,
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: 24,
  },
  title: {
    ...typography.hero,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.xxl,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: colors.panelDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 20,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.textDim,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.text,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
  },
  card: {
    backgroundColor: colors.panelDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.panelSoft,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  kgLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textMuted,
  },
  btnLog: {
    paddingHorizontal: 20,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.purple,
    justifyContent: "center",
    alignItems: "center",
  },
  btnLogText: {
    color: "#fff",
    fontWeight: "800",
  },
  sectionLabel: {
    ...typography.sectionLabel,
    marginBottom: 10,
  },
  emptyTimeline: {
    backgroundColor: colors.panelDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: colors.textDim,
  },
  timelineCard: {
    backgroundColor: colors.panelDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  timelineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  timelineDate: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "600",
  },
  timelineVal: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
});
