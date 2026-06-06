import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  StatusBar,
  Alert,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { useAnalyzeFood } from "../hooks/useAnalyzeFood";
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
    const step = target / 40 || 1;
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
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>{label}</Text>
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

  // Configuration and confirm flow states
  const [servingSize, setServingSize] = useState<number>(1.0);
  const [category, setCategory] = useState<string>("Lunch");
  const [isLogged, setIsLogged] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const toastAnim = useRef(new Animated.Value(0)).current;

  const isLoading = state.status === "uploading" || state.status === "analyzing";
  const isSuccess = state.status === "success" && !!state.data;
  const isValidationFailed = isSuccess && state.data && state.data.validImage === false;

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
      if (__DEV__) console.error("[FRONTEND ERROR DURING ANALYSIS]", error);
      Alert.alert("Error", "Could not analyze image. Please try again.");
    }
  };

  useEffect(() => {
    if (analysisResult) hydrate(analysisResult);
    else if (imageUri) {
      runAnalysis(imageUri).catch(err => {
        if (__DEV__) console.error("[FRONTEND ERROR DURING ANALYSIS EFFECT]", err);
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

  const showToastNotification = () => {
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, easing: Easing.in(Easing.quad), useNativeDriver: true })
    ]).start(() => {
      navigation.navigate("Tabs");
    });
  };

  const handleLogMeal = async (d: any) => {
    setIsLogged(true);
    const foodsList = Array.isArray(d.foods) ? d.foods : [];
    
    const name = foodsList.map((f: any) => f.name).join(", ") || "AI Scanned Meal";
    const calories = Math.round((Number(d.totalCalories) || 0) * servingSize);
    const protein = Math.round((Number(d.totalProtein) || 0) * servingSize);
    const carbs = Math.round((Number(d.totalCarbs) || 0) * servingSize);
    const fat = Math.round((Number(d.totalFat) || 0) * servingSize);

    try {
      await addMeal({
        name,
        calories,
        protein,
        carbs,
        fat,
        category,
      });
      showToastNotification();
    } catch (e) {
      setIsLogged(false);
      Alert.alert("Log Failed", "Could not log meal to database. Please check your connection.");
    }
  };

  const scanY = scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [-120, 120] });
  const macroColor = (t: string) => ({ protein: colors.green, carbs: colors.blue, fat: colors.pink }[t] ?? colors.text);

  const toastTranslateY = toastAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0]
  });

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
        {isSuccess && !isValidationFailed && (
          <Animated.View style={[s.successBadge, { transform: [{ scale: successScaleAnim }] }]}>
            <Text style={s.successIcon}>✓</Text>
            <Text style={s.successText}>Analysis Complete</Text>
          </Animated.View>
        )}

        {/* Invalid Image Quality Badge */}
        {isValidationFailed && (
          <Animated.View style={[s.successBadge, { borderColor: colors.red, backgroundColor: "rgba(248,113,113,0.12)", transform: [{ scale: successScaleAnim }] }]}>
            <Text style={[s.successIcon, { color: colors.red }]}>⚠️</Text>
            <Text style={[s.successText, { color: colors.red }]}>Verification Failed</Text>
          </Animated.View>
        )}

        {/* Back button */}
        <TouchableOpacity style={[s.backBtn, { top: insets.top + 12 }]} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
      </View>

      {/* ── Bottom sheet ── */}
      <ScrollView style={s.sheet} contentContainerStyle={[s.sheetContent, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>

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
            <Text style={s.errorTitle}>Could not analyze</Text>
            <Text style={s.errorMsg}>{state.error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => runAnalysis(imageUri)} activeOpacity={0.8}>
              <Text style={s.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Invalid Image Rejection UX */}
        {isValidationFailed && state.data && (() => {
          const reason = state.data.reason || "Photo is blurry, a screen screenshot, or contains insufficient light.";
          return (
            <Animated.View style={[s.errorBox, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Text style={{ fontSize: 40, marginBottom: 14 }}>📸</Text>
              <Text style={s.errorTitle}>Take a clearer meal photo</Text>
              <Text style={s.errorMsg}>Our verification system rejected the photo.{"\n"}{reason}</Text>
              
              <TouchableOpacity
                style={s.logBtn}
                activeOpacity={0.8}
                onPress={() => navigation.replace("Camera")}
              >
                <Text style={s.logBtnText}>Retake Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.discardBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                <Text style={s.discardText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })()}

        {/* Success results */}
        {isSuccess && !isValidationFailed && state.data && (() => {
          const d = state.data;
          
          const currentCalories = Math.round(d.totalCalories * servingSize);
          const currentProtein = Math.round(d.totalProtein * servingSize);
          const currentCarbs = Math.round(d.totalCarbs * servingSize);
          const currentFat = Math.round(d.totalFat * servingSize);

          const maxMacro = Math.max(currentProtein, currentCarbs, currentFat, 1);
          const confidence = Math.min(98, Math.max(72, 86 + (Array.isArray(d.foods) ? d.foods.length * 3 : 0)));

          // Check for low confidence warning
          const hasLowConfidence = d.foods.some((f: any) => typeof f.confidence === "number" && f.confidence < 0.65);

          return (
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

              <View style={s.resultHeader}>
                <View>
                  <Text style={s.resultEyebrow}>AI MULTIPHASE CLASSIFIED</Text>
                  <Text style={s.resultTitle}>Meal Breakdown</Text>
                </View>
                <View style={s.confidenceBadge}>
                  <Text style={s.confidenceNum}>{confidence}%</Text>
                  <Text style={s.confidenceLabel}>confidence</Text>
                </View>
              </View>

              {/* Confidence warnings */}
              {hasLowConfidence && (
                <View style={s.warningCard}>
                  <Text style={s.warningText}>
                    ⚠️ Not confident. Please verify portions and details.
                  </Text>
                </View>
              )}

              {/* Serving Size Selector */}
              <Text style={s.sectionLabel}>SERVING SIZE</Text>
              <View style={s.selectorRow}>
                {[0.5, 1.0, 1.5, 2.0].map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[s.selectorItem, servingSize === size ? s.selectorItemActive : null]}
                    onPress={() => setServingSize(size)}
                  >
                    <Text style={[s.selectorText, servingSize === size ? s.selectorTextActive : null]}>
                      {size}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Meal Category Selector */}
              <Text style={s.sectionLabel}>MEAL CATEGORY</Text>
              <View style={s.selectorRow}>
                {["Breakfast", "Lunch", "Dinner", "Snack"].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[s.selectorItem, category === cat ? s.selectorItemActive : null]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[s.selectorText, category === cat ? s.selectorTextActive : null]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Totals row */}
              <View style={s.totalsRow}>
                <View style={s.calCard}>
                  <AnimCounter target={currentCalories} color="#fff" label="kcal" />
                  <Text style={s.calCardSub}>total calories</Text>
                </View>
                <View style={s.macrosGroup}>
                  <AnimCounter target={currentProtein} color="#34d399" label="protein" />
                  <AnimCounter target={currentCarbs} color="#60a5fa" label="carbs" />
                  <AnimCounter target={currentFat} color="#f472b6" label="fat" />
                </View>
              </View>

              {/* Macro bars */}
              <View style={s.macroBarCard}>
                <MacroBar label="PROTEIN" value={currentProtein} max={maxMacro} color="#34d399" />
                <MacroBar label="CARBS" value={currentCarbs} max={maxMacro} color="#60a5fa" />
                <MacroBar label="FAT" value={currentFat} max={maxMacro} color="#f472b6" />
              </View>

              {/* Foods detected */}
              <Text style={s.sectionLabel}>FOODS INVOLVED</Text>
              {(!d || !Array.isArray(d.foods) || d.foods.length === 0) ? (
                <View style={[s.card, { padding: 24, alignItems: "center", justifyContent: "center", minHeight: 100 }]}>
                  <Text style={s.emptyGlyph}>◎</Text>
                  <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: "600" }}>No foods detected</Text>
                </View>
              ) : (
                <>
                  {d.foods.map((item: any, i: number) => {
                    const itemCal = Math.round(item.calories * servingSize);
                    const itemPro = Math.round(item.protein * servingSize);
                    const itemCar = Math.round(item.carbs * servingSize);
                    const itemFat = Math.round(item.fat * servingSize);
                    const itemConfidence = typeof item.confidence === "number" ? Math.round(item.confidence * 100) : null;

                    return (
                      <View key={i} style={s.foodCard}>
                        <View style={[s.foodAccent, { backgroundColor: macroColor(i % 3 === 0 ? "protein" : i % 3 === 1 ? "carbs" : "fat") }]} />
                        <View style={s.foodCardInner}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <View style={{ flex: 1, marginRight: 12 }}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <Text style={s.foodName}>{item.name}</Text>
                                {itemConfidence !== null && (
                                  <View style={[s.miniConfBadge, itemConfidence < 65 ? { backgroundColor: "rgba(248,113,113,0.12)", borderColor: "rgba(248,113,113,0.2)" } : null]}>
                                    <Text style={[s.miniConfText, itemConfidence < 65 ? { color: colors.red } : null]}>
                                      {itemConfidence}% match
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <Text style={s.foodPortion}>{item.portion} ({servingSize}x serving)</Text>
                            </View>
                            <View style={s.foodCalBadge}>
                              <Text style={s.foodCalNum}>{itemCal}</Text>
                              <Text style={s.foodCalUnit}>kcal</Text>
                            </View>
                          </View>
                          <View style={s.foodMacroRow}>
                            <View style={s.foodMacroItem}>
                              <Text style={[s.foodMacroVal, { color: colors.green }]}>{itemPro}g</Text>
                              <Text style={s.foodMacroKey}>protein</Text>
                            </View>
                            <View style={s.foodMacroItem}>
                              <Text style={[s.foodMacroVal, { color: colors.blue }]}>{itemCar}g</Text>
                              <Text style={s.foodMacroKey}>carbs</Text>
                            </View>
                            <View style={s.foodMacroItem}>
                              <Text style={[s.foodMacroVal, { color: colors.pink }]}>{itemFat}g</Text>
                              <Text style={s.foodMacroKey}>fat</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </>
              )}

              {/* Log buttons actions */}
              <TouchableOpacity
                style={[s.logBtn, isLogged ? { opacity: 0.6 } : null]}
                activeOpacity={0.88}
                disabled={isLogged}
                onPress={() => handleLogMeal(d)}
              >
                <Text style={s.logBtnText}>Add to Daily Intake</Text>
              </TouchableOpacity>

              <View style={s.actionRow}>
                <TouchableOpacity
                  style={s.secondaryActionBtn}
                  onPress={() => navigation.replace("Camera")}
                  activeOpacity={0.7}
                >
                  <Text style={s.secondaryActionText}>Scan Again</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[s.secondaryActionBtn, s.cancelBtn]}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.7}
                >
                  <Text style={[s.secondaryActionText, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
              </View>

              {/* Developer Debug Panel */}
              {__DEV__ && d.debug && (
                <View style={s.debugPanel}>
                  <TouchableOpacity
                    style={s.debugHeader}
                    onPress={() => setShowDebug(!showDebug)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.debugTitle}>🔧 Developer Debug Panel</Text>
                    <Text style={s.debugToggle}>{showDebug ? "Collapse" : "Expand"}</Text>
                  </TouchableOpacity>
                  {showDebug && (
                    <View style={s.debugContent}>
                      <Text style={s.debugLabel}>Nutrition Mapping Sources:</Text>
                      <Text style={s.debugCode}>{d.debug.nutritionMappingSource}</Text>
                      
                      <Text style={[s.debugLabel, { marginTop: 10 }]}>Parsed Vision Foods:</Text>
                      <Text style={s.debugCode}>{JSON.stringify(d.debug.parsedFoods, null, 2)}</Text>
                      
                      <Text style={[s.debugLabel, { marginTop: 10 }]}>Raw AI Output:</Text>
                      <Text style={s.debugCode}>{d.debug.rawAIResponse}</Text>
                    </View>
                  )}
                </View>
              )}

            </Animated.View>
          );
        })()}
      </ScrollView>

      {/* Confirmation Toast Notification */}
      <Animated.View style={[s.toastContainer, { transform: [{ translateY: toastTranslateY }] }]}>
        <View style={s.toastContent}>
          <Text style={s.toastIcon}>✓</Text>
          <Text style={s.toastText}>Meal added to today's intake</Text>
        </View>
      </Animated.View>
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
  errorBox: { alignItems: "center", paddingTop: 32, paddingBottom: 24 },
  errorTitle: { color: "#fff", fontSize: 20, fontWeight: "900", marginBottom: 8 },
  errorMsg: { color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center",
    lineHeight: 20, marginBottom: 28 },
  retryBtn: { backgroundColor: CARD_BG, borderRadius: 50, paddingHorizontal: 32,
    paddingVertical: 14, borderWidth: 1, borderColor: BORDER },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Selectors row
  selectorRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  selectorItem: { flex: 1, backgroundColor: colors.panelSoft, borderRadius: radius.md, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingVertical: 12, alignItems: "center" },
  selectorItemActive: { borderColor: colors.purple, backgroundColor: "rgba(139,126,246,0.1)" },
  selectorText: { color: colors.textMuted, fontSize: 13, fontWeight: "700" },
  selectorTextActive: { color: colors.text, fontWeight: "800" },

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

  // Warning Card
  warningCard: {
    backgroundColor: "rgba(250,204,21,0.08)",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.25)",
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    color: colors.amber,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },

  // Macro bar card
  card: { backgroundColor: colors.panelDeep, borderRadius: radius.xl, borderWidth: 1, borderColor: BORDER, padding: 17, marginBottom: 16, ...shadow.card },
  macroBarCard: { backgroundColor: colors.panelDeep, borderRadius: radius.xl, borderWidth: 1,
    borderColor: BORDER, padding: 17, marginBottom: 18, ...shadow.card },

  sectionLabel: { ...typography.sectionLabel, marginBottom: 10, marginTop: 4 },
  emptyGlyph: { fontSize: 24, marginBottom: 8, color: colors.violet, fontWeight: "900" },

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
  
  miniConfBadge: {
    backgroundColor: "rgba(52,211,153,0.1)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.22)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniConfText: {
    color: colors.green,
    fontSize: 9,
    fontWeight: "800",
  },

  // Actions
  logBtn: { backgroundColor: colors.purple, borderRadius: radius.xl, paddingVertical: 16,
    alignItems: "center", marginTop: 10,
    ...shadow.glowSoft },
  logBtnText: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 0.3 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  secondaryActionBtn: { flex: 1, backgroundColor: colors.panelSoft, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: radius.xl, paddingVertical: 14, alignItems: "center" },
  cancelBtn: { backgroundColor: "transparent", borderWidth: 0 },
  secondaryActionText: { color: colors.violet, fontSize: 14, fontWeight: "800" },
  discardBtn: { paddingVertical: 14, alignItems: "center", marginTop: 6 },
  discardText: { color: "rgba(255,255,255,0.25)", fontSize: 13, fontWeight: "600" },

  // Toast
  toastContainer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "rgba(10, 10, 20, 0.95)",
    borderWidth: 1.5,
    borderColor: "rgba(52, 211, 153, 0.35)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  toastContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  toastIcon: { color: "#34d399", fontSize: 16, fontWeight: "900" },
  toastText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  // Debug Panel
  debugPanel: {
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.md,
    overflow: "hidden",
  },
  debugHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  debugTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  debugToggle: {
    color: colors.purple,
    fontSize: 11,
    fontWeight: "700",
  },
  debugContent: {
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  debugLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 4,
  },
  debugCode: {
    color: "#a78bfa",
    fontFamily: "monospace",
    fontSize: 11,
    lineHeight: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 8,
    borderRadius: 6,
    overflow: "scroll",
  },
});
