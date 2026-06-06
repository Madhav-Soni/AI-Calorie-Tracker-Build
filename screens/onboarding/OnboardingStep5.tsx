import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { PressScale } from '../../components/PressScale';
import { colors, radius, shadow, spacing, typography, ui } from '../../components/DesignSystem';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfileStore } from '../../store/userProfileStore';

// Mifflin-St Jeor Equation for BMR
function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

// Calculate TDEE based on activity level
function calculateTDEE(bmr: number, activityMultiplier: number): number {
  return Math.round(bmr * activityMultiplier);
}

// Calculate macros based on goal
function calculateMacros(tdee: number, goal: string): { calories: number; protein: number; carbs: number; fat: number } {
  let adjustedCalories = tdee;
  let proteinRatio = 0.3;
  let fatRatio = 0.3;
  let carbRatio = 0.4;

  switch (goal) {
    case 'lose_fat':
      adjustedCalories = tdee - 500; // 500 calorie deficit
      proteinRatio = 0.35; // Higher protein for satiety
      fatRatio = 0.3;
      carbRatio = 0.35;
      break;
    case 'maintain':
      adjustedCalories = tdee;
      proteinRatio = 0.3;
      fatRatio = 0.3;
      carbRatio = 0.4;
      break;
    case 'build_muscle':
      adjustedCalories = tdee + 300; // 300 calorie surplus
      proteinRatio = 0.35; // Higher protein for muscle building
      fatRatio = 0.25;
      carbRatio = 0.4;
      break;
    case 'athlete':
      adjustedCalories = tdee + 500; // Higher surplus for performance
      proteinRatio = 0.3;
      fatRatio = 0.25;
      carbRatio = 0.45; // Higher carbs for energy
      break;
  }

  const protein = Math.round((adjustedCalories * proteinRatio) / 4);
  const fat = Math.round((adjustedCalories * fatRatio) / 9);
  const carbs = Math.round((adjustedCalories * carbRatio) / 4);

  return {
    calories: adjustedCalories,
    protein,
    carbs,
    fat,
  };
}

