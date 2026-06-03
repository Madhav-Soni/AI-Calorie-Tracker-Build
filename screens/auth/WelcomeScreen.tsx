import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { PressScale } from '../../components/PressScale';
import { colors, radius, shadow, spacing, typography, ui } from '../../components/DesignSystem';

export default function WelcomeScreen({ navigation }: any) {
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
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: ui.screen,
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  container: {
    alignItems: 'center',
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
});
