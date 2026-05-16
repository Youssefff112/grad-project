import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import * as coachService from '../../services/coachService';
import type { ClientActivitySnapshot, AdherenceSummary, DetailedDietLog } from '../../services/coachService';

interface Measurement {
  date: string;
  weight?: number;
  bodyFat?: number;
  notes?: string;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function shortDay(fullDay: string): string {
  const idx = DAY_FULL_NAMES.indexOf((fullDay || '').toLowerCase());
  return idx !== -1 ? DAY_LABELS[idx] : fullDay;
}

function capitalise(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '';
}

function adherenceBarFill(pct: number | null, isDark: boolean): string {
  if (pct == null) return isDark ? '#334155' : '#cbd5e1';
  if (pct >= 80) return '#22c55e';
  if (pct >= 50) return '#eab308';
  return '#f97316';
}

function shortWeekdayFromYmd(ymd: string): string {
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) return '';
  const [y, m, d] = parts;
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dt.getUTCDay()] ?? '';
}

export const CoachClientDetailScreen = ({ navigation, route }: any) => {
  const { clientId, userId: clientUserId, clientName = 'Client' } = route.params ?? {};
  // Use the actual User.id for API calls that query by userId (plans, etc.)
  // Fall back to clientId if userId wasn't passed (older nav paths)
  const planClientId = clientUserId || clientId;
  const { isDark, accent } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'checkins'>('overview');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [pendingWorkoutPlans, setPendingWorkoutPlans] = useState<any[]>([]);
  const [pendingDietPlans, setPendingDietPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(false);
  const [approvingPlanId, setApprovingPlanId] = useState<number | null>(null);
  const [clientActivity, setClientActivity] = useState<ClientActivitySnapshot | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [mealLogs, setMealLogs] = useState<DetailedDietLog[]>([]);
  const [mealLogsLoading, setMealLogsLoading] = useState(false);
  const [mealLogsExpanded, setMealLogsExpanded] = useState(false);

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';

  useEffect(() => {
    const load = async () => {
      if (!planClientId) { setLoading(false); return; }
      setLoading(true);
      try {
        // Use the coach-specific endpoint so we read the CLIENT's measurements, not the coach's
        const { measurements: data } = await coachService.getClientMeasurements(Number(planClientId));
        const mapped: Measurement[] = (data || []).map((m: any) => ({
          date: new Date(m.recordedAt || m.date || m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weight: m.weight,
          bodyFat: m.bodyFat,
          notes: m.notes,
        }));
        setMeasurements(mapped.reverse());
      } catch {
        setMeasurements([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [planClientId]);

  const loadPlans = useCallback(async () => {
    if (!planClientId) return;
    setPlansLoading(true);
    try {
      const [wRes, dRes, pwRes, pdRes] = await Promise.allSettled([
        coachService.getClientWorkoutPlan(Number(planClientId)),
        coachService.getClientDietPlan(Number(planClientId)),
        coachService.getClientPendingWorkoutPlans(Number(planClientId)),
        coachService.getClientPendingDietPlans(Number(planClientId)),
      ]);
      setWorkoutPlan(wRes.status === 'fulfilled' ? wRes.value.plan : null);
      setDietPlan(dRes.status === 'fulfilled' ? dRes.value.plan : null);
      setPendingWorkoutPlans(pwRes.status === 'fulfilled' ? pwRes.value.plans : []);
      setPendingDietPlans(pdRes.status === 'fulfilled' ? pdRes.value.plans : []);
    } finally {
      setPlansLoading(false);
    }
  }, [planClientId]);

  const handleApproveWorkoutPlan = async (planId: number) => {
    setApprovingPlanId(planId);
    try {
      await coachService.approveClientWorkoutPlan(planId);
      Alert.alert('Approved', 'Workout plan has been approved and activated for the client.');
      loadPlans();
    } catch {
      Alert.alert('Error', 'Failed to approve workout plan.');
    } finally {
      setApprovingPlanId(null);
    }
  };

  const handleApproveDietPlan = async (planId: number) => {
    setApprovingPlanId(planId);
    try {
      await coachService.approveClientDietPlan(planId);
      Alert.alert('Approved', 'Meal plan has been approved and activated for the client.');
      loadPlans();
    } catch {
      Alert.alert('Error', 'Failed to approve meal plan.');
    } finally {
      setApprovingPlanId(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'plans') loadPlans();
  }, [activeTab, loadPlans]);

  const loadClientActivity = useCallback(async () => {
    if (!planClientId) return;
    setActivityLoading(true);
    try {
      const snap = await coachService.getClientActivity(Number(planClientId), 14);
      setClientActivity(snap);
    } catch {
      setClientActivity(null);
    } finally {
      setActivityLoading(false);
    }
  }, [planClientId]);

  const loadMealLogs = useCallback(async () => {
    if (!planClientId) return;
    setMealLogsLoading(true);
    try {
      const { logs } = await coachService.getClientDietLogs(Number(planClientId), 14);
      setMealLogs(logs);
    } catch {
      setMealLogs([]);
    } finally {
      setMealLogsLoading(false);
    }
  }, [planClientId]);

  useFocusEffect(
    useCallback(() => {
      loadClientActivity();
      loadMealLogs();
      if (planClientId) {
        loadPlans();
      }
    }, [loadClientActivity, loadMealLogs, loadPlans, planClientId]),
  );

  const latestCheckin = measurements[0];
  const prevCheckin = measurements[1];
  const weightDiff = latestCheckin && prevCheckin && latestCheckin.weight != null && prevCheckin.weight != null
    ? latestCheckin.weight - prevCheckin.weight
    : null;
  const fatDiff = latestCheckin && prevCheckin && latestCheckin.bodyFat != null && prevCheckin.bodyFat != null
    ? latestCheckin.bodyFat - prevCheckin.bodyFat
    : null;

  // ─── Plan summary helpers ──────────────────────────────────────────────────

  const renderPlanBadge = (plan: any) => {
    const isAI = !plan.assignedByCoachId;
    return (
      <View style={[tw`flex-row items-center gap-1 px-2 py-0.5 rounded-full`, {
        backgroundColor: isAI ? '#6366f114' : accent + '14',
      }]}>
        <MaterialIcons name={isAI ? 'auto-awesome' : 'person'} size={11} color={isAI ? '#6366f1' : accent} />
        <Text style={[tw`text-xs font-bold`, { color: isAI ? '#6366f1' : accent }]}>
          {isAI ? 'AI Generated' : 'Coach Assigned'}
        </Text>
      </View>
    );
  };

  const renderWorkoutPlanCard = () => {
    if (!workoutPlan) return null;
    const activeDays = (workoutPlan.weeklySchedule || []).filter((d: any) => !d.isRestDay);
    return (
      <View style={[tw`rounded-2xl overflow-hidden mb-4`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
        {/* Header */}
        <View style={[tw`p-4`, { backgroundColor: isDark ? '#1a1a2e' : '#f8faff', borderBottomWidth: 1, borderColor }]}>
          <View style={tw`flex-row items-center justify-between mb-2`}>
            <View style={tw`flex-row items-center gap-2`}>
              <View style={[tw`w-8 h-8 rounded-lg items-center justify-center`, { backgroundColor: accent + '20' }]}>
                <MaterialIcons name="fitness-center" size={16} color={accent} />
              </View>
              <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                {workoutPlan.planName || capitalise(workoutPlan.goal || 'Workout') + ' Plan'}
              </Text>
            </View>
            {renderPlanBadge(workoutPlan)}
          </View>
          <View style={tw`flex-row gap-3`}>
            {[
              { label: 'Goal', value: capitalise(workoutPlan.goal || '') },
              { label: 'Level', value: capitalise(workoutPlan.experienceLevel || '') },
              { label: 'Days/wk', value: String(activeDays.length) },
            ].map(s => (
              <View key={s.label}>
                <Text style={[tw`text-xs`, { color: subtextColor }]}>{s.label}</Text>
                <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{s.value || '—'}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Weekly overview */}
        <View style={tw`px-4 py-3`}>
          <Text style={[tw`text-xs font-bold mb-2`, { color: subtextColor }]}>WEEKLY SCHEDULE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-2`}>
            {(workoutPlan.weeklySchedule || []).map((day: any, i: number) => (
              <View
                key={i}
                style={[tw`items-center px-3 py-2 rounded-xl min-w-12`, {
                  backgroundColor: day.isRestDay ? (isDark ? '#0d0d1a' : '#f1f5f9') : accent + '14',
                  borderWidth: 1,
                  borderColor: day.isRestDay ? borderColor : accent + '30',
                }]}
              >
                <Text style={[tw`text-xs font-bold`, { color: day.isRestDay ? subtextColor : accent }]}>
                  {shortDay(day.day)}
                </Text>
                <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>
                  {day.isRestDay ? 'Rest' : capitalise(day.focus || '')}
                </Text>
                {!day.isRestDay && (
                  <Text style={[tw`text-xs`, { color: subtextColor }]}>
                    {(day.exercises || []).length} ex
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Actions */}
        <View style={[tw`flex-row gap-2 px-4 pb-4`]}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CoachWorkoutPlan', {
              userId: Number(planClientId),
              clientId: Number(planClientId),
              clientName,
              existingPlan: workoutPlan,
            })}
            style={[tw`flex-1 flex-row items-center justify-center gap-1 py-2.5 rounded-xl`, {
              backgroundColor: accent + '14',
              borderWidth: 1,
              borderColor: accent + '28',
            }]}
          >
            <MaterialIcons name="edit" size={15} color={accent} />
            <Text style={[tw`text-xs font-bold`, { color: accent }]}>Edit Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('CoachWorkoutPlan', {
              userId: Number(planClientId),
              clientId: Number(planClientId),
              clientName,
            })}
            style={[tw`flex-1 flex-row items-center justify-center gap-1 py-2.5 rounded-xl`, {
              backgroundColor: isDark ? '#1e1b4b' : '#ede9fe',
              borderWidth: 1,
              borderColor: isDark ? '#4f46e5' : '#a5b4fc',
            }]}
          >
            <MaterialIcons name="auto-awesome" size={15} color="#6366f1" />
            <Text style={[tw`text-xs font-bold`, { color: '#6366f1' }]}>New Plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDietPlanCard = () => {
    if (!dietPlan) return null;
    return (
      <View style={[tw`rounded-2xl overflow-hidden mb-4`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
        {/* Header */}
        <View style={[tw`p-4`, { backgroundColor: isDark ? '#1a1a2e' : '#f8faff', borderBottomWidth: 1, borderColor }]}>
          <View style={tw`flex-row items-center justify-between mb-2`}>
            <View style={tw`flex-row items-center gap-2`}>
              <View style={[tw`w-8 h-8 rounded-lg items-center justify-center`, { backgroundColor: '#10b98120' }]}>
                <MaterialIcons name="restaurant-menu" size={16} color="#10b981" />
              </View>
              <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                {dietPlan.planName || capitalise(dietPlan.goal || 'Diet') + ' Plan'}
              </Text>
            </View>
            {renderPlanBadge(dietPlan)}
          </View>
          <View style={tw`flex-row gap-3`}>
            {[
              { label: 'Goal', value: capitalise(dietPlan.goal || '') },
              { label: 'Calories', value: `${dietPlan.dailyCalorieTarget || '—'} kcal` },
              { label: 'Diet', value: capitalise(dietPlan.dietaryPreference || 'None') },
            ].map(s => (
              <View key={s.label}>
                <Text style={[tw`text-xs`, { color: subtextColor }]}>{s.label}</Text>
                <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{s.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Macros */}
        {dietPlan.macronutrients && (
          <View style={tw`flex-row gap-3 px-4 py-3`}>
            {[
              { label: 'Protein', value: dietPlan.macronutrients.protein, unit: 'g', color: '#3b82f6' },
              { label: 'Carbs', value: dietPlan.macronutrients.carbs, unit: 'g', color: '#f59e0b' },
              { label: 'Fats', value: dietPlan.macronutrients.fats, unit: 'g', color: '#ef4444' },
            ].map(m => (
              <View key={m.label} style={[tw`flex-1 p-3 rounded-xl items-center`, { backgroundColor: m.color + '14' }]}>
                <Text style={[tw`text-base font-black`, { color: m.color }]}>{m.value}{m.unit}</Text>
                <Text style={[tw`text-xs`, { color: subtextColor }]}>{m.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Sample day pills */}
        {(dietPlan.weeklyMealPlan || []).length > 0 && (
          <View style={tw`px-4 pb-3`}>
            <Text style={[tw`text-xs font-bold mb-2`, { color: subtextColor }]}>DAYS WITH MEALS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-2`}>
              {(dietPlan.weeklyMealPlan || []).map((day: any, i: number) => {
                const hasMeals = (day.meals || []).length > 0;
                return (
                  <View
                    key={i}
                    style={[tw`items-center px-3 py-2 rounded-xl min-w-12`, {
                      backgroundColor: hasMeals ? '#10b98114' : (isDark ? '#0d0d1a' : '#f1f5f9'),
                      borderWidth: 1,
                      borderColor: hasMeals ? '#10b98130' : borderColor,
                    }]}
                  >
                    <Text style={[tw`text-xs font-bold`, { color: hasMeals ? '#10b981' : subtextColor }]}>
                      {shortDay(day.day)}
                    </Text>
                    <Text style={[tw`text-xs mt-0.5`, { color: subtextColor }]}>
                      {hasMeals ? `${(day.meals || []).length} meals` : '—'}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Actions */}
        <View style={[tw`flex-row flex-wrap gap-2 px-4 pb-4`]}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('CoachMealPlan', {
                userId: Number(planClientId),
                clientId: Number(planClientId),
                clientName,
                existingPlan: dietPlan,
              })
            }
            style={[tw`flex-1 min-w-[30%] flex-row items-center justify-center gap-1 py-2.5 rounded-xl`, {
              backgroundColor: '#0ea5e914',
              borderWidth: 1,
              borderColor: '#0ea5e930',
            }]}
          >
            <MaterialIcons name="list-alt" size={15} color="#0ea5e9" />
            <Text style={[tw`text-xs font-bold`, { color: '#0ea5e9' }]}>Ingredients</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('CoachMealPlan', {
              userId: Number(planClientId),
              clientId: Number(planClientId),
              clientName,
              existingPlan: dietPlan,
            })}
            style={[tw`flex-1 min-w-[30%] flex-row items-center justify-center gap-1 py-2.5 rounded-xl`, {
              backgroundColor: '#10b98114',
              borderWidth: 1,
              borderColor: '#10b98128',
            }]}
          >
            <MaterialIcons name="edit" size={15} color="#10b981" />
            <Text style={[tw`text-xs font-bold`, { color: '#10b981' }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('CoachMealPlan', {
              userId: Number(planClientId),
              clientId: Number(planClientId),
              clientName,
            })}
            style={[tw`flex-1 min-w-[30%] flex-row items-center justify-center gap-1 py-2.5 rounded-xl`, {
              backgroundColor: isDark ? '#1e1b4b' : '#ede9fe',
              borderWidth: 1,
              borderColor: isDark ? '#4f46e5' : '#a5b4fc',
            }]}
          >
            <MaterialIcons name="auto-awesome" size={15} color="#6366f1" />
            <Text style={[tw`text-xs font-bold`, { color: '#6366f1' }]}>New Plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyPlanCard = (type: 'workout' | 'diet') => {
    const isWorkout = type === 'workout';
    const color = isWorkout ? accent : '#10b981';
    const route = isWorkout ? 'CoachWorkoutPlan' : 'CoachMealPlan';
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate(route, { userId: Number(planClientId), clientId: Number(planClientId), clientName })}
        style={[tw`p-5 rounded-2xl items-center mb-4`, { backgroundColor: cardBg, borderWidth: 1, borderColor, borderStyle: 'dashed' }]}
      >
        <View style={[tw`w-12 h-12 rounded-full items-center justify-center mb-3`, { backgroundColor: color + '14' }]}>
          <MaterialIcons name={isWorkout ? 'fitness-center' : 'restaurant-menu'} size={24} color={color} />
        </View>
        <Text style={[tw`text-sm font-bold mb-1`, { color: textPrimary }]}>
          {isWorkout ? 'No Workout Plan' : 'No Diet Plan'}
        </Text>
        <Text style={[tw`text-xs text-center mb-3`, { color: subtextColor }]}>
          {isWorkout
            ? 'Create or generate an AI workout plan for this client.'
            : 'Create or generate an AI meal plan for this client.'}
        </Text>
        <View style={[tw`flex-row items-center gap-1 px-4 py-2 rounded-xl`, { backgroundColor: color + '14' }]}>
          <MaterialIcons name="add" size={15} color={color} />
          <Text style={[tw`text-xs font-bold`, { color }]}>
            {isWorkout ? 'Create Workout Plan' : 'Create Meal Plan'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAdherenceBody = () => {
    if (activityLoading) {
      return <ActivityIndicator size="small" color={accent} />;
    }
    if (!clientActivity) {
      return (
        <Text style={[tw`text-xs`, { color: subtextColor }]}>
          Could not load activity. Tap refresh on the Plans tab.
        </Text>
      );
    }

    const adherence = clientActivity.adherence as AdherenceSummary | null | undefined;
    const hasActiveDietPlan =
      clientActivity.hasActivePlan?.diet ?? adherence?.hasActiveDietPlan ?? true;
    const today = new Date().toISOString().split('T')[0];
    const dlog = clientActivity.dietLogs.find((l: any) => {
      const d = l.date ? new Date(l.date).toISOString().split('T')[0] : '';
      return d === today;
    });
    const mealsDone = dlog?.mealsCompleted
      ? Object.values(dlog.mealsCompleted).filter(Boolean).length
      : 0;
    const mealSlots = dlog?.mealsCompleted ? Object.keys(dlog.mealsCompleted).length : 0;
    // Only show a hydration goal when the client has an active plan.
    const goalMl = hasActiveDietPlan ? (adherence?.hydrationGoalMl ?? null) : null;
    const waterL = dlog?.waterMl != null ? (Number(dlog.waterMl) / 1000).toFixed(1) : '—';
    const goalL = goalMl != null ? (goalMl / 1000).toFixed(1) : null;
    const recentWo = (clientActivity.workoutLogs || []).slice(0, 3);

    const bd = adherence?.todayBreakdown;
    const pctBar = (label: string, pct: number | null, foot?: string) => (
      <View key={label} style={tw`gap-1 mb-2`}>
        <View style={tw`flex-row justify-between`}>
          <Text style={[tw`text-xs`, { color: subtextColor }]}>{label}</Text>
          <Text style={[tw`text-xs font-bold`, { color: textPrimary }]}>
            {pct == null ? '—' : `${pct}%`}
          </Text>
        </View>
        {foot ? (
          <Text style={[tw`text-[10px] leading-tight`, { color: subtextColor }]}>{foot}</Text>
        ) : null}
        <View style={[tw`h-1.5 rounded-full overflow-hidden`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
          <View
            style={{
              height: '100%',
              width: pct == null ? '0%' : `${Math.min(100, pct)}%`,
              borderRadius: 999,
              backgroundColor: adherenceBarFill(pct, isDark),
            }}
          />
        </View>
      </View>
    );

    const trainHint =
      adherence && adherence.trainingDayNames.length > 0
        ? `Training days: ${adherence.trainingDayNames.map(capitalise).join(', ')}`
        : 'No active workout plan — workout score only counts when the client has training days on their plan.';

    return (
      <View style={tw`gap-2`}>
        {/* No active plan banner — shown instead of stale numbers */}
        {!hasActiveDietPlan && (
          <View style={[tw`flex-row items-center gap-2 px-3 py-2.5 rounded-xl mb-1`, { backgroundColor: '#f59e0b14', borderWidth: 1, borderColor: '#f59e0b30' }]}>
            <MaterialIcons name="info-outline" size={15} color="#f59e0b" />
            <Text style={[tw`text-xs flex-1 leading-relaxed`, { color: '#f59e0b' }]}>
              Client has no active meal plan. Meal and hydration adherence scores are unavailable until a plan is created.
            </Text>
          </View>
        )}

        {adherence && (
          <View style={tw`mb-2`}>
            <View style={tw`flex-row items-end justify-between mb-2`}>
              <View>
                <Text style={[tw`text-[10px] uppercase font-bold`, { color: subtextColor }]}>Today</Text>
                <Text style={[tw`text-3xl font-black`, { color: textPrimary }]}>
                  {adherence.todayPercent == null ? '—' : `${adherence.todayPercent}%`}
                </Text>
              </View>
              <View style={tw`items-end`}>
                <Text style={[tw`text-[10px] uppercase font-bold`, { color: subtextColor }]}>7-day avg</Text>
                <Text style={[tw`text-lg font-bold`, { color: accent }]}>
                  {adherence.rolling7DayAvgPercent == null ? '—' : `${adherence.rolling7DayAvgPercent}%`}
                </Text>
              </View>
            </View>
            <Text style={[tw`text-[10px] leading-relaxed mb-2`, { color: subtextColor }]}>
              {hasActiveDietPlan
                ? `Combined score: meal check-ins, water vs ${goalL ?? '—'} L goal, and completed workout on training days.`
                : 'Workout adherence only — no active meal plan.'}
            </Text>
            <View style={tw`flex-row justify-between gap-1`}>
              {(adherence.last7Days || []).map((day) => (
                <View key={day.date} style={tw`flex-1 items-center`}>
                  <View
                    style={[
                      tw`w-full max-w-[36px] h-8 rounded-lg`,
                      {
                        backgroundColor: adherenceBarFill(day.percent, isDark),
                        opacity: day.percent == null ? 0.35 : 1,
                      },
                    ]}
                  />
                  <Text style={[tw`text-[9px] mt-0.5`, { color: subtextColor }]} numberOfLines={1}>
                    {shortWeekdayFromYmd(day.date)}
                  </Text>
                </View>
              ))}
            </View>
            <View style={[tw`mt-3 pt-3`, { borderTopWidth: 1, borderColor }]}>
              {pctBar(
                hasActiveDietPlan ? 'Meals (logged)' : 'Meals (no active plan)',
                hasActiveDietPlan ? (bd?.meals ?? null) : null,
              )}
              {pctBar(
                hasActiveDietPlan
                  ? `Hydration (vs ${goalL ?? '—'} L goal)`
                  : 'Hydration (no active plan)',
                hasActiveDietPlan ? (bd?.water ?? null) : null,
                hasActiveDietPlan && goalL
                  ? `Goal ${goalL} L from active meal plan`
                  : 'Create a meal plan to track hydration vs goal.',
              )}
              {pctBar('Workout (scheduled day)', bd?.workout ?? null, trainHint)}
            </View>
          </View>
        )}

        <Text style={[tw`text-[10px] font-bold uppercase mt-1`, { color: subtextColor }]}>Raw logs</Text>
        <View style={tw`flex-row justify-between`}>
          <Text style={[tw`text-xs`, { color: subtextColor }]}>Meals logged</Text>
          <Text style={[tw`text-xs font-bold`, { color: textPrimary }]}>
            {mealSlots ? `${mealsDone}/${mealSlots} today` : dlog ? `${mealsDone} checked` : 'No meal log yet'}
          </Text>
        </View>
        <View style={tw`flex-row justify-between`}>
          <Text style={[tw`text-xs`, { color: subtextColor }]}>Water</Text>
          <Text style={[tw`text-xs font-bold`, { color: textPrimary }]}>
            {waterL === '—'
              ? '—'
              : goalL != null
                ? `${waterL} / ${goalL} L`
                : `${waterL} L`}
          </Text>
        </View>
        <View style={tw`mt-1`}>
          <Text style={[tw`text-xs`, { color: subtextColor }]}>Recent workouts</Text>
          {recentWo.length === 0 ? (
            <Text style={[tw`text-xs mt-1`, { color: textPrimary }]}>None in the last 2 weeks.</Text>
          ) : (
            recentWo.map((w: any) => (
              <Text key={w.id} style={[tw`text-xs mt-1`, { color: textPrimary }]}>
                {w.date ? new Date(w.date).toLocaleDateString() : '—'} · {w.duration != null ? `${w.duration} min` : 'completed'}
                {w.day ? ` · ${capitalise(w.day)}` : ''}
              </Text>
            ))
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center px-4 py-3 justify-between`, { borderBottomWidth: 1, borderColor, backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-1`}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>{clientName}</Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Chat', {
              conversationName: clientName,
              receiverId: planClientId != null ? Number(planClientId) : undefined,
              conversationId: null,
            })
          }
        >
          <MaterialIcons name="chat-bubble" size={24} color={accent} />
        </TouchableOpacity>
      </View>

      {/* Client hero */}
      <View style={[tw`px-4 py-5 flex-row items-center gap-4`, { borderBottomWidth: 1, borderColor }]}>
        <View style={[tw`w-16 h-16 rounded-full items-center justify-center`, { backgroundColor: accent + '20' }]}>
          <MaterialIcons name="person" size={32} color={accent} />
        </View>
        <View style={tw`flex-1`}>
          <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>{clientName}</Text>
          <Text style={[tw`text-sm`, { color: subtextColor }]}>Client #{clientId}</Text>
          <View style={[tw`flex-row items-center gap-1 mt-1`]}>
            <View style={[tw`px-2 py-0.5 rounded-full`, { backgroundColor: '#10b98120' }]}>
              <Text style={tw`text-xs font-bold text-green-500`}>Active</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={[tw`flex-row px-4 pt-3 pb-0 gap-2`, { borderBottomWidth: 1, borderColor }]}>
        {(['overview', 'plans', 'checkins'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[tw`flex-1 items-center py-2 rounded-t-lg`, {
              borderBottomWidth: 2,
              borderColor: activeTab === tab ? accent : 'transparent',
            }]}
          >
            <Text style={[tw`text-xs font-bold capitalize`, { color: activeTab === tab ? accent : subtextColor }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      ) : (
        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-4 pb-8`}>

          {/* ── Overview Tab ─────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <View style={tw`gap-4`}>
              {latestCheckin ? (
                <View style={tw`flex-row gap-3`}>
                  {[
                    { label: 'Current Weight', value: latestCheckin.weight ? `${latestCheckin.weight} kg` : '—', delta: weightDiff, icon: 'monitor-weight' as const },
                    { label: 'Body Fat', value: latestCheckin.bodyFat ? `${latestCheckin.bodyFat}%` : '—', delta: fatDiff, icon: 'percent' as const },
                  ].map(stat => (
                    <View key={stat.label} style={[tw`flex-1 p-4 rounded-xl`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
                      <MaterialIcons name={stat.icon} size={18} color={accent} style={tw`mb-1`} />
                      <Text style={[tw`text-xl font-black`, { color: textPrimary }]}>{stat.value}</Text>
                      <Text style={[tw`text-xs`, { color: subtextColor }]}>{stat.label}</Text>
                      {stat.delta != null && (
                        <View style={tw`flex-row items-center mt-1`}>
                          <MaterialIcons
                            name={stat.delta < 0 ? 'trending-down' : 'trending-up'}
                            size={14}
                            color={stat.delta < 0 ? '#10b981' : '#ef4444'}
                          />
                          <Text style={[tw`text-xs ml-0.5 font-bold`, { color: stat.delta < 0 ? '#10b981' : '#ef4444' }]}>
                            {stat.delta > 0 ? '+' : ''}{stat.delta.toFixed(1)} since last
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={[tw`p-5 rounded-xl items-center`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
                  <MaterialIcons name="monitor-weight" size={32} color={subtextColor} />
                  <Text style={[tw`text-sm mt-2`, { color: subtextColor }]}>No measurements recorded yet</Text>
                </View>
              )}

              {/* Client adherence (from logged meals, water, workouts) */}
              <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Today{"'"}s adherence</Text>
              <View style={[tw`p-4 rounded-xl mb-2`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
                {renderAdherenceBody()}
              </View>

              {/* Quick actions */}
              <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Quick Actions</Text>
              <View style={tw`flex-row gap-3`}>
                {[
                  { label: 'Create Meal Plan', icon: 'restaurant-menu' as const, route: 'CoachMealPlan', params: { userId: Number(planClientId), clientId: Number(planClientId), clientName } },
                  { label: 'Create Workout', icon: 'fitness-center' as const, route: 'CoachWorkoutPlan', params: { userId: Number(planClientId), clientId: Number(planClientId), clientName } },
                ].map(a => (
                  <TouchableOpacity
                    key={a.label}
                    onPress={() => navigation.navigate(a.route, a.params)}
                    style={[tw`flex-1 p-4 rounded-xl items-center`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}
                  >
                    <View style={[tw`w-10 h-10 rounded-xl items-center justify-center mb-2`, { backgroundColor: accent + '14' }]}>
                      <MaterialIcons name={a.icon} size={20} color={accent} />
                    </View>
                    <Text style={[tw`text-xs font-bold text-center`, { color: textPrimary }]}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Plans Tab ────────────────────────────────────────── */}
          {activeTab === 'plans' && (
            <View>
              {plansLoading ? (
                <View style={tw`py-12 items-center`}>
                  <ActivityIndicator size="large" color={accent} />
                </View>
              ) : (
                <>
                  <View style={tw`flex-row items-center justify-between mb-4`}>
                    <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Client Plans</Text>
                    <TouchableOpacity
                      onPress={() => {
                        loadPlans();
                        loadClientActivity();
                        loadMealLogs();
                      }}
                    >
                      <MaterialIcons name="refresh" size={20} color={subtextColor} />
                    </TouchableOpacity>
                  </View>

                  <View style={[tw`p-4 rounded-xl mb-4`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
                    <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Client adherence (what they logged)</Text>
                    <Text style={[tw`text-xs mb-3 leading-relaxed`, { color: subtextColor }]}>
                      {"Adherence means how closely the client is following their plan in the app—not the plan document itself. "}
                      Below you see today’s meal check-ins, water, and recent completed workouts so you can compare the written plan to what they actually did.
                    </Text>
                    {renderAdherenceBody()}
                  </View>

                  {/* ── Meal Completion History ─────────────────────────── */}
                  <View style={[tw`rounded-xl mb-4 overflow-hidden`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
                    <TouchableOpacity
                      onPress={() => setMealLogsExpanded((v) => !v)}
                      style={tw`flex-row items-center justify-between p-4`}
                    >
                      <View style={tw`flex-row items-center gap-2`}>
                        <View style={[tw`w-8 h-8 rounded-lg items-center justify-center`, { backgroundColor: '#10b98114' }]}>
                          <MaterialIcons name="restaurant-menu" size={18} color="#10b981" />
                        </View>
                        <View>
                          <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Meal Completion History</Text>
                          <Text style={[tw`text-xs`, { color: subtextColor }]}>Last 14 days · tap to expand</Text>
                        </View>
                      </View>
                      {mealLogsLoading
                        ? <ActivityIndicator size="small" color={accent} />
                        : <MaterialIcons
                            name={mealLogsExpanded ? 'expand-less' : 'expand-more'}
                            size={22}
                            color={subtextColor}
                          />
                      }
                    </TouchableOpacity>

                    {mealLogsExpanded && (
                      <View style={[tw`pb-3 px-4`, { borderTopWidth: 1, borderColor }]}>
                        {mealLogs.length === 0 && !mealLogsLoading && (
                          <Text style={[tw`text-xs py-4 text-center`, { color: subtextColor }]}>
                            No meal logs recorded in the last 14 days.
                          </Text>
                        )}

                        {mealLogs.map((log) => {
                          const dateLabel = (() => {
                            const datePart = String(log.date).split('T')[0];
                            const parts = datePart.split('-').map(Number);
                            if (parts.length !== 3) return datePart;
                            const [y, m, d] = parts;
                            return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
                              weekday: 'short', month: 'short', day: 'numeric',
                            });
                          })();

                          const pct = log.summary.pct;
                          const barColor = pct == null ? '#94a3b8'
                            : pct >= 80 ? '#22c55e'
                            : pct >= 40 ? '#eab308'
                            : '#f97316';

                          const STATUS_LABELS: Record<string, string> = {
                            followed: 'Followed', partial: 'Partial', missed: 'Missed',
                          };

                          return (
                            <View
                              key={log.id}
                              style={[tw`mt-3 p-3 rounded-xl`, {
                                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                                borderWidth: 1, borderColor,
                              }]}
                            >
                              <View style={tw`flex-row items-center justify-between mb-2`}>
                                <Text style={[tw`text-xs font-bold`, { color: textPrimary }]}>{dateLabel}</Text>
                                <View style={tw`flex-row items-center gap-2`}>
                                  {log.waterMl != null && (
                                    <View style={tw`flex-row items-center gap-0.5`}>
                                      <MaterialIcons name="water-drop" size={11} color="#38bdf8" />
                                      <Text style={[tw`text-[10px] font-bold`, { color: '#38bdf8' }]}>
                                        {(log.waterMl / 1000).toFixed(1)}L
                                      </Text>
                                    </View>
                                  )}
                                  <View style={[tw`px-2 py-0.5 rounded-full`, { backgroundColor: barColor + '20' }]}>
                                    <Text style={[tw`text-[10px] font-bold`, { color: barColor }]}>
                                      {STATUS_LABELS[log.status] ?? log.status}
                                    </Text>
                                  </View>
                                </View>
                              </View>

                              <View style={tw`flex-row items-center gap-2 mb-2`}>
                                <View style={[tw`flex-1 h-1.5 rounded-full overflow-hidden`, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                                  <View style={{ height: '100%', width: `${pct ?? 0}%`, borderRadius: 999, backgroundColor: barColor }} />
                                </View>
                                <Text style={[tw`text-[10px] font-bold w-14 text-right`, { color: barColor }]}>
                                  {log.summary.completed}/{log.summary.total} meals
                                </Text>
                              </View>

                              {log.namedMeals.length > 0 ? (
                                <View style={tw`gap-1`}>
                                  {log.namedMeals.map((meal) => (
                                    <View key={meal.id} style={tw`flex-row items-center gap-2`}>
                                      <MaterialIcons
                                        name={meal.completed ? 'check-circle' : 'radio-button-unchecked'}
                                        size={14}
                                        color={meal.completed ? '#22c55e' : isDark ? '#475569' : '#cbd5e1'}
                                      />
                                      <Text
                                        style={[tw`text-xs flex-1`, { color: meal.completed ? textPrimary : subtextColor }]}
                                        numberOfLines={1}
                                      >
                                        {meal.name}
                                      </Text>
                                      <Text style={[tw`text-[10px]`, { color: meal.completed ? '#22c55e' : subtextColor }]}>
                                        {meal.completed ? '✓ eaten' : 'skipped'}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              ) : (
                                <Text style={[tw`text-xs`, { color: subtextColor }]}>
                                  {log.status === 'followed' ? 'All meals completed' : 'No individual meal details recorded'}
                                </Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {/* Pending Coach Review Plans */}
                  {(pendingWorkoutPlans.length > 0 || pendingDietPlans.length > 0) && (
                    <View style={[tw`rounded-2xl p-4 mb-4`, { backgroundColor: '#f59e0b10', borderWidth: 1, borderColor: '#f59e0b30' }]}>
                      <View style={tw`flex-row items-center gap-2 mb-3`}>
                        <MaterialIcons name="pending-actions" size={18} color="#f59e0b" />
                        <Text style={[tw`text-sm font-bold`, { color: '#f59e0b' }]}>Awaiting Your Review</Text>
                      </View>

                      {pendingWorkoutPlans.map((plan: any) => (
                        <View key={plan.id} style={[tw`flex-row items-center justify-between p-3 rounded-xl mb-2`, { backgroundColor: isDark ? '#111128' : '#fff', borderWidth: 1, borderColor }]}>
                          <View style={tw`flex-1`}>
                            <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                              {plan.planName || 'Workout Plan'}
                            </Text>
                            <Text style={[tw`text-xs`, { color: subtextColor }]}>
                              Workout · {capitalise(plan.goal || '')} · {(plan.weeklySchedule || []).filter((d: any) => !d.isRestDay).length} days/week
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleApproveWorkoutPlan(plan.id)}
                            disabled={approvingPlanId === plan.id}
                            style={[tw`ml-2 px-3 py-1.5 rounded-lg flex-row items-center gap-1`, { backgroundColor: '#10b98120', borderWidth: 1, borderColor: '#10b98130' }]}
                          >
                            {approvingPlanId === plan.id ? (
                              <ActivityIndicator size="small" color="#10b981" />
                            ) : (
                              <>
                                <MaterialIcons name="check-circle" size={14} color="#10b981" />
                                <Text style={tw`text-xs font-bold text-green-500`}>Approve</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      ))}

                      {pendingDietPlans.map((plan: any) => (
                        <View key={plan.id} style={[tw`rounded-xl mb-2`, { backgroundColor: isDark ? '#111128' : '#fff', borderWidth: 1, borderColor }]}>
                          <TouchableOpacity
                            onPress={() =>
                              navigation.navigate('CoachMealPlan', {
                                userId: Number(planClientId),
                                clientId: Number(planClientId),
                                clientName,
                                existingPlan: plan,
                              })
                            }
                            style={tw`p-3`}
                          >
                            <Text style={[tw`text-xs font-bold`, { color: '#0ea5e9' }]}>Review ingredients & meals →</Text>
                            <Text style={[tw`text-sm font-bold mt-1`, { color: textPrimary }]}>
                              {plan.planName || 'Meal Plan'}
                            </Text>
                            <Text style={[tw`text-xs`, { color: subtextColor }]}>
                              Meal Plan · {plan.dailyCalorieTarget} kcal/day · {capitalise(plan.goal || '')}
                            </Text>
                          </TouchableOpacity>
                          <View style={[tw`flex-row justify-end px-3 pb-3`]}>
                            <TouchableOpacity
                              onPress={() => handleApproveDietPlan(plan.id)}
                              disabled={approvingPlanId === plan.id}
                              style={[tw`px-3 py-1.5 rounded-lg flex-row items-center gap-1`, { backgroundColor: '#10b98120', borderWidth: 1, borderColor: '#10b98130' }]}
                            >
                              {approvingPlanId === plan.id ? (
                                <ActivityIndicator size="small" color="#10b981" />
                              ) : (
                                <>
                                  <MaterialIcons name="check-circle" size={14} color="#10b981" />
                                  <Text style={tw`text-xs font-bold text-green-500`}>Approve</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  <Text style={[tw`text-xs font-bold mb-2`, { color: subtextColor }]}>WORKOUT PLAN</Text>
                  {workoutPlan ? renderWorkoutPlanCard() : renderEmptyPlanCard('workout')}

                  <Text style={[tw`text-xs font-bold mb-2`, { color: subtextColor }]}>DIET PLAN</Text>
                  {dietPlan ? renderDietPlanCard() : renderEmptyPlanCard('diet')}
                </>
              )}
            </View>
          )}

          {/* ── Check-ins Tab ─────────────────────────────────────── */}
          {activeTab === 'checkins' && (
            <View style={tw`gap-3`}>
              {measurements.length === 0 && (
                <View style={[tw`p-8 rounded-xl items-center`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
                  <MaterialIcons name="assignment" size={36} color={isDark ? '#334155' : '#cbd5e1'} />
                  <Text style={[tw`text-sm mt-2`, { color: subtextColor }]}>No check-ins recorded yet</Text>
                </View>
              )}
              {measurements.map((checkin, i) => (
                <View key={i} style={[tw`p-4 rounded-xl`, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
                  <View style={tw`flex-row items-center justify-between mb-3`}>
                    <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{checkin.date}</Text>
                    {i === 0 && (
                      <View style={[tw`px-2 py-0.5 rounded-full`, { backgroundColor: accent + '14' }]}>
                        <Text style={[tw`text-xs font-bold`, { color: accent }]}>Latest</Text>
                      </View>
                    )}
                  </View>
                  <View style={tw`flex-row gap-4 mb-2`}>
                    {checkin.weight != null && (
                      <View>
                        <Text style={[tw`text-xs`, { color: subtextColor }]}>Weight</Text>
                        <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>{checkin.weight} kg</Text>
                      </View>
                    )}
                    {checkin.bodyFat != null && (
                      <View>
                        <Text style={[tw`text-xs`, { color: subtextColor }]}>Body Fat</Text>
                        <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>{checkin.bodyFat}%</Text>
                      </View>
                    )}
                  </View>
                  {checkin.notes && (
                    <Text style={[tw`text-xs leading-relaxed`, { color: subtextColor }]}>{'"'}{checkin.notes}{'"'}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
