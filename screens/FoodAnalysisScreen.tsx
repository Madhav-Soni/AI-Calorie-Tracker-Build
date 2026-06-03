import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions, Animated, StatusBar, Alert,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { useAnalyzeFood } from "../hooks/useAnalyzeFood";
import type { FoodItem } from "../services/foodAnalysis";
import { useMealStore } from "../useMealStore";
import { colors, radius, shadow, spacing, typography, ui } from "../components/DesignSystem";

const { width: W } = Dimensions.get("window");
const CARD_BG = colors.panelSolid;
const BORDER = colors.border;
type RouteProps = RouteProp<RootStackParamList, "FoodAnalysis">;

// ── Shimmer skeleton ──────────────────────────────────────────────────────────
function Shimmer({ width, height, borderRadius = 10 }: { width: number | string; height: number; borderRadius?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.22] });
  return (
    <Animated.View style={{ width: width as any, height, borderRadius, backgroundColor: "#fff", opacity, marginBottom: 8 }} />
  );
}

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimCounter({ target, color, label }: { target: number; color: string; label: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 40;
    const t = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(Math.round(start));
      if (start >= target) clearInterval(t);
    }, 20);
    return () => clearInterval(t);
  }, [target]);
  return (
    <View style={ctr.wrap}>
      <Text style={[ctr.num, { color }]}>{val}{label === "kcal" ? "" : "g"}</Text>
      <Text style={ctr.label}>{label}</Text>
    </View>
  );
}
const ctr = StyleSheet.create({
  wrap: { alignItems: "center", flex: 1 },
  num: { fontSize: 22, fontWeight: "900", letterSpacing: 0 },
  label: { ...typography.tiny, fontWeight: "800", textTransform: "uppercase", marginTop: 2 },
});

