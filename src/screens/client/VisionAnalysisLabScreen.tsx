import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';
import { useExerciseManagement } from '../../context/ExerciseManagementContext';
import * as offlineService from '../../services/offlineService';
import * as workoutService from '../../services/workoutService';
import { COMMON_EXERCISES } from '../../services/exerciseService';

const prettyLabel = (s?: string) =>
  (s || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || '';
import { hasFeatureAccess } from '../../utils/planUtils';
import { FeatureLocked } from '../../components/FeatureLocked';
import { TraineeBottomNav } from '../../components/TraineeBottomNav';

interface PlanExercise {
  name: string;
  sets: number;
  reps: string;
  rest: number;
  source: 'plan' | 'custom';
  workoutName?: string;
}

export const VisionAnalysisLabScreen = ({ navigation, route }: any) => {
  const { isDark, accent } = useTheme();
  const { subscriptionPlan } = useUser();
  const { totalUnread } = useNotifications();
  const { workouts, exercises: customExercises } = useExerciseManagement();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
  const preselectedExercise: string | undefined = route?.params?.exerciseName;

  // Active workout plan exercises
  const [planExercises, setPlanExercises] = useState<PlanExercise[]>([]);
  const [planLoading, setPlanLoading] = useState(true);
  const [planName, setPlanName] = useState<string | null>(null);

  // Swap state
  const [swapTarget, setSwapTarget] = useState<number | null>(null);
  const [swapSearch, setSwapSearch] = useState('');

  // History
  const [cachedHistory, setCachedHistory] = useState<Array<{
    date: string; type: string; duration: string; score: string; exercises: number;
  }> | null>(null);
  const [apiHistory, setApiHistory] = useState<workoutService.WorkoutSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const bg = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const inputBg = isDark ? '#1e293b' : '#f1f5f9';

  const loadActivePlanExercises = useCallback(async () => {
    setPlanLoading(true);
    try {
      const { plan } = await workoutService.getActiveWorkoutPlan();
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const todaySchedule = plan?.weeklySchedule?.find(
        (d: any) => d.day?.toLowerCase() === today && !d.isRestDay,
      ) || plan?.weeklySchedule?.find((d: any) => !d.isRestDay);

      if (todaySchedule?.exercises?.length) {
        setPlanName(`${prettyLabel(todaySchedule.day)}: ${prettyLabel(todaySchedule.focus) || 'Workout'}`);
        setPlanExercises(
          todaySchedule.exercises.map((e: any) => ({
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            rest: e.restTime ?? e.rest ?? 60,
            source: 'plan' as const,
          })),
        );
      } else {
        // No active plan (or plan has no exercises) — wipe stale state so the
        // UI doesn't keep showing the previously-deleted plan.
        setPlanName(null);
        setPlanExercises([]);
      }
    } catch {
      setPlanName(null);
      setPlanExercises([]);
    } finally {
      setPlanLoading(false);
    }
  }, []);

  // Refresh plan exercises AND history on every focus so changes from other
  // screens (completed workouts, deleted plans) are reflected immediately.
  useFocusEffect(
    useCallback(() => {
      loadActivePlanExercises();
      loadWorkoutHistory(); // always refresh history on screen focus
    }, [loadActivePlanExercises]),
  );

  useEffect(() => {
    if (activeTab === 'history') loadWorkoutHistory();
  }, [activeTab]);

  useEffect(() => {
    if (preselectedExercise) loadCached();
  }, []);

  const loadCached = async () => {
    try {
      const cached = await offlineService.getCachedWorkoutHistory();
      if (cached?.length) setCachedHistory(cached);
    } catch { /* ignore */ }
  };

  const loadWorkoutHistory = async () => {
    setHistoryLoading(true);
    try {
      const { logs } = await workoutService.getWorkoutHistory();
      setApiHistory(logs || []);
    } catch { /* fallback */ }
    finally { setHistoryLoading(false); }
  };

  // Primary muscle groups of the exercise being swapped (for same-group filtering)
  const swapTargetMuscleGroups = useMemo<string[]>(() => {
    if (swapTarget === null) return [];
    const currentName = planExercises[swapTarget]?.name ?? '';
    const found = COMMON_EXERCISES.find(
      (e) => e.name.toLowerCase() === currentName.toLowerCase()
    );
    if (!found) {
      const lower = currentName.toLowerCase();
      const inferred = ['Chest', 'Shoulders', 'Back', 'Biceps', 'Triceps', 'Legs'].find(
        (g) => lower.includes(g.toLowerCase())
      );
      return inferred ? [inferred] : [];
    }
    return found.muscleGroups;
  }, [swapTarget, planExercises]);

  const swapCandidates = useMemo(() => {
    let pool = COMMON_EXERCISES;

    // Exclude the exercise being swapped out
    if (swapTarget !== null) {
      const currentName = planExercises[swapTarget]?.name ?? '';
      pool = pool.filter((e) => e.name.toLowerCase() !== currentName.toLowerCase());
    }

    if (swapSearch.trim()) {
      const q = swapSearch.toLowerCase();
      pool = pool.filter(
        (e) => e.name.toLowerCase().includes(q) || e.muscleGroups.some((m) => m.toLowerCase().includes(q))
      );
    } else if (swapTargetMuscleGroups.length > 0) {
      const primary = swapTargetMuscleGroups[0];
      pool = pool.filter((e) => e.muscleGroups.includes(primary));
    }

    return pool;
  }, [swapSearch, swapTarget, swapTargetMuscleGroups, planExercises]);

  const handleSwap = (candidate: typeof COMMON_EXERCISES[0]) => {
    if (swapTarget === null) return;
    setPlanExercises((prev) =>
      prev.map((ex, i) =>
        i === swapTarget
          ? { ...ex, name: candidate.name, sets: candidate.defaultSets, reps: candidate.defaultReps, rest: candidate.defaultRest }
          : ex
      )
    );
    setSwapTarget(null);
    setSwapSearch('');
  };

  if (!hasFeatureAccess(subscriptionPlan, 'hasComputerVision')) {
    return (
      <FeatureLocked
        featureName="Computer Vision"
        featureIcon="videocam"
        description="AI-powered form tracking and exercise analysis"
        upgradePlans={['Premium', 'ProCoach', 'Elite']}
        onUpgradePress={() => navigation.navigate('SubscriptionPlans')}
        onBackPress={() => navigation.goBack()}
      />
    );
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[tw`flex-row items-center justify-between z-10`, { backgroundColor: cardBg, borderBottomWidth: 1, borderColor: cardBorder, paddingHorizontal: 16, paddingBottom: 14, paddingTop: Math.max(insets.top, 16), minHeight: 64 }]}>
        <View style={tw`flex-row items-center gap-3`}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[tw`items-center justify-center rounded-xl`, { width: 44, height: 44, backgroundColor: accent + '14' }]}>
            <MaterialIcons name="arrow-back" size={22} color={accent} />
          </TouchableOpacity>
          <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>Workouts</Text>
        </View>
        <TouchableOpacity
          style={[tw`items-center justify-center rounded-xl`, { width: 44, height: 44, backgroundColor: accent + '18', borderWidth: 1, borderColor: accent + '30' }]}
          onPress={() => setActiveTab('history')}
        >
          <MaterialIcons name="history" size={22} color={accent} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[tw`flex-row px-4 gap-2 py-3`, { backgroundColor: cardBg, borderBottomWidth: 1, borderColor: cardBorder }]}>
        {[
          { id: 'live' as const, label: 'Live Session', icon: 'videocam' },
          { id: 'history' as const, label: 'Past Sessions', icon: 'history' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[
              tw`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl`,
              { backgroundColor: activeTab === tab.id ? accent : (isDark ? '#1e293b' : '#f1f5f9') },
            ]}
          >
            <MaterialIcons name={tab.icon as any} size={18} color={activeTab === tab.id ? '#ffffff' : textSecondary} />
            <Text style={[tw`text-sm font-bold`, { color: activeTab === tab.id ? '#ffffff' : textSecondary }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'live' ? (
        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-32`}>

          {/* Generate Workout shortcut */}
          <View style={tw`px-4 pt-4 pb-2`}>
            <TouchableOpacity
              onPress={() => navigation.navigate('WorkoutGeneration')}
              style={[tw`rounded-xl p-4 flex-row items-center gap-3`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}
            >
              <MaterialIcons name="auto-awesome" size={24} color={accent} />
              <View style={tw`flex-1`}>
                <Text style={[tw`font-bold text-sm`, { color: accent }]}>Generate / Manage Workout Plan</Text>
                <Text style={[tw`text-xs mt-0.5`, { color: textSecondary }]}>AI-powered plan generation</Text>
              </View>
              <MaterialIcons name="arrow-forward" size={20} color={accent} />
            </TouchableOpacity>
          </View>

          {/* ── Active Plan Exercises ── */}
          <View style={tw`px-4 pt-2`}>
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <Text style={[tw`text-sm font-bold uppercase`, { color: textSecondary }]}>
                {planName ? planName : "Today's Plan"}
              </Text>
              <TouchableOpacity onPress={loadActivePlanExercises}>
                <MaterialIcons name="refresh" size={18} color={accent} />
              </TouchableOpacity>
            </View>

            {planLoading ? (
              <View style={tw`items-center py-6`}>
                <ActivityIndicator color={accent} />
              </View>
            ) : planExercises.length > 0 ? (
              <View style={tw`gap-2`}>
                {planExercises.map((ex, idx) => (
                  <View
                    key={idx}
                    style={[tw`rounded-xl p-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}
                  >
                    <View style={tw`flex-row items-center justify-between`}>
                      <View style={tw`flex-1 mr-2`}>
                        <Text style={[tw`font-bold text-sm`, { color: textPrimary }]}>{ex.name}</Text>
                        <Text style={[tw`text-xs mt-0.5`, { color: textSecondary }]}>
                          {ex.sets} sets · {ex.reps} reps · {ex.rest}s rest
                        </Text>
                      </View>
                      <View style={tw`flex-row gap-1`}>
                        <TouchableOpacity
                          onPress={() => { setSwapTarget(idx); setSwapSearch(''); }}
                          style={[tw`px-2 py-1.5 rounded-lg flex-row items-center gap-1`, { backgroundColor: accent + '18' }]}
                        >
                          <MaterialIcons name="swap-horiz" size={14} color={accent} />
                          <Text style={[tw`text-xs font-bold`, { color: accent }]}>Swap</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('Calibration', { exerciseName: ex.name })}
                          style={[tw`px-2 py-1.5 rounded-lg flex-row items-center gap-1`, { backgroundColor: '#4ade8018' }]}
                        >
                          <MaterialIcons name="videocam" size={14} color="#4ade80" />
                          <Text style={[tw`text-xs font-bold`, { color: '#4ade80' }]}>Track</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[tw`rounded-xl p-5 items-center gap-2`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}>
                <MaterialIcons name="fitness-center" size={32} color={textSecondary} />
                <Text style={[tw`text-sm font-bold text-center`, { color: textSecondary }]}>No active plan yet</Text>
                <Text style={[tw`text-xs text-center`, { color: textSecondary }]}>
                  Generate a workout plan to see your exercises here
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('WorkoutGeneration')}
                  style={[tw`mt-2 px-4 py-2 rounded-lg`, { backgroundColor: accent }]}
                >
                  <Text style={tw`text-white text-xs font-bold`}>Generate Plan</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── Custom Workouts ── */}
          {workouts.length > 0 && (
            <View style={tw`px-4 pt-5`}>
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <Text style={[tw`text-sm font-bold uppercase`, { color: textSecondary }]}>
                  My Custom Workouts
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('WorkoutBuilder')}>
                  <MaterialIcons name="add" size={18} color={accent} />
                </TouchableOpacity>
              </View>
              {workouts.map((workout) => (
                <View
                  key={workout.id}
                  style={[tw`rounded-xl mb-3 overflow-hidden`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}
                >
                  {/* Workout header */}
                  <View style={[tw`flex-row items-center justify-between px-3 py-2.5`, { backgroundColor: accent + '10', borderBottomWidth: 1, borderColor: cardBorder }]}>
                    <View>
                      <Text style={[tw`font-bold text-sm`, { color: textPrimary }]}>{workout.name}</Text>
                      <Text style={[tw`text-xs mt-0.5 capitalize`, { color: textSecondary }]}>
                        {workout.difficulty} · {workout.totalExercises} exercises · ~{workout.estimatedDuration} min
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Calibration', { workoutName: workout.name })}
                      style={[tw`px-3 py-1.5 rounded-lg flex-row items-center gap-1`, { backgroundColor: accent }]}
                    >
                      <MaterialIcons name="play-arrow" size={16} color="white" />
                      <Text style={tw`text-white text-xs font-bold`}>Start All</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Individual exercises */}
                  <View style={tw`py-1`}>
                    {workout.exercises.map((item, eIdx) => {
                      const ex = customExercises.find((e) => e.id === item.exerciseId);
                      const name = ex?.name ?? item.exerciseId;
                      return (
                        <View
                          key={eIdx}
                          style={[tw`flex-row items-center justify-between py-2`, eIdx > 0 && { borderTopWidth: 1, borderColor: cardBorder }]}
                        >
                          <View style={tw`flex-1 mr-2`}>
                            <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>{name}</Text>
                            <Text style={[tw`text-xs mt-0.5`, { color: textSecondary }]}>
                              {item.sets} sets · {item.reps} reps · {item.restSeconds}s rest
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => navigation.navigate('Calibration', { exerciseName: name })}
                            style={[tw`px-2 py-1.5 rounded-lg flex-row items-center gap-1`, { backgroundColor: '#4ade8018' }]}
                          >
                            <MaterialIcons name="videocam" size={14} color="#4ade80" />
                            <Text style={[tw`text-xs font-bold`, { color: '#4ade80' }]}>Track</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        /* ── History Tab ── */
        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 pt-4 gap-3 pb-32`}>
          {historyLoading ? (
            <View style={tw`flex-1 items-center justify-center py-12`}>
              <ActivityIndicator color={accent} />
              <Text style={[tw`mt-2 text-xs`, { color: textSecondary }]}>Loading history...</Text>
            </View>
          ) : apiHistory.length > 0 ? (
            apiHistory.map((session, i) => (
              <TouchableOpacity
                key={session.id || i}
                onPress={() => navigation.navigate('WorkoutSessionDetail', { session })}
                style={[tw`flex-row items-center p-4 rounded-2xl gap-4`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}
              >
                <View style={[tw`w-12 h-12 rounded-xl items-center justify-center`, { backgroundColor: accent + '18' }]}>
                  <MaterialIcons name="fitness-center" size={24} color={accent} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-base font-bold`, { color: textPrimary }]}>{session.day || 'Workout'}</Text>
                  <Text style={[tw`text-xs mt-0.5`, { color: '#94a3b8' }]}>
                    {session.date ? new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    {session.duration ? ` · ${session.duration}m` : ''}
                    {session.exercises?.length ? ` · ${session.exercises.length} exercises` : ''}
                  </Text>
                </View>
                <Text style={[tw`text-xs font-bold uppercase px-2 py-1 rounded-full`, { backgroundColor: accent + '20', color: accent }]}>
                  {session.status === 'completed' ? 'Done' : session.status || '--'}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            (cachedHistory || [{ date: 'No history yet', type: 'Start a workout to see history', duration: '--', score: '--', exercises: 0 }]).map((session, i) => (
              <View key={i} style={[tw`flex-row items-center p-4 rounded-2xl gap-4`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}>
                <View style={[tw`w-12 h-12 rounded-xl items-center justify-center`, { backgroundColor: accent + '18' }]}>
                  <MaterialIcons name="fitness-center" size={24} color={accent} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-base font-bold`, { color: textPrimary }]}>{session.type}</Text>
                  <Text style={[tw`text-xs mt-0.5`, { color: '#94a3b8' }]}>{session.date}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* ── Swap Exercise Sheet ── */}
      <Modal
        visible={swapTarget !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSwapTarget(null)}
      >
        <View style={[tw`flex-1 justify-end`, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <SafeAreaView style={[tw`rounded-t-3xl`, { backgroundColor: bg, maxHeight: '75%' }]}>
            <View style={tw`p-4`}>
              <View style={[tw`w-10 h-1 rounded-full self-center mb-4`, { backgroundColor: cardBorder }]} />
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <Text style={[tw`text-base font-bold`, { color: textPrimary }]}>Swap Exercise</Text>
                <TouchableOpacity onPress={() => setSwapTarget(null)}>
                  <MaterialIcons name="close" size={22} color={textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={[tw`flex-row items-center gap-2 px-3 py-2 rounded-xl mb-3`, { backgroundColor: inputBg }]}>
                <MaterialIcons name="search" size={18} color={textSecondary} />
                <TextInput
                  style={[tw`flex-1 text-sm`, { color: textPrimary }]}
                  placeholder="Search exercises…"
                  placeholderTextColor={textSecondary}
                  value={swapSearch}
                  onChangeText={setSwapSearch}
                />
              </View>
            </View>
            <ScrollView style={tw`px-4`} contentContainerStyle={tw`gap-2 pb-6`}>
              {swapCandidates.slice(0, 40).map((candidate, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleSwap(candidate)}
                  style={[tw`p-3 rounded-xl flex-row items-center justify-between`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}
                >
                  <View style={tw`flex-1`}>
                    <Text style={[tw`font-bold text-sm`, { color: textPrimary }]}>{candidate.name}</Text>
                    <Text style={[tw`text-xs mt-0.5`, { color: textSecondary }]}>
                      {candidate.muscleGroups.join(', ')} · {candidate.location === 'home' ? '🏠 Home' : '🏋️ Gym'}
                    </Text>
                  </View>
                  <View style={[tw`px-2 py-1 rounded-full ml-2`, { backgroundColor: accent + '18' }]}>
                    <Text style={[tw`text-xs font-bold`, { color: accent }]}>
                      {candidate.defaultSets}×{candidate.defaultReps}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      <TraineeBottomNav activeId="workouts" navigation={navigation} totalUnread={totalUnread} />
    </SafeAreaView>
  );
};
