import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
  Platform,
  Alert,
  Easing,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { useAnalyzeFood } from "../hooks/useAnalyzeFood";

const { width, height } = Dimensions.get("window");
const CORNER = 22;
const FRAME_W = width * 0.78;
const FRAME_H = width * 0.78;

const LOADING_PHASES = [
  { threshold: 10, label: "Uploading image…", sub: "Sending to AI backend" },
  { threshold: 40, label: "Processing…",      sub: "Workers AI is reading your meal" },
  { threshold: 70, label: "Analysing macros…",sub: "Estimating calories & nutrients" },
  { threshold: 95, label: "Almost done…",     sub: "Building your nutrition breakdown" },
];

function getPhase(progress: number) {
  for (let i = LOADING_PHASES.length - 1; i >= 0; i--) {
    if (progress >= LOADING_PHASES[i].threshold) return LOADING_PHASES[i];
  }
  return LOADING_PHASES[0];
}

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state, analyze, reset } = useAnalyzeFood();

  const isLoading = state.status === "uploading" || state.status === "analyzing";

  // Animations
  const shimmer       = useRef(new Animated.Value(0)).current;
  const captureScale  = useRef(new Animated.Value(1)).current;
  const previewOpacity= useRef(new Animated.Value(0)).current;
  const spinAnim      = useRef(new Animated.Value(0)).current;
  const progressAnim  = useRef(new Animated.Value(0)).current;
  const overlayOpacity= useRef(new Animated.Value(0)).current;
  const phaseOpacity  = useRef(new Animated.Value(1)).current;
  const scanLineAnim  = useRef(new Animated.Value(0)).current;

  // Corner shimmer loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Scan line loop on preview
  useEffect(() => {
    if (capturedUri && !isLoading) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(scanLineAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [capturedUri, isLoading]);

  // Spin loader
  useEffect(() => {
    let loopRef: Animated.CompositeAnimation | null = null;
    if (isLoading) {
      Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      loopRef = Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.linear })
      );
      loopRef.start();
    } else {
      spinAnim.setValue(0);
      Animated.timing(overlayOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
    return () => loopRef?.stop();
  }, [isLoading]);

  // Progress bar animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: state.progress,
      duration: 400,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();

    // Cross-fade phase label
    if (isLoading) {
      Animated.sequence([
        Animated.timing(phaseOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(phaseOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [state.progress]);

  // Navigate on success
  useEffect(() => {
    if (state.status === "success" && state.data && capturedUri) {
      navigation.navigate("FoodAnalysis", {
        imageUri: capturedUri,
        analysisResult: state.data,
      });
    }
  }, [state.status]);

  const cornerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const progressBarWidth = progressAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  const scanLineY = scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [-FRAME_H / 2, FRAME_H / 2] });

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing || isLoading) return;
    setIsCapturing(true);
    Animated.sequence([
      Animated.timing(captureScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(captureScale, { toValue: 1, duration: 130, useNativeDriver: true }),
    ]).start();
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) showPreview(photo.uri);
    } catch (e) {
      Alert.alert("Capture Failed", "Could not take photo. Please try again.");
    }
    setIsCapturing(false);
  };

  const pickFromGallery = async () => {
    if (isLoading) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      showPreview(result.assets[0].uri);
    }
  };

  const showPreview = (uri: string) => {
    reset();
    setCapturedUri(uri);
    previewOpacity.setValue(0);
    Animated.timing(previewOpacity, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  };

  const retake = () => {
    if (isLoading) return;
    reset();
    Animated.timing(previewOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setCapturedUri(null);
    });
  };

  const handleAnalyse = async () => {
    if (!capturedUri || isLoading) return;
    const result = await analyze(capturedUri);
    if (!result) {
      if (state.error && state.error.includes("Please retake the photo")) {
        Alert.alert(
          "Food Not Identified",
          state.error,
          [
            { text: "Retake Photo", onPress: () => retake() },
            { text: "Cancel", style: "cancel" },
          ]
        );
      } else {
        Alert.alert(
          "Analysis Failed",
          state.error ?? "Could not analyse the image. Check your connection and backend.",
          [
            { text: "Retry", onPress: () => handleAnalyse() },
            { text: "Cancel", style: "cancel" },
          ]
        );
      }
    }
  };

  // ── Permission screens ──────────────────────────────────────────────────────
  if (!permission) return <View style={s.root} />;

  if (!permission.granted) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" />
        <View style={s.permBox}>
          <Text style={s.permIcon}>📷</Text>
          <Text style={s.permTitle}>Camera Access</Text>
          <Text style={s.permSub}>Allow camera access to log your meals instantly.</Text>
          <TouchableOpacity style={s.grantBtn} onPress={requestPermission}>
            <Text style={s.grantBtnText}>Grant Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const phase = getPhase(state.progress);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* Live camera */}
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />

      {/* Dark edges */}
      <View style={s.topFade} pointerEvents="none" />
      <View style={s.bottomFade} pointerEvents="none" />

      {/* ── Top bar ── */}
      <View style={[s.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()}>
          <Text style={s.iconBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={s.topCenter}>
          <Text style={s.topLabel}>LOG MEAL</Text>
          <View style={s.aiPill}>
            <View style={s.aiDot} />
            <Text style={s.aiPillText}>AI Ready</Text>
          </View>
        </View>
        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
        >
          <Text style={s.iconBtnText}>⟳</Text>
        </TouchableOpacity>
      </View>

      {/* ── Scan frame ── */}
      <View style={s.frameWrapper} pointerEvents="none">
        <Animated.View style={[s.cornerTL, { opacity: cornerOpacity }]} />
        <Animated.View style={[s.cornerTR, { opacity: cornerOpacity }]} />
        <Animated.View style={[s.cornerBL, { opacity: cornerOpacity }]} />
        <Animated.View style={[s.cornerBR, { opacity: cornerOpacity }]} />
        <Text style={s.frameHint}>Point at your food</Text>
      </View>

      {/* ── Bottom bar ── */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity style={s.sideBtn} onPress={pickFromGallery}>
          <Text style={s.sideBtnIcon}>⊞</Text>
          <Text style={s.sideBtnLabel}>Gallery</Text>
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: captureScale }] }}>
          <TouchableOpacity style={s.captureOuter} onPress={takePicture} activeOpacity={0.9}>
            <View style={s.captureInner} />
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={s.sideBtn}>
          <Text style={s.sideBtnIcon}>⚡</Text>
          <Text style={s.sideBtnLabel}>Flash</Text>
        </TouchableOpacity>
      </View>

      {/* ── Preview overlay ── */}
      {capturedUri && (
        <Animated.View style={[s.previewOverlay, { opacity: previewOpacity }]}>
          <Image source={{ uri: capturedUri }} style={s.previewImage} />

          {/* Scan line on preview (idle state) */}
          {!isLoading && (
            <Animated.View
              style={[s.scanLine, { transform: [{ translateY: scanLineY }] }]}
              pointerEvents="none"
            />
          )}

          {/* Sheet */}
          <View style={[s.previewPanel, { paddingBottom: insets.bottom + 20 }]}>
            <View style={s.previewHandle} />
            <Text style={s.previewTitle}>Looks good?</Text>
            <Text style={s.previewSub}>AI will identify each food and estimate nutrition.</Text>

            <TouchableOpacity
              style={[s.analyseBtn, isLoading && { opacity: 0.6 }]}
              activeOpacity={0.88}
              onPress={handleAnalyse}
              disabled={isLoading}
            >
              <Text style={s.analyseBtnText}>✦  Analyse Meal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.retakeBtn} onPress={retake} disabled={isLoading}>
              <Text style={s.retakeBtnText}>Retake</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* ── Loading overlay (full-screen premium) ── */}
      <Animated.View
        style={[s.loadingOverlay, { opacity: overlayOpacity }]}
        pointerEvents={isLoading ? "auto" : "none"}
      >
        {/* Blurred image bg */}
        {capturedUri && (
          <Image source={{ uri: capturedUri }} style={s.loadingBgImage} blurRadius={18} />
        )}
        <View style={s.loadingBgDim} />

        {/* Spinner ring */}
        <View style={s.spinnerWrap}>
          <Animated.View style={[s.spinnerRing, { transform: [{ rotate: spin }] }]} />
          <View style={s.spinnerInner}>
            <Text style={s.spinnerEmoji}>🧠</Text>
          </View>
        </View>

        {/* Phase labels */}
        <Animated.View style={{ opacity: phaseOpacity, alignItems: "center" }}>
          <Text style={s.loadingTitle}>{phase.label}</Text>
          <Text style={s.loadingSub}>{phase.sub}</Text>
        </Animated.View>

        {/* Progress bar */}
        <View style={s.progressTrack}>
          <Animated.View style={[s.progressFill, { width: progressBarWidth }]} />
        </View>
        <Text style={s.progressPct}>{`${Math.round(state.progress)}%`}</Text>

        {/* Steps */}
        <View style={s.stepRow}>
          {["Upload", "Vision AI", "Macros"].map((step, i) => {
            const done = state.progress > [35, 65, 95][i];
            return (
              <View key={step} style={s.stepItem}>
                <View style={[s.stepDot, done && s.stepDotDone]}>
                  {done && <Text style={s.stepCheck}>✓</Text>}
                </View>
                <Text style={[s.stepLabel, done && s.stepLabelDone]}>{step}</Text>
              </View>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },

  topFade: {
    position: "absolute", top: 0, left: 0, right: 0, height: 160,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  bottomFade: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 200,
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  // Permission
  permBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  permIcon: { fontSize: 48, marginBottom: 16 },
  permTitle: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 10 },
  permSub: { color: "rgba(255,255,255,0.5)", fontSize: 14, textAlign: "center", lineHeight: 21, marginBottom: 32 },
  grantBtn: { backgroundColor: "#fff", paddingHorizontal: 36, paddingVertical: 14, borderRadius: 50 },
  grantBtnText: { color: "#000", fontWeight: "700", fontSize: 15 },

  // Top bar
  topBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, zIndex: 10 },
  topCenter: { alignItems: "center", gap: 6 },
  topLabel: { color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: "700", letterSpacing: 3 },
  aiPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(52,211,153,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: "rgba(52,211,153,0.3)" },
  aiDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#34d399" },
  aiPillText: { color: "#34d399", fontSize: 10, fontWeight: "700" },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  iconBtnText: { color: "#fff", fontSize: 16 },

  // Frame
  frameWrapper: { position: "absolute", top: height / 2 - FRAME_H / 2 - 30, left: (width - FRAME_W) / 2, width: FRAME_W, height: FRAME_H, alignItems: "center", justifyContent: "flex-end", paddingBottom: 14 },
  cornerTL: { position: "absolute", top: 0, left: 0, width: CORNER, height: CORNER, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderColor: "#fff", borderTopLeftRadius: 6 },
  cornerTR: { position: "absolute", top: 0, right: 0, width: CORNER, height: CORNER, borderTopWidth: 2.5, borderRightWidth: 2.5, borderColor: "#fff", borderTopRightRadius: 6 },
  cornerBL: { position: "absolute", bottom: 0, left: 0, width: CORNER, height: CORNER, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderColor: "#fff", borderBottomLeftRadius: 6 },
  cornerBR: { position: "absolute", bottom: 0, right: 0, width: CORNER, height: CORNER, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderColor: "#fff", borderBottomRightRadius: 6 },
  frameHint: { color: "rgba(255,255,255,0.45)", fontSize: 12, letterSpacing: 1.2, fontWeight: "500" },

  // Bottom bar
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 44, zIndex: 10 },
  captureOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: "rgba(255,255,255,0.85)", alignItems: "center", justifyContent: "center" },
  captureInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#fff" },
  sideBtn: { alignItems: "center", gap: 5, width: 56 },
  sideBtnIcon: { fontSize: 22, color: "#fff" },
  sideBtnLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, letterSpacing: 0.5, fontWeight: "500" },

  // Preview
  previewOverlay: { ...StyleSheet.absoluteFill, zIndex: 20 },
  previewImage: { width, height, resizeMode: "cover" },
  scanLine: {
    position: "absolute",
    top: "50%", left: 0, right: 0,
    height: 2,
    backgroundColor: "rgba(124,58,237,0.6)",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  previewPanel: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(8,8,16,0.92)",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 28, paddingTop: 16,
    borderTopWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  previewHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.18)", alignSelf: "center", marginBottom: 20 },
  previewTitle: { color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: -0.4, marginBottom: 6 },
  previewSub: { color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 19, marginBottom: 24 },
  analyseBtn: { backgroundColor: "#7c3aed", borderRadius: 50, paddingVertical: 16, alignItems: "center", marginBottom: 12, shadowColor: "#7c3aed", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
  analyseBtnText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.4 },
  retakeBtn: { paddingVertical: 13, alignItems: "center" },
  retakeBtnText: { color: "rgba(255,255,255,0.45)", fontSize: 14, fontWeight: "500" },

  // Loading overlay
  loadingOverlay: { ...StyleSheet.absoluteFill, zIndex: 30, alignItems: "center", justifyContent: "center", gap: 20 },
  loadingBgImage: { ...StyleSheet.absoluteFill, width, height, resizeMode: "cover" },
  loadingBgDim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(6,6,15,0.82)" },
  spinnerWrap: { width: 90, height: 90, alignItems: "center", justifyContent: "center" },
  spinnerRing: {
    position: "absolute",
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 2.5,
    borderColor: "transparent",
    borderTopColor: "#7c3aed",
    borderRightColor: "#a855f7",
  },
  spinnerInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(124,58,237,0.15)", alignItems: "center", justifyContent: "center" },
  spinnerEmoji: { fontSize: 26 },
  loadingTitle: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  loadingSub: { color: "rgba(255,255,255,0.45)", fontSize: 13, textAlign: "center" },
  progressTrack: { width: width * 0.65, height: 4, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#7c3aed", borderRadius: 2 },
  progressPct: { color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: "700" },
  stepRow: { flexDirection: "row", gap: 32, alignItems: "center" },
  stepItem: { alignItems: "center", gap: 6 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  stepDotDone: { backgroundColor: "rgba(52,211,153,0.2)", borderColor: "#34d399" },
  stepCheck: { color: "#34d399", fontSize: 12, fontWeight: "700" },
  stepLabel: { color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: "600" },
  stepLabelDone: { color: "#34d399" },
});