// ── Macro bar ─────────────────────────────────────────────────────────────────
function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 900, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, []);
  const pct = Math.min(1, value / Math.max(max, 1));
  const w = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${pct * 100}%`] });
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
        <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>{label}</Text>
        <Text style={{ color, fontSize: 11, fontWeight: "900" }}>{value}g</Text>
      </View>
      <View style={{ height: 5, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
        <Animated.View style={{ width: w, height: "100%", backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function FoodAnalysisScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProps>();
  const { imageUri, analysisResult } = route.params || {};
  const insets = useSafeAreaInsets();
  const { state, analyze, hydrate } = useAnalyzeFood();
  const addMeal = useMealStore((s) => s.addMeal);

  const isLoading = state.status === "uploading" || state.status === "analyzing";
  const isSuccess = state.status === "success" && !!state.data;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successScaleAnim = useRef(new Animated.Value(0.92)).current;

  const runAnalysis = async (uri: string) => {
    try {
      const res = await analyze(uri);
      if (!res) {
        Alert.alert("Error", "Could not analyze image. Please try again.");
      }
    } catch (error) {
      console.error("[FRONTEND ERROR DURING ANALYSIS]", error);
      Alert.alert("Error", "Could not analyze image. Please try again.");
    }
  };

  useEffect(() => {
    if (analysisResult) hydrate(analysisResult);
    else if (imageUri) {
      runAnalysis(imageUri).catch(err => {
        console.error("[FRONTEND ERROR DURING ANALYSIS EFFECT]", err);
      });
    }
  }, []);

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(scanLineAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
    if (isSuccess) {
      scanLineAnim.stopAnimation();
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
        Animated.spring(successScaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 12 }),
      ]).start();
    }
  }, [state.status]);

  const scanY = scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [-120, 120] });
  const macroColor = (t: string) => ({ protein: colors.green, carbs: colors.blue, fat: colors.pink }[t] ?? colors.text);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Hero image ── */}
      <View style={s.imageWrap}>
        {imageUri
          ? <Image source={{ uri: imageUri }} style={s.heroImg} />
          : <View style={[s.heroImg, { backgroundColor: "#111", alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ color: "rgba(255,255,255,0.2)", fontSize: 40 }}>🍽️</Text>
            </View>
        }
        {/* Gradient overlay */}
        <View style={s.imgOverlay} />

        {/* Scan line animation */}
        {isLoading && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Animated.View style={[s.scanLine, { transform: [{ translateY: scanY }] }]} />
            <View style={s.scanCornerTL} />
            <View style={s.scanCornerTR} />
            <View style={s.scanCornerBL} />
            <View style={s.scanCornerBR} />
            <Animated.View style={[s.scanPulse, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={s.scanLabel}>AI SCANNING</Text>
            <Text style={s.scanSubLabel}>building macro estimate</Text>
            </Animated.View>
          </View>
        )}

        {/* Success flash */}
        {isSuccess && (
          <Animated.View style={[s.successBadge, { transform: [{ scale: successScaleAnim }] }]}>
            <Text style={s.successIcon}>✓</Text>
            <Text style={s.successText}>Detected</Text>
          </Animated.View>
        )}

        {/* Back button */}
        <TouchableOpacity style={[s.backBtn, { top: insets.top + 12 }]} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
      </View>

      {/* ── Bottom sheet ── */}
      <ScrollView style={s.sheet} contentContainerStyle={[s.sheetContent, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

        {/* Loading skeletons */}
        {isLoading && (
          <View>
            <Text style={s.analyzingLabel}>IDENTIFYING FOODS...</Text>
            <View style={s.shimmerTotals}>
              <Shimmer width="48%" height={72} borderRadius={18} />
              <Shimmer width="16%" height={72} borderRadius={18} />
              <Shimmer width="16%" height={72} borderRadius={18} />
              <Shimmer width="16%" height={72} borderRadius={18} />
            </View>
            <Shimmer width="100%" height={90} borderRadius={18} />
            <Shimmer width="100%" height={90} borderRadius={18} />
          </View>
        )}

        {/* Error */}
        {state.status === "error" && (
          <View style={s.errorBox}>
            <Text style={{ fontSize: 44, marginBottom: 14 }}>⚠️</Text>
            <Text style={s.errorTitle}>Could not analyse</Text>
            <Text style={s.errorMsg}>{state.error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => runAnalysis(imageUri)} activeOpacity={0.8}>
              <Text style={s.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Success results */}
        {isSuccess && state.data && (() => {
          const d = state.data;
          const maxMacro = Math.max(d.totalProtein, d.totalCarbs, d.totalFat, 1);
          const confidence = Math.min(98, Math.max(72, 86 + (Array.isArray(d.foods) ? d.foods.length * 3 : 0)));
          return (
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

              <View style={s.resultHeader}>
                <View>
                  <Text style={s.resultEyebrow}>AI ANALYSIS COMPLETE</Text>
                  <Text style={s.resultTitle}>Nutrition estimate</Text>
                </View>
                <View style={s.confidenceBadge}>
                  <Text style={s.confidenceNum}>{confidence}%</Text>
                  <Text style={s.confidenceLabel}>confidence</Text>
                </View>
              </View>

              {/* Totals row */}
              <View style={s.totalsRow}>
                <View style={s.calCard}>
                  <AnimCounter target={d.totalCalories} color="#fff" label="kcal" />
                  <Text style={s.calCardSub}>total calories</Text>
                </View>
                <View style={s.macrosGroup}>
                  <AnimCounter target={d.totalProtein} color="#34d399" label="protein" />
                  <AnimCounter target={d.totalCarbs} color="#60a5fa" label="carbs" />
                  <AnimCounter target={d.totalFat} color="#f472b6" label="fat" />
                </View>
              </View>

              {/* Macro bars */}
              <View style={s.macroBarCard}>
                <MacroBar label="PROTEIN" value={d.totalProtein} max={maxMacro} color="#34d399" />
                <MacroBar label="CARBS" value={d.totalCarbs} max={maxMacro} color="#60a5fa" />
                <MacroBar label="FAT" value={d.totalFat} max={maxMacro} color="#f472b6" />
              </View>

              {/* Foods detected */}
              <Text style={s.sectionLabel}>FOODS DETECTED</Text>
              {(!d || !Array.isArray(d.foods) || d.foods.length === 0) ? (
                <View style={[s.card, { padding: 24, alignItems: "center", justifyContent: "center", minHeight: 100 }]}>
                  <Text style={s.emptyGlyph}>◎</Text>
                  <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: "600" }}>No foods detected</Text>
                </View>
              ) : (
                <>
                  <View style={s.detectedChipRow}>
                    {d.foods.slice(0, 4).map((item: FoodItem, i: number) => (
                      <View key={`${item.name}-${i}`} style={s.detectedChip}>
                        <Text style={s.detectedChipText} numberOfLines={1}>{item.name}</Text>
                      </View>
                    ))}
                  </View>
                  {d.foods.map((item: FoodItem, i: number) => (
                    <View key={i} style={s.foodCard}>
                      <View style={[s.foodAccent, { backgroundColor: macroColor(i % 3 === 0 ? "protein" : i % 3 === 1 ? "carbs" : "fat") }]} />
                      <View style={s.foodCardInner}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <View style={{ flex: 1, marginRight: 12 }}>
                            <Text style={s.foodName}>{item.name}</Text>
                            <Text style={s.foodPortion}>{item.portion}</Text>
                          </View>
                          <View style={s.foodCalBadge}>
                            <Text style={s.foodCalNum}>{item.calories}</Text>
                            <Text style={s.foodCalUnit}>kcal</Text>
                          </View>
                        </View>
                        <View style={s.foodMacroRow}>
                          {(["protein", "carbs", "fat"] as const).map((m) => (
                            <View key={m} style={s.foodMacroItem}>
                              <Text style={[s.foodMacroVal, { color: macroColor(m) }]}>{item[m]}g</Text>
                              <Text style={s.foodMacroKey}>{m}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {/* Log button */}
              <TouchableOpacity
                style={s.logBtn}
                activeOpacity={0.88}
                onPress={() => {
                  const foodsList = Array.isArray(d.foods) ? d.foods : [];
                  addMeal({
                    name: foodsList.map((f: FoodItem) => f.name).join(", ") || "AI Scanned Meal",
                    calories: Number(d.totalCalories) || 0,
                    protein: Number(d.totalProtein) || 0,
                    carbs: Number(d.totalCarbs) || 0,
                    fat: Number(d.totalFat) || 0,
                  });
                  Alert.alert("Logged ✓", "Meal added to your diary!", [
                    { text: "Done", onPress: () => navigation.goBack() },
                  ]);
                }}
              >
                <Text style={s.logBtnText}>+ Log to Diary</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.discardBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                <Text style={s.discardText}>Discard</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })()}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: ui.screen,

  // Image hero
  imageWrap: { width: W, height: 290, position: "relative" },
  heroImg: { width: W, height: 290, resizeMode: "cover" },
  imgOverlay: { ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(5,5,16,0.44)" },
  backBtn: { position: "absolute", left: 16, width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(5,5,16,0.64)", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  backArrow: { color: "#fff", fontSize: 24, lineHeight: 28, marginTop: -2 },

  // Scan FX
  scanLine: { position: "absolute", left: 0, right: 0, height: 2,
    backgroundColor: "rgba(168,85,247,0.58)", top: "50%",
    shadowColor: colors.violet, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.28, shadowRadius: 7 },
  scanCornerTL: { position: "absolute", top: 24, left: 24, width: 22, height: 22,
    borderTopWidth: 2, borderLeftWidth: 2, borderColor: colors.violet, borderRadius: 3 },
  scanCornerTR: { position: "absolute", top: 24, right: 24, width: 22, height: 22,
    borderTopWidth: 2, borderRightWidth: 2, borderColor: colors.violet, borderRadius: 3 },
  scanCornerBL: { position: "absolute", bottom: 24, left: 24, width: 22, height: 22,
    borderBottomWidth: 2, borderLeftWidth: 2, borderColor: colors.violet, borderRadius: 3 },
  scanCornerBR: { position: "absolute", bottom: 24, right: 24, width: 22, height: 22,
    borderBottomWidth: 2, borderRightWidth: 2, borderColor: colors.violet, borderRadius: 3 },
  scanPulse: { position: "absolute", bottom: 16, alignSelf: "center",
    backgroundColor: "rgba(12,12,24,0.72)", borderWidth: 1, borderColor: "rgba(168,85,247,0.34)",
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignItems: "center" },
  scanLabel: { color: colors.violet, fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  scanSubLabel: { color: "rgba(255,255,255,0.44)", fontSize: 10, fontWeight: "600", marginTop: 2 },

  successBadge: { position: "absolute", bottom: 20, alignSelf: "center",
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(52,211,153,0.12)", borderWidth: 1, borderColor: "rgba(52,211,153,0.28)",
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, ...shadow.glowGreen },
  successIcon: { color: "#34d399", fontSize: 14, fontWeight: "900" },
  successText: { color: "#34d399", fontSize: 12, fontWeight: "800", letterSpacing: 1 },

  // Sheet
  sheet: { flex: 1, backgroundColor: colors.ink, borderTopLeftRadius: 28,
    borderTopRightRadius: 28, marginTop: -24 },
  sheetContent: { padding: spacing.xl, paddingTop: 22 },

  // Loading
  analyzingLabel: { fontSize: 10, color: colors.violet, fontWeight: "800", letterSpacing: 2,
    textTransform: "uppercase", marginBottom: 14, textAlign: "center" },
  shimmerTotals: { flexDirection: "row", gap: 8, marginBottom: 10 },

  // Error
  errorBox: { alignItems: "center", paddingTop: 32 },
  errorTitle: { color: "#fff", fontSize: 20, fontWeight: "900", marginBottom: 8 },
  errorMsg: { color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center",
    lineHeight: 20, marginBottom: 28 },
  retryBtn: { backgroundColor: CARD_BG, borderRadius: 50, paddingHorizontal: 32,
    paddingVertical: 14, borderWidth: 1, borderColor: BORDER },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Totals
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  resultEyebrow: typography.sectionLabel,
  resultTitle: { ...typography.title, fontSize: 24, marginTop: 3 },
  confidenceBadge: { minWidth: 76, alignItems: "center", borderRadius: radius.lg, borderWidth: 1, borderColor: "rgba(52,211,153,0.22)", backgroundColor: "rgba(52,211,153,0.07)", paddingVertical: 8, paddingHorizontal: 10 },
  confidenceNum: { color: colors.green, fontSize: 18, fontWeight: "900" },
  confidenceLabel: { color: "rgba(52,211,153,0.66)", fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 },
  totalsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  calCard: { flex: 1.5, backgroundColor: colors.purpleDeep, borderRadius: radius.xl, padding: 18,
    alignItems: "center", justifyContent: "center",
    ...shadow.glowSoft },
  calCardSub: { color: "rgba(255,255,255,0.6)", fontSize: 9, fontWeight: "700",
    letterSpacing: 1, textTransform: "uppercase", marginTop: 4 },
  macrosGroup: { flex: 1, gap: 6 },

  // Macro bar card
  card: { backgroundColor: colors.panelDeep, borderRadius: radius.xl, borderWidth: 1, borderColor: BORDER, padding: 17, marginBottom: 16, ...shadow.card },
  macroBarCard: { backgroundColor: colors.panelDeep, borderRadius: radius.xl, borderWidth: 1,
    borderColor: BORDER, padding: 17, marginBottom: 18, ...shadow.card },

  sectionLabel: { ...typography.sectionLabel, marginBottom: 12 },
  emptyGlyph: { fontSize: 24, marginBottom: 8, color: colors.violet, fontWeight: "900" },
  detectedChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  detectedChip: { ...ui.chip, maxWidth: "48%", backgroundColor: "rgba(168,85,247,0.1)", borderColor: "rgba(168,85,247,0.24)" },
  detectedChipText: { color: colors.violet, fontSize: 11, fontWeight: "800" },

  // Food cards
  foodCard: { backgroundColor: colors.panelDeep, borderRadius: radius.xl, borderWidth: 1,
    borderColor: BORDER, marginBottom: 9, overflow: "hidden",
    flexDirection: "row" },
  foodAccent: { width: 4, borderRadius: 2 },
  foodCardInner: { flex: 1, padding: 16 },
  foodName: { color: "#fff", fontSize: 15, fontWeight: "800" },
  foodPortion: { color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 },
  foodCalBadge: { backgroundColor: "rgba(124,58,237,0.15)", borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(124,58,237,0.3)", paddingHorizontal: 10,
    paddingVertical: 6, alignItems: "center" },
  foodCalNum: { color: "#c084fc", fontSize: 16, fontWeight: "900" },
  foodCalUnit: { color: "rgba(192,132,252,0.6)", fontSize: 9, fontWeight: "700" },
  foodMacroRow: { flexDirection: "row", gap: 20 },
  foodMacroItem: { alignItems: "center" },
  foodMacroVal: { fontSize: 13, fontWeight: "800" },
  foodMacroKey: { color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: "600",
    textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 },

  // Actions
  logBtn: { backgroundColor: colors.purpleDeep, borderRadius: radius.xl, paddingVertical: 16,
    alignItems: "center", marginTop: 10,
    ...shadow.glowSoft },
  logBtnText: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 0.3 },
  discardBtn: { paddingVertical: 14, alignItems: "center", marginTop: 6 },
  discardText: { color: "rgba(255,255,255,0.25)", fontSize: 13, fontWeight: "600" },
});
