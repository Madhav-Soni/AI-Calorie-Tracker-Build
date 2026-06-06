import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { PressScale } from '../../components/PressScale';
import { colors, radius, shadow, spacing, typography, ui } from '../../components/DesignSystem';
import { useAuth } from '../../contexts/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

export default function WelcomeScreen({ navigation }: any) {
  const { loginWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

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
      console.log("WELCOME REDIRECT URI:", googleRequest.url);
    }
  }, [googleRequest]);

  useEffect(() => {
    if (googleResponse?.type === "success") {
      const { id_token, access_token } = googleResponse.params;
      if (!id_token) {
        Alert.alert("Google Sign-In Failed", "Failed to retrieve authentication token from Google.");
        return;
      }
      handleGoogleAuth(id_token, access_token || "");
    }
  }, [googleResponse]);

  const handleGoogleAuth = async (idToken: string, accessToken?: string) => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle(idToken, accessToken);
    } catch (error: any) {
      if (error?.code === "auth/account-exists-with-different-credential") {
        Alert.alert(
          "Account Exists",
          "An account with this email already exists under a password login. Please Sign In with your email and password, then link your Google account in settings.",
          [
            { text: "Go to Sign In", onPress: () => navigation.navigate("Login") },
            { text: "Cancel", style: "cancel" }
          ]
        );
      } else {
        const code = error?.code ?? "";
        const msg =
          code === "auth/network-request-failed"
            ? "No internet connection. Please try again."
            : error.message || "Google authentication failed.";
        Alert.alert("Google Sign-In Failed", msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(30);

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    slideAnim.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.container, animatedStyle]}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>⚡</Text>
          </View>

          {/* Hero Text */}
          <Text style={styles.title}>Track Your Nutrition</Text>
          <Text style={styles.subtitle}>
            AI-powered calorie tracking with personalized diet plans based on your goals
          </Text>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>📸</Text>
              <Text style={styles.featureText}>Snap & Track</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🎯</Text>
              <Text style={styles.featureText}>Personalized Goals</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🤖</Text>
              <Text style={styles.featureText}>AI Coach</Text>
            </View>
          </View>

          {/* Buttons */}
          <PressScale
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </PressScale>

          <PressScale
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
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
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: ui.screen,
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  container: {
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    fontSize: 80,
  },
  title: {
    ...typography.hero,
    fontSize: 36,
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    fontSize: 16,
    color: colors.textDim,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 48,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    ...typography.tiny,
    fontSize: 12,
    color: colors.textDim,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: colors.purpleDeep,
    borderRadius: radius.xxl,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    ...shadow.glowPurple,
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: colors.panelDeep,
    borderRadius: radius.xxl,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
    width: '100%',
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
    borderRadius: radius.xxl,
    paddingVertical: 18,
    paddingHorizontal: 48,
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
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
