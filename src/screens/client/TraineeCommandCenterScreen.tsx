import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';
import { useOffline } from '../../context/OfflineContext';
import { hasFeatureAccess } from '../../utils/planUtils';
import { TraineeBottomNav } from '../../components/TraineeBottomNav';
import { Button } from '../../components/Button';
import * as progressService from '../../services/progressService';
import * as workoutService from '../../services/workoutService';
import * as dietService from '../../services/dietService';
import * as offlineService from '../../services/offlineService';
import { getClientProfile, getClientSubscriptionStatus } from '../../services/clientService';
import { getCoaches } from '../../services/coachService';
import { WATER_ML_PER_GLASS } from '../../utils/waterConversions';
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

  // Daily progress
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const { isDark, accent } = useTheme();
  const { fullName, lastPlanReviewDate, subscriptionPlan, canUseAIAssistant, weight, setWeight, bodyFatPercentage, setBodyFatPercentage, coachId, coachName, setCoach, clearCoach, setSubscriptionPlan } = useUser();
  const { totalUnread } = useNotifications();
  const { isOnline, syncInProgress, queuedCount } = useOffline();
  const firstName = fullName?.split(' ')[0] || 'Trainee';

  // Calculate readiness score based on various factors
  const readinessScore = Math.floor(Math.random() * 40 + 60); // 60-100%

  const loadActivePlan = useCallback(async () => {
    try {
      const { plan } = await workoutService.getActiveWorkoutPlan();
      // Always reflect the server-side truth, including null (no plan).
      // Without this, deleting / regenerating the plan elsewhere would leave
      // the stale plan stuck on the home page.
      setActivePlan(plan ?? null);
    } catch {
      setActivePlan(null);
    }
  }, []);

  // Sync assigned coach from the server so it persists correctly after restart
  const syncCoachInfo = useCallback(async () => {
    try {
      const profile = await getClientProfile();
      const profileData = (profile as any)?.profile ?? profile;
      const serverCoachId = profileData?.selectedCoachId ?? null;
      if (serverCoachId) {
        // Resolve coach name if we don't already have it
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
        // Server says no coach but local state has one — clear it
        clearCoach();
      }
    } catch {
      // Non-critical — silently fail, coach card will show based on AsyncStorage
    }
  }, [coachId, coachName, setCoach, clearCoach]);

  const syncClientSubscription = useCallback(async () => {
    try {
      const { subscription } = await getClientSubscriptionStatus();
      if (subscription?.planName) setSubscriptionPlan(subscription.planName as any);
    } catch {
      /* non-blocking */
    }
  }, [setSubscriptionPlan]);

  const loadDailyProgress = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [logResult, planResult] = await Promise.allSettled([
        offlineService.getCachedMealLog(today),
        dietService.getActiveDietPlan(),
      ]);

      const cachedLog =
        logResult.status === 'fulfilled' ? (logResult.value as offlineService.DailyMealLog | null) : null;
      const plan: dietService.DietPlan | null =
        planResult.status === 'fulfilled' && planResult.value ? planResult.value.plan ?? null : null;

      const log = cachedLog;
      if (log?.waterMl != null && log.waterMl > 0) {
        setWaterGlasses(Math.round(log.waterMl / WATER_ML_PER_GLASS));
      } else {
        setWaterGlasses(log?.waterGlasses ?? 0);
      }

      const dietPlan = plan;
      // Reset to default when there's no active diet plan, otherwise the
      // home page keeps showing the deleted plan's calorie target.
      setCalorieTarget(dietPlan?.dailyCalorieTarget ?? 2000);
      if (!dietPlan) setCaloriesConsumed(0);

      // Try to get today's consumed calories from diet history
      try {
        const { logs } = await dietService.getDietHistory(1, 5);
        const todayLog = logs.find((l) => l.date?.startsWith(today));
        if (todayLog?.caloriesConsumed != null) {
          setCaloriesConsumed(todayLog.caloriesConsumed);
        }
        if (todayLog?.waterMl != null && todayLog.waterMl > 0) {
          setWaterGlasses(Math.round(todayLog.waterMl / WATER_ML_PER_GLASS));
        }
      } catch {
        // no history yet
      }
    } catch {
      // ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDailyProgress();
      loadActivePlan();
      syncCoachInfo();
      syncClientSubscription();
    }, [loadDailyProgress, loadActivePlan, syncCoachInfo, syncClientSubscription]),
  );

  // Get today's workout day from the active plan
  const todayWorkoutDay = useMemo((): WorkoutDay | null => {
    if (!activePlan?.weeklySchedule) return null;
    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return (
      activePlan.weeklySchedule.find(d => d.day?.toLowerCase() === dayName.toLowerCase() && !d.isRestDay) ||
      activePlan.weeklySchedule.find(d => !d.isRestDay) ||
      null
    );
  }, [activePlan]);

  const getReadinessStatus = () => {
    if (readinessScore >= 80) return 'Optimal';
    if (readinessScore >= 60) return 'Good';
    return 'Fair';
  };

  const getReadinessRecommendation = () => {
    const score = readinessScore;
    if (score >= 85) return 'Your recovery is optimal. High intensity training is recommended today.';
    if (score >= 70) return 'You\'re ready for moderate to high intensity. Recovery is adequate.';
    if (score >= 50) return 'Consider lighter training today. Your body needs more recovery.';
    return 'Take it easy today. Focus on stretching and mobility work.';
  };

  // Check if plan review is due (every 7 days)
  const shouldShowPlanReview = useMemo(() => {
    if (!lastPlanReviewDate) return true;
    const lastReview = new Date(lastPlanReviewDate);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 7;
  }, [lastPlanReviewDate]);

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center p-4 pb-2 justify-between z-10`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <View style={tw`flex w-12 items-center justify-start`}>
          <TouchableOpacity style={tw`relative p-2`} onPress={() => navigation.navigate('NotificationsSettings')}>
            <MaterialIcons name="notifications" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
            {!!totalUnread && (
              <View style={[tw`absolute top-1 right-0 rounded-full items-center justify-center h-5 w-5`, { backgroundColor: accent }]}>
                <Text style={tw`text-white text-xs font-bold`}>
                  {totalUnread > 99 ? '99+' : totalUnread}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={tw`flex-row items-center gap-2`}>
          {!isOnline && (
            <View style={[tw`px-3 py-1 rounded-full flex-row items-center gap-1`, { backgroundColor: '#ef444430' }]}>
              <MaterialIcons name="wifi-off" size={12} color="#ef4444" />
              <Text style={tw`text-xs text-red-500 font-bold`}>Offline</Text>
            </View>
          )}
          {syncInProgress && (
            <View style={tw`flex-row items-center gap-1`}>
              <MaterialIcons name="cloud-upload" size={16} color={accent} />
              <Text style={[tw`text-xs font-semibold`, { color: accent }]}>Syncing...</Text>
            </View>
          )}
          {!!queuedCount && (
            <View style={tw`px-2 py-0.5 rounded bg-yellow-500/20`}>
              <Text style={tw`text-xs text-yellow-600 font-bold`}>{queuedCount} pending</Text>
            </View>
          )}
        </View>
        <Text style={[tw`text-lg font-bold tracking-tighter flex-1 text-center`, { color: accent }]}>VERTEX</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={tw`flex size-12 shrink-0 items-center justify-center`}>
          <MaterialIcons name="person" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-24`}>
        {/* Personal Info & Plan Review Reminder Banner */}
        {shouldShowPlanReview && (
          <View style={[tw`mx-4 mt-4 rounded-xl p-4 flex-col gap-3`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}>
            <View style={tw`flex-row items-start gap-3`}>
              <MaterialIcons name="scale" size={22} color={accent} style={tw`mt-0.5`} />
              <View style={tw`flex-1`}>
                <Text style={[tw`font-bold text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                  Weekly Check-In: Weigh In
                </Text>
                <Text style={[tw`text-xs mt-1.5 leading-relaxed`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  Weigh yourself this week to track your progress accurately. Your weight helps us optimize your personalized plan for better results.
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={tw`flex-col gap-2 mt-2`}>
              <View style={tw`flex-row gap-2 items-center`}>
                <TextInput
                  placeholder="Weight"
                  placeholderTextColor={isDark ? '#64748b' : '#cbd5e1'}
                  value={weightInput}
                  onChangeText={setWeightInput}
                  keyboardType="decimal-pad"
                  style={[tw`flex-1 rounded-lg p-3 text-base font-semibold`, { 
                    backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    borderWidth: 1,
                    borderColor: accent + '40'
                  }]}
                />
                <TextInput
                  placeholder="Body Fat %"
                  placeholderTextColor={isDark ? '#64748b' : '#cbd5e1'}
                  value={bodyFatInput}
                  onChangeText={setBodyFatInput}
                  keyboardType="decimal-pad"
                  style={[tw`flex-1 rounded-lg p-3 text-base font-semibold`, { 
                    backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    borderWidth: 1,
                    borderColor: accent + '40'
                  }]}
                />
                <TouchableOpacity
                  onPress={async () => {
                    if (weightInput.trim() || bodyFatInput.trim()) {
                      const newWeight = weightInput.trim() ? parseFloat(weightInput) : undefined;
                      const newBodyFat = bodyFatInput.trim() ? parseFloat(bodyFatInput) : undefined;

                      if (newWeight) setWeight(newWeight);
                      if (newBodyFat) setBodyFatPercentage(newBodyFat);

                      try {
                        await progressService.addMeasurement({
                          weight: newWeight,
                          bodyFat: newBodyFat,
                          measuredAt: new Date().toISOString(),
                        });
                      } catch {
                        // silently fail — local state already updated
                      }

                      setWeightInput('');
                      setBodyFatInput('');
                    }
                  }}
                  style={[tw`rounded-lg p-3 items-center justify-center`, { backgroundColor: accent }]}
                >
                  <MaterialIcons name="check" size={20} color="white" />
                </TouchableOpacity>
              </View>
              <View style={tw`flex-row gap-2 text-xs`}>
                {!!weight && <Text style={[tw`flex-1 text-xs text-center`, { color: isDark ? '#94a3b8' : '#64748b' }]}>Weight: {weight} kg</Text>}
                {!!bodyFatPercentage && <Text style={[tw`flex-1 text-xs text-center`, { color: isDark ? '#94a3b8' : '#64748b' }]}>Fat: {bodyFatPercentage}%</Text>}
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('SubscriptionPlans')}
                style={[tw`rounded-lg p-3 items-center`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}
              >
                <Text style={[tw`font-bold text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  Review Plans
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* Greeting */}
        <View style={tw`px-4 pt-6 pb-2`}>
          <Text style={[tw`text-sm font-medium`, { color: isDark ? '#94a3b8' : '#64748b' }]}>Welcome back,</Text>
          <Text style={[tw`text-2xl font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{firstName}</Text>
        </View>

        {/* Coach Info Card — shows only when client has an assigned coach */}
        {!!coachId && (
          <View style={tw`px-4 mb-2 flex-row items-stretch gap-2`}>
            <TouchableOpacity
              onPress={() => navigation.navigate('CoachAssignment')}
              style={[tw`flex-1 flex-row items-center gap-3 p-3 rounded-xl`, { backgroundColor: accent + '12', borderWidth: 1, borderColor: accent + '28' }]}
            >
              <View style={[tw`w-9 h-9 rounded-full items-center justify-center`, { backgroundColor: accent + '20' }]}>
                <MaterialIcons name="sports" size={18} color={accent} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={[tw`text-xs font-semibold`, { color: accent }]}>Your Coach</Text>
                <Text style={[tw`text-sm font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{coachName || 'Coach'}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={accent} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Chat', {
                  conversationName: coachName || 'Coach',
                  receiverId: Number(coachId),
                  conversationId: null,
                })
              }
              accessibilityLabel="Message your coach"
              style={[tw`w-14 rounded-xl items-center justify-center`, { backgroundColor: accent + '20', borderWidth: 1, borderColor: accent + '35' }]}
            >
              <MaterialIcons name="chat-bubble" size={22} color={accent} />
            </TouchableOpacity>
          </View>
        )}

        {/* Daily Dial Section */}
        <View style={tw`px-4 pt-2`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={[tw`text-2xl font-bold leading-tight tracking-tight`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Daily Dial
            </Text>
            <Text style={[tw`text-sm font-semibold`, { color: accent }]}>Today</Text>
          </View>

          <View style={tw`flex-row flex-wrap justify-between gap-y-3`}>
            {/* Calories Card */}
            {(() => {
              const pct = calorieTarget > 0 ? Math.min(caloriesConsumed / calorieTarget, 1) : 0;
              const remaining = calorieTarget - caloriesConsumed;
              return (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Meals')}
                  activeOpacity={0.7}
                  style={[tw`w-[48%] flex-col gap-2 rounded-xl p-4`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
                >
                  <View style={tw`flex-row items-center gap-1.5`}>
                    <MaterialIcons name="local-fire-department" size={18} color={accent} />
                    <Text style={[tw`text-xs font-semibold uppercase tracking-wider`, { color: isDark ? '#64748b' : '#94a3b8' }]}>Calories</Text>
                  </View>
                  <Text style={[tw`text-2xl font-black leading-tight`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    {caloriesConsumed.toLocaleString()}
                  </Text>
                  <View style={[tw`w-full h-1.5 rounded-full overflow-hidden`, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                    <View style={[tw`h-full rounded-full`, { backgroundColor: accent, width: `${Math.round(pct * 100)}%` }]} />
                  </View>
                  <Text style={[tw`text-xs font-semibold`, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                    {remaining > 0 ? `${remaining.toLocaleString()} kcal left` : 'Goal reached!'}{'\n'}
                    <Text style={{ color: isDark ? '#475569' : '#cbd5e1' }}>of {calorieTarget.toLocaleString()}</Text>
                  </Text>
                </TouchableOpacity>
              );
            })()}

            {/* Water Card */}
            {(() => {
              const waterMl = waterGlasses * WATER_ML_PER_GLASS;
              const targetMl = WATER_TARGET_GLASSES * WATER_ML_PER_GLASS;
              const pct = Math.min(waterGlasses / WATER_TARGET_GLASSES, 1);
              const waterL = (waterMl / 1000).toFixed(1);
              const targetL = (targetMl / 1000).toFixed(1);
              return (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Meals')}
                  activeOpacity={0.7}
                  style={[tw`w-[48%] flex-col gap-2 rounded-xl p-4`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
                >
                  <View style={tw`flex-row items-center gap-1.5`}>
                    <MaterialIcons name="water-drop" size={18} color="#3b82f6" />
                    <Text style={[tw`text-xs font-semibold uppercase tracking-wider`, { color: isDark ? '#64748b' : '#94a3b8' }]}>Water</Text>
                  </View>
                  <Text style={[tw`text-2xl font-black leading-tight`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    {waterL}L
                  </Text>
                  <View style={[tw`w-full h-1.5 rounded-full overflow-hidden`, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                    <View style={[tw`h-full rounded-full bg-blue-500`, { width: `${Math.round(pct * 100)}%` }]} />
                  </View>
                  <Text style={[tw`text-xs font-semibold`, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                    {waterGlasses}/{WATER_TARGET_GLASSES} glasses{'\n'}
                    <Text style={{ color: isDark ? '#475569' : '#cbd5e1' }}>of {targetL}L goal</Text>
                  </Text>
                </TouchableOpacity>
              );
            })()}

            {/* Readiness Score */}
            <TouchableOpacity
              onPress={() => navigation.navigate('VisionAnalysisLab')}
              activeOpacity={0.7}
              style={[tw`w-full flex-col gap-2 rounded-xl p-5 shadow-sm mt-3`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}
            >
              <View style={tw`flex-row items-center justify-between`}>
                <View style={tw`flex-row items-center gap-2`}>
                  <MaterialIcons name="bolt" size={24} color={accent} />
                  <Text style={[tw`text-base font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Readiness Score</Text>
                </View>
                <Text style={[tw`text-2xl font-black`, { color: accent }]}>{readinessScore}%</Text>
              </View>
              <Text style={[tw`text-sm leading-relaxed mt-1`, { color: isDark ? '#94a3b8' : '#475569' }]}>
                {getReadinessRecommendation()}
              </Text>
              <View style={tw`flex-row gap-2 mt-2`}>
                <View style={[tw`px-3 py-1 rounded-full`, { backgroundColor: accent + '28' }]}>
                  <Text style={[tw`text-xs font-bold uppercase tracking-wider`, { color: accent }]}>{getReadinessStatus()}</Text>
                </View>
                <View style={[tw`px-3 py-1 rounded-full`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                  <Text style={[tw`text-xs font-bold uppercase tracking-wider`, { color: isDark ? '#cbd5e1' : '#475569' }]}>Start Workout →</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI/Workout & Meal Generation Section */}
        {(hasFeatureAccess(subscriptionPlan, 'hasAIWorkoutGeneration') || hasFeatureAccess(subscriptionPlan, 'hasAIMealPlanGeneration')) && (
          <View style={tw`px-4 mt-8`}>
            <Text style={[tw`text-2xl font-bold leading-tight tracking-tight mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Generate Plans
            </Text>
            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                onPress={() => navigation.navigate('WorkoutGeneration')}
                style={[tw`flex-1 rounded-xl p-4`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}
              >
                <MaterialIcons name="lightbulb" size={28} color={accent} style={tw`mb-2`} />
                <Text style={[tw`font-bold text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                  Generate Workout
                </Text>
                <Text style={[tw`text-xs mt-1`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  Custom plan for you
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('MealGeneration')}
                style={[tw`flex-1 rounded-xl p-4`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}
              >
                <MaterialIcons name="restaurant" size={28} color={accent} style={tw`mb-2`} />
                <Text style={[tw`font-bold text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                  Generate Meals
                </Text>
                <Text style={[tw`text-xs mt-1`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  Personalized nutrition
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Hub Section - Quick Access */}
        <View style={tw`px-4 mt-8 mb-6`}>
          <Text style={[tw`text-2xl font-bold leading-tight tracking-tight mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            Important
          </Text>
          <View style={tw`flex-row gap-3 flex-wrap`}>
            <TouchableOpacity
              onPress={() => navigation.navigate('SubscriptionPlans')}
              style={[tw`flex-1 rounded-xl p-4 min-w-32`, { backgroundColor: accent + '20', borderWidth: 1, borderColor: accent + '40' }]}
            >
              <MaterialIcons name="card-membership" size={24} color={accent} style={tw`mb-2`} />
              <Text style={[tw`font-bold text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                Subscription
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              style={[tw`flex-1 rounded-xl p-4 min-w-32`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            >
              <MaterialIcons name="person" size={24} color={accent} style={tw`mb-2`} />
              <Text style={[tw`font-bold text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                Profile
              </Text>
            </TouchableOpacity>
            {hasFeatureAccess(subscriptionPlan, 'hasAIChat') || hasFeatureAccess(subscriptionPlan, 'hasCoachChat') ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('Messages')}
                style={[tw`flex-1 rounded-xl p-4 min-w-32`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
              >
                <MaterialIcons name="chat-bubble" size={24} color={accent} style={tw`mb-2`} />
                <Text style={[tw`font-bold text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                  Coaching
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate('SubscriptionPlans')}
                style={[tw`flex-1 rounded-xl p-4 min-w-32 opacity-70`, { backgroundColor: isDark ? '#111128' : '#e2e8f0', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
              >
                <MaterialIcons name="chat-bubble" size={24} color={isDark ? '#cbd5e1' : '#64748b'} style={tw`mb-2`} />
                <View style={tw`flex-row items-center gap-1`}>
                  <Text style={[tw`font-bold text-sm`, { color: isDark ? '#cbd5e1' : '#64748b' }]}>
                    Coaching
                  </Text>
                  <MaterialIcons name="lock" size={14} color={isDark ? '#cbd5e1' : '#64748b'} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {hasFeatureAccess(subscriptionPlan, 'hasComputerVision') ? (
        <View style={tw`px-4 mt-8`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={[tw`text-2xl font-bold leading-tight tracking-tight`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Workout Anchor
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('VisionAnalysisLab')}>
              <Text style={[tw`text-sm font-bold`, { color: accent }]}>View Plan</Text>
            </TouchableOpacity>
          </View>

          {todayWorkoutDay ? (
            <>
              <TouchableOpacity
                activeOpacity={0.9}
                style={[tw`overflow-hidden rounded-2xl h-60 w-full`, { borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}
                onPress={() => navigation.navigate('Calibration')}
              >
                <ImageBackground
                  source={{ uri: getWorkoutImage(todayWorkoutDay.focus) }}
                  style={tw`w-full h-full justify-end`}
                  imageStyle={{ resizeMode: 'cover' }}
                >
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.52)' }} />
                  <View style={tw`p-5`}>
                    <View style={tw`flex-row items-center gap-2 mb-2`}>
                      <View style={[tw`px-2.5 py-0.5 rounded-full`, { backgroundColor: accent }]}>
                        <Text style={tw`text-white text-[10px] font-bold uppercase tracking-wider`}>Today</Text>
                      </View>
                      <Text style={tw`text-white/70 text-xs font-medium`}>
                        {prettyLabel(todayWorkoutDay.day)} · {todayWorkoutDay.duration || 60} min
                      </Text>
                    </View>
                    <Text style={tw`text-white text-2xl font-black mb-1`}>
                      {prettyLabel(todayWorkoutDay.focus) || "Today's Workout"}
                    </Text>
                    <Text style={tw`text-white/60 text-xs mb-4`}>
                      {(todayWorkoutDay.exercises || []).length} exercises
                    </Text>
                    <View style={tw`flex-row items-center gap-2`}>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('Calibration')}
                        style={[tw`flex-row items-center gap-2 px-5 py-2.5 rounded-xl`, { backgroundColor: accent }]}
                      >
                        <MaterialIcons name="play-arrow" size={18} color="white" />
                        <Text style={tw`text-white text-sm font-bold`}>Start Session</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('VisionAnalysisLab')}
                        style={[tw`flex-row items-center gap-1 px-4 py-2.5 rounded-xl`, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                      >
                        <Text style={tw`text-white text-xs font-semibold`}>View Plan</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>

              {(todayWorkoutDay.exercises || []).length > 0 && (
                <View style={tw`mt-3 gap-2`}>
                  <Text style={[tw`text-xs font-semibold uppercase tracking-wider px-1 mb-1`, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                    {"Today's Exercises"}
                  </Text>
                  {(todayWorkoutDay.exercises || []).slice(0, 3).map((exercise, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => navigation.navigate('ExerciseDetail', { name: exercise.name })}
                      style={[tw`flex-row items-center justify-between px-4 py-3 rounded-xl`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}
                    >
                      <View style={tw`flex-row items-center gap-3`}>
                        <View style={[tw`w-8 h-8 rounded-lg items-center justify-center`, { backgroundColor: accent + '18' }]}>
                          <Text style={[tw`text-xs font-black`, { color: accent }]}>{i + 1}</Text>
                        </View>
                        <View>
                          <Text style={[tw`text-sm font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>{exercise.name}</Text>
                          <Text style={[tw`text-xs mt-0.5`, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                            {exercise.sets} sets · {exercise.reps} reps · {exercise.restTime}s rest
                          </Text>
                        </View>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={isDark ? '#334155' : '#cbd5e1'} />
                    </TouchableOpacity>
                  ))}
                  {(todayWorkoutDay.exercises || []).length > 3 && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('VisionAnalysisLab')}
                      style={[tw`items-center py-2.5 rounded-xl`, { backgroundColor: isDark ? '#111128' : '#f1f5f9' }]}
                    >
                      <Text style={[tw`text-xs font-bold`, { color: accent }]}>
                        +{(todayWorkoutDay.exercises || []).length - 3} more exercises
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate('WorkoutGeneration')}
              style={[tw`rounded-2xl p-6 items-center gap-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            >
              <MaterialIcons name="auto-awesome" size={40} color={accent} />
              <Text style={[tw`text-base font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>No Workout Plan Yet</Text>
              <Text style={[tw`text-sm text-center`, { color: isDark ? '#94a3b8' : '#64748b' }]}>Generate your personalized AI workout plan</Text>
              <View style={[tw`flex-row items-center justify-center gap-2 py-3 px-6 rounded-xl mt-1`, { backgroundColor: accent + '14' }]}>
                <MaterialIcons name="arrow-forward" size={16} color={accent} />
                <Text style={[tw`text-sm font-bold`, { color: accent }]}>Generate Plan</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        ) : (
        <TouchableOpacity
          onPress={() => navigation.navigate('SubscriptionPlans')}
          style={[tw`mx-4 mt-8 rounded-2xl p-5`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
        >
          <View style={tw`flex-row items-center gap-3 mb-3`}>
            <View style={[tw`w-12 h-12 rounded-xl items-center justify-center`, { backgroundColor: accent + '18' }]}>
              <MaterialIcons name="lock" size={24} color={accent} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={[tw`text-lg font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>Workout Anchor</Text>
              <Text style={[tw`text-xs mt-0.5`, { color: isDark ? '#94a3b8' : '#64748b' }]}>CV-powered form tracking & guided sessions</Text>
            </View>
          </View>
          <View style={[tw`flex-row items-center justify-center gap-2 py-3 rounded-xl`, { backgroundColor: accent + '14' }]}>
            <MaterialIcons name="arrow-upward" size={16} color={accent} />
            <Text style={[tw`text-sm font-bold`, { color: accent }]}>Upgrade to Premium+</Text>
          </View>
        </TouchableOpacity>
        )}
      </ScrollView>

      <TraineeBottomNav activeId={activeTab} navigation={navigation} totalUnread={totalUnread} />
    </SafeAreaView>
  );
};

