import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Svg, Circle } from 'react-native-svg';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';
import { useFoodManagement } from '../../context/FoodManagementContext';
import { useExerciseManagement } from '../../context/ExerciseManagementContext';
import * as offlineService from '../../services/offlineService';
import * as dietService from '../../services/dietService';
import { TraineeBottomNav } from '../../components/TraineeBottomNav';

const DEFAULT_TARGETS = {
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
  const { customMeals } = useFoodManagement();
  const meals = customMeals || [];
  const { workouts: customWorkouts } = useExerciseManagement();
  const workouts = customWorkouts || [];

  const [checkedMeals, setCheckedMeals] = useState<Record<string, boolean>>({});
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [completedWorkoutMinutes, setCompletedWorkoutMinutes] = useState(0);
  const [activeDietPlan, setActiveDietPlan] = useState<dietService.DietPlan | null>(null);
  const [dailyTargets, setDailyTargets] = useState(DEFAULT_TARGETS);
  // Ref to debounce diet log saves
  const dietLogTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const textMuted = isDark ? '#64748b' : '#94a3b8';

  const firstName = fullName ? fullName.split(' ')[0] : 'Champ';

  // Load cached data and active diet plan on mount
  useEffect(() => {
    const loadData = async () => {
      const today = new Date().toISOString().split('T')[0];
      const cachedMeals = await offlineService.getCachedMealLog(today);
      if (cachedMeals) {
        setCheckedMeals(cachedMeals.checkedMeals);
        setWaterGlasses(cachedMeals.waterGlasses);
      }

      try {
        const { plan } = await dietService.getActiveDietPlan();
        if (plan) {
          setActiveDietPlan(plan);
          setDailyTargets({
            calories: plan.dailyCalorieTarget || DEFAULT_TARGETS.calories,
            protein: plan.macronutrients?.protein || DEFAULT_TARGETS.protein,
            carbs: plan.macronutrients?.carbs || DEFAULT_TARGETS.carbs,
            fats: plan.macronutrients?.fats || DEFAULT_TARGETS.fats,
            water: DEFAULT_TARGETS.water,
            workoutMinutes: DEFAULT_TARGETS.workoutMinutes,
          });
        }
      } catch {
        // use default targets
      }
    };
    loadData();
  }, []);

  // Cache data and save to backend whenever it changes
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    // Always save to local cache
    offlineService.cacheMealLog(today, { checkedMeals, waterGlasses, date: today });

    // Debounce backend save
    if (dietLogTimer.current) clearTimeout(dietLogTimer.current);
    dietLogTimer.current = setTimeout(async () => {
      if (!activeDietPlan) return;
      try {
        const consumed = Object.keys(checkedMeals).reduce(
          (acc, id) => {
            if (!checkedMeals[id]) return acc;
            const meal = meals.find((m: any) => m.id === id);
            if (meal) {
              acc.calories += meal.totalCalories || 0;
              acc.protein += meal.totalMacros?.protein || 0;
              acc.carbs += meal.totalMacros?.carbs || 0;
              acc.fats += meal.totalMacros?.fats || 0;
            }
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fats: 0 }
        );

        const completedCount = Object.values(checkedMeals).filter(Boolean).length;
        const totalMeals = meals.length;
        const status: 'full' | 'partial' | 'missed' =
          completedCount === 0 ? 'missed' :
          completedCount >= totalMeals ? 'full' : 'partial';

        await dietService.logDietDay({
          date: today,
          mealsCompleted: checkedMeals,
          caloriesConsumed: consumed.calories,
          macrosConsumed: { protein: consumed.protein, carbs: consumed.carbs, fats: consumed.fats },
          status,
          dietPlanId: activeDietPlan.id,
        });
      } catch {
        // silently fail — local cache is the source of truth while offline
      }
    }, 2000);
  }, [checkedMeals, waterGlasses]);

  // Calculate consumed macros from checked custom meals
  const consumedMacros = useMemo(() => {
    if (!meals || !Array.isArray(meals)) {
      return { calories: 0, protein: 0, carbs: 0, fats: 0 };
    }
    return meals.reduce(
      (acc, meal) => {
        if (checkedMeals[meal.id]) {
          acc.calories += meal.totalCalories || 0;
          acc.protein += meal.totalMacros?.protein || 0;
          acc.carbs += meal.totalMacros?.carbs || 0;
          acc.fats += meal.totalMacros?.fats || 0;
        }
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [meals, checkedMeals]);

  // Progress calculations
  const calorieProgress = Math.min(consumedMacros.calories / dailyTargets.calories, 1);
  const proteinProgress = Math.min(consumedMacros.protein / dailyTargets.protein, 1);
  const carbsProgress = Math.min(consumedMacros.carbs / dailyTargets.carbs, 1);
  const fatsProgress = Math.min(consumedMacros.fats / dailyTargets.fats, 1);
  const waterProgress = Math.min(waterGlasses / dailyTargets.water, 1);
  const workoutProgress = Math.min(completedWorkoutMinutes / dailyTargets.workoutMinutes, 1);

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
      target: dailyTargets.protein,
      unit: 'g',
      color: '#4ade80',
      icon: 'restaurant',
    },
    {
      label: 'Carbs',
      current: consumedMacros.carbs,
      target: dailyTargets.carbs,
      unit: 'g',
      color: '#facc15',
      icon: 'grain',
    },
    {
      label: 'Fats',
      current: consumedMacros.fats,
      target: dailyTargets.fats,
      unit: 'g',
      color: '#f87171',
      icon: 'opacity',
    },
    {
      label: 'Water',
      current: waterGlasses,
      target: dailyTargets.water,
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
                { label: 'Remaining', value: `${Math.max(dailyTargets.calories - consumedMacros.calories, 0)}`, icon: 'flag' },
                { label: 'Meals', value: `${mealCount}/${(meals || []).length}`, icon: 'restaurant' },
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
        {meals && meals.length > 0 && (
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
      <TraineeBottomNav activeId="track" navigation={navigation} totalUnread={totalUnread} />
    </SafeAreaView>
  );
};
