import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { PressScale } from "../../components/PressScale";
import { colors, radius, shadow, spacing, typography, ui } from "../../components/DesignSystem";
import { useAuth } from "../../contexts/AuthContext";

const { width: W } = Dimensions.get("window");

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Inline Validation States
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(20);

  React.useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    slideAnim.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const validate = () => {
    let valid = true;
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    if (!email) {
      setEmailError("Email is required.");
      valid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError("Please enter a valid email address.");
        valid = false;
      }
    }

    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      valid = false;
    }

    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      const code = error?.code ?? "";
      const msg =
        code === "auth/invalid-email"        ? "Please enter a valid email address." :
        code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential"
          ? "Incorrect email or password."
          : code === "auth/network-request-failed"
          ? "No internet connection. Please try again."
          : "Login failed. Please check your credentials.";
      setGeneralError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.container, animatedStyle]}>
            {/* Header */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue tracking your nutrition</Text>

            {/* General Error Alert Banner */}
            {!!generalError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{generalError}</Text>
              </View>
            )}

            {/* Glassmorphism Credentials Card */}
            <View style={styles.glassCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <TextInput
                  style={[styles.input, !!emailError && styles.inputErrorBorder]}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.textDim}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError("");
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PASSWORD</Text>
                <TextInput
                  style={[styles.input, !!passwordError && styles.inputErrorBorder]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textDim}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError("");
                  }}
                  secureTextEntry
                />
                {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPassword")}
                style={styles.forgotPasswordWrap}
              >
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <PressScale
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </PressScale>

            {/* Navigation options to Sign Up */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: ui.screen,
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 16,
    paddingBottom: 40,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
  },
  backButton: {
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  backText: {
    fontSize: 16,
    color: colors.textDim,
    fontWeight: "700",
  },
  title: {
    ...typography.hero,
    fontSize: 34,
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    ...typography.body,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 28,
  },
  errorBanner: {
    backgroundColor: "rgba(248,113,113,0.12)",
    borderColor: "rgba(248,113,113,0.24)",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 20,
  },
  errorBannerText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  glassCard: {
    backgroundColor: "rgba(13, 13, 26, 0.65)",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 24,
    ...shadow.card,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    ...typography.tiny,
    fontSize: 10,
    color: colors.textDim,
    marginBottom: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.text,
    fontWeight: "600",
  },
  inputErrorBorder: {
    borderColor: "rgba(248,113,113,0.4)",
  },
  errorText: {
    color: colors.red,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 6,
    marginLeft: 2,
  },
  forgotPasswordWrap: {
    alignSelf: "flex-end",
    marginTop: 4,
  },
  forgotPassword: {
    fontSize: 13,
    color: colors.violet,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: colors.purple,
    borderRadius: radius.xl,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.6,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    fontSize: 13,
    color: colors.textDim,
    fontWeight: "600",
  },
  signupLink: {
    fontSize: 13,
    color: colors.violet,
    fontWeight: "800",
  },
});
