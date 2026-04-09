import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Svg, Circle } from 'react-native-svg';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { BottomNav } from '../components/BottomNav';

const MEALS = [
  { id: 'breakfast', meal: 'Breakfast', time: '7:30 AM', icon: 'wb-sunny' as const, items: ['4 Egg Whites + 1 Whole', 'Oatmeal (80g)', 'Blueberries (100g)'], calories: 420, protein: 35, carbs: 52, fats: 12 },
  { id: 'lunch', meal: 'Lunch', time: '12:30 PM', icon: 'restaurant' as const, items: ['Grilled Chicken (200g)', 'Brown Rice (150g)', 'Broccoli & Spinach'], calories: 620, protein: 52, carbs: 65, fats: 14 },
  { id: 'preworkout', meal: 'Pre-Workout', time: '4:00 PM', icon: 'bolt' as const, items: ['Banana', 'Whey Protein Shake', 'Rice Cakes (2)'], calories: 310, protein: 28, carbs: 48, fats: 4 },
  { id: 'dinner', meal: 'Dinner', time: '7:30 PM', icon: 'nightlight-round' as const, items: ['Salmon Fillet (180g)', 'Sweet Potato (200g)', 'Mixed Greens Salad'], calories: 580, protein: 42, carbs: 45, fats: 22 },
];

const DAILY_TARGET = { calories: 2400, protein: 160, carbs: 220, fats: 65 };

