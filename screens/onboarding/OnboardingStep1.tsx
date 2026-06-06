import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { PressScale } from '../../components/PressScale';
import { colors, radius, shadow, spacing, typography, ui } from '../../components/DesignSystem';

export default function OnboardingStep1({ navigation, route }: any) {
  const { userData = {} } = route.params || {};
  const [name, setName] = useState(userData.name || '');
  const [age, setAge] = useState(userData.age || '');
  const [gender, setGender] = useState(userData.gender || '');
  const [height, setHeight] = useState(userData.height || '');
  const [weight, setWeight] = useState(userData.weight || '');

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
    const ageNum = parseInt(age);
    const heightNum = parseInt(height);
    const weightNum = parseInt(weight);

    if (!name.trim()) {
      Alert.alert("Missing Info", "Please enter your name.");
      return;
    }
    if (isNaN(ageNum) || ageNum < 10 || ageNum > 120) {
      Alert.alert("Invalid Age", "Please enter a valid age between 10 and 120.");
      return;
    }
    if (!gender) {
      Alert.alert("Missing Info", "Please select your biological sex.");
      return;
    }
    if (isNaN(heightNum) || heightNum < 100 || heightNum > 250) {
      Alert.alert("Invalid Height", "Please enter a valid height in cm (100–250).");
      return;
    }
    if (isNaN(weightNum) || weightNum < 20 || weightNum > 300) {
      Alert.alert("Invalid Weight", "Please enter a valid weight in kg (20–300).");
      return;
    }

    navigation.navigate('OnboardingStep2', {
      userData: {
        ...userData,
        name: name.trim(),
        age: ageNum,
        gender,
        height: heightNum,
        weight: weightNum,
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
              <View style={[styles.progressFill, { width: '20%' }]} />
            </View>
            <Text style={styles.stepText}>Step 1 of 5</Text>
          </View>

          {/* Header */}
          <Text style={styles.title}>Let's Get Started</Text>
          <Text style={styles.subtitle}>Tell us about yourself to personalize your experience</Text>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={colors.textDim}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="25"
                placeholderTextColor={colors.textDim}
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderOptions}>
                <TouchableOpacity
                  style={[styles.genderOption, gender === 'male' && styles.genderOptionSelected]}
                  onPress={() => setGender('male')}
                >
                  <Text style={[styles.genderText, gender === 'male' && styles.genderTextSelected]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderOption, gender === 'female' && styles.genderOptionSelected]}
                  onPress={() => setGender('female')}
                >
                  <Text style={[styles.genderText, gender === 'female' && styles.genderTextSelected]}>Female</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderOption, gender === 'other' && styles.genderOptionSelected]}
                  onPress={() => setGender('other')}
                >
                  <Text style={[styles.genderText, gender === 'other' && styles.genderTextSelected]}>Other</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.half]}>
                <Text style={styles.label}>Height (cm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="175"
                  placeholderTextColor={colors.textDim}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>

              <View style={[styles.inputGroup, styles.half]}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="70"
                  placeholderTextColor={colors.textDim}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>
          </View>

          {/* Button */}
          <PressScale
            style={[styles.nextButton, (!name || !age || !gender || !height || !weight) && styles.disabledButton]}
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
    marginBottom: 40,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  half: {
    flex: 1,
  },
  label: {
    ...typography.tiny,
    fontSize: 12,
    color: colors.textDim,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.panelDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    backgroundColor: colors.panelDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: colors.purpleDeep,
    borderColor: colors.violet,
  },
  genderText: {
    fontSize: 14,
    color: colors.textDim,
    fontWeight: '600',
  },
  genderTextSelected: {
    color: '#fff',
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
