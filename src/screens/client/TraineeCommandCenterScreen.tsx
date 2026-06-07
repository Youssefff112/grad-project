import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { canClientSelectPersonalCoach } from '../../utils/planUtils';
import { useNotifications } from '../../context/NotificationContext';
import { hasFeatureAccess } from '../../utils/planUtils';
import { TraineeBottomNav } from '../../components/TraineeBottomNav';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import * as progressService from '../../services/progressService';
import * as workoutService from '../../services/workoutService';
import * as dietService from '../../services/dietService';
import { getClientProfile, getClientSubscriptionStatus } from '../../services/clientService';
import { getCoaches } from '../../services/coachService';
import { WATER_ML_PER_GLASS } from '../../utils/waterConversions';
import { buildImageUrl } from '../../utils/imageUrl';
import type { WorkoutPlan, WorkoutDay } from '../../services/workoutService';

const prettyLabel = (s?: string) =>
  (s || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

const WATER_TARGET_GLASSES = 8;

const getWorkoutImage = (focus?: string): string => {
  const f = (focus || '').toLowerCase().replace(/[\s_]+/g, '_');
  const map: Record<string, string> = {
    chest:      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=900&q=80',
    push:       'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=900&q=80',
    back:       'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=900&q=80',
    pull:       'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=900&q=80',
    legs:       'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=900&q=80',
    lower_body: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=900&q=80',
    upper_body: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=900&q=80',
    shoulders:  'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=900&q=80',
    arms:       'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=900&q=80',
    cardio:     'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=900&q=80',
    core:       'https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=900&q=80',
    abs:        'https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=900&q=80',
    full_body:  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=80',
  };
  for (const key of Object.keys(map)) {
    if (f.includes(key)) return map[key];
  }
  return map.full_body;
};

export const TraineeCommandCenterScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState('home');
  const [weightInput, setWeightInput] = useState('');
  const [bodyFatInput, setBodyFatInput] = useState('');
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);

  // Daily progress
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [hasActiveDietPlan, setHasActiveDietPlan] = useState(false);
  const { isDark, accent, colors } = useTheme();
  const { fullName, lastPlanReviewDate, subscriptionPlan, canUseAIAssistant, weight, setWeight, bodyFatPercentage, setBodyFatPercentage, coachId, coachName, setCoach, clearCoach, setSubscriptionPlan, updateLastPlanReview, userId, profilePicture } = useUser();
  const { totalUnread } = useNotifications();
  const firstName = fullName?.split(' ')[0] || 'Trainee';

  const loadActivePlan = useCallback(async () => {
    try {
      const { plan } = await workoutService.getActiveWorkoutPlan();
      setActivePlan(plan ?? null);
    } catch {
      setActivePlan(null);
    }
    try {
      const exercises = await workoutService.getCompletedExercises();
      setCompletedExercises(exercises);
    } catch {}
  }, []);

  const syncCoachInfo = useCallback(async () => {
    if (!canClientSelectPersonalCoach(subscriptionPlan)) {
      if (coachId) clearCoach();
      return;
    }
    try {
      const profile = await getClientProfile();
      const profileData = (profile as any)?.profile ?? profile;
      const serverCoachId = profileData?.selectedCoachId ?? null;
      if (serverCoachId) {
        if (!coachName) {
          try {
            const { coaches } = await getCoaches();
            const found = coaches?.find((c: any) => String(c.userId) === String(serverCoachId));
            const fromUser = found?.User
              ? `${found.User.firstName || ''} ${found.User.lastName || ''}`.trim()
              : '';
            setCoach(String(serverCoachId), fromUser || coachName || 'Coach');
          } catch {
            setCoach(String(serverCoachId), coachName || 'Coach');
          }
        } else {
          setCoach(String(serverCoachId), coachName);
        }
      } else if (!serverCoachId && coachId) {
        clearCoach();
      }
    } catch {}
  }, [coachId, coachName, subscriptionPlan, setCoach, clearCoach]);

  const syncClientSubscription = useCallback(async () => {
    try {
      const { subscription } = await getClientSubscriptionStatus();
      if (subscription?.planName) setSubscriptionPlan(subscription.planName as any);
    } catch {}
  }, [setSubscriptionPlan]);

  const loadDailyProgress = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const planResult = await dietService.getActiveDietPlan().catch(() => ({ plan: null }));
      const plan = planResult.plan ?? null;

      setHasActiveDietPlan(!!plan);

      if (!plan) {
        setCaloriesConsumed(0);
        setCalorieTarget(0); // No plan — no target, avoids hardcoded 2000 fallback
        setWaterGlasses(0);
        return;
      }

      // Compute today's meal list to derive the real calorie target
      const todayDow = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
      const DAY_FULL_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const todayDayName = DAY_FULL_NAMES[todayDow];
      const dayPlan =
        plan.weeklyMealPlan.find((d) => d.day.toLowerCase() === todayDayName) ||
        plan.weeklyMealPlan[todayDow] ||
        plan.weeklyMealPlan[0];

      const todayMeals = (dayPlan?.meals ?? []).map((m, idx) => ({
        id: `${m.type}-${idx}`,
        calories: m.nutrition?.calories ?? 0,
      }));

      const actualDailyTarget = todayMeals.reduce((sum, m) => sum + m.calories, 0);
      // Prefer today's actual meal-sum; fall back to plan-level target; never use magic 2000
      setCalorieTarget(actualDailyTarget > 0 ? actualDailyTarget : plan.dailyCalorieTarget > 0 ? plan.dailyCalorieTarget : 0);

      // Read today's log from the server
      try {
        const { log } = await dietService.getDietLog(today);
        if (log) {
          // Compute consumed from mealsCompleted + plan meal calories
          if (log.mealsCompleted && Number(log.dietPlanId) === plan.id) {
            const consumed = todayMeals.reduce(
              (sum, meal) => sum + (log.mealsCompleted![meal.id] ? meal.calories : 0),
              0,
            );
            setCaloriesConsumed(consumed);
          } else if (log.caloriesConsumed != null) {
            setCaloriesConsumed(log.caloriesConsumed);
          } else {
            setCaloriesConsumed(0);
          }
          if (log.waterMl != null && log.waterMl > 0) {
            setWaterGlasses(Math.round(log.waterMl / WATER_ML_PER_GLASS));
          } else {
            setWaterGlasses(0);
          }
        } else {
          setCaloriesConsumed(0);
          setWaterGlasses(0);
        }
      } catch {
        setCaloriesConsumed(0);
        setWaterGlasses(0);
      }
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDailyProgress();
      loadActivePlan();
      syncCoachInfo();
      syncClientSubscription();
    }, [loadDailyProgress, loadActivePlan, syncCoachInfo, syncClientSubscription]),
  );

  const todayWorkoutDay = useMemo((): WorkoutDay | null => {
    if (!activePlan?.weeklySchedule) return null;
    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return (
      activePlan.weeklySchedule.find(d => d.day?.toLowerCase() === dayName.toLowerCase() && !d.isRestDay) ||
      activePlan.weeklySchedule.find(d => !d.isRestDay) ||
      null
    );
  }, [activePlan]);

  const nextWorkoutTarget = useMemo(() => {
    const exercises = todayWorkoutDay?.exercises ?? [];
    if (!exercises.length) return null;
    const undone = exercises.find(
      (ex) => !completedExercises.includes(ex.name.toLowerCase()),
    );
    if (undone) return { exercise: undone, isRedo: false };
    return { exercise: exercises[0], isRedo: true };
  }, [todayWorkoutDay, completedExercises]);

  const openNextWorkoutSession = useCallback(() => {
    if (!todayWorkoutDay || !nextWorkoutTarget) return;
    const { exercise } = nextWorkoutTarget;
    navigation.navigate('Calibration', {
      exerciseName: exercise.name,
      workoutName: prettyLabel(todayWorkoutDay.focus) || "Today's Workout",
      workoutFocus: todayWorkoutDay.focus,
      workoutPlanId: activePlan?.id,
      workoutDay: todayWorkoutDay.day?.toLowerCase(),
      targetReps: exercise.reps
        ? parseInt(String(exercise.reps), 10) || undefined
        : undefined,
      targetSets: exercise.sets,
    });
  }, [todayWorkoutDay, nextWorkoutTarget, activePlan?.id, navigation]);

  const shouldShowPlanReview = useMemo(() => {
    if (!lastPlanReviewDate) return true;
    const lastReview = new Date(lastPlanReviewDate);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 7;
  }, [lastPlanReviewDate]);

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[tw`flex-row items-center px-5 py-3 justify-between z-10 relative`, { backgroundColor: colors.navBg, borderBottomWidth: 1, borderColor: colors.navBorder }]}>
        {/* Absolute Centered Title */}
        <View style={tw`absolute inset-0 items-center justify-center pointer-events-none`}>
          <Text style={[tw`text-lg font-black tracking-widest`, { color: accent }]}>VERTEX</Text>
        </View>

        <View style={tw`flex w-12 items-center justify-center`}>
          <TouchableOpacity style={tw`relative p-2 ml-[-8px]`} onPress={() => navigation.navigate('NotificationsSettings')}>
            <MaterialIcons name="notifications" size={30} color={colors.text} />
            {!!totalUnread && (
              <View style={[tw`absolute top-1 right-0 rounded-full items-center justify-center h-5 w-5`, { backgroundColor: colors.error }]}>
                <Text style={tw`text-white text-[10px] font-black`}>
                  {totalUnread > 99 ? '99+' : totalUnread}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={tw`flex w-12 items-center justify-center`}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={tw`p-1 mr-[-8px]`}>
            {buildImageUrl(profilePicture) ? (
              <Image source={{ uri: buildImageUrl(profilePicture) }} style={[tw`rounded-full`, { width: 40, height: 40 }]} />
            ) : (
              <MaterialIcons name="account-circle" size={40} color={colors.text} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-28 pt-4`}>
        
        {/* Greeting Section */}
        <View style={tw`px-6 pb-6`}>
          <Text style={[tw`text-sm font-semibold uppercase tracking-wider`, { color: colors.textMuted }]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
          <Text style={[tw`text-4xl font-black mt-1 tracking-tight`, { color: colors.text }]}>
            Hi, {firstName}
          </Text>
        </View>

        {/* Weekly Check-In Banner */}
        {shouldShowPlanReview && (
          <View style={tw`px-5 mb-6`}>
            <Card variant="filled" padding="md" style={[tw`flex-col gap-4 border`, { borderColor: accent + '40', backgroundColor: accent + '12' }]}>
              <View style={tw`flex-row items-start gap-3`}>
                <View style={[tw`w-10 h-10 rounded-full items-center justify-center`, { backgroundColor: accent + '25' }]}>
                  <MaterialIcons name="scale" size={22} color={accent} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`font-bold text-base`, { color: colors.text }]}>
                    Weekly Weigh-In
                  </Text>
                  <Text style={[tw`text-sm mt-1 leading-relaxed`, { color: colors.textSecondary }]}>
                    Track your weight to optimize your personalized plan.
                  </Text>
                </View>
              </View>
              <View style={tw`flex-col gap-3`}>
                <View style={tw`flex-row gap-3`}>
                  <View style={[tw`flex-1 rounded-2xl flex-row items-center px-2 h-14`, { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder }]}>
                    <MaterialIcons name="monitor-weight" size={18} color={accent} style={tw`mr-1`} />
                    <TextInput
                      placeholder="Weight (kg)"
                      placeholderTextColor={colors.textMuted}
                      value={weightInput}
                      onChangeText={setWeightInput}
                      keyboardType="decimal-pad"
                      style={[tw`flex-1 text-xs font-bold`, { color: colors.text }]}
                    />
                  </View>
                  <View style={[tw`flex-1 rounded-2xl flex-row items-center px-2 h-14`, { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder }]}>
                    <MaterialIcons name="opacity" size={18} color={accent} style={tw`mr-1`} />
                    <TextInput
                      placeholder="Fat %"
                      placeholderTextColor={colors.textMuted}
                      value={bodyFatInput}
                      onChangeText={setBodyFatInput}
                      keyboardType="decimal-pad"
                      style={[tw`flex-1 text-xs font-bold`, { color: colors.text }]}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={async () => {
                      const newWeight = weightInput.trim() ? parseFloat(weightInput) : undefined;
                      const newBodyFat = bodyFatInput.trim() ? parseFloat(bodyFatInput) : undefined;
                      const weightValid = newWeight != null && isFinite(newWeight) && newWeight > 0;
                      const fatValid = newBodyFat != null && isFinite(newBodyFat) && newBodyFat > 0;

                      if (!weightValid && !fatValid) return;

                      if (weightValid) setWeight(newWeight!);
                      if (fatValid) setBodyFatPercentage(newBodyFat!);

                      updateLastPlanReview();
                      progressService.addMeasurement({
                        weight: weightValid ? newWeight : undefined,
                        bodyFat: fatValid ? newBodyFat : undefined,
                        measuredAt: new Date().toISOString(),
                      }).catch(() => {});

                      setWeightInput('');
                      setBodyFatInput('');
                    }}
                    style={[tw`h-14 w-14 rounded-2xl items-center justify-center`, { backgroundColor: accent }]}
                  >
                    <MaterialIcons name="check" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Coach Info Card */}
        {canClientSelectPersonalCoach(subscriptionPlan) && !!coachId && (
          <View style={tw`px-5 mb-6`}>
            <TouchableOpacity onPress={() => navigation.navigate('CoachAssignment')}>
              <Card variant="default" padding="sm" style={tw`flex-row items-center gap-3`}>
                <View style={[tw`w-12 h-12 rounded-full items-center justify-center`, { backgroundColor: accent + '15' }]}>
                  <MaterialIcons name="sports" size={24} color={accent} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-xs font-bold uppercase tracking-wider`, { color: accent }]}>Your Coach</Text>
                  <Text style={[tw`text-base font-bold mt-0.5`, { color: colors.text }]}>{coachName || 'Coach'}</Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('Chat', {
                      conversationName: coachName || 'Coach',
                      receiverId: Number(coachId),
                      conversationId: null,
                    })
                  }
                  style={[tw`h-10 w-10 rounded-full items-center justify-center`, { backgroundColor: accent + '15' }]}
                >
                  <MaterialIcons name="chat-bubble" size={20} color={accent} />
                </TouchableOpacity>
              </Card>
            </TouchableOpacity>
          </View>
        )}

        {/* Daily Dial Section */}
        <View style={tw`px-5 mb-8`}>
          <View style={tw`flex-row items-end justify-between mb-4`}>
            <Text style={[tw`text-2xl font-black tracking-tight`, { color: colors.text }]}>
              Daily Dial
            </Text>
          </View>

          <View style={tw`flex-row justify-between gap-4`}>
            {/* Calories Card */}
            {(() => {
              const pct = calorieTarget > 0 ? Math.min(caloriesConsumed / calorieTarget, 1) : 0;
              const remaining = calorieTarget > 0 ? Math.max(calorieTarget - caloriesConsumed, 0) : 0;
              const isComplete = hasActiveDietPlan && calorieTarget > 0 && pct >= 1;
              const barColor = isComplete ? colors.success : colors.warning;
              return (
                <View style={tw`flex-1`}>
                  <TouchableOpacity onPress={() => navigation.navigate('Meals')} activeOpacity={0.8}>
                    <Card variant="default" padding="lg" style={tw`flex-col gap-3 h-44 justify-between`}>
                      <View style={tw`flex-row items-center gap-2`}>
                        <View style={[tw`w-8 h-8 rounded-full items-center justify-center`, { backgroundColor: isComplete ? colors.successSurface : colors.warningSurface }]}>
                          <MaterialIcons name={isComplete ? 'check-circle' : 'local-fire-department'} size={16} color={isComplete ? colors.success : colors.warning} />
                        </View>
                        <Text style={[tw`text-[11px] font-bold uppercase tracking-widest`, { color: colors.textSecondary }]}>Calories</Text>
                      </View>
                      
                      <View style={tw`items-center`}>
                        {!hasActiveDietPlan ? (
                          <Text style={[tw`text-sm font-semibold text-center`, { color: colors.textMuted }]}>No meal plan</Text>
                        ) : (
                          <Text style={[tw`text-3xl font-black tracking-tighter text-center`, { color: isComplete ? colors.success : colors.text }]}>
                            {caloriesConsumed.toLocaleString()}
                          </Text>
                        )}
                        <Text style={[tw`text-xs font-medium mt-1 text-center`, { color: colors.textMuted }]}>
                          {!hasActiveDietPlan
                            ? 'Add a plan to track'
                            : isComplete
                            ? '🎯 Goal met!'
                            : `${remaining.toLocaleString()} kcal left`}
                        </Text>
                      </View>

                      <View style={tw`w-full`}>
                        <View style={[tw`w-full h-2 rounded-full overflow-hidden`, { backgroundColor: colors.bgSurface }]}>
                          <View style={[tw`h-full rounded-full`, { backgroundColor: barColor, width: `${Math.round(pct * 100)}%` }]} />
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                </View>
              );
            })()}

            {/* Water Card */}
            {(() => {
              const pct = Math.min(waterGlasses / WATER_TARGET_GLASSES, 1);
              const waterL = ((waterGlasses * WATER_ML_PER_GLASS) / 1000).toFixed(1);
              return (
                <View style={tw`flex-1`}>
                  <TouchableOpacity onPress={() => navigation.navigate('Meals')} activeOpacity={0.8}>
                    <Card variant="default" padding="lg" style={tw`flex-col gap-3 h-44 justify-between`}>
                      <View style={tw`flex-row items-center gap-2`}>
                        <View style={[tw`w-8 h-8 rounded-full items-center justify-center`, { backgroundColor: 'rgba(10,132,255,0.15)' }]}>
                          <MaterialIcons name="water-drop" size={16} color="#0a84ff" />
                        </View>
                        <Text style={[tw`text-[11px] font-bold uppercase tracking-widest`, { color: colors.textSecondary }]}>Water</Text>
                      </View>
                      
                      <View style={tw`items-center`}>
                        <Text style={[tw`text-3xl font-black tracking-tighter text-center`, { color: colors.text }]}>
                          {waterL}L
                        </Text>
                        <Text style={[tw`text-xs font-medium mt-1 text-center`, { color: colors.textMuted }]}>
                          {waterGlasses} of {WATER_TARGET_GLASSES} glasses
                        </Text>
                      </View>

                      <View style={tw`w-full`}>
                        <View style={[tw`w-full h-2 rounded-full overflow-hidden`, { backgroundColor: colors.bgSurface }]}>
                          <View style={[tw`h-full rounded-full bg-blue-500`, { width: `${Math.round(pct * 100)}%` }]} />
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                </View>
              );
            })()}
          </View>
        </View>

        {/* AI Generate Section */}
        {(hasFeatureAccess(subscriptionPlan, 'hasAIWorkoutGeneration') || hasFeatureAccess(subscriptionPlan, 'hasAIMealPlanGeneration')) && (
          <View style={tw`px-5 mb-8`}>
            <Text style={[tw`text-xl font-black tracking-tight mb-4`, { color: colors.text }]}>
              Intelligence
            </Text>
            <View style={tw`flex-row gap-4`}>
              <TouchableOpacity
                onPress={() => navigation.navigate('WorkoutGeneration')}
                style={tw`flex-1`}
              >
                <Card variant="filled" padding="md" style={tw`items-center`}>
                  <View style={[tw`w-12 h-12 rounded-full items-center justify-center mb-3`, { backgroundColor: accent + '20' }]}>
                    <MaterialIcons name="auto-awesome" size={24} color={accent} />
                  </View>
                  <Text style={[tw`font-bold text-sm text-center`, { color: colors.text }]}>AI Workout</Text>
                </Card>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('MealGeneration')}
                style={tw`flex-1`}
              >
                <Card variant="filled" padding="md" style={tw`items-center`}>
                  <View style={[tw`w-12 h-12 rounded-full items-center justify-center mb-3`, { backgroundColor: accent + '20' }]}>
                    <MaterialIcons name="restaurant-menu" size={24} color={accent} />
                  </View>
                  <Text style={[tw`font-bold text-sm text-center`, { color: colors.text }]}>AI Diet</Text>
                </Card>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Workout Anchor */}
        <View style={tw`px-5 mb-8`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={[tw`text-2xl font-black tracking-tight`, { color: colors.text }]}>
              Workout Anchor
            </Text>
            {hasFeatureAccess(subscriptionPlan, 'hasComputerVision') && (
              <TouchableOpacity onPress={() => navigation.navigate('VisionAnalysisLab')}>
                <Text style={[tw`text-sm font-bold`, { color: accent }]}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {hasFeatureAccess(subscriptionPlan, 'hasComputerVision') ? (
            todayWorkoutDay ? (
              <View style={tw`gap-4`}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[tw`overflow-hidden rounded-3xl h-64 w-full shadow-lg`, { backgroundColor: colors.card }]}
                  onPress={openNextWorkoutSession}
                >
                  <ImageBackground
                    source={{ uri: getWorkoutImage(todayWorkoutDay.focus) }}
                    style={tw`w-full h-full justify-end`}
                    imageStyle={{ resizeMode: 'cover' }}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.85)']}
                      style={tw`absolute inset-0`}
                    />
                    <View style={tw`p-6`}>
                      <View style={tw`flex-row items-center gap-3 mb-3`}>
                        <View style={[tw`px-3 py-1 rounded-full`, { backgroundColor: accent }]}>
                          <Text style={tw`text-white text-[10px] font-black uppercase tracking-widest`}>Up Next</Text>
                        </View>
                        <Text style={tw`text-white/80 text-xs font-bold uppercase tracking-wider`}>
                          {prettyLabel(todayWorkoutDay.day)} · {todayWorkoutDay.duration || 60} min
                        </Text>
                      </View>
                      <Text style={tw`text-white text-3xl font-black mb-1 tracking-tighter`}>
                        {prettyLabel(todayWorkoutDay.focus) || "Today's Workout"}
                      </Text>
                      {nextWorkoutTarget && (
                        <Text style={tw`text-white/70 text-sm font-bold mb-4`}>
                          {nextWorkoutTarget.isRedo
                            ? `All done — redo ${nextWorkoutTarget.exercise.name}`
                            : `Next: ${nextWorkoutTarget.exercise.name}`}
                        </Text>
                      )}
                      
                      <Button 
                        title={
                          nextWorkoutTarget
                            ? nextWorkoutTarget.isRedo
                              ? `Redo ${nextWorkoutTarget.exercise.name}`
                              : `Start ${nextWorkoutTarget.exercise.name}`
                            : 'Start Session'
                        }
                        size="md" 
                        icon={<MaterialIcons name="play-arrow" size={20} color="white" />}
                        onPress={openNextWorkoutSession}
                      />
                    </View>
                  </ImageBackground>
                </TouchableOpacity>

                {(todayWorkoutDay.exercises || []).length > 0 && (
                  <View style={tw`mt-2 gap-3`}>
                    {(todayWorkoutDay.exercises || []).slice(0, 3).map((exercise, i) => {
                      const exDone = completedExercises.includes(exercise.name.toLowerCase());
                      return (
                        <TouchableOpacity
                          key={i}
                          onPress={() => navigation.navigate('ExerciseDetail', { name: exercise.name })}
                        >
                          <Card variant="default" padding="md" style={tw`flex-row items-center justify-between`}>
                            <View style={tw`flex-row items-center gap-4`}>
                              <View style={[tw`w-12 h-12 rounded-2xl items-center justify-center`, { backgroundColor: exDone ? colors.successSurface : colors.bgSurface }]}>
                                {exDone
                                  ? <MaterialIcons name="check" size={20} color={colors.success} />
                                  : <Text style={[tw`text-sm font-black`, { color: colors.textSecondary }]}>{i + 1}</Text>
                                }
                              </View>
                              <View>
                                <Text style={[tw`text-base font-bold`, { color: exDone ? colors.success : colors.text }]}>{exercise.name}</Text>
                                <Text style={[tw`text-xs font-medium mt-1`, { color: colors.textMuted }]}>
                                  {exercise.sets} sets · {exercise.reps} reps
                                </Text>
                              </View>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
                          </Card>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : (
              <Card variant="default" padding="lg" style={tw`items-center gap-4 py-10`}>
                <View style={[tw`w-16 h-16 rounded-full items-center justify-center`, { backgroundColor: accent + '15' }]}>
                  <MaterialIcons name="calendar-today" size={28} color={accent} />
                </View>
                <View style={tw`items-center`}>
                  <Text style={[tw`text-lg font-black`, { color: colors.text }]}>No Plan Assigned</Text>
                  <Text style={[tw`text-sm text-center mt-2`, { color: colors.textSecondary }]}>Generate a new AI plan or ask your coach for a routine.</Text>
                </View>
                <Button 
                  title="Generate Plan" 
                  size="md" 
                  onPress={() => navigation.navigate('WorkoutGeneration')}
                  containerStyle={tw`w-full mt-2`}
                />
              </Card>
            )
          ) : (
            <TouchableOpacity onPress={() => navigation.navigate('SubscriptionPlans')}>
              <Card variant="elevated" padding="lg" style={tw`items-center gap-3 py-8`}>
                <View style={[tw`w-16 h-16 rounded-full items-center justify-center mb-2`, { backgroundColor: accent + '15' }]}>
                  <MaterialIcons name="lock" size={28} color={accent} />
                </View>
                <Text style={[tw`text-xl font-black text-center`, { color: colors.text }]}>Premium Tracking</Text>
                <Text style={[tw`text-sm text-center mb-4`, { color: colors.textSecondary }]}>Unlock AI form analysis and smart workout guidance.</Text>
                <Button 
                  title="Upgrade Plan" 
                  size="md" 
                  onPress={() => navigation.navigate('SubscriptionPlans')} 
                  containerStyle={tw`w-full`}
                />
              </Card>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>

      <TraineeBottomNav activeId={activeTab} navigation={navigation} totalUnread={totalUnread} />
    </SafeAreaView>
  );
};