export const MealsScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { fullName } = useUser();

  const [checkedMeals, setCheckedMeals] = useState<Record<string, boolean>>({
    breakfast: false,
    lunch: false,
    preworkout: false,
    dinner: false,
  });

  const [waterGlasses, setWaterGlasses] = useState(3);

  const toggleMeal = (id: string) => {
    setCheckedMeals((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Calculate consumed totals from checked meals
  const consumed = MEALS.reduce(
    (acc, meal) => {
      if (checkedMeals[meal.id]) {
        acc.calories += meal.calories;
        acc.protein += meal.protein;
        acc.carbs += meal.carbs;
        acc.fats += meal.fats;
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );

  const checkedCount = Object.values(checkedMeals).filter(Boolean).length;

  // Circular progress ring calculations
  const ringSize = 160;
  const strokeWidth = 12;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const calorieProgress = Math.min(consumed.calories / DAILY_TARGET.calories, 1);
  const strokeDashoffset = circumference * (1 - calorieProgress);

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const ringTrackColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const firstName = fullName ? fullName.split(' ')[0] : 'Champ';

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-24`}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={tw`px-5 pt-5 pb-2`}>
          <Text style={[tw`text-sm font-semibold`, { color: accent }]}>
            Meal Planner
          </Text>
          <Text style={[tw`text-2xl font-black mt-1`, { color: textPrimary }]}>
            Hey {firstName}, let's fuel up!
          </Text>
          <Text style={[tw`text-sm mt-1`, { color: textSecondary }]}>
            {checkedCount} of {MEALS.length} meals logged today
          </Text>
        </View>

        {/* Generate Meal Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('MealGeneration')}
          style={[
            tw`mx-5 mt-4 rounded-2xl p-4 flex-row items-center justify-between`,
            { backgroundColor: accent + '14' }
          ]}
        >
          <View style={tw`flex-row items-center gap-3`}>
            <View
              style={[
                tw`w-10 h-10 rounded-lg items-center justify-center`,
                { backgroundColor: accent + '28' }
              ]}
            >
              <MaterialIcons name="restaurant" size={20} color={accent} />
            </View>
            <View>
              <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                Generate Meals
              </Text>
              <Text style={[tw`text-xs`, { color: textSecondary }]}>
                AI-powered meal plans
              </Text>
            </View>
          </View>
          <MaterialIcons name="arrow-forward" size={20} color={accent} />
        </TouchableOpacity>

        {/* Calorie Ring + Macros Section */}
        <View
          style={[
            tw`mx-5 mt-4 rounded-3xl p-5`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
          ]}
        >
          {/* Ring and Summary Row */}
          <View style={tw`flex-row items-center`}>
            {/* Circular Progress Ring */}
            <View style={[tw`items-center justify-center`, { width: ringSize, height: ringSize }]}>
              <Svg width={ringSize} height={ringSize}>
                {/* Track */}
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  stroke={ringTrackColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {/* Progress */}
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  stroke={accent}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  rotation={-90}
                  origin={`${ringSize / 2}, ${ringSize / 2}`}
                />
              </Svg>
              {/* Center Text */}
              <View style={[tw`absolute items-center justify-center`, { width: ringSize, height: ringSize }]}>
                <Text style={[tw`text-3xl font-black`, { color: textPrimary }]}>
                  {consumed.calories}
                </Text>
                <Text style={[tw`text-[10px] font-bold uppercase tracking-wider`, { color: textMuted }]}>
                  / {DAILY_TARGET.calories} kcal
                </Text>
              </View>
            </View>

            {/* Right Side Quick Stats */}
            <View style={tw`flex-1 ml-5 gap-3`}>
              {[
                { label: 'Eaten', value: `${consumed.calories}`, unit: 'kcal', icon: 'local-fire-department' as const, color: accent },
                { label: 'Remaining', value: `${Math.max(DAILY_TARGET.calories - consumed.calories, 0)}`, unit: 'kcal', icon: 'flag' as const, color: '#4ade80' },
                { label: 'Meals Left', value: `${MEALS.length - checkedCount}`, unit: '', icon: 'schedule' as const, color: '#facc15' },
              ].map((stat) => (
                <View key={stat.label} style={tw`flex-row items-center gap-2`}>
                  <View
                    style={[
                      tw`w-8 h-8 rounded-lg items-center justify-center`,
                      { backgroundColor: stat.color + '18' },
                    ]}
                  >
                    <MaterialIcons name={stat.icon} size={16} color={stat.color} />
                  </View>
                  <View>
                    <Text style={[tw`text-xs`, { color: textMuted }]}>{stat.label}</Text>
                    <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                      {stat.value} {stat.unit}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Macro Progress Bars */}
          <View style={[tw`mt-5 pt-4`, { borderTopWidth: 1, borderColor: dividerColor }]}>
            <Text style={[tw`text-xs font-bold uppercase tracking-wider mb-3`, { color: textMuted }]}>
              Macronutrient Breakdown
            </Text>
            {[
              { label: 'Protein', consumed: consumed.protein, target: DAILY_TARGET.protein, unit: 'g', color: '#4ade80' },
              { label: 'Carbs', consumed: consumed.carbs, target: DAILY_TARGET.carbs, unit: 'g', color: '#facc15' },
              { label: 'Fats', consumed: consumed.fats, target: DAILY_TARGET.fats, unit: 'g', color: '#f87171' },
            ].map((macro) => {
              const progress = Math.min(macro.consumed / macro.target, 1);
              return (
                <View key={macro.label} style={tw`mb-3`}>
                  <View style={tw`flex-row items-center justify-between mb-1.5`}>
                    <Text style={[tw`text-sm font-semibold`, { color: textPrimary }]}>
                      {macro.label}
                    </Text>
                    <Text style={[tw`text-xs font-bold`, { color: macro.color }]}>
                      {macro.consumed}{macro.unit} / {macro.target}{macro.unit}
                    </Text>
                  </View>
                  <View
                    style={[
                      tw`h-2.5 rounded-full overflow-hidden`,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
                    ]}
                  >
                    <View
                      style={[
                        tw`h-full rounded-full`,
                        { width: `${progress * 100}%`, backgroundColor: macro.color },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Meal Cards */}
        <View style={tw`px-5 mt-6`}>
          <Text style={[tw`text-lg font-black mb-3`, { color: textPrimary }]}>
            Today's Meals
          </Text>

          {MEALS.map((meal) => {
            const isChecked = checkedMeals[meal.id];
            return (
              <TouchableOpacity
                key={meal.id}
                activeOpacity={0.7}
                onPress={() => toggleMeal(meal.id)}
                style={[
                  tw`rounded-2xl p-4 mb-3`,
                  {
                    backgroundColor: cardBg,
                    borderWidth: 1,
                    borderColor: isChecked ? accent + '40' : cardBorder,
                    opacity: isChecked ? 0.65 : 1,
                  },
                ]}
              >
                {/* Meal Header */}
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-row items-center gap-3`}>
                    <View
                      style={[
                        tw`w-11 h-11 rounded-xl items-center justify-center`,
                        {
                          backgroundColor: isChecked ? '#4ade80' + '20' : accent + '18',
                        },
                      ]}
                    >
                      {isChecked ? (
                        <MaterialIcons name="check-circle" size={22} color="#4ade80" />
                      ) : (
                        <MaterialIcons name={meal.icon} size={22} color={accent} />
                      )}
                    </View>
                    <View>
                      <Text
                        style={[
                          tw`text-base font-bold`,
                          {
                            color: isChecked ? textMuted : textPrimary,
                            textDecorationLine: isChecked ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {meal.meal}
                      </Text>
                      <Text style={[tw`text-xs`, { color: textMuted }]}>
                        {meal.time}
                      </Text>
                    </View>
                  </View>

                  <View style={tw`items-end`}>
                    <Text style={[tw`text-sm font-bold`, { color: isChecked ? '#4ade80' : accent }]}>
                      {meal.calories} kcal
                    </Text>
                    <Text style={[tw`text-xs`, { color: textMuted }]}>
                      {meal.protein}g protein
                    </Text>
                  </View>
                </View>

                {/* Food Items */}
                <View style={[tw`mt-3 pt-3`, { borderTopWidth: 1, borderColor: dividerColor }]}>
                  {meal.items.map((item, i) => (
                    <View key={i} style={tw`flex-row items-center gap-2.5 py-1`}>
                      <View
                        style={[
                          tw`w-1.5 h-1.5 rounded-full`,
                          { backgroundColor: isChecked ? textMuted : accent },
                        ]}
                      />
                      <Text
                        style={[
                          tw`text-sm`,
                          {
                            color: isChecked ? textMuted : textSecondary,
                            textDecorationLine: isChecked ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Macro Chips */}
                <View style={tw`flex-row gap-2 mt-3`}>
                  {[
                    { label: 'P', value: `${meal.protein}g`, color: '#4ade80' },
                    { label: 'C', value: `${meal.carbs}g`, color: '#facc15' },
                    { label: 'F', value: `${meal.fats}g`, color: '#f87171' },
                  ].map((chip) => (
                    <View
                      key={chip.label}
                      style={[
                        tw`flex-row items-center gap-1 px-2.5 py-1 rounded-full`,
                        { backgroundColor: chip.color + '14' },
                      ]}
                    >
                      <Text style={[tw`text-[10px] font-black`, { color: chip.color }]}>
                        {chip.label}
                      </Text>
                      <Text style={[tw`text-[11px] font-bold`, { color: chip.color }]}>
                        {chip.value}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Checked Overlay Text */}
                {isChecked && (
                  <View style={tw`flex-row items-center gap-1.5 mt-2`}>
                    <MaterialIcons name="check" size={14} color="#4ade80" />
                    <Text style={[tw`text-xs font-bold`, { color: '#4ade80' }]}>
                      Logged
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Water Tracker */}
        <View style={tw`px-5 mt-4`}>
          <View
            style={[
              tw`rounded-2xl p-5`,
              { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
            ]}
          >
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <View style={tw`flex-row items-center gap-3`}>
                <View
                  style={[
                    tw`w-11 h-11 rounded-xl items-center justify-center`,
                    { backgroundColor: '#38bdf8' + '18' },
                  ]}
                >
                  <MaterialIcons name="water-drop" size={22} color="#38bdf8" />
                </View>
                <View>
                  <Text style={[tw`text-base font-bold`, { color: textPrimary }]}>
                    Water Intake
                  </Text>
                  <Text style={[tw`text-xs`, { color: textMuted }]}>
                    Goal: 8 glasses per day
                  </Text>
                </View>
              </View>
              <Text style={[tw`text-2xl font-black`, { color: '#38bdf8' }]}>
                {waterGlasses}/8
              </Text>
            </View>

            {/* Water Progress Bar */}
            <View
              style={[
                tw`h-3 rounded-full overflow-hidden mb-4`,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
              ]}
            >
              <View
                style={[
                  tw`h-full rounded-full`,
                  {
                    width: `${Math.min((waterGlasses / 8) * 100, 100)}%`,
                    backgroundColor: '#38bdf8',
                  },
                ]}
              />
            </View>

            {/* Glass Icons Row */}
            <View style={tw`flex-row items-center justify-center gap-1.5 mb-4`}>
              {Array.from({ length: 8 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    tw`w-8 h-8 rounded-lg items-center justify-center`,
                    {
                      backgroundColor: i < waterGlasses ? '#38bdf8' + '20' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                    },
                  ]}
                >
                  <MaterialIcons
                    name="local-drink"
                    size={18}
                    color={i < waterGlasses ? '#38bdf8' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)')}
                  />
                </View>
              ))}
            </View>

            {/* +/- Buttons */}
            <View style={tw`flex-row items-center justify-center gap-4`}>
              <TouchableOpacity
                onPress={() => setWaterGlasses((prev) => Math.max(prev - 1, 0))}
                style={[
                  tw`w-12 h-12 rounded-full items-center justify-center`,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <MaterialIcons name="remove" size={24} color={textSecondary} />
              </TouchableOpacity>

              <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>
                {waterGlasses} {waterGlasses === 1 ? 'glass' : 'glasses'}
              </Text>

              <TouchableOpacity
                onPress={() => setWaterGlasses((prev) => Math.min(prev + 1, 12))}
                style={[
                  tw`w-12 h-12 rounded-full items-center justify-center`,
                  {
                    backgroundColor: '#38bdf8' + '18',
                    borderWidth: 1,
                    borderColor: '#38bdf8' + '30',
                  },
                ]}
              >
                <MaterialIcons name="add" size={24} color="#38bdf8" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav
        activeId="meals"
        onSelect={(id) => {
          if (id === 'home') navigation.navigate('TraineeCommandCenter');
          if (id === 'workouts') navigation.navigate('VisionAnalysisLab');
          if (id === 'messages') navigation.navigate('Messages');
          if (id === 'profile') navigation.navigate('Profile');
        }}
        items={[
          { id: 'home', icon: 'home', label: 'Home' },
          { id: 'workouts', icon: 'fitness-center', label: 'Workouts' },
          { id: 'meals', icon: 'restaurant', label: 'Meals' },
          { id: 'messages', icon: 'chat-bubble', label: 'Messages' },
          { id: 'profile', icon: 'person', label: 'Profile' },
        ]}
      />
    </SafeAreaView>
  );
};
