import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { colors, radius, spacing, typography, ui } from "../components/DesignSystem";
import { useMealStore } from "../useMealStore";
import { PressScale } from "../components/PressScale";

const { width: W } = Dimensions.get("window");

export default function OnboardingScreen() {
  const completeOnboarding = useMealStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(1);

  // Form State
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male"); // male | female
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState("maintain"); // lose_fat | maintain | build_muscle
  const [activityLevel, setActivityLevel] = useState("lightly_active"); // sedentary | lightly_active | active | athlete

  // Calculated state
  const [calculatedGoals, setCalculatedGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 225,
    fat: 65,
  });

  const nextStep = () => {
    if (step === 2) {
      // Validate inputs
      const ageNum = parseInt(age, 10);
      const heightNum = parseFloat(height);
      const weightNum = parseFloat(weight);

      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        alert("Please enter a valid age.");
        return;
      }
      if (isNaN(heightNum) || heightNum < 50 || heightNum > 270) {
        alert("Please enter a valid height in cm.");
        return;
      }
      if (isNaN(weightNum) || weightNum < 20 || weightNum > 350) {
        alert("Please enter a valid weight in kg.");
        return;
      }
    }

    if (step === 4) {
      // Perform calculations before going to screen 5
      calculateNutrition();
    }

    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const calculateNutrition = () => {
    const ageNum = parseInt(age, 10);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    // BMR (Mifflin-St Jeor Equation)
    // BMR = 10 * weight (kg) + 6.25 * height (cm) - 5 * age (y) + s
    // s = +5 for men, -161 for women
    const genderS = gender === "male" ? 5 : -161;
    const bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + genderS;

    // Activity Multiplier
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      lightly_active: 1.375,
      active: 1.55,
      athlete: 1.725,
    };
    const multiplier = activityMultipliers[activityLevel] || 1.375;
    const tdee = bmr * multiplier;

    // Adjust calories based on goal
    let calGoal = Math.round(tdee);
    if (goal === "lose_fat") {
      calGoal = Math.round(tdee - 500); // 500 kcal deficit
    } else if (goal === "build_muscle") {
      calGoal = Math.round(tdee + 300); // 300 kcal surplus
    }

    // Floor to safe minimum calories
    if (calGoal < 1200) calGoal = 1200;

    // Macros calculations
    // Protein: 2.0g per kg of bodyweight
    let proteinG = Math.round(weightNum * 2.0);
    if (proteinG < 60) proteinG = 60; // minimum protein floor
    if (proteinG > 250) proteinG = 250;

    // Fat: 25% of total calories (9 kcal/gram)
    let fatG = Math.round((calGoal * 0.25) / 9);
    if (fatG < 30) fatG = 30; // minimum fat floor

    // Carbs: remaining calories (4 kcal/gram)
    const remainingKcal = calGoal - (proteinG * 4 + fatG * 9);
    let carbsG = Math.round(remainingKcal / 4);
    if (carbsG < 50) carbsG = 50;

    setCalculatedGoals({
      calories: calGoal,
      protein: proteinG,
      carbs: carbsG,
      fat: fatG,
    });
  };

  const handleFinish = () => {
    completeOnboarding(
      {
        age: parseInt(age, 10),
        gender,
        height: parseFloat(height),
        weight: parseFloat(weight),
        goal,
        activityLevel,
      },
      calculatedGoals
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Step Indicator */}
          {step > 1 && (
            <View style={s.progressBar}>
              {[2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  style={[
                    s.progressSegment,
                    i <= step ? s.progressSegmentActive : null,
                  ]}
                />
              ))}
            </View>
          )}

          {/* SCREEN 1: Welcome */}
          {step === 1 && (
            <View style={s.stepContent}>
              <View style={s.iconSplash}>
                <Text style={s.iconText}></Text>
              </View>
              <Text style={s.welcomeTitle}>Track nutrition{"\n"}with AI</Text>
              <Text style={s.welcomeSubtitle}>
                Instant meals recognition, personalized nutrition coaching, and smart macro tracking.
              </Text>
              <PressScale style={[ui.primaryButton, s.btnPrimary]} onPress={nextStep}>
                <Text style={s.btnText}>Get Started</Text>
              </PressScale>
            </View>
          )}

          {/* SCREEN 2: Basic Info */}
          {step === 2 && (
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>Tell us about yourself</Text>
              <Text style={s.stepSubtitle}>This info helps calculate your baseline metabolism accurately.</Text>

              {/* Gender Selector */}
              <Text style={s.label}>GENDER</Text>
              <View style={s.genderRow}>
                {["male", "female"].map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(g)}
                    style={[
                      s.genderOption,
                      gender === g ? s.optionActive : null,
                    ]}
                  >
                    <Text style={[s.optionText, gender === g ? s.optionTextActive : null]}>
                      {g === "male" ? "Male" : "Female"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Age, Height, Weight Fields */}
              <View style={s.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>AGE (years)</Text>
                  <TextInput
                    style={s.input}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="number-pad"
                    placeholder="25"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                </View>
              </View>

              <View style={s.inputRow}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={s.label}>HEIGHT (cm)</Text>
                  <TextInput
                    style={s.input}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="number-pad"
                    placeholder="175"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>WEIGHT (kg)</Text>
                  <TextInput
                    style={s.input}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    placeholder="70"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                </View>
              </View>

              <View style={s.footerNav}>
                <TouchableOpacity style={s.btnBack} onPress={prevStep}>
                  <Text style={s.btnBackText}>Back</Text>
                </TouchableOpacity>
                <PressScale style={[ui.primaryButton, s.btnNext]} onPress={nextStep}>
                  <Text style={s.btnText}>Continue</Text>
                </PressScale>
              </View>
            </View>
          )}

          {/* SCREEN 3: Goal */}
          {step === 3 && (
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>What is your goal?</Text>
              <Text style={s.stepSubtitle}>We will adjust your calorie targets based on this focus.</Text>

              {[
                { key: "lose_fat", label: "Lose Fat", desc: "Sustainable calorie deficit to drop fat" },
                { key: "maintain", label: "Maintain", desc: "Stay at current weight and build clean habits" },
                { key: "build_muscle", label: "Build Muscle", desc: "Clean surplus to gain strength and lean mass" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setGoal(item.key)}
                  style={[s.selectCard, goal === item.key ? s.cardActive : null]}
                >
                  <View>
                    <Text style={[s.cardTitle, goal === item.key ? s.cardTitleActive : null]}>
                      {item.label}
                    </Text>
                    <Text style={s.cardDesc}>{item.desc}</Text>
                  </View>
                  {goal === item.key && <Text style={s.cardCheck}>✓</Text>}
                </TouchableOpacity>
              ))}

              <View style={s.footerNav}>
                <TouchableOpacity style={s.btnBack} onPress={prevStep}>
                  <Text style={s.btnBackText}>Back</Text>
                </TouchableOpacity>
                <PressScale style={[ui.primaryButton, s.btnNext]} onPress={nextStep}>
                  <Text style={s.btnText}>Continue</Text>
                </PressScale>
              </View>
            </View>
          )}

          {/* SCREEN 4: Activity Level */}
          {step === 4 && (
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>What is your activity level?</Text>
              <Text style={s.stepSubtitle}>Helps determine daily energy expenditure (TDEE).</Text>

              {[
                { key: "sedentary", label: "Sedentary", desc: "Desk job, little to no structured workouts" },
                { key: "lightly_active", label: "Lightly Active", desc: "Light workouts or walking 1-3 days/week" },
                { key: "active", label: "Active", desc: "Standard gym sessions or sport 3-5 days/week" },
                { key: "athlete", label: "Athlete", desc: "Intense athletic training daily or physical labor" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setActivityLevel(item.key)}
                  style={[s.selectCard, activityLevel === item.key ? s.cardActive : null]}
                >
                  <View>
                    <Text style={[s.cardTitle, activityLevel === item.key ? s.cardTitleActive : null]}>
                      {item.label}
                    </Text>
                    <Text style={s.cardDesc}>{item.desc}</Text>
                  </View>
                  {activityLevel === item.key && <Text style={s.cardCheck}>✓</Text>}
                </TouchableOpacity>
              ))}

              <View style={s.footerNav}>
                <TouchableOpacity style={s.btnBack} onPress={prevStep}>
                  <Text style={s.btnBackText}>Back</Text>
                </TouchableOpacity>
                <PressScale style={[ui.primaryButton, s.btnNext]} onPress={nextStep}>
                  <Text style={s.btnText}>Calculate Targets</Text>
                </PressScale>
              </View>
            </View>
          )}

          {/* SCREEN 5: Calculated Targets */}
          {step === 5 && (
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>Your Custom Targets</Text>
              <Text style={s.stepSubtitle}>Calculated using the Mifflin-St Jeor TDEE formula based on your inputs.</Text>

              {/* Calorie Display Card */}
              <View style={s.calDisplayCard}>
                <Text style={s.calTitle}>DAILY CALORIE BUDGET</Text>
                <Text style={s.calBig}>{calculatedGoals.calories.toLocaleString()}</Text>
                <Text style={s.calUnit}>kcal / day</Text>
              </View>

              {/* Macros Breakdown */}
              <Text style={s.label}>DAILY MACROS</Text>
              <View style={s.macroGrid}>
                {[
                  { label: "PROTEIN", val: calculatedGoals.protein, unit: "g", color: colors.blue },
                  { label: "CARBS", val: calculatedGoals.carbs, unit: "g", color: colors.green },
                  { label: "FAT", val: calculatedGoals.fat, unit: "g", color: colors.pink },
                ].map((item) => (
                  <View key={item.label} style={[s.macroCol, { borderLeftColor: item.color }]}>
                    <Text style={s.macroLabel}>{item.label}</Text>
                    <Text style={[s.macroVal, { color: item.color }]}>
                      {item.val}
                      <Text style={s.macroUnit}>{item.unit}</Text>
                    </Text>
                  </View>
                ))}
              </View>

              <View style={s.footerNav}>
                <TouchableOpacity style={s.btnBack} onPress={prevStep}>
                  <Text style={s.btnBackText}>Back</Text>
                </TouchableOpacity>
                <PressScale style={[ui.primaryButton, s.btnNext]} onPress={handleFinish}>
                  <Text style={s.btnText}>Start Tracking</Text>
                </PressScale>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: ui.screen,
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
  },
  progressBar: {
    flexDirection: "row",
    gap: 6,
    width: "100%",
    marginBottom: 40,
    marginTop: 10,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  progressSegmentActive: {
    backgroundColor: colors.purple,
  },
  stepContent: {
    flex: 1,
    justifyContent: "center",
    width: "100%",
  },
  iconSplash: {
    alignSelf: "center",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(139, 126, 246, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: "rgba(139, 126, 246, 0.24)",
  },
  iconText: {
    fontSize: 40,
    color: colors.violet,
  },
  welcomeTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
    lineHeight: 48,
    marginBottom: spacing.lg,
  },
  welcomeSubtitle: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    color: colors.textMuted,
    paddingHorizontal: 12,
    marginBottom: 40,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: 28,
  },
  label: {
    ...typography.sectionLabel,
    marginBottom: spacing.sm,
  },
  genderRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.panelSoft,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  optionActive: {
    borderColor: colors.purple,
    backgroundColor: "rgba(139, 126, 246, 0.1)",
  },
  optionText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textMuted,
  },
  optionTextActive: {
    color: colors.text,
  },
  inputRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  input: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.panelSoft,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  selectCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.panelSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: spacing.lg,
    marginBottom: 12,
  },
  cardActive: {
    borderColor: colors.purple,
    backgroundColor: "rgba(139, 126, 246, 0.08)",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textMuted,
  },
  cardTitleActive: {
    color: colors.text,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 4,
  },
  cardCheck: {
    fontSize: 18,
    color: colors.purple,
    fontWeight: "900",
  },
  calDisplayCard: {
    backgroundColor: colors.panelSoft,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 28,
    alignItems: "center",
    marginBottom: 24,
  },
  calTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textDim,
    letterSpacing: 1.5,
  },
  calBig: {
    fontSize: 54,
    fontWeight: "900",
    color: colors.text,
    marginVertical: 6,
  },
  calUnit: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
  },
  macroGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 40,
  },
  macroCol: {
    flex: 1,
    backgroundColor: colors.panelSoft,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    padding: spacing.md,
    gap: 4,
  },
  macroLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.textDim,
  },
  macroVal: {
    fontSize: 20,
    fontWeight: "900",
  },
  macroUnit: {
    fontSize: 12,
    color: colors.textDim,
  },
  btnPrimary: {
    height: 54,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  footerNav: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 12,
  },
  btnBack: {
    flex: 1,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  btnBackText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "700",
  },
  btnNext: {
    flex: 2,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
});
