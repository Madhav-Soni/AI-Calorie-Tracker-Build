import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { PressScale } from '../../components/PressScale';
import { colors, radius, shadow, spacing, typography, ui } from '../../components/DesignSystem';

const ACTIVITY_LEVELS = [
  {
    id: 'sedentary',
    title: 'Sedentary',
    description: 'Little to no exercise',
    icon: '🪑',
    multiplier: 1.2,
  },
  {
    id: 'light',
    title: 'Lightly Active',
    description: 'Light exercise 1-3 days/week',
    icon: '🚶',
    multiplier: 1.375,
  },
  {
    id: 'moderate',
    title: 'Moderately Active',
    description: 'Moderate exercise 3-5 days/week',
    icon: '🏃',
    multiplier: 1.55,
  },
  {
    id: 'very_active',
    title: 'Very Active',
    description: 'Hard exercise 6-7 days/week',
    icon: '💪',
    multiplier: 1.725,
  },
  {
    id: 'athlete',
    title: 'Athlete',
    description: 'Very hard exercise, physical job',
    icon: '🏆',
    multiplier: 1.9,
  },
];

export default function OnboardingStep3({ navigation, route }: any) {
  const { userData = {} } = route.params || {};
  const [selectedLevel, setSelectedLevel] = React.useState(userData.activityLevel || '');

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
    if (!selectedLevel) {
      return;
    }

    const levelData = ACTIVITY_LEVELS.find(l => l.id === selectedLevel);
    
    navigation.navigate('OnboardingStep4', {
      userData: {
        ...userData,
        activityLevel: selectedLevel,
        activityMultiplier: levelData?.multiplier,
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
              <View style={[styles.progressFill, { width: '60%' }]} />
            </View>
            <Text style={styles.stepText}>Step 3 of 5</Text>
          </View>

          {/* Header */}
          <Text style={styles.title}>Activity Level</Text>
          <Text style={styles.subtitle}>How active are you on a daily basis?</Text>

          {/* Activity Levels */}
          <View style={styles.levelsContainer}>
            {ACTIVITY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[styles.levelCard, selectedLevel === level.id && styles.levelCardSelected]}
                onPress={() => setSelectedLevel(level.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.levelIcon}>{level.icon}</Text>
                <View style={styles.levelTextContainer}>
                  <Text style={styles.levelTitle}>{level.title}</Text>
                  <Text style={styles.levelDescription}>{level.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Button */}
          <PressScale
            style={[styles.nextButton, !selectedLevel && styles.disabledButton]}
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
  levelsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  levelCard: {
    backgroundColor: colors.panelDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  levelCardSelected: {
    backgroundColor: colors.purpleDeep,
    borderColor: colors.violet,
  },
  levelIcon: {
    fontSize: 28,
  },
  levelTextContainer: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '800',
  },
  levelDescription: {
    fontSize: 13,
    color: colors.textDim,
    marginTop: 2,
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