export default function OnboardingStep5({ navigation, route }: any) {
  const { user } = useAuth();
  const { userData = {} } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [calculatedGoals, setCalculatedGoals] = useState<any>(null);

  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(30);

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    slideAnim.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });

    // Calculate goals
    if (userData.weight && userData.height && userData.age && userData.gender && userData.activityMultiplier && userData.goal) {
      const bmr = calculateBMR(userData.weight, userData.height, userData.age, userData.gender);
      const tdee = calculateTDEE(bmr, userData.activityMultiplier || 1.2);
      const macros = calculateMacros(tdee, userData.goal);
      setCalculatedGoals(macros);
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const handleComplete = async () => {
    if (!user || !calculatedGoals) return;

    setLoading(true);
    try {
      // Update user document with onboarding data using store
      await useUserProfileStore.getState().updateProfile(user.uid, {
        ...userData,
        calorieTarget: calculatedGoals.calories,
        proteinTarget: calculatedGoals.protein,
        carbTarget: calculatedGoals.carbs,
        fatTarget: calculatedGoals.fat,
        onboardingCompleted: true,
      });

      // Navigate to main app and reset navigation stack
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error completing onboarding:', error);
      }
      Alert.alert('Error', 'Failed to save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!calculatedGoals) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.violet} />
          <Text style={styles.loadingText}>Calculating your personalized plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.container, animatedStyle]}>
          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
            <Text style={styles.stepText}>Step 5 of 5</Text>
          </View>

          {/* Header */}
          <Text style={styles.title}>Your Personalized Plan</Text>
          <Text style={styles.subtitle}>Based on your goals and activity level</Text>

          {/* Calorie Target Card */}
          <View style={styles.calorieCard}>
            <Text style={styles.calorieLabel}>Daily Calorie Target</Text>
            <Text style={styles.calorieValue}>{calculatedGoals.calories.toLocaleString()}</Text>
            <Text style={styles.calorieUnit}>kcal/day</Text>
          </View>

          {/* Macros */}
          <Text style={styles.sectionTitle}>Macro Targets</Text>
          {(() => {
            const proteinCals = calculatedGoals.protein * 4;
            const carbCals = calculatedGoals.carbs * 4;
            const fatCals = calculatedGoals.fat * 9;
            const totalCals = proteinCals + carbCals + fatCals;
            const pPct = totalCals > 0 ? Math.round((proteinCals / totalCals) * 100) : 35;
            const cPct = totalCals > 0 ? Math.round((carbCals / totalCals) * 100) : 35;
            const fPct = 100 - pPct - cPct;

            return (
              <View style={styles.macrosContainer}>
                <View style={styles.macroCard}>
                  <Text style={[styles.macroLabel, { color: '#60a5fa' }]}>Protein</Text>
                  <Text style={styles.macroValue}>{calculatedGoals.protein}g</Text>
                  <Text style={styles.macroPercent}>{pPct}%</Text>
                </View>
                <View style={styles.macroCard}>
                  <Text style={[styles.macroLabel, { color: '#34d399' }]}>Carbs</Text>
                  <Text style={styles.macroValue}>{calculatedGoals.carbs}g</Text>
                  <Text style={styles.macroPercent}>{cPct}%</Text>
                </View>
                <View style={styles.macroCard}>
                  <Text style={[styles.macroLabel, { color: '#f472b6' }]}>Fat</Text>
                  <Text style={styles.macroValue}>{calculatedGoals.fat}g</Text>
                  <Text style={styles.macroPercent}>{fPct}%</Text>
                </View>
              </View>
            );
          })()}

          {/* Recommendations */}
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.recommendationsCard}>
            <View style={styles.recommendationItem}>
              <Text style={styles.recommendationIcon}>💧</Text>
              <View style={styles.recommendationText}>
                <Text style={styles.recommendationTitle}>Hydration</Text>
                <Text style={styles.recommendationDesc}>Drink {Math.round(userData.weight * 0.033)}L water daily</Text>
              </View>
            </View>
            <View style={styles.recommendationItem}>
              <Text style={styles.recommendationIcon}>🍽️</Text>
              <View style={styles.recommendationText}>
                <Text style={styles.recommendationTitle}>Meal Frequency</Text>
                <Text style={styles.recommendationDesc}>Aim for 3-4 balanced meals per day</Text>
              </View>
            </View>
            <View style={styles.recommendationItem}>
              <Text style={styles.recommendationIcon}>⏰</Text>
              <View style={styles.recommendationText}>
                <Text style={styles.recommendationTitle}>Timing</Text>
                <Text style={styles.recommendationDesc}>Log meals within 30 minutes of eating</Text>
              </View>
            </View>
          </View>

          {/* Button */}
          <PressScale
            style={styles.completeButton}
            onPress={handleComplete}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.completeButtonText}>Start Your Journey</Text>
            )}
          </PressScale>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: ui.screen,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textDim,
    marginTop: 16,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 20,
    paddingBottom: 40,
  },
  container: {
    flex: 1,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.violet,
    borderRadius: 2,
  },
  stepText: {
    ...typography.tiny,
    fontSize: 12,
    color: colors.textDim,
    fontWeight: '600',
  },
  title: {
    ...typography.hero,
    fontSize: 32,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    fontSize: 15,
    color: colors.textDim,
    marginBottom: 32,
  },
  calorieCard: {
    backgroundColor: colors.purpleDeep,
    borderRadius: radius.xxl,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    ...shadow.glowPurple,
  },
  calorieLabel: {
    ...typography.tiny,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: 8,
  },
  calorieValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  calorieUnit: {
    ...typography.tiny,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.sectionLabel,
    marginBottom: 12,
  },
  macrosContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  macroCard: {
    flex: 1,
    backgroundColor: colors.panelDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    alignItems: 'center',
  },
  macroLabel: {
    ...typography.tiny,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
  },
  macroPercent: {
    ...typography.tiny,
    fontSize: 10,
    color: colors.textDim,
    fontWeight: '600',
  },
  recommendationsCard: {
    backgroundColor: colors.panelDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 24,
    ...shadow.card,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recommendationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  recommendationText: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  recommendationDesc: {
    fontSize: 12,
    color: colors.textDim,
  },
  completeButton: {
    backgroundColor: colors.purpleDeep,
    borderRadius: radius.xxl,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    ...shadow.glowPurple,
  },
  completeButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
