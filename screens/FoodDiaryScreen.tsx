import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";

type Meal = "breakfast" | "lunch" | "dinner" | "snacks";

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
}

interface DiaryState {
  breakfast: FoodEntry[];
  lunch: FoodEntry[];
  dinner: FoodEntry[];
  snacks: FoodEntry[];
}

const MEAL_CONFIG: {
  key: Meal;
  label: string;
  icon: string;
  accent: string;
  bg: string;
  border: string;
}[] = [
  {
    key: "breakfast",
    label: "Breakfast",
    icon: "☀️",
    accent: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/30",
  },
  {
    key: "lunch",
    label: "Lunch",
    icon: "🌿",
    accent: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
  },
  {
    key: "dinner",
    label: "Dinner",
    icon: "🌙",
    accent: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/30",
  },
  {
    key: "snacks",
    label: "Snacks",
    icon: "⚡",
    accent: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/30",
  },
];

const DAILY_GOAL = 2000;

export default function FoodDiaryScreen() {
  const [diary, setDiary] = useState<DiaryState>({
    breakfast: [
      { id: "1", name: "Oats with banana", calories: 320 },
      { id: "2", name: "Black coffee", calories: 5 },
    ],
    lunch: [{ id: "3", name: "Grilled chicken salad", calories: 480 }],
    dinner: [],
    snacks: [{ id: "4", name: "Mixed nuts", calories: 160 }],
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [activeMeal, setActiveMeal] = useState<Meal>("breakfast");
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");

  const totalCalories = Object.values(diary).flat().reduce((s, e) => s + e.calories, 0);
  const progress = Math.min(totalCalories / DAILY_GOAL, 1);
  const remaining = DAILY_GOAL - totalCalories;

  const mealCalories = (meal: Meal) =>
    diary[meal].reduce((s, e) => s + e.calories, 0);

  const openModal = (meal: Meal) => {
    setActiveMeal(meal);
    setFoodName("");
    setCalories("");
    setModalVisible(true);
  };

  const addEntry = () => {
    const cal = parseInt(calories);
    if (!foodName.trim() || isNaN(cal) || cal <= 0) return;
    setDiary((prev) => ({
      ...prev,
      [activeMeal]: [
        ...prev[activeMeal],
        { id: Date.now().toString(), name: foodName.trim(), calories: cal },
      ],
    }));
    setModalVisible(false);
  };

  const removeEntry = (meal: Meal, id: string) => {
    setDiary((prev) => ({
      ...prev,
      [meal]: prev[meal].filter((e) => e.id !== id),
    }));
  };

  const progressColor =
    progress < 0.7
      ? "bg-emerald-400"
      : progress < 0.9
      ? "bg-amber-400"
      : "bg-rose-400";

  return (
    <View className="flex-1 bg-neutral-950">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="pt-14 pb-4 px-5 border-b border-neutral-800">
        <Text className="text-neutral-500 text-xs tracking-widest uppercase font-medium mb-1">
          Today's Log
        </Text>
        <Text className="text-white text-2xl font-bold tracking-tight">
          Food Diary
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-5 pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* Calorie Summary Card */}
        <View className="bg-neutral-900 rounded-2xl p-5 mb-6 border border-neutral-800">
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-neutral-500 text-xs tracking-widest uppercase mb-1">
                Consumed
              </Text>
              <View className="flex-row items-baseline gap-1">
                <Text className="text-white text-4xl font-bold">{totalCalories}</Text>
                <Text className="text-neutral-500 text-sm">kcal</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-neutral-500 text-xs tracking-widest uppercase mb-1">
                Remaining
              </Text>
              <View className="flex-row items-baseline gap-1">
                <Text
                  className={`text-3xl font-bold ${
                    remaining >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {Math.abs(remaining)}
                </Text>
                <Text className="text-neutral-500 text-sm">
                  {remaining >= 0 ? "left" : "over"}
                </Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <View
              className={`h-full rounded-full ${progressColor}`}
              style={{ width: `${progress * 100}%` }}
            />
          </View>
          <View className="flex-row justify-between mt-2">
            <Text className="text-neutral-600 text-xs">0</Text>
            <Text className="text-neutral-500 text-xs">
              Goal: {DAILY_GOAL} kcal
            </Text>
          </View>
        </View>

        {/* Meal Sections */}
        {MEAL_CONFIG.map(({ key, label, icon, accent, bg, border }) => (
          <View key={key} className="mb-4">
            <View
              className={`rounded-2xl border ${border} overflow-hidden`}
            >
              {/* Meal Header */}
              <View className={`${bg} px-4 py-3 flex-row justify-between items-center`}>
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg">{icon}</Text>
                  <Text className={`font-semibold text-base ${accent}`}>
                    {label}
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Text className="text-neutral-400 text-sm font-medium">
                    {mealCalories(key)} kcal
                  </Text>
                  <TouchableOpacity
                    onPress={() => openModal(key)}
                    className={`${bg} border ${border} rounded-full w-7 h-7 items-center justify-center`}
                    activeOpacity={0.7}
                  >
                    <Text className={`${accent} text-lg leading-none`}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Entries */}
              {diary[key].length === 0 ? (
                <View className="bg-neutral-900 px-4 py-4">
                  <Text className="text-neutral-600 text-sm text-center">
                    No entries yet
                  </Text>
                </View>
              ) : (
                <View className="bg-neutral-900">
                  {diary[key].map((entry, idx) => (
                    <View
                      key={entry.id}
                      className={`flex-row items-center justify-between px-4 py-3 ${
                        idx < diary[key].length - 1
                          ? "border-b border-neutral-800"
                          : ""
                      }`}
                    >
                      <Text
                        className="text-neutral-200 text-sm flex-1 mr-2"
                        numberOfLines={1}
                      >
                        {entry.name}
                      </Text>
                      <View className="flex-row items-center gap-3">
                        <Text className="text-neutral-400 text-sm tabular-nums">
                          {entry.calories} kcal
                        </Text>
                        <TouchableOpacity
                          onPress={() => removeEntry(key, entry.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text className="text-neutral-600 text-base">×</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add Entry Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end"
        >
          <View className="bg-neutral-900 rounded-t-3xl border-t border-neutral-800 px-5 pt-5 pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-lg font-semibold">
                Add to{" "}
                {MEAL_CONFIG.find((m) => m.key === activeMeal)?.label}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="bg-neutral-800 rounded-full w-8 h-8 items-center justify-center"
              >
                <Text className="text-neutral-400 text-base">×</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-neutral-500 text-xs uppercase tracking-widest mb-2">
              Food Name
            </Text>
            <TextInput
              className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm mb-4"
              placeholder="e.g. Grilled salmon"
              placeholderTextColor="#525252"
              value={foodName}
              onChangeText={setFoodName}
              returnKeyType="next"
            />

            <Text className="text-neutral-500 text-xs uppercase tracking-widest mb-2">
              Calories (kcal)
            </Text>
            <TextInput
              className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm mb-6"
              placeholder="e.g. 350"
              placeholderTextColor="#525252"
              keyboardType="numeric"
              value={calories}
              onChangeText={setCalories}
              returnKeyType="done"
              onSubmitEditing={addEntry}
            />

            <TouchableOpacity
              onPress={addEntry}
              className="bg-white rounded-xl py-4 items-center"
              activeOpacity={0.85}
            >
              <Text className="text-neutral-950 font-semibold text-base">
                Add Entry
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
