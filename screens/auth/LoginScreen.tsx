import React, { useState, useEffect } from "react";
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
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { PressScale } from "../../components/PressScale";
import { colors, radius, shadow, spacing, typography, ui } from "../../components/DesignSystem";
import { useAuth } from "../../contexts/AuthContext";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Ionicons } from "@expo/vector-icons";

WebBrowser.maybeCompleteAuthSession();

const { width: W } = Dimensions.get("window");

export default function LoginScreen({ navigation }: any) {
  const { login, loginWithGoogle, linkGoogleAccount } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Inline Validation States
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  // Google Sign-In & Linking States
  const [googleLoading, setGoogleLoading] = useState(false);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkPassword, setLinkPassword] = useState("");
  const [linkingLoading, setLinkingLoading] = useState(false);
  const [tempGoogleIdToken, setTempGoogleIdToken] = useState("");
  const [tempGoogleAccessToken, setTempGoogleAccessToken] = useState("");

  const [googleRequest, googleResponse, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
    responseType: "id_token",
    scopes: ["profile", "email"],
  });

  useEffect(() => {
    if (googleRequest?.url && __DEV__) {
      console.log("LOGIN REDIRECT URI:", googleRequest.url);
    }
  }, [googleRequest]);

  useEffect(() => {
    if (googleResponse?.type === "success") {
      const { id_token, access_token } = googleResponse.params;
      if (!id_token) {
        setGeneralError("Failed to retrieve authentication token from Google.");
        return;
      }
      handleGoogleAuth(id_token, access_token || "");
    }
  }, [googleResponse]);

  const handleGoogleAuth = async (idToken: string, accessToken?: string) => {
    setGoogleLoading(true);
    setGeneralError("");
    try {
      await loginWithGoogle(idToken, accessToken);
    } catch (error: any) {
      if (error?.code === "auth/account-exists-with-different-credential") {
        const emailAddress = error?.customData?.email || "";
        setLinkEmail(emailAddress);
        setTempGoogleIdToken(idToken);
        setTempGoogleAccessToken(accessToken || "");
        setLinkModalVisible(true);
      } else {
        const code = error?.code ?? "";
        const msg =
          code === "auth/network-request-failed"
            ? "No internet connection. Please try again."
            : error.message || "Google authentication failed.";
        setGeneralError(msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLinkAccount = async () => {
    if (!linkPassword) {
      Alert.alert("Password Required", "Please enter the password for your existing account.");
      return;
    }
    setLinkingLoading(true);
    try {
      await linkGoogleAccount(linkEmail, linkPassword, tempGoogleIdToken, tempGoogleAccessToken);
      setLinkModalVisible(false);
      setLinkPassword("");
    } catch (error: any) {
      Alert.alert("Linking Failed", error.message || "Incorrect password or network error.");
    } finally {
      setLinkingLoading(false);
    }
  };

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

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Button */}
            <PressScale
              style={[
                styles.googleButton,
                (googleLoading || !googleRequest) && styles.disabledButton
              ]}
              onPress={() => {
                setGoogleLoading(true);
                promptAsync().catch((err) => {
                  if (__DEV__) console.error("Google Auth Prompt failed:", err);
                  setGoogleLoading(false);
                });
              }}
              disabled={googleLoading || !googleRequest}
            >
              {googleLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={styles.googleButtonContent}>
                  <Ionicons name="logo-google" size={20} color="#fff" style={styles.googleIcon} />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </View>
              )}
            </PressScale>

            {/* Account Linking Modal */}
            <Modal
              visible={linkModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setLinkModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Link Google Account</Text>
                  <Text style={styles.modalSubtitle}>
                    An account with the email <Text style={{ fontWeight: '700', color: colors.violet }}>{linkEmail}</Text> already exists.
                  </Text>
                  <Text style={styles.modalInstruction}>
                    Please enter your password to link your Google sign-in.
                  </Text>

                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter password"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry
                    value={linkPassword}
                    onChangeText={setLinkPassword}
                    autoCapitalize="none"
                  />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalCancelButton]}
                      onPress={() => {
                        setLinkModalVisible(false);
                        setLinkPassword("");
                      }}
                    >
                      <Text style={styles.modalCancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalLinkButton]}
                      onPress={handleLinkAccount}
                      disabled={linkingLoading}
                    >
                      {linkingLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.modalLinkButtonText}>Link Account</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

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
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  dividerText: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: "700",
    marginHorizontal: 16,
    letterSpacing: 1,
  },
  googleButton: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.xl,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.panelDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    ...shadow.card,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  modalInstruction: {
    fontSize: 13,
    color: colors.textDim,
    lineHeight: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#fff",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalCancelButtonText: {
    color: colors.textMuted,
    fontWeight: "700",
    fontSize: 14,
  },
  modalLinkButton: {
    backgroundColor: colors.purple,
    ...shadow.glowPurple,
  },
  modalLinkButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
});
