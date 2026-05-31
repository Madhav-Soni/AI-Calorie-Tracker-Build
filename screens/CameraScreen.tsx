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
  ActivityIndicator,
  Alert,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./AppNavigator";
import { useAnalyzeFood } from "../hooks/useAnalyzeFood";

const { width, height } = Dimensions.get("window");

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const { state: analyzeState, analyze, reset: resetAnalysis } = useAnalyzeFood();

  const shimmer = useRef(new Animated.Value(0)).current;
  const captureScale = useRef(new Animated.Value(1)).current;
  const previewOpacity = useRef(new Animated.Value(0)).current;

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

  const cornerOpacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);

    Animated.sequence([
      Animated.timing(captureScale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.timing(captureScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) showPreview(photo.uri);
    } catch (e) {
      console.error(e);
    }
    setIsCapturing(false);
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      showPreview(result.assets[0].uri);
    }
  };

  const showPreview = (uri: string) => {
    setCapturedUri(uri);
    previewOpacity.setValue(0);
    Animated.timing(previewOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const retake = () => {
    resetAnalysis();
    Animated.timing(previewOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setCapturedUri(null));
  };

  const handleAnalyse = async () => {
    if (!capturedUri) return;
    const result = await analyze(capturedUri);
    if (result) {
      navigation.navigate("FoodAnalysis", {
        imageUri: capturedUri,
        analysisResult: result,
      });
    } else {
      Alert.alert(
        "Analysis Failed",
        "Could not connect to the AI service or parse the image. Please verify your connection and try again.",
        [{ text: "OK" }]
      );
    }
  };

  if (!permission) return <View style={styles.root} />;

  if (!permission.granted) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <View style={styles.permissionBox}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Access</Text>
          <Text style={styles.permissionSub}>
            Allow camera access to log your meals instantly.
          </Text>
          <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
            <Text style={styles.grantBtnText}>Grant Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
      />

      {/* Dark vignette overlay */}
      <View style={styles.vignette} pointerEvents="none" />

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.iconBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topLabel}>LOG MEAL</Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
        >
          <Text style={styles.iconBtnText}>⟳</Text>
        </TouchableOpacity>
      </View>

      {/* Scan Frame */}
      <View style={styles.frameWrapper} pointerEvents="none">
        <Animated.View style={[styles.frameCornerTL, { opacity: cornerOpacity }]} />
        <Animated.View style={[styles.frameCornerTR, { opacity: cornerOpacity }]} />
        <Animated.View style={[styles.frameCornerBL, { opacity: cornerOpacity }]} />
        <Animated.View style={[styles.frameCornerBR, { opacity: cornerOpacity }]} />
        <Text style={styles.frameHint}>Point at your food</Text>
      </View>

      {/* Bottom Controls */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
        {/* Gallery */}
        <TouchableOpacity style={styles.sideBtn} onPress={pickFromGallery}>
          <Text style={styles.sideBtnIcon}>⊞</Text>
          <Text style={styles.sideBtnLabel}>Gallery</Text>
        </TouchableOpacity>

        {/* Capture */}
        <Animated.View style={{ transform: [{ scale: captureScale }] }}>
          <TouchableOpacity
            style={styles.captureOuter}
            onPress={takePicture}
            activeOpacity={0.9}
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </Animated.View>

        {/* Flash placeholder (can wire up) */}
        <TouchableOpacity style={styles.sideBtn}>
          <Text style={styles.sideBtnIcon}>⚡</Text>
          <Text style={styles.sideBtnLabel}>Flash</Text>
        </TouchableOpacity>
      </View>

      {/* Preview Overlay */}
      {capturedUri && (
        <Animated.View style={[styles.previewOverlay, { opacity: previewOpacity }]}>
          <Image source={{ uri: capturedUri }} style={styles.previewImage} />

          {/* Glass panel */}
          <View style={[styles.previewPanel, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.previewHandle} />
            <Text style={styles.previewTitle}>Looks good?</Text>
            <Text style={styles.previewSub}>
              Analyse this meal and log its calories.
            </Text>

            <TouchableOpacity
              style={styles.analyseBtn}
              activeOpacity={0.88}
              onPress={handleAnalyse}
              disabled={analyzeState.status === "loading"}
            >
              {analyzeState.status === "loading" ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.analyseBtnText}>✦ Analyse Meal</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={retake}
              disabled={analyzeState.status === "loading"}
            >
              <Text style={styles.retakeBtnText}>Retake</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Uploading/Analyzing Premium Loading Overlay */}
      {analyzeState.status === "loading" && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Uploading to AI Backend...</Text>
          <Text style={styles.loadingSubtext}>Gemini is estimating macros & calories</Text>
        </View>
      )}
    </View>
  );
}

const CORNER = 22;
const FRAME_W = width * 0.78;
const FRAME_H = width * 0.78;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  vignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "transparent",
    shadowColor: "#000",
    // gradient simulation via nested views handled below
  },
  // ---------- Permission ----------
  permissionBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    backgroundColor: "#05050a",
  },
  permissionIcon: { fontSize: 52, marginBottom: 20 },
  permissionTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  permissionSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 36,
  },
  grantBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  grantBtnText: { color: "#000", fontWeight: "700", fontSize: 16 },

  // ---------- Top Bar ----------
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  topCenter: { alignItems: "center" },
  topLabel: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 3,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  iconBtnText: { color: "#fff", fontSize: 16, fontWeight: "400" },

  // ---------- Frame ----------
  frameWrapper: {
    position: "absolute",
    top: height / 2 - FRAME_H / 2 - 30,
    left: (width - FRAME_W) / 2,
    width: FRAME_W,
    height: FRAME_H,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 14,
  },
  frameCornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: CORNER,
    height: CORNER,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: "#fff",
    borderTopLeftRadius: 6,
  },
  frameCornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: CORNER,
    height: CORNER,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: "#fff",
    borderTopRightRadius: 6,
  },
  frameCornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: CORNER,
    height: CORNER,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: "#fff",
    borderBottomLeftRadius: 6,
  },
  frameCornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: CORNER,
    height: CORNER,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: "#fff",
    borderBottomRightRadius: 6,
  },
  frameHint: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: "500",
  },

  // ---------- Bottom Bar ----------
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 44,
    zIndex: 10,
  },
  captureOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#fff",
  },
  sideBtn: { alignItems: "center", gap: 5, width: 56 },
  sideBtnIcon: { fontSize: 22, color: "#fff" },
  sideBtnLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    letterSpacing: 0.5,
    fontWeight: "500",
  },

  // ---------- Preview ----------
  previewOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
  },
  previewImage: {
    width,
    height,
    resizeMode: "cover",
  },
  previewPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(10,10,10,0.88)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    ...(Platform.OS === "ios" && {
      backdropFilter: "blur(20px)",
    }),
  },
  previewHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginBottom: 20,
  },
  previewTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  previewSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 24,
  },
  analyseBtn: {
    backgroundColor: "#fff",
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 12,
  },
  analyseBtnText: {
    color: "#05050a",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  retakeBtn: {
    paddingVertical: 13,
    alignItems: "center",
  },
  retakeBtnText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.85)",
    zIndex: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  loadingSubtext: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    marginTop: 8,
  },
});
