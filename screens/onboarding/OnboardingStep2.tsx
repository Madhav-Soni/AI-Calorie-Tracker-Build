import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { PressScale } from '../../components/PressScale';
import { colors, radius, shadow, spacing, typography, ui } from '../../components/DesignSystem';

const GOALS = [
  {
    id: 'lose_fat',
    title: 'Lose Fat',
    description: 'Burn calories and reduce body fat',
    icon: '🔥',
  },
  {
    id: 'maintain',
    title: 'Maintain Weight',
    description: 'Keep your current weight stable',
    icon: '⚖️',
  },
  {
    id: 'build_muscle',
    title: 'Build Muscle',
    description: 'Gain strength and muscle mass',
    icon: '💪',
  },
  {
    id: 'athlete',
    title: 'Athlete Performance',
    description: 'Optimize for athletic performance',
    icon: '🏆',
  },
];

export default function OnboardingStep2({ navigation, route }: any) {
  const { userData = {} } = route.params || {};
  const [selectedGoal, setSelectedGoal] = React.useState(userData.goal || '');

  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(30);

  React.useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    slideAnim.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const handleNext = () => {
    if (!selectedGoal) {
      return;
    }

    navigation.navigate('OnboardingStep3', {
      userData: {
        ...userData,
        goal: selectedGoal,
      },
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.container, animatedStyle]}>
          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '40%' }]} />
            </View>
            <Text style={styles.stepText}>Step 2 of 5</Text>
          </View>

          {/* Header */}
          <Text style={styles.title}>What's Your Goal?</Text>
          <Text style={styles.subtitle}>Choose your primary fitness goal</Text>

          {/* Goals */}
          <View style={styles.goalsContainer}>
            {GOALS.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[styles.goalCard, selectedGoal === goal.id && styles.goalCardSelected]}
                onPress={() => setSelectedGoal(goal.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.goalIcon}>{goal.icon}</Text>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalDescription}>{goal.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Button */}
          <PressScale
            style={[styles.nextButton, !selectedGoal && styles.disabledButton]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>Continue</Text>
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
  goalsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  goalCard: {
    backgroundColor: colors.panelDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  goalCardSelected: {
    backgroundColor: colors.purpleDeep,
    borderColor: colors.violet,
  },
  goalIcon: {
    fontSize: 32,
  },
  goalTitle: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '800',
  },
  goalDescription: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 4,
  },
  nextButton: {
    backgroundColor: colors.purpleDeep,
    borderRadius: radius.xxl,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    ...shadow.glowPurple,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
