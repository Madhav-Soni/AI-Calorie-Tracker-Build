import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  Easing,
} from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

const { width } = Dimensions.get("window");

// ─── SHIMMER COMPONENT ────────────────────────────────────────────────────────
interface ShimmerProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

export function Shimmer({ width: w, height: h, borderRadius = 12, style }: ShimmerProps) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.75,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.shimmer,
        {
          width: w,
          height: h,
          borderRadius,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

// ─── AI SCANNING ANIMATION ────────────────────────────────────────────────────
interface AIScanningProps {
  imageUri?: string;
}

export function AIScanning({ imageUri }: AIScanningProps) {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Scan bar up/down loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse scale loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const scanY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240],
  });

  return (
    <View style={styles.scanContainer}>
      {/* Outer glowing frame */}
      <Animated.View style={[styles.scanFrame, { transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />
        
        {/* Animated laser scan line */}
        <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanY }] }]}>
          <View style={styles.laserGlow} />
        </Animated.View>

        <View style={styles.scanningBadge}>
          <Text style={styles.scanningText}>🤖 AI SCANNING MEAL</Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── PREMIUM ANALYSIS SPINNER ────────────────────────────────────────────────
export function AnalysisSpinner() {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.spinnerCenter}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Svg width={64} height={64}>
          <Defs>
            <LinearGradient id="spinnerGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#7c3aed" stopOpacity="1" />
              <Stop offset="100%" stopColor="#06060f" stopOpacity="0.1" />
            </LinearGradient>
          </Defs>
          <Circle
            cx={32}
            cy={32}
            r={26}
            stroke="url(#spinnerGrad)"
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
      <Text style={styles.spinnerText}>AI is analyzing nutritional data...</Text>
      <Text style={styles.spinnerSubtext}>estimating calories and macro breakdown</Text>
    </View>
  );
}

// ─── HOME SCREEN SKELETON LOADER ─────────────────────────────────────────────
export function HomeScreenSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      {/* Header Skeleton */}
      <View style={styles.skeletonHeader}>
        <View style={{ gap: 6 }}>
          <Shimmer width={120} height={12} borderRadius={6} />
          <Shimmer width={180} height={24} borderRadius={8} />
        </View>
        <Shimmer width={46} height={46} borderRadius={23} />
      </View>

      {/* Hero Card Skeleton */}
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonCardInner}>
          <Shimmer width={130} height={130} borderRadius={65} />
          <View style={{ flex: 1, gap: 14, marginLeft: 20 }}>
            <View style={{ gap: 6 }}>
              <Shimmer width={80} height={8} />
              <Shimmer width={100} height={20} />
            </View>
            <View style={{ gap: 6 }}>
              <Shimmer width={60} height={8} />
              <Shimmer width={80} height={20} />
            </View>
          </View>
        </View>
      </View>

      {/* Macros Row Skeleton */}
      <View style={styles.skeletonRow}>
        <Shimmer width="31%" height={70} borderRadius={18} />
        <Shimmer width="31%" height={70} borderRadius={18} />
        <Shimmer width="31%" height={70} borderRadius={18} />
      </View>

      {/* Weekly Chart Card Skeleton */}
      <View style={[styles.skeletonCard, { height: 160 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
          <Shimmer width={110} height={12} />
          <Shimmer width={80} height={20} borderRadius={10} />
        </View>
        <View style={styles.chartSkeleton}>
          <Shimmer width={16} height={50} borderRadius={4} />
          <Shimmer width={16} height={70} borderRadius={4} />
          <Shimmer width={16} height={40} borderRadius={4} />
          <Shimmer width={16} height={60} borderRadius={4} />
          <Shimmer width={16} height={80} borderRadius={4} />
          <Shimmer width={16} height={35} borderRadius={4} />
          <Shimmer width={16} height={55} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  shimmer: {
    backgroundColor: "#16162a",
  },
  scanContainer: {
    width: "100%",
    height: 280,
    backgroundColor: "#06060f",
    alignItems: "center",
    justifyContent: "center",
  },
  scanFrame: {
    width: 240,
    height: 240,
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.15)",
  },
  cornerTL: { position: "absolute", top: 0, left: 0, width: 20, height: 20, borderLeftWidth: 2, borderTopWidth: 2, borderColor: "#a855f7" },
  cornerTR: { position: "absolute", top: 0, right: 0, width: 20, height: 20, borderRightWidth: 2, borderTopWidth: 2, borderColor: "#a855f7" },
  cornerBL: { position: "absolute", bottom: 0, left: 0, width: 20, height: 20, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: "#a855f7" },
  cornerBR: { position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderRightWidth: 2, borderBottomWidth: 2, borderColor: "#a855f7" },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#a855f7",
  },
  laserGlow: {
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    height: 8,
    backgroundColor: "#a855f7",
    marginTop: -2,
  },
  scanningBadge: {
    position: "absolute",
    alignSelf: "center",
    bottom: 20,
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scanningText: {
    color: "#c084fc",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  spinnerCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  spinnerText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 20,
    textAlign: "center",
  },
  spinnerSubtext: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  skeletonContainer: {
    paddingHorizontal: 18,
    paddingTop: 28,
    backgroundColor: "#06060f",
    flex: 1,
  },
  skeletonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  skeletonCard: {
    backgroundColor: "#0c0c1a",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    padding: 20,
    marginBottom: 14,
  },
  skeletonCardInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  skeletonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  chartSkeleton: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 80,
  },
});
