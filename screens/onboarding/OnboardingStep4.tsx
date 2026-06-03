import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { PressScale } from '../../components/PressScale';
import { colors, radius, shadow, spacing, typography, ui } from '../../components/DesignSystem';

const DIET_PREFERENCES = [
  {
    id: 'no_restriction',
    title: 'No Restrictions',
    description: 'No specific dietary preferences',
    icon: '🍽️',
  },
  {
    id: 'vegetarian',
    title: 'Vegetarian',
    description: 'No meat, includes dairy and eggs',
    icon: '🥬',
  },
  {
    id: 'vegan',
    title: 'Vegan',
    description: 'Plant-based only',
    icon: '🌱',
  },
  {
    id: 'high_protein',
    title: 'High Protein',
    description: 'Focus on protein-rich foods',
    icon: '🥩',
  },
  {
    id: 'keto',
    title: 'Keto',
    description: 'Low carb, high fat',
    icon: '🥑',
  },
  {
    id: 'balanced',
    title: 'Balanced',
    description: 'Well-rounded macronutrients',
    icon: '⚖️',
  },
  {
    id: 'indian',
    title: 'Indian Diet',
    description: 'Traditional Indian cuisine',
    icon: '🍛',
  },
];

export default function OnboardingStep4({ navigation, route }: any) {
  const { userData = {} } = route.params || {};
  const [selectedPreference, setSelectedPreference] = React.useState(userData.dietPreference || '');

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
    // Diet preference is optional, default to no_restriction if not selected
    const preference = selectedPreference || 'no_restriction';

    navigation.navigate('OnboardingStep5', {
      userData: {
        ...userData,
        dietPreference: preference,
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
              <View style={[styles.progressFill, { width: '80%' }]} />
            </View>
            <Text style={styles.stepText}>Step 4 of 5</Text>
          </View>

          {/* Header */}
          <Text style={styles.title}>Diet Preference</Text>
          <Text style={styles.subtitle}>Select your dietary preference (optional)</Text>

          {/* Diet Preferences */}
          <View style={styles.preferencesContainer}>
            {DIET_PREFERENCES.map((pref) => (
              <TouchableOpacity
                key={pref.id}
                style={[styles.prefCard, selectedPreference === pref.id && styles.prefCardSelected]}
                onPress={() => setSelectedPreference(pref.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.prefIcon}>{pref.icon}</Text>
                <View style={styles.prefTextContainer}>
                  <Text style={styles.prefTitle}>{pref.title}</Text>
                  <Text style={styles.prefDescription}>{pref.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Button */}
          <PressScale
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>Continue</Text>
          </PressScale>

          {/* Skip Text */}
          <TouchableOpacity onPress={handleNext}>
            <Text style={styles.skipText}>Skip this step</Text>
          </TouchableOpacity>
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
  preferencesContainer: {
    gap: 12,
    marginBottom: 24,
  },
  prefCard: {
    backgroundColor: colors.panelDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  prefCardSelected: {
    backgroundColor: colors.purpleDeep,
    borderColor: colors.violet,
  },
  prefIcon: {
    fontSize: 28,
  },
  prefTextContainer: {
    flex: 1,
  },
  prefTitle: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '800',
  },
  prefDescription: {
    fontSize: 12,
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
    marginBottom: 16,
    ...shadow.glowPurple,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  skipText: {
    fontSize: 14,
    color: colors.textDim,
    textAlign: 'center',
    fontWeight: '600',
  },
});
