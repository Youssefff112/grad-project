import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import * as progressService from '../../services/progressService';
import * as coachService from '../../services/coachService';

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
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(false);

  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { measurements: data } = await progressService.getMeasurements();
        const mapped: Measurement[] = (data || []).map((m: any) => ({
          date: new Date(m.recordedAt || m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
  }, [clientId]);

  const loadPlans = useCallback(async () => {
    if (!planClientId) return;
    setPlansLoading(true);
    try {
      const [wRes, dRes] = await Promise.allSettled([
        coachService.getClientWorkoutPlan(Number(planClientId)),
        coachService.getClientDietPlan(Number(planClientId)),
      ]);
      setWorkoutPlan(wRes.status === 'fulfilled' ? wRes.value.plan : null);
      setDietPlan(dRes.status === 'fulfilled' ? dRes.value.plan : null);
    } finally {
      setPlansLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (activeTab === 'plans') loadPlans();
  }, [activeTab, loadPlans]);

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
              clientId: planClientId,
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
            onPress={() => navigation.navigate('CoachWorkoutPlan', { clientId: planClientId, clientName })}
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
        <View style={[tw`flex-row gap-2 px-4 pb-4`]}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CoachMealPlan', {
              clientId: planClientId,
              clientName,
              existingPlan: dietPlan,
            })}
            style={[tw`flex-1 flex-row items-center justify-center gap-1 py-2.5 rounded-xl`, {
              backgroundColor: '#10b98114',
              borderWidth: 1,
              borderColor: '#10b98128',
            }]}
          >
            <MaterialIcons name="edit" size={15} color="#10b981" />
            <Text style={[tw`text-xs font-bold`, { color: '#10b981' }]}>Edit Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('CoachMealPlan', { clientId: planClientId, clientName })}
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

  const renderEmptyPlanCard = (type: 'workout' | 'diet') => {
    const isWorkout = type === 'workout';
    const color = isWorkout ? accent : '#10b981';
    const route = isWorkout ? 'CoachWorkoutPlan' : 'CoachMealPlan';
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate(route, { clientId: planClientId, clientName })}
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

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`flex-row items-center px-4 py-3 justify-between`, { borderBottomWidth: 1, borderColor, backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-1`}>
          <MaterialIcons name="arrow-back" size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
        </TouchableOpacity>
        <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>{clientName}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Chat', { conversationName: clientName })}>
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

              {/* Quick actions */}
              <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Quick Actions</Text>
              <View style={tw`flex-row gap-3`}>
                {[
                  { label: 'Create Meal Plan', icon: 'restaurant-menu' as const, route: 'CoachMealPlan', params: { clientId: planClientId, clientName } },
                  { label: 'Create Workout', icon: 'fitness-center' as const, route: 'CoachWorkoutPlan', params: { clientId: planClientId, clientName } },
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
                    <TouchableOpacity onPress={loadPlans}>
                      <MaterialIcons name="refresh" size={20} color={subtextColor} />
                    </TouchableOpacity>
                  </View>

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
