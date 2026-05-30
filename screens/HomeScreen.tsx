import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
  StatusBar,
  SafeAreaView,
} from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./AppNavigator";
import { useMealStore } from "../useMealStore";

const { width } = Dimensions.get("window");

const MOCK = {
  user: { name: "Alex", avatar: "https://i.pravatar.cc/80?img=11" },
  calories: { goal: 2100 },
  macros: {
    protein: { goal: 150, color: "#FF6B6B", grad: ["#FF6B6B", "#FF8E53"] },
    carbs: { goal: 230, color: "#4ECDC4", grad: ["#4ECDC4", "#44A08D"] },
    fat: { goal: 65, color: "#FFD93D", grad: ["#FFD93D", "#FF9A3C"] },
  },
};

function AnimatedRing({
  consumed,
  goal,
  color,
  grad,
  label,
  unit = "g",
}: {
  consumed: number;
  goal: number;
  color: string;
  grad: string[];
  label: string;
  unit?: string;
}) {
  const size = 90;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(consumed / goal, 1);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 1200, useNativeDriver: false }).start();
  }, [pct]);

  const gradId = `grad_${label}`;

  return (
    <View className="items-center">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ position: "absolute" }}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={grad[0]} />
              <Stop offset="100%" stopColor={grad[1]} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={`url(#${gradId})`}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2},${size / 2}`}
          />
        </Svg>
        <View className="absolute inset-0 items-center justify-center">
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>{consumed}</Text>
          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 9 }}>/{goal}{unit}</Text>
        </View>
      </View>
      <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 6, fontWeight: "600" }}>
        {label}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const meals = useMealStore((s) => s.meals);
  const getDailyTotals = useMealStore((s) => s.getDailyTotals);
  const totals = getDailyTotals();

  const caloriesConsumed = totals.calories;
  const caloriesGoal = MOCK.calories.goal;
  const calPct = caloriesConsumed > 0 ? Math.min(caloriesConsumed / caloriesGoal, 1) : 0;
  const calCirc = 2 * Math.PI * 88;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0F" }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Gradient blob bg */}
        <View
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 280,
            height: 280,
            borderRadius: 140,
            backgroundColor: "#7C3AED",
            opacity: 0.18,
            transform: [{ scaleX: 1.4 }],
          }}
          pointerEvents="none"
        />
        <View
          style={{
            position: "absolute",
            top: 200,
            left: -80,
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: "#2563EB",
            opacity: 0.12,
          }}
          pointerEvents="none"
        />

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
            <View>
              <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: "500" }}>
                Good morning 👋
              </Text>
              <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 2 }}>
                {MOCK.user.name}
              </Text>
            </View>
            <Image
              source={{ uri: MOCK.user.avatar }}
              style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: "#7C3AED" }}
            />
          </View>

          {/* Calories Card */}
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              borderRadius: 24,
              overflow: "hidden",
              backgroundColor: "#13131A",
              borderWidth: 1,
              borderColor: "rgba(124,58,237,0.3)",
            }}
          >
            <View style={{ padding: 20 }}>
              <View className="flex-row justify-between items-start">
                <View>
                  <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: "600", letterSpacing: 1 }}>
                    TODAY'S CALORIES
                  </Text>
                  <View className="flex-row items-end mt-1">
                    <Text style={{ color: "#fff", fontSize: 46, fontWeight: "900", lineHeight: 52 }}>
                      {caloriesConsumed.toLocaleString()}
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 16, marginBottom: 8, marginLeft: 4 }}>
                      /{caloriesGoal.toLocaleString()} kcal
                    </Text>
                  </View>
                </View>
                <View style={{ position: "relative", width: 100, height: 100 }}>
                  <Svg width={100} height={100}>
                    <Defs>
                      <LinearGradient id="calGrad" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0%" stopColor="#7C3AED" />
                        <Stop offset="100%" stopColor="#EC4899" />
                      </LinearGradient>
                    </Defs>
                    <Circle cx={50} cy={50} r={44} stroke="rgba(255,255,255,0.07)" strokeWidth={8} fill="none" />
                    <Circle
                      cx={50}
                      cy={50}
                      r={44}
                      stroke="url(#calGrad)"
                      strokeWidth={8}
                      fill="none"
                      strokeDasharray={calCirc}
                      strokeDashoffset={calCirc * (1 - calPct)}
                      strokeLinecap="round"
                      rotation="-90"
                      origin="50,50"
                    />
                  </Svg>
                  <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>
                      {Math.round(calPct * 100)}%
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 9 }}>of goal</Text>
                  </View>
                </View>
              </View>

              {/* Cal bar */}
              <View style={{ marginTop: 16 }}>
                <View style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 6, height: 8, overflow: "hidden" }}>
                  <View
                    style={{
                      height: 8,
                      width: `${calPct * 100}%`,
                      borderRadius: 6,
                      backgroundColor: "#7C3AED",
                    }}
                  />
                </View>
                <View className="flex-row justify-between mt-2">
                  <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                    {Math.max(0, caloriesGoal - caloriesConsumed)} kcal remaining
                  </Text>
                  <Text style={{ color: "#7C3AED", fontSize: 11, fontWeight: "700" }}>
                    {caloriesConsumed >= caloriesGoal ? "Goal Met! 🎉" : "On track ✓"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

                {/* Macros */}
                <View
                  style={{
                    marginHorizontal: 16,
                    marginTop: 14,
                    borderRadius: 24,
                    backgroundColor: "#13131A",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.07)",
                    padding: 20,
                  }}
                >
                  <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: "600", letterSpacing: 1, marginBottom: 16 }}>
                    MACRONUTRIENTS
                  </Text>
                  <View className="flex-row justify-around">
                    <AnimatedRing {...MOCK.macros.protein} consumed={totals.protein} label="Protein" />
                    <AnimatedRing {...MOCK.macros.carbs} consumed={totals.carbs} label="Carbs" />
                    <AnimatedRing {...MOCK.macros.fat} consumed={totals.fat} label="Fat" />
                  </View>
                </View>

                {/* Meals */}
                <View style={{ marginHorizontal: 16, marginTop: 14 }}>
                  <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: "600", letterSpacing: 1, marginBottom: 12 }}>
                    TODAY'S MEALS
                  </Text>
                  {meals.length === 0 ? (
                    <View style={{ padding: 20, alignItems: "center", backgroundColor: "#13131A", borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" }}>
                      <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>No meals logged today yet.</Text>
                    </View>
                  ) : (
                    meals.map((meal) => {
                      const time = meal.loggedAt ? new Date(meal.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now";
                      return (
                        <Animated.View
                          key={meal.id}
                          style={{
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                            marginBottom: 10,
                            borderRadius: 18,
                            backgroundColor: "#13131A",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.06)",
                            overflow: "hidden",
                          }}
                        >
                          <TouchableOpacity activeOpacity={0.75} style={{ padding: 16 }}>
                            <View className="flex-row items-center justify-between">
                              <View className="flex-row items-center flex-1">
                                <View
                                  style={{
                                    width: 46,
                                    height: 46,
                                    borderRadius: 14,
                                    backgroundColor: "rgba(255,255,255,0.05)",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 12,
                                  }}
                                >
                                  <Text style={{ fontSize: 22 }}>🍽️</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{meal.name}</Text>
                                  <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>
                                    Protein: {meal.protein}g  Carbs: {meal.carbs}g  Fat: {meal.fat}g
                                  </Text>
                                </View>
                              </View>
                              <View style={{ alignItems: "flex-end", marginLeft: 8 }}>
                                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>{meal.calories}</Text>
                                <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>kcal</Text>
                                <Text style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 2 }}>{time}</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        </Animated.View>
                      );
                    })
                  )}
                </View>
              </Animated.View>
            </ScrollView>

            {/* FAB Camera */}
            <View
              style={{
                position: "absolute",
                bottom: 36,
                alignSelf: "center",
                shadowColor: "#7C3AED",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.6,
                shadowRadius: 20,
                elevation: 12,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate("Camera")}
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  backgroundColor: "#7C3AED",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 3,
                  borderColor: "rgba(124,58,237,0.4)",
                }}
              >
                <Text style={{ fontSize: 28 }}>📷</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
  );
}
