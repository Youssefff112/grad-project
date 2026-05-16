import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Svg, Circle } from 'react-native-svg';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';
import { useFoodManagement } from '../../context/FoodManagementContext';
import * as offlineService from '../../services/offlineService';
import * as dietService from '../../services/dietService';
import { TraineeBottomNav } from '../../components/TraineeBottomNav';
import {
  WATER_ML_PER_GLASS,
  formatLitres,
  mlFromLitres,
  mlFromMetricCups,
  mlFromUsCups,
} from '../../utils/waterConversions';

const DEFAULT_DAILY_TARGET = { calories: 2000, protein: 150, carbs: 200, fats: 65 };

const MEAL_TIME_MAP: Record<string, string> = {
  breakfast: '7:30 AM',
  lunch: '12:30 PM',
  dinner: '7:30 PM',
  snack: '4:00 PM',
};
const MEAL_ICON_MAP: Record<string, keyof typeof import('@expo/vector-icons').MaterialIcons.glyphMap> = {
  breakfast: 'wb-sunny',
  lunch: 'restaurant',
  dinner: 'nightlight-round',
  snack: 'bolt',
};

export const MealsScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { fullName, userId } = useUser();
  const { totalUnread } = useNotifications();
  const { customMeals } = useFoodManagement();

  // Week day navigation (Mon–Sun).  0 = Monday … 6 = Sunday
  const todayIndex = (() => {
    const d = new Date().getDay(); // 0=Sun
    return d === 0 ? 6 : d - 1;   // convert to Mon=0
  })();
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex);

  const DAY_LABELS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const DAY_FULL_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const [checkedMeals, setCheckedMeals] = useState<Record<string, boolean>>({});
  const [waterGlasses, setWaterGlasses] = useState(3);
  /** Exact ml when user uses the calculator; otherwise derived from glasses × 250 */
  const [waterMlOverride, setWaterMlOverride] = useState<number | null>(null);
  const [showWaterCalc, setShowWaterCalc] = useState(false);
  const [calcLitres, setCalcLitres] = useState('');
  const [calcMetricCups, setCalcMetricCups] = useState('');
  const [calcUsCups, setCalcUsCups] = useState('');
  const [activePlan, setActivePlan] = useState<dietService.DietPlan | null>(null);
  const [dailyTarget, setDailyTarget] = useState(DEFAULT_DAILY_TARGET);
  const [planLoading, setPlanLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const logTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Today's calendar date string YYYY-MM-DD — stable for the lifetime of this render cycle */
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  /** Calendar date string for the currently selected week-day index */
  const selectedDateStr = useMemo(() => {
    const d = new Date();
    const todayDow = d.getDay() === 0 ? 6 : d.getDay() - 1; // Mon=0…Sun=6
    const diff = selectedDayIndex - todayDow;
    const target = new Date(d);
    target.setDate(d.getDate() + diff);
    return target.toISOString().split('T')[0];
  }, [selectedDayIndex]);

  // Build display meals: prefer active backend plan → custom meals → empty
  const mealsToDisplay = (() => {
    if (activePlan) {
      const selectedDayName = DAY_FULL_NAMES[selectedDayIndex];
      const dayPlan = activePlan.weeklyMealPlan.find(
        (d) => d.day.toLowerCase() === selectedDayName.toLowerCase()
      ) || activePlan.weeklyMealPlan[selectedDayIndex] || activePlan.weeklyMealPlan[0];
      if (dayPlan) {
        return dayPlan.meals.map((m, idx) => ({
          id: `${m.type}-${idx}`,
          meal: m.name,
          time: MEAL_TIME_MAP[m.type] || '12:00 PM',
          icon: MEAL_ICON_MAP[m.type] || 'restaurant',
          items: m.ingredients,
          calories: m.nutrition.calories,
          protein: m.nutrition.protein,
          carbs: m.nutrition.carbs,
          fats: m.nutrition.fats,
        }));
      }
    }
    const localMeals = customMeals || [];
    if (localMeals.length > 0) {
      return localMeals.map((meal) => ({
        id: meal.id,
        meal: meal.name,
        time: MEAL_TIME_MAP[meal.mealType] || '12:00 PM',
        icon: MEAL_ICON_MAP[meal.mealType] || 'restaurant',
        items: meal.foods.map((f) => `Food #${f.foodId}`),
        calories: meal.totalCalories,
        protein: meal.totalMacros.protein,
        carbs: meal.totalMacros.carbs,
        fats: meal.totalMacros.fats,
      }));
    }
    return [];
  })();

  // Load active diet plan; re-runs on every focus so deletes/regenerations
  // anywhere in the app are reflected here immediately.
  const loadDietPlan = useCallback(async () => {
    setPlanLoading(true);
    try {
      const { plan } = await dietService.getActiveDietPlan();
      if (plan) {
        setActivePlan(plan);
        setDailyTarget({
          calories: plan.dailyCalorieTarget,
          protein: plan.macronutrients.protein,
          carbs: plan.macronutrients.carbs,
          fats: plan.macronutrients.fats,
        });
      } else {
        // No active plan — drop stale state and revert to defaults.
        setActivePlan(null);
        setDailyTarget(DEFAULT_DAILY_TARGET);
      }
    } catch {
      setActivePlan(null);
      setDailyTarget(DEFAULT_DAILY_TARGET);
    } finally {
      setPlanLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDietPlan();
    }, [loadDietPlan]),
  );

  /**
   * Build a base completion map with every meal ID set to false.
   * This ensures the saved `mealsCompleted` object always contains ALL meal IDs
   * as keys (including unchecked ones), so the backend can compute correct
   * percentages (completed / total) rather than (completed / checked).
   */
  const buildBaseMealMap = useCallback(
    (meals: typeof mealsToDisplay): Record<string, boolean> => {
      const base: Record<string, boolean> = {};
      meals.forEach((m) => { base[m.id] = false; });
      return base;
    },
    [],
  );

  /**
   * Load completion state for the currently selected day.
   * Priority: server log → local cache (today only) → all unchecked.
   * Always merges retrieved data over a full base so every meal ID is present.
   * Fires whenever the selected day or the active plan changes.
   */
  useEffect(() => {
    if (!activePlan) {
      setCheckedMeals({});
      return;
    }

    let cancelled = false;
    setLogLoading(true);

    const load = async () => {
      // Full base — all meals unchecked; used when no valid log exists for this plan
      const base = buildBaseMealMap(mealsToDisplay);

      try {
        const { log } = await dietService.getDietLog(selectedDateStr);
        if (cancelled) return;

        if (log) {
          // PLAN-SWITCH GUARD: only apply meal completions when the log belongs to
          // the currently active plan.  If the client switched plans today, the old
          // log's mealsCompleted must NOT be applied to the new plan's meals
          // (different meals at the same positional IDs would show as already eaten).
          const logBelongsToCurrentPlan =
            log.dietPlanId != null && Number(log.dietPlanId) === activePlan.id;

          if (logBelongsToCurrentPlan && log.mealsCompleted) {
            setCheckedMeals({ ...base, ...(log.mealsCompleted as Record<string, boolean>) });
          } else {
            // Different / missing plan ID — start fresh for this plan.
            setCheckedMeals(base);
          }

          // Water intake is independent of which meal plan is active — always restore it.
          if (selectedDateStr === todayStr && log.waterMl != null && log.waterMl > 0) {
            setWaterMlOverride(log.waterMl);
            setWaterGlasses(Math.min(24, Math.round(log.waterMl / WATER_ML_PER_GLASS)));
          }
          return;
        }
      } catch {
        // network error — fall through to local cache
      }

      if (cancelled) return;

      if (selectedDateStr === todayStr) {
        // Fall back to local offline cache (scoped by userId + planId to avoid cross-plan bleed)
        const cached = await offlineService.getCachedMealLog(selectedDateStr, userId, activePlan.id);
        if (!cancelled && cached) {
          setCheckedMeals({ ...base, ...cached.checkedMeals });
          setWaterGlasses(cached.waterGlasses);
          const w = (cached as { waterMl?: number }).waterMl;
          if (typeof w === 'number' && w > 0) setWaterMlOverride(w);
          else setWaterMlOverride(null);
          return;
        }
      }

      // No valid log found for this plan — initialise with all meals unchecked
      if (!cancelled) setCheckedMeals(base);
    };

    load().finally(() => { if (!cancelled) setLogLoading(false); });
    return () => { cancelled = true; };
  // mealsToDisplay deliberately excluded: it is derived from activePlan + selectedDayIndex
  // which ARE in the dep array, so rebuilding on plan/day change is correct.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDayIndex, activePlan?.id, selectedDateStr, todayStr, userId]);

  // Cache locally + debounce backend save whenever TODAY's meal/water state changes.
  // This effect intentionally skips saving when viewing past/future days — those logs
  // are read-only and we never want to overwrite them with the displayed (stale) state.
  useEffect(() => {
    if (selectedDayIndex !== todayIndex) return;

    const waterMlEffective = waterMlOverride ?? waterGlasses * WATER_ML_PER_GLASS;

    // Ensure every meal ID is present (unchecked meals explicitly false) so the
    // backend denominator is always the full assigned meal count, not just the
    // number of tapped meals.
    const fullMealMap: Record<string, boolean> = { ...buildBaseMealMap(mealsToDisplay), ...checkedMeals };

    // Scope the offline cache by planId so old entries don't bleed into a new plan
    offlineService.cacheMealLog(todayStr, {
      checkedMeals: fullMealMap,
      waterGlasses,
      date: todayStr,
      waterMl: waterMlEffective,
    }, userId, activePlan?.id ?? null);

    setSaveStatus('saving');
    if (logTimer.current) clearTimeout(logTimer.current);
    logTimer.current = setTimeout(async () => {
      try {
        const consumed = mealsToDisplay.reduce(
          (acc, meal) => {
            if (fullMealMap[meal.id]) {
              acc.calories += meal.calories;
              acc.protein += meal.protein;
              acc.carbs += meal.carbs;
              acc.fats += meal.fats;
            }
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fats: 0 },
        );
        const allChecked = mealsToDisplay.length > 0 && mealsToDisplay.every((m) => fullMealMap[m.id]);
        const anyChecked = mealsToDisplay.some((m) => fullMealMap[m.id]);
        await dietService.logDietDay({
          date: todayStr,
          mealsCompleted: fullMealMap,
          caloriesConsumed: consumed.calories,
          macrosConsumed: { protein: consumed.protein, carbs: consumed.carbs, fats: consumed.fats },
          status: allChecked ? 'full' : anyChecked ? 'partial' : 'missed',
          waterMl: waterMlEffective,
          ...(activePlan ? { dietPlanId: activePlan.id } : {}),
        });
        setSaveStatus('saved');
        if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current);
        saveStatusTimer.current = setTimeout(() => setSaveStatus('idle'), 2500);
      } catch {
        setSaveStatus('idle');
        // silent – data cached locally
      }
    }, 2000);
    return () => {
      if (logTimer.current) clearTimeout(logTimer.current);
      if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current);
    };
  }, [checkedMeals, waterGlasses, waterMlOverride, activePlan?.id, selectedDayIndex]);

  const toggleMeal = (id: string) => {
    setCheckedMeals((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Calculate consumed totals from checked meals
  const consumed = mealsToDisplay.reduce(
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

  const waterDisplayMl = waterMlOverride ?? waterGlasses * WATER_ML_PER_GLASS;
  const waterGoalMl = 8 * WATER_ML_PER_GLASS;
  const waterBarPct = Math.min(waterDisplayMl / waterGoalMl, 1);
  const openWaterCalculator = () => {
    const ml = waterDisplayMl;
    setCalcLitres((ml / 1000).toFixed(2));
    setCalcMetricCups('');
    setCalcUsCups('');
    setShowWaterCalc(true);
  };
  const applyWaterCalculator = () => {
    const L = parseFloat(String(calcLitres).replace(',', '.')) || 0;
    const mc = parseFloat(String(calcMetricCups).replace(',', '.')) || 0;
    const uc = parseFloat(String(calcUsCups).replace(',', '.')) || 0;
    const total = Math.min(
      15000,
      Math.max(0, mlFromLitres(L) + mlFromMetricCups(mc) + mlFromUsCups(uc))
    );
    setWaterMlOverride(total);
    setWaterGlasses(Math.min(24, Math.max(0, Math.round(total / WATER_ML_PER_GLASS))));
    setShowWaterCalc(false);
  };
  const ringSize = 160;
  const strokeWidth = 12;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const calorieProgress = Math.min(consumed.calories / dailyTarget.calories, 1);
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
            {"Hey "}{firstName}{", let's fuel up!"}
          </Text>
          {planLoading ? (
            <ActivityIndicator size="small" color={accent} style={tw`mt-1 self-start`} />
          ) : (
            <View style={tw`flex-row items-center gap-2 mt-1`}>
              <Text style={[tw`text-sm`, { color: textSecondary }]}>
                {activePlan ? 'AI plan active · ' : ''}{checkedCount} of {mealsToDisplay.length} meals logged
              </Text>
              {logLoading && <ActivityIndicator size="small" color={accent} />}
              {!logLoading && saveStatus === 'saving' && selectedDayIndex === todayIndex && (
                <Text style={[tw`text-xs`, { color: accent }]}>Saving…</Text>
              )}
              {!logLoading && saveStatus === 'saved' && selectedDayIndex === todayIndex && (
                <View style={tw`flex-row items-center gap-0.5`}>
                  <MaterialIcons name="check-circle" size={13} color="#4ade80" />
                  <Text style={[tw`text-xs font-bold`, { color: '#4ade80' }]}>Saved</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Action Buttons Row */}
        <View style={tw`px-5 mt-4 flex-row gap-2`}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MealGeneration')}
            style={[
              tw`flex-1 rounded-2xl p-4 flex-row items-center justify-between`,
              { backgroundColor: accent + '14' }
            ]}
          >
            <View style={tw`flex-row items-center gap-3 flex-1`}>
              <View
                style={[
                  tw`w-10 h-10 rounded-lg items-center justify-center`,
                  { backgroundColor: accent + '28' }
                ]}
              >
                <MaterialIcons name="restaurant" size={20} color={accent} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                  Generate
                </Text>
                <Text style={[tw`text-xs`, { color: textSecondary }]}>
                  AI-powered
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('MealBuilder')}
            style={[
              tw`flex-1 rounded-2xl p-4 flex-row items-center justify-between`,
              { backgroundColor: accent + '14' }
            ]}
          >
            <View style={tw`flex-row items-center gap-3 flex-1`}>
              <View
                style={[
                  tw`w-10 h-10 rounded-lg items-center justify-center`,
                  { backgroundColor: accent + '28' }
                ]}
              >
                <MaterialIcons name="add" size={20} color={accent} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                  Create
                </Text>
                <Text style={[tw`text-xs`, { color: textSecondary }]}>
                  Custom meal
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Week day selector — only shown when an active plan exists */}
        {activePlan && !planLoading && (
          <View style={tw`mt-4`}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={tw`px-5 gap-2`}
            >
              {DAY_LABELS_SHORT.map((label, idx) => {
                const isToday = idx === todayIndex;
                const isSelected = idx === selectedDayIndex;
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => setSelectedDayIndex(idx)}
                    style={[
                      tw`items-center px-3 py-2 rounded-2xl min-w-[52px]`,
                      {
                        backgroundColor: isSelected ? accent : isDark ? '#111128' : '#ffffff',
                        borderWidth: 1,
                        borderColor: isSelected ? accent : isToday ? accent + '40' : cardBorder,
                      },
                    ]}
                  >
                    <Text style={[tw`text-xs font-bold`, { color: isSelected ? '#fff' : textPrimary }]}>
                      {label}
                    </Text>
                    {isToday && (
                      <View style={[tw`w-1.5 h-1.5 rounded-full mt-0.5`, { backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : accent }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {selectedDayIndex !== todayIndex && (
              <View style={[tw`mx-5 mt-2 px-3 py-1.5 rounded-lg flex-row items-center gap-1.5`, { backgroundColor: '#f59e0b14' }]}>
                <MaterialIcons name="info-outline" size={14} color="#f59e0b" />
                <Text style={[tw`text-xs`, { color: '#f59e0b' }]}>
                  Viewing {DAY_LABELS_SHORT[selectedDayIndex]} — tap today ({DAY_LABELS_SHORT[todayIndex]}) to log meals
                </Text>
              </View>
            )}
          </View>
        )}

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
                  / {dailyTarget.calories} kcal
                </Text>
              </View>
            </View>

            {/* Right Side Quick Stats */}
            <View style={tw`flex-1 ml-5 gap-3`}>
              {[
                { label: 'Eaten', value: `${consumed.calories}`, unit: 'kcal', icon: 'local-fire-department' as const, color: accent },
                { label: 'Remaining', value: `${Math.max(dailyTarget.calories - consumed.calories, 0)}`, unit: 'kcal', icon: 'flag' as const, color: '#4ade80' },
                { label: 'Meals Left', value: `${mealsToDisplay.length - checkedCount}`, unit: '', icon: 'schedule' as const, color: '#facc15' },
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
              { label: 'Protein', consumed: consumed.protein, target: dailyTarget.protein, unit: 'g', color: '#4ade80' },
              { label: 'Carbs', consumed: consumed.carbs, target: dailyTarget.carbs, unit: 'g', color: '#facc15' },
              { label: 'Fats', consumed: consumed.fats, target: dailyTarget.fats, unit: 'g', color: '#f87171' },
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
            {selectedDayIndex === todayIndex ? "Today's Meals" : `${DAY_LABELS_SHORT[selectedDayIndex]}'s Meals`}
          </Text>

          {/* Empty state — no plan and no custom meals */}
          {!planLoading && mealsToDisplay.length === 0 && (
            <View style={[tw`rounded-2xl p-8 items-center`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}>
              <View style={[tw`w-16 h-16 rounded-full items-center justify-center mb-4`, { backgroundColor: accent + '14' }]}>
                <MaterialIcons name="restaurant" size={32} color={accent} />
              </View>
              <Text style={[tw`text-base font-bold mb-1 text-center`, { color: textPrimary }]}>No meals yet</Text>
              <Text style={[tw`text-sm text-center mb-5`, { color: textSecondary }]}>
                Generate an AI meal plan or build a custom meal to see your daily meals here.
              </Text>
              <View style={tw`flex-row gap-3`}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('MealGeneration')}
                  style={[tw`flex-1 py-3 rounded-xl items-center`, { backgroundColor: accent }]}
                >
                  <Text style={tw`text-sm font-bold text-white`}>Generate Plan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('MealBuilder')}
                  style={[tw`flex-1 py-3 rounded-xl items-center`, { backgroundColor: accent + '18', borderWidth: 1, borderColor: accent + '30' }]}
                >
                  <Text style={[tw`text-sm font-bold`, { color: accent }]}>Build Custom</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {mealsToDisplay.map((meal) => {
            const isChecked = checkedMeals[meal.id];
            const isViewingToday = selectedDayIndex === todayIndex;
            return (
              <TouchableOpacity
                key={meal.id}
                activeOpacity={isViewingToday ? 0.7 : 1}
                onPress={() => isViewingToday && toggleMeal(meal.id)}
                style={[
                  tw`rounded-2xl p-4 mb-3`,
                  {
                    backgroundColor: cardBg,
                    borderWidth: 1,
                    borderColor: isChecked ? accent + '40' : cardBorder,
                    opacity: isChecked ? 0.65 : 1 },
                ]}
              >
                {/* Meal Header */}
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-row items-center gap-3`}>
                    <View
                      style={[
                        tw`w-11 h-11 rounded-xl items-center justify-center`,
                        {
                          backgroundColor: isChecked ? '#4ade80' + '20' : accent + '18' },
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
                            textDecorationLine: isChecked ? 'line-through' : 'none' },
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
                            textDecorationLine: isChecked ? 'line-through' : 'none' },
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
                    Goal ~{formatLitres(waterGoalMl)} L (8 × {WATER_ML_PER_GLASS} ml)
                  </Text>
                </View>
              </View>
              <Text style={[tw`text-2xl font-black`, { color: '#38bdf8' }]}>
                {formatLitres(waterDisplayMl)}L
              </Text>
            </View>

            <TouchableOpacity
              onPress={openWaterCalculator}
              style={[tw`self-start mb-3 px-3 py-1.5 rounded-lg flex-row items-center gap-1`, { backgroundColor: '#38bdf8' + '18' }]}
            >
              <MaterialIcons name="calculate" size={16} color="#38bdf8" />
              <Text style={[tw`text-xs font-bold`, { color: '#38bdf8' }]}>Cup / litre calculator</Text>
            </TouchableOpacity>

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
                    width: `${Math.round(waterBarPct * 100)}%`,
                    backgroundColor: '#38bdf8' },
                ]}
              />
            </View>

            {/* Glass Icons Row */}
            <View style={tw`flex-row items-center justify-center gap-1.5 mb-4`}>
              {Array.from({ length: 8 }).map((_, i) => {
                const filled = waterDisplayMl >= (i + 1) * WATER_ML_PER_GLASS;
                return (
                <View
                  key={i}
                  style={[
                    tw`w-8 h-8 rounded-lg items-center justify-center`,
                    {
                      backgroundColor: filled ? '#38bdf8' + '20' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)') },
                  ]}
                >
                  <MaterialIcons
                    name="local-drink"
                    size={18}
                    color={filled ? '#38bdf8' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)')}
                  />
                </View>
              );})}
            </View>

            {/* +/- Buttons */}
            <View style={tw`flex-row items-center justify-center gap-4`}>
              <TouchableOpacity
                onPress={() => {
                  setWaterMlOverride(null);
                  setWaterGlasses((prev) => Math.max(prev - 1, 0));
                }}
                style={[
                  tw`w-12 h-12 rounded-full items-center justify-center`,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                ]}
              >
                <MaterialIcons name="remove" size={24} color={textSecondary} />
              </TouchableOpacity>

              <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>
                {(waterDisplayMl / WATER_ML_PER_GLASS).toFixed(1)} glasses
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setWaterMlOverride(null);
                  setWaterGlasses((prev) => Math.min(prev + 1, 24));
                }}
                style={[
                  tw`w-12 h-12 rounded-full items-center justify-center`,
                  {
                    backgroundColor: '#38bdf8' + '18',
                    borderWidth: 1,
                    borderColor: '#38bdf8' + '30' },
                ]}
              >
                <MaterialIcons name="add" size={24} color="#38bdf8" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showWaterCalc} transparent animationType="fade" onRequestClose={() => setShowWaterCalc(false)}>
        <View style={tw`flex-1 justify-end`}>
          <Pressable style={[tw`flex-1`, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={() => setShowWaterCalc(false)} />
          <View
            style={[
              tw`rounded-t-3xl px-5 pt-4 pb-8`,
              { backgroundColor: cardBg, borderTopWidth: 1, borderColor: cardBorder },
            ]}
          >
            <Text style={[tw`text-lg font-bold mb-1`, { color: textPrimary }]}>Water calculator</Text>
            <Text style={[tw`text-xs mb-4`, { color: textMuted }]}>
              Enter any combination. Metric cups = 250 ml each. US cups ≈ 236.6 ml (nutrition labels).
            </Text>
            <Text style={[tw`text-xs font-bold mb-1`, { color: textSecondary }]}>Litres</Text>
            <TextInput
              value={calcLitres}
              onChangeText={setCalcLitres}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={textMuted}
              style={[tw`rounded-xl px-4 py-3 mb-3`, { borderWidth: 1, borderColor: cardBorder, color: textPrimary }]}
            />
            <Text style={[tw`text-xs font-bold mb-1`, { color: textSecondary }]}>Metric cups (250 ml)</Text>
            <TextInput
              value={calcMetricCups}
              onChangeText={setCalcMetricCups}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={textMuted}
              style={[tw`rounded-xl px-4 py-3 mb-3`, { borderWidth: 1, borderColor: cardBorder, color: textPrimary }]}
            />
            <Text style={[tw`text-xs font-bold mb-1`, { color: textSecondary }]}>US cups (~236.6 ml)</Text>
            <TextInput
              value={calcUsCups}
              onChangeText={setCalcUsCups}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={textMuted}
              style={[tw`rounded-xl px-4 py-3 mb-4`, { borderWidth: 1, borderColor: cardBorder, color: textPrimary }]}
            />
            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                onPress={() => setShowWaterCalc(false)}
                style={[tw`flex-1 py-3 rounded-xl items-center`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}
              >
                <Text style={[tw`font-bold`, { color: textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={applyWaterCalculator}
                style={[tw`flex-1 py-3 rounded-xl items-center`, { backgroundColor: '#38bdf8' }]}
              >
                <Text style={tw`font-bold text-white`}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <TraineeBottomNav activeId="meals" navigation={navigation} totalUnread={totalUnread} />
    </SafeAreaView>
  );
};

