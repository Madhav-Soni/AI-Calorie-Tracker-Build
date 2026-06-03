import { Platform, StyleSheet } from "react-native";

// Premium visual system shared across screens. Keep this lightweight: tokens are
// plain React Native values so existing screen logic can adopt them incrementally.
export const colors = {
  ink: "#050510",
  inkElevated: "#0A0A17",
  panel: "rgba(13, 13, 26, 0.86)",
  panelSolid: "#0D0D1A",
  panelDeep: "rgba(9, 9, 20, 0.94)",
  panelSoft: "rgba(255, 255, 255, 0.045)",
  border: "rgba(139, 126, 246, 0.14)",
  borderStrong: "rgba(168, 85, 247, 0.26)",
  text: "#FFFFFF",
  textMuted: "rgba(255, 255, 255, 0.58)",
  textDim: "rgba(255, 255, 255, 0.34)",
  purple: "#8B5CF6",
  purpleDeep: "#6D28D9",
  violet: "#A855F7",
  blue: "#60A5FA",
  cyan: "#22D3EE",
  green: "#34D399",
  pink: "#F472B6",
  rose: "#FB7185",
  amber: "#FACC15",
  red: "#F87171",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 999,
};

export const shadow = {
  glowPurple: {
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: Platform.OS === "ios" ? 0.16 : 0.22,
    shadowRadius: 20,
    elevation: 7,
  },
  glowSoft: {
    shadowColor: colors.violet,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  glowGreen: {
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
};

export const typography = {
  hero: {
    fontSize: 34,
    fontWeight: "900" as const,
    letterSpacing: 0,
    color: colors.text,
  },
  title: {
    fontSize: 26,
    fontWeight: "900" as const,
    letterSpacing: 0,
    color: colors.text,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800" as const,
    letterSpacing: 0,
    color: colors.text,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800" as const,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const,
    color: colors.textDim,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  caption: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textDim,
  },
  tiny: {
    fontSize: 10,
    lineHeight: 13,
    color: colors.textDim,
  },
};

export const ui = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  glassCard: {
    backgroundColor: colors.panelDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadow.card,
  },
  softCard: {
    backgroundColor: colors.panelSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  primaryButton: {
    backgroundColor: colors.purpleDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 7,
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
});
