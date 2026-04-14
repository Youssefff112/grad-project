import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Svg, Circle } from 'react-native-svg';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useNotifications } from '../context/NotificationContext';
import { useFoodManagement } from '../context/FoodManagementContext';
import { useExerciseManagement } from '../context/ExerciseManagementContext';
import * as offlineService from '../services/offlineService';
import { BottomNav } from '../components/BottomNav';

const DAILY_TARGETS = {
  calories: 2400,
  protein: 160,
  carbs: 220,
  fats: 65,
  water: 8,
  workoutMinutes: 60,
};

export const DailyTrackerScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { fullName } = useUser();
  const { totalUnread } = useNotifications();
  const { meals } = useFoodManagement();
  const { workouts } = useExerciseManagement();

  const [checkedMeals, setCheckedMeals] = useState<Record<string, boolean>>({});
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [completedWorkoutMinutes, setCompletedWorkoutMinutes] = useState(0);

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';

  const firstName = fullName ? fullName.split(' ')[0] : 'Champ';

  // Load cached data on mount
  useEffect(() => {
    const loadCachedData = async () => {
      const today = new Date().toISOString().split('T')[0];

      const cachedMeals = await offlineService.getCachedMealLog(today);
      if (cachedMeals) {
        setCheckedMeals(cachedMeals.checkedMeals);
        setWaterGlasses(cachedMeals.waterGlasses);
      }
    };
    loadCachedData();
  }, []);

  // Cache data whenever it changes
  useEffect(() => {
    const cacheData = async () => {
      const today = new Date().toISOString().split('T')[0];
      await offlineService.cacheMealLog(today, {
        checkedMeals,
        waterGlasses,
        date: today,
      });
    };
    cacheData();
  }, [checkedMeals, waterGlasses]);

  // Calculate consumed macros from checked custom meals
  const consumedMacros = useMemo(() => {
    return meals.reduce(
      (acc, meal) => {
        if (checkedMeals[meal.id]) {
          acc.calories += meal.totalCalories;
          acc.protein += meal.totalMacros.protein;
          acc.carbs += meal.totalMacros.carbs;
          acc.fats += meal.totalMacros.fats;
        }
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [meals, checkedMeals]);

  // Progress calculations
  const calorieProgress = Math.min(consumedMacros.calories / DAILY_TARGETS.calories, 1);
  const proteinProgress = Math.min(consumedMacros.protein / DAILY_TARGETS.protein, 1);
  const carbsProgress = Math.min(consumedMacros.carbs / DAILY_TARGETS.carbs, 1);
  const fatsProgress = Math.min(consumedMacros.fats / DAILY_TARGETS.fats, 1);
  const waterProgress = Math.min(waterGlasses / DAILY_TARGETS.water, 1);
  const workoutProgress = Math.min(completedWorkoutMinutes / DAILY_TARGETS.workoutMinutes, 1);

  // Ring calculations
  const ringSize = 120;
  const strokeWidth = 8;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const calorieStrokeDashoffset = circumference * (1 - calorieProgress);

  const trackers = [
    {
      label: 'Protein',
      current: consumedMacros.protein,
      target: DAILY_TARGETS.protein,
      unit: 'g',
      color: '#4ade80',
      icon: 'restaurant',
    },
    {
      label: 'Carbs',
      current: consumedMacros.carbs,
      target: DAILY_TARGETS.carbs,
      unit: 'g',
      color: '#facc15',
      icon: 'grain',
    },
    {
      label: 'Fats',
      current: consumedMacros.fats,
      target: DAILY_TARGETS.fats,
      unit: 'g',
      color: '#f87171',
      icon: 'opacity',
    },
    {
      label: 'Water',
      current: waterGlasses,
      target: DAILY_TARGETS.water,
      unit: 'glasses',
      color: '#38bdf8',
      icon: 'water-drop',
    },
  ];

  const getMealCount = () => Object.values(checkedMeals).filter(Boolean).length;
  const mealCount = getMealCount();

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-24`}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={tw`px-5 pt-5 pb-3`}>
          <Text style={[tw`text-sm font-semibold`, { color: accent }]}>
            Daily Tracker
          </Text>
          <Text style={[tw`text-2xl font-black mt-1`, { color: textPrimary }]}>
            {firstName}, let's crush today!
          </Text>
          <Text style={[tw`text-sm mt-1`, { color: textSecondary }]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
        </View>

        {/* Main Calorie Ring */}
        <View
          style={[
            tw`mx-5 mt-4 rounded-3xl p-5`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
          ]}
        >
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={[tw`text-sm font-bold uppercase tracking-wider`, { color: textSecondary }]}>
              Daily Calories
            </Text>
            <View style={[tw`px-2 py-1 rounded-full`, { backgroundColor: accent + '20' }]}>
              <Text style={[tw`text-xs font-bold`, { color: accent }]}>
                {Math.round((calorieProgress * 100))}%
              </Text>
            </View>
          </View>

          <View style={tw`flex-row items-center justify-between`}>
            {/* Ring */}
            <View style={[tw`items-center justify-center`, { width: ringSize, height: ringSize }]}>
              <Svg width={ringSize} height={ringSize}>
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={radius}
                  stroke={accent}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={calorieStrokeDashoffset}
                  strokeLinecap="round"
                  rotation={-90}
                  origin={`${ringSize / 2}, ${ringSize / 2}`}
                />
              </Svg>
              <View style={[tw`absolute items-center justify-center`, { width: ringSize, height: ringSize }]}>
                <Text style={[tw`text-2xl font-black`, { color: textPrimary }]}>
                  {Math.round(consumedMacros.calories)}
                </Text>
                <Text style={[tw`text-[10px] font-bold uppercase tracking-wider mt-0.5`, { color: textMuted }]}>
                  kcal
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View style={tw`flex-1 ml-5 gap-2`}>
              {[
                { label: 'Consumed', value: `${Math.round(consumedMacros.calories)}`, icon: 'local-fire-department' },
                { label: 'Remaining', value: `${Math.max(DAILY_TARGETS.calories - consumedMacros.calories, 0)}`, icon: 'flag' },
                { label: 'Meals', value: `${mealCount}/${meals.length}`, icon: 'restaurant' },
              ].map((stat) => (
                <View key={stat.label} style={tw`flex-row items-center gap-2`}>
                  <MaterialIcons name={stat.icon as any} size={16} color={accent} />
                  <View>
                    <Text style={[tw`text-xs`, { color: textMuted }]}>{stat.label}</Text>
                    <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{stat.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Macro Trackers Grid */}
        <View style={tw`px-5 mt-5 gap-3`}>
          {trackers.map((tracker) => {
            const progress = tracker.label === 'Water'
              ? waterProgress
              : tracker.label === 'Protein'
              ? proteinProgress
              : tracker.label === 'Carbs'
              ? carbsProgress
              : fatsProgress;

            return (
              <View
                key={tracker.label}
                style={[
                  tw`p-4 rounded-2xl`,
                  { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
                ]}
              >
                <View style={tw`flex-row items-center justify-between mb-2`}>
                  <View style={tw`flex-row items-center gap-2`}>
                    <View
                      style={[
                        tw`w-10 h-10 rounded-lg items-center justify-center`,
                        { backgroundColor: tracker.color + '18' },
                      ]}
                    >
                      <MaterialIcons name={tracker.icon as any} size={20} color={tracker.color} />
                    </View>
                    <Text style={[tw`font-bold`, { color: textPrimary }]}>{tracker.label}</Text>
                  </View>
                  <Text style={[tw`text-sm font-bold`, { color: tracker.color }]}>
                    {Math.round(tracker.current)}{tracker.unit} / {tracker.target}{tracker.unit}
                  </Text>
                </View>
                <View
                  style={[
                    tw`h-2 rounded-full overflow-hidden`,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
                  ]}
                >
                  <View
                    style={[
                      tw`h-full rounded-full`,
                      { width: `${progress * 100}%`, backgroundColor: tracker.color },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Quick Actions */}
        <View style={tw`px-5 mt-6 gap-3`}>
          <Text style={[tw`text-sm font-bold uppercase tracking-wider`, { color: textSecondary }]}>
            Quick Actions
          </Text>
          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Meals')}
              style={[
                tw`flex-1 rounded-2xl p-4 items-center justify-center gap-2`,
                { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' },
              ]}
            >
              <MaterialIcons name="restaurant" size={24} color={accent} />
              <Text style={[tw`text-xs font-bold text-center`, { color: accent }]}>
                Log Meal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('VisionAnalysisLab')}
              style={[
                tw`flex-1 rounded-2xl p-4 items-center justify-center gap-2`,
                { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' },
              ]}
            >
              <MaterialIcons name="fitness-center" size={24} color={accent} />
              <Text style={[tw`text-xs font-bold text-center`, { color: accent }]}>
                Start Workout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setWaterGlasses((prev) => Math.min(prev + 1, 16))}
              style={[
                tw`flex-1 rounded-2xl p-4 items-center justify-center gap-2`,
                { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' },
              ]}
            >
              <MaterialIcons name="water-drop" size={24} color={accent} />
              <Text style={[tw`text-xs font-bold text-center`, { color: accent }]}>
                Add Water
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Analytics Section */}
        <View style={tw`px-5 mt-6`}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ProgressScreen')}
            style={[
              tw`rounded-2xl p-4 flex-row items-center justify-between`,
              { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' },
            ]}
          >
            <View style={tw`flex-row items-center gap-3`}>
              <View
                style={[
                  tw`w-10 h-10 rounded-lg items-center justify-center`,
                  { backgroundColor: accent + '28' },
                ]}
              >
                <MaterialIcons name="trending-up" size={20} color={accent} />
              </View>
              <View>
                <Text style={[tw`font-bold text-sm`, { color: accent }]}>
                  View Analytics
                </Text>
                <Text style={[tw`text-xs mt-0.5`, { color: textSecondary }]}>
                  Weekly stats & progress
                </Text>
              </View>
            </View>
            <MaterialIcons name="arrow-forward" size={20} color={accent} />
          </TouchableOpacity>
        </View>

        {/* Today's Meals Summary */}
        {meals.length > 0 && (
          <View style={tw`px-5 mt-6`}>
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <Text style={[tw`text-sm font-bold uppercase tracking-wider`, { color: textSecondary }]}>
                Logged Meals ({mealCount})
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Meals')}>
                <MaterialIcons name="arrow-forward" size={18} color={accent} />
              </TouchableOpacity>
            </View>

            {meals.map((meal) => {
              const isLogged = checkedMeals[meal.id];
              return (
                <TouchableOpacity
                  key={meal.id}
                  onPress={() => setCheckedMeals((prev) => ({ ...prev, [meal.id]: !prev[meal.id] }))}
                  style={[
                    tw`p-3 rounded-xl mb-2 flex-row items-center justify-between`,
                    {
                      backgroundColor: cardBg,
                      borderWidth: 1,
                      borderColor: isLogged ? accent + '40' : cardBorder,
                      opacity: isLogged ? 0.65 : 1,
                    },
                  ]}
                >
                  <View style={tw`flex-row items-center gap-2 flex-1`}>
                    <View
                      style={[
                        tw`w-8 h-8 rounded-lg items-center justify-center`,
                        { backgroundColor: isLogged ? '#4ade80' + '20' : accent + '18' },
                      ]}
                    >
                      {isLogged ? (
                        <MaterialIcons name="check-circle" size={18} color="#4ade80" />
                      ) : (
                        <MaterialIcons name="circle" size={18} color={accent} />
                      )}
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                        {meal.name}
                      </Text>
                      <Text style={[tw`text-xs`, { color: textSecondary }]}>
                        {meal.totalCalories} kcal
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav
        activeId="track"
        onSelect={(id) => {
          if (id === 'home') navigation.navigate('TraineeCommandCenter');
          if (id === 'workouts') navigation.navigate('VisionAnalysisLab');
          if (id === 'meals') navigation.navigate('Meals');
          if (id === 'messages') navigation.navigate('Messages');
          if (id === 'profile') navigation.navigate('Profile');
        }}
        items={[
          { id: 'home', icon: 'home', label: 'Home' },
          { id: 'workouts', icon: 'fitness-center', label: 'Workouts' },
          { id: 'track', icon: 'trending-up', label: 'Track' },
          { id: 'meals', icon: 'restaurant', label: 'Meals' },
          { id: 'messages', icon: 'chat-bubble', label: 'Messages' },
          { id: 'profile', icon: 'person', label: 'Profile' },
        ]}
      />
    </SafeAreaView>
  );
};
