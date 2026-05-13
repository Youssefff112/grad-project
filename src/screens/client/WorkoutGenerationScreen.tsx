import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { hasFeatureAccess } from '../../utils/planUtils';
import { FeatureLocked } from '../../components/FeatureLocked';
import { Button } from '../../components/Button';
import * as workoutService from '../../services/workoutService';
import { COMMON_EXERCISES } from '../../services/exerciseService';
import { useExerciseManagement } from '../../context/ExerciseManagementContext';

interface GeneratedExercise {
  name: string;
  sets: number;
  reps: string;
  rest: number;
}

interface GeneratedWorkout {
  id: string;
  name: string;
  duration: number;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  focus: string;
  exercises: GeneratedExercise[];
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
}

type WorkoutLocation = 'home' | 'gym';

const HOME_EQUIPMENT_OPTIONS = [
  { id: 'dumbbells', label: 'Dumbbells' },
  { id: 'resistance_bands', label: 'Resistance Bands' },
  { id: 'pullup_bar', label: 'Pull-up Bar' },
  { id: 'bench', label: 'Bench / Chair' },
  { id: 'barbell', label: 'Barbell + Weights' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'none', label: 'Nothing (Bodyweight Only)' },
];

const mapExperienceToDifficulty = (level?: string): 'Easy' | 'Moderate' | 'Hard' => {
  if (level === 'beginner') return 'Easy';
  if (level === 'advanced') return 'Hard';
  return 'Moderate';
};

const prettyLabel = (s?: string) =>
  (s || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || 'General';

const planToWorkout = (plan: workoutService.WorkoutPlan): GeneratedWorkout[] => {
  const workoutDays = plan.weeklySchedule?.filter((d) => !d.isRestDay) || [];
  const status = plan.pendingCoachReview ? 'pending' : 'approved';
  return workoutDays.map((day) => ({
    id: `${plan.id}-${day.day}`,
    name: `${prettyLabel(day.day)}: ${prettyLabel(day.focus) || 'Workout'}`,
    duration: day.duration || 60,
    difficulty: mapExperienceToDifficulty(plan.experienceLevel),
    focus: prettyLabel(day.focus) || 'Full Body',
    exercises: (day.exercises || []).map((e) => ({
      name: e.name,
      sets: e.sets,
      reps: e.reps,
      rest: e.restTime,
    })),
    notes: `${workoutDays.length} workout days per week · Goal: ${prettyLabel(plan.goal) || 'Fitness'}`,
    status,
  }));
};

export const WorkoutGenerationScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { userMode, subscriptionPlan, coachId, coachName, experienceLevel } = useUser();
  const { workouts: customWorkouts, deleteWorkout } = useExerciseManagement();
  const insets = useSafeAreaInsets();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [availableWorkouts, setAvailableWorkouts] = useState<GeneratedWorkout[]>([]);

  // Location questionnaire state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationStep, setLocationStep] = useState<1 | 2>(1);
  const [workoutLocation, setWorkoutLocation] = useState<WorkoutLocation | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  // Swap exercise state
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [swapSearch, setSwapSearch] = useState('');

  // ── Derived colors ───────────────────────────────────────────────────────────
  const bg = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#cbd5e1' : '#475569';
  const inputBg = isDark ? '#1e293b' : '#f1f5f9';
  const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  const loadActivePlan = useCallback(async () => {
    setIsLoadingPlan(true);
    try {
      const { plan } = await workoutService.getActiveWorkoutPlan();
      // CRITICAL: if the user just deleted the plan elsewhere or never had
      // one, we MUST clear local state. Otherwise the previously-loaded plan
      // would persist visually after deletion or regeneration.
      setAvailableWorkouts(plan ? planToWorkout(plan) : []);
    } catch {
      // Treat fetch failure as "no plan" so the UI doesn't show stale data.
      setAvailableWorkouts([]);
    } finally {
      setIsLoadingPlan(false);
    }
  }, []);

  // Re-fetch every time this screen regains focus so deletes/generates done
  // from other screens (or this one) always reflect immediately.
  useFocusEffect(
    useCallback(() => {
      if (hasFeatureAccess(subscriptionPlan, 'hasAIWorkoutGeneration')) {
        loadActivePlan();
      }
    }, [subscriptionPlan, loadActivePlan]),
  );

  if (!hasFeatureAccess(subscriptionPlan, 'hasAIWorkoutGeneration')) {
    return (
      <FeatureLocked
        featureName="AI Workout Generation"
        featureIcon="lightbulb"
        description="Generate personalized workout plans powered by AI"
        upgradePlans={['Premium', 'Elite']}
        onUpgradePress={() => navigation.navigate('SubscriptionPlans')}
        onBackPress={() => navigation.goBack()}
      />
    );
  }

  // ── Step 1: open questionnaire ───────────────────────────────────────────────
  const handleOpenQuestionnaire = () => {
    setWorkoutLocation(null);
    setSelectedEquipment([]);
    setLocationStep(1);
    setShowLocationModal(true);
  };

  // ── Step 2: confirm & generate ───────────────────────────────────────────────
  const handleConfirmAndGenerate = async () => {
    setShowLocationModal(false);
    await runGeneration();
  };

  const runGeneration = async (
    loc: WorkoutLocation | null = workoutLocation,
    equip: string[] = selectedEquipment,
  ) => {
    setIsGenerating(true);
    try {
      const { plan } = await workoutService.generateWorkoutPlan(loc, equip);
      if (plan) {
        const workouts = planToWorkout(plan);
        const first = workouts[0];
        if (first) {
          setGeneratedWorkout({ ...first, status: 'pending' });
          setShowPreview(true);
          setAvailableWorkouts(workouts);
        } else {
          throw new Error('Plan has no workout days');
        }
      } else {
        throw new Error('No plan returned');
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to generate workout plan. Make sure your profile is complete and you have an active subscription.';
      Alert.alert('Generation Failed', msg, [{ text: 'OK' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Swap helpers ─────────────────────────────────────────────────────────────
  // Muscle groups of the exercise currently being swapped (for same-group filtering)
  const swapTargetMuscleGroups = useMemo<string[]>(() => {
    if (swapIndex === null || !generatedWorkout) return [];
    const currentName = generatedWorkout.exercises[swapIndex]?.name ?? '';
    const found = COMMON_EXERCISES.find(
      (e) => e.name.toLowerCase() === currentName.toLowerCase(),
    );
    // If the exercise isn't in our catalog, try substring match on the primary muscle group
    if (!found) {
      const lower = currentName.toLowerCase();
      const inferred = ['Chest', 'Shoulders', 'Back', 'Biceps', 'Triceps', 'Legs'].find(
        (g) => lower.includes(g.toLowerCase()),
      );
      return inferred ? [inferred] : [];
    }
    return found.muscleGroups;
  }, [swapIndex, generatedWorkout]);

  const swapCandidates = useMemo(() => {
    let pool = COMMON_EXERCISES;

    // Exclude the exercise being swapped out
    if (swapIndex !== null && generatedWorkout) {
      const currentName = generatedWorkout.exercises[swapIndex]?.name ?? '';
      pool = pool.filter((e) => e.name.toLowerCase() !== currentName.toLowerCase());
    }

    // Filter by location when known
    if (workoutLocation) {
      pool = pool.filter((e) => e.location === workoutLocation);
    }

    if (swapSearch.trim()) {
      // When searching, match name or muscle group across everything
      const q = swapSearch.toLowerCase();
      pool = pool.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.muscleGroups.some((m) => m.toLowerCase().includes(q)),
      );
    } else if (swapTargetMuscleGroups.length > 0) {
      // No search term → limit to exercises that share the primary muscle group
      const primary = swapTargetMuscleGroups[0];
      pool = pool.filter((e) => e.muscleGroups.includes(primary));
    }

    return pool;
  }, [workoutLocation, swapSearch, swapIndex, swapTargetMuscleGroups]);

  const handleSwapExercise = (candidate: typeof COMMON_EXERCISES[0]) => {
    if (swapIndex === null || !generatedWorkout) return;
    const updated = generatedWorkout.exercises.map((ex, i) =>
      i === swapIndex
        ? {
            name: candidate.name,
            sets: candidate.defaultSets,
            reps: candidate.defaultReps,
            rest: candidate.defaultRest,
          }
        : ex,
    );
    setGeneratedWorkout({ ...generatedWorkout, exercises: updated });
    setSwapIndex(null);
    setSwapSearch('');
  };

  const handleApproveWorkout = () => {
    if (!generatedWorkout) return;
    Alert.alert('Workout Plan Saved!', 'Your workout plan has been added to your routine.', [
      {
        text: 'View Workouts',
        onPress: () => {
          setShowPreview(false);
          setGeneratedWorkout(null);
          navigation.navigate('VisionAnalysisLab');
        },
      },
      {
        text: 'Generate Another',
        onPress: () => {
          setShowPreview(false);
          setGeneratedWorkout(null);
          handleOpenQuestionnaire();
        },
      },
    ]);
  };

  const handleSubmitForApproval = () => {
    if (!generatedWorkout) return;
    Alert.alert(
      'Submit for Coach Review',
      `Your workout will be reviewed by ${coachName || 'your coach'} within 24 hours.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            Alert.alert('Submitted', 'Your coach will review this workout shortly.');
            setShowPreview(false);
            setGeneratedWorkout(null);
          },
        },
      ],
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10b981';
      case 'Moderate': return '#f59e0b';
      case 'Hard': return '#ef4444';
      default: return accent;
    }
  };

  const toggleEquipment = (id: string) => {
    if (id === 'none') {
      setSelectedEquipment(['none']);
      return;
    }
    setSelectedEquipment((prev) => {
      const without = prev.filter((e) => e !== 'none');
      return without.includes(id) ? without.filter((e) => e !== id) : [...without, id];
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bg }]}>
      {/* Header */}
      <View
        style={[
          tw`flex-row items-center gap-4`,
          {
            backgroundColor: bg,
            borderBottomWidth: 1,
            borderColor: cardBorder,
            paddingHorizontal: 16,
            paddingBottom: 14,
            paddingTop: Math.max(insets.top, 16),
            minHeight: 64,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[tw`items-center justify-center rounded-xl`, { width: 44, height: 44, backgroundColor: accent + '14' }]}
        >
          <MaterialIcons name="arrow-back" size={22} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`text-xl font-bold flex-1`, { color: textPrimary }]}>
          Generate Workout
        </Text>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-6`}>
        {/* Mode Info Banner */}
        <View
          style={[
            tw`mb-6 rounded-xl p-4`,
            { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' },
          ]}
        >
          <View style={tw`flex-row items-start gap-3 mb-2`}>
            <MaterialIcons name="info" size={20} color={accent} />
            <Text style={[tw`flex-1 text-sm font-bold`, { color: textPrimary }]}>
              {userMode === 'CoachAssisted'
                ? 'Coach Review Required'
                : userMode === 'AIDriven'
                ? 'AI-Generated Workouts'
                : 'Browse Workouts'}
            </Text>
          </View>
          <Text style={[tw`text-sm`, { color: textSecondary }]}>
            {userMode === 'CoachAssisted'
              ? `Generated workouts will be reviewed by ${coachName} before appearing in your routine.`
              : userMode === 'AIDriven'
              ? 'Your AI generates personalized workouts based on your fitness level, goals, and location.'
              : 'You can browse our exercise library and create custom workouts.'}
          </Text>
        </View>

        {/* Experience Level Info */}
        <View
          style={[
            tw`mb-6 rounded-xl p-4 flex-row items-center gap-3`,
            { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
          ]}
        >
          <MaterialIcons name="fitness-center" size={24} color={accent} />
          <View style={tw`flex-1`}>
            <Text style={[tw`font-bold text-sm`, { color: textPrimary }]}>Experience Level</Text>
            <Text style={[tw`text-xs mt-1 capitalize`, { color: textSecondary }]}>
              {experienceLevel || 'Not set'}
            </Text>
          </View>
        </View>

        {/* Create New Workout */}
        {!generatedWorkout && (
          <View>
            <Text style={[tw`text-lg font-bold mb-4`, { color: textPrimary }]}>
              Create New Workout
            </Text>

            <View style={tw`gap-3 mb-6`}>
              <TouchableOpacity
                disabled={isGenerating}
                onPress={handleOpenQuestionnaire}
                style={[
                  tw`rounded-xl p-4 flex-row items-center gap-3`,
                  { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' },
                ]}
              >
                <View style={[tw`p-3 rounded-lg`, { backgroundColor: accent }]}>
                  <MaterialIcons name="auto-awesome" size={24} color="white" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`font-bold text-base`, { color: textPrimary }]}>
                    Generate Auto
                  </Text>
                  <Text style={[tw`text-xs mt-1`, { color: textSecondary }]}>
                    Let AI create a workout plan tailored to your location
                  </Text>
                </View>
                {isGenerating && <ActivityIndicator color={accent} />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('WorkoutBuilder')}
                style={[
                  tw`rounded-xl p-4 flex-row items-center gap-3`,
                  { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
                ]}
              >
                <View style={[tw`p-3 rounded-lg`, { backgroundColor: inputBg }]}>
                  <MaterialIcons name="edit" size={24} color={accent} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`font-bold text-base`, { color: textPrimary }]}>
                    Build Custom
                  </Text>
                  <Text style={[tw`text-xs mt-1`, { color: textSecondary }]}>
                    Choose exercises manually from the full library
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View
              style={[
                tw`rounded-xl p-4`,
                { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
              ]}
            >
              <Text style={[tw`font-bold text-sm mb-3`, { color: textPrimary }]}>
                💡 Quick Tips
              </Text>
              <View style={tw`gap-2`}>
                <Text style={[tw`text-sm`, { color: textSecondary }]}>
                  • AI will ask where you workout and what equipment you have
                </Text>
                <Text style={[tw`text-sm`, { color: textSecondary }]}>
                  • You can swap any exercise in the generated plan before saving
                </Text>
                <Text style={[tw`text-sm`, { color: textSecondary }]}>
                  • Generating a new plan replaces your current one
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Active Workout Plan Days */}
        {!isLoadingPlan && availableWorkouts.length > 0 && availableWorkouts.some(w => w.status === 'pending') && (
          <View style={[tw`mt-6 rounded-xl p-4 flex-row items-start gap-3`, { backgroundColor: '#f59e0b12', borderWidth: 1, borderColor: '#f59e0b30' }]}>
            <MaterialIcons name="pending-actions" size={20} color="#f59e0b" />
            <View style={tw`flex-1`}>
              <Text style={[tw`font-bold text-sm`, { color: '#f59e0b' }]}>Awaiting Coach Review</Text>
              <Text style={[tw`text-xs mt-0.5`, { color: textSecondary }]}>
                {`Your workout plan has been sent to ${coachName || 'your coach'} for review. It will activate once approved.`}
              </Text>
            </View>
          </View>
        )}

        {!isLoadingPlan && availableWorkouts.length > 0 && (
          <View style={tw`mt-8`}>
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>
                Your Current Plan
              </Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Delete Plan', 'Delete your current workout plan?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await workoutService.deleteActiveWorkoutPlan();
                          setAvailableWorkouts([]);
                        } catch (e: any) {
                          Alert.alert('Error', e?.response?.data?.message || 'Failed to delete plan');
                        }
                      },
                    },
                  ])
                }
                style={[tw`flex-row items-center gap-1 px-2 py-1 rounded-lg`, { backgroundColor: '#ef444418' }]}
              >
                <MaterialIcons name="delete-outline" size={16} color="#ef4444" />
                <Text style={[tw`text-xs font-bold`, { color: '#ef4444' }]}>Delete Plan</Text>
              </TouchableOpacity>
            </View>
            {availableWorkouts.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                onPress={() => {
                  setGeneratedWorkout(workout);
                  setShowPreview(true);
                }}
                style={[
                  tw`rounded-xl p-4 mb-3`,
                  { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
                ]}
              >
                <View style={tw`flex-row items-start justify-between mb-2`}>
                  <View style={tw`flex-1`}>
                    <Text style={[tw`font-bold text-base`, { color: textPrimary }]}>
                      {workout.name}
                    </Text>
                    <Text style={[tw`text-xs mt-1`, { color: textSecondary }]}>
                      {workout.focus} • {workout.duration} mins
                    </Text>
                  </View>
                  <View
                    style={[
                      tw`px-2 py-1 rounded`,
                      { backgroundColor: getDifficultyColor(workout.difficulty) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        tw`text-xs font-bold`,
                        { color: getDifficultyColor(workout.difficulty) },
                      ]}
                    >
                      {workout.difficulty}
                    </Text>
                  </View>
                </View>
                <View style={[tw`w-full h-px`, { backgroundColor: cardBorder }]} />
                <View style={tw`mt-2 flex-row items-center gap-1`}>
                  <MaterialIcons name="fitness-center" size={14} color={accent} />
                  <Text style={[tw`text-xs`, { color: textSecondary }]}>
                    {workout.exercises.length} exercises
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isLoadingPlan && (
          <View style={tw`items-center py-6`}>
            <ActivityIndicator color={accent} />
            <Text style={[tw`text-xs mt-2`, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Loading your plan...
            </Text>
          </View>
        )}

        {/* ── Custom Workouts Section ─────────────────────────────────────────── */}
        {customWorkouts && customWorkouts.length > 0 && (
          <View style={tw`mt-8`}>
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>
                My Custom Workouts
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('WorkoutBuilder')}
                style={[tw`px-3 py-1.5 rounded-lg`, { backgroundColor: accent + '20' }]}
              >
                <Text style={[tw`text-xs font-bold`, { color: accent }]}>+ New</Text>
              </TouchableOpacity>
            </View>
            {customWorkouts.map((cw) => (
              <View
                key={cw.id}
                style={[
                  tw`rounded-xl p-4 mb-3`,
                  { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
                ]}
              >
                <View style={tw`flex-row items-start justify-between`}>
                  <View style={tw`flex-1`}>
                    <Text style={[tw`font-bold text-base`, { color: textPrimary }]}>{cw.name}</Text>
                    <Text style={[tw`text-xs mt-1 capitalize`, { color: textSecondary }]}>
                      {cw.difficulty} · {cw.totalExercises} exercises · ~{cw.estimatedDuration} min
                    </Text>
                  </View>
                  <View style={tw`flex-row gap-2`}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('VisionAnalysisLab', { workoutName: cw.name })}
                      style={[tw`p-2 rounded-lg`, { backgroundColor: '#4ade8018' }]}
                    >
                      <MaterialIcons name="videocam" size={16} color="#4ade80" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('WorkoutBuilder', { workout: cw })}
                      style={[tw`p-2 rounded-lg`, { backgroundColor: accent + '20' }]}
                    >
                      <MaterialIcons name="edit" size={16} color={accent} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert('Delete Workout', `Delete "${cw.name}"?`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => deleteWorkout(cw.id) },
                        ])
                      }
                      style={[tw`p-2 rounded-lg`, { backgroundColor: '#ef444420' }]}
                    >
                      <MaterialIcons name="delete-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Location / Equipment Questionnaire Modal ─────────────────────────── */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={[tw`flex-1 justify-end`, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View
            style={[
              tw`rounded-t-3xl p-6`,
              { backgroundColor: bg, maxHeight: '85%' },
            ]}
          >
            {/* Handle */}
            <View style={[tw`w-10 h-1 rounded-full self-center mb-6`, { backgroundColor: cardBorder }]} />

            {locationStep === 1 ? (
              <>
                <Text style={[tw`text-xl font-bold mb-2`, { color: textPrimary }]}>
                  Where will you workout?
                </Text>
                <Text style={[tw`text-sm mb-6`, { color: textSecondary }]}>
                  This helps us select exercises that match your environment.
                </Text>

                <View style={tw`gap-3`}>
                  <TouchableOpacity
                    onPress={() => {
                      setWorkoutLocation('home');
                      setLocationStep(2);
                    }}
                    style={[
                      tw`p-5 rounded-2xl flex-row items-center gap-4`,
                      {
                        backgroundColor: workoutLocation === 'home' ? accent + '20' : cardBg,
                        borderWidth: 2,
                        borderColor: workoutLocation === 'home' ? accent : cardBorder,
                      },
                    ]}
                  >
                    <Text style={tw`text-3xl`}>🏠</Text>
                    <View style={tw`flex-1`}>
                      <Text style={[tw`font-bold text-base`, { color: textPrimary }]}>
                        At Home
                      </Text>
                      <Text style={[tw`text-xs mt-1`, { color: textSecondary }]}>
                        Bodyweight, bands, dumbbells & more
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={accent} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setWorkoutLocation('gym');
                      setSelectedEquipment([]);
                      handleConfirmAndGenerate();
                    }}
                    style={[
                      tw`p-5 rounded-2xl flex-row items-center gap-4`,
                      {
                        backgroundColor: workoutLocation === 'gym' ? accent + '20' : cardBg,
                        borderWidth: 2,
                        borderColor: workoutLocation === 'gym' ? accent : cardBorder,
                      },
                    ]}
                  >
                    <Text style={tw`text-3xl`}>🏋️</Text>
                    <View style={tw`flex-1`}>
                      <Text style={[tw`font-bold text-base`, { color: textPrimary }]}>
                        At the Gym
                      </Text>
                      <Text style={[tw`text-xs mt-1`, { color: textSecondary }]}>
                        Full equipment access
                      </Text>
                    </View>
                    {isGenerating && <ActivityIndicator color={accent} />}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => setShowLocationModal(false)}
                  style={tw`items-center mt-5 py-3`}
                >
                  <Text style={[tw`font-bold`, { color: accent }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  onPress={() => setLocationStep(1)}
                  style={tw`flex-row items-center gap-2 mb-4`}
                >
                  <MaterialIcons name="arrow-back" size={20} color={accent} />
                  <Text style={[tw`text-sm font-bold`, { color: accent }]}>Back</Text>
                </TouchableOpacity>

                <Text style={[tw`text-xl font-bold mb-2`, { color: textPrimary }]}>
                  What equipment do you have?
                </Text>
                <Text style={[tw`text-sm mb-5`, { color: textSecondary }]}>
                  Select all that apply so we tailor your exercises.
                </Text>

                <View style={tw`gap-2 mb-6`}>
                  {HOME_EQUIPMENT_OPTIONS.map((opt) => {
                    const selected = selectedEquipment.includes(opt.id);
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => toggleEquipment(opt.id)}
                        style={[
                          tw`p-4 rounded-xl flex-row items-center gap-3`,
                          {
                            backgroundColor: selected ? accent + '18' : cardBg,
                            borderWidth: 2,
                            borderColor: selected ? accent : cardBorder,
                          },
                        ]}
                      >
                        <View
                          style={[
                            tw`w-5 h-5 rounded border-2 items-center justify-center`,
                            {
                              borderColor: selected ? accent : textSecondary,
                              backgroundColor: selected ? accent : 'transparent',
                            },
                          ]}
                        >
                          {selected && (
                            <MaterialIcons name="check" size={12} color="white" />
                          )}
                        </View>
                        <Text style={[tw`text-sm font-bold flex-1`, { color: textPrimary }]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  onPress={handleConfirmAndGenerate}
                  style={[tw`py-4 rounded-xl items-center`, { backgroundColor: accent }]}
                >
                  {isGenerating ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={tw`font-bold text-white text-base`}>Generate My Workout</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedEquipment([]);
                    handleConfirmAndGenerate();
                  }}
                  style={tw`items-center mt-3 py-3`}
                >
                  <Text style={[tw`text-sm`, { color: textSecondary }]}>
                    Skip — no equipment
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Workout Preview Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={showPreview}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          if (swapIndex !== null) {
            setSwapIndex(null);
          } else {
            setShowPreview(false);
            setGeneratedWorkout(null);
          }
        }}
      >
        <SafeAreaView style={[tw`flex-1`, { backgroundColor: bg }]} edges={['left', 'right', 'bottom']}>
          <View
            style={[
              tw`flex-row items-center justify-between`,
              {
                borderBottomWidth: 1,
                borderColor: cardBorder,
                paddingHorizontal: 16,
                paddingBottom: 14,
                paddingTop: Math.max(insets.top + 8, 20),
                minHeight: 64,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                setShowPreview(false);
                setGeneratedWorkout(null);
                setSwapIndex(null);
              }}
              style={[tw`items-center justify-center rounded-xl`, { width: 44, height: 44, backgroundColor: accent + '14' }]}
            >
              <MaterialIcons name="close" size={22} color={accent} />
            </TouchableOpacity>
            <Text style={[tw`text-lg font-bold flex-1 text-center`, { color: textPrimary }]}>
              Workout Preview
            </Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-6 gap-4`}>
            {generatedWorkout && (
              <>
                {/* Header */}
                <View>
                  <View style={tw`flex-row items-start justify-between mb-3`}>
                    <View style={tw`flex-1`}>
                      <Text style={[tw`text-2xl font-bold`, { color: textPrimary }]}>
                        {generatedWorkout.name}
                      </Text>
                      <Text style={[tw`text-sm mt-2`, { color: textSecondary }]}>
                        {generatedWorkout.focus}
                      </Text>
                    </View>
                    <View
                      style={[
                        tw`px-3 py-1 rounded-full`,
                        {
                          backgroundColor:
                            getDifficultyColor(generatedWorkout.difficulty) + '20',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          tw`text-xs font-bold`,
                          { color: getDifficultyColor(generatedWorkout.difficulty) },
                        ]}
                      >
                        {generatedWorkout.difficulty}
                      </Text>
                    </View>
                  </View>

                  <View style={tw`flex-row gap-6 mt-4`}>
                    <View style={tw`flex-row items-center gap-2`}>
                      <MaterialIcons name="schedule" size={18} color={accent} />
                      <Text style={[tw`text-sm font-bold`, { color: textSecondary }]}>
                        {generatedWorkout.duration} min
                      </Text>
                    </View>
                    <View style={tw`flex-row items-center gap-2`}>
                      <MaterialIcons name="fitness-center" size={18} color={accent} />
                      <Text style={[tw`text-sm font-bold`, { color: textSecondary }]}>
                        {generatedWorkout.exercises.length} exercises
                      </Text>
                    </View>
                    {workoutLocation && (
                      <View style={tw`flex-row items-center gap-1`}>
                        <Text style={tw`text-sm`}>
                          {workoutLocation === 'home' ? '🏠' : '🏋️'}
                        </Text>
                        <Text style={[tw`text-sm font-bold capitalize`, { color: textSecondary }]}>
                          {workoutLocation}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {generatedWorkout.notes && (
                  <View
                    style={[
                      tw`rounded-xl p-4`,
                      { backgroundColor: accent + '0a', borderWidth: 1, borderColor: accent + '18' },
                    ]}
                  >
                    <Text style={[tw`text-sm`, { color: textSecondary }]}>
                      {generatedWorkout.notes}
                    </Text>
                  </View>
                )}

                {/* Exercises */}
                <View>
                  <View style={tw`flex-row items-center justify-between mb-3`}>
                    <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>
                      Exercises
                    </Text>
                    <Text style={[tw`text-xs`, { color: textSecondary }]}>
                      Tap Swap to customize
                    </Text>
                  </View>
                  <View style={tw`gap-2`}>
                    {generatedWorkout.exercises.map((exercise, idx) => (
                      <View
                        key={idx}
                        style={[
                          tw`rounded-xl p-3`,
                          { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
                        ]}
                      >
                        <View style={tw`flex-row items-start justify-between mb-2`}>
                          <Text
                            style={[tw`font-bold text-sm flex-1 mr-2`, { color: textPrimary }]}
                          >
                            {idx + 1}. {exercise.name}
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              setSwapIndex(idx);
                              setSwapSearch('');
                            }}
                            style={[
                              tw`px-2 py-1 rounded-lg flex-row items-center gap-1`,
                              { backgroundColor: accent + '18' },
                            ]}
                          >
                            <MaterialIcons name="swap-horiz" size={14} color={accent} />
                            <Text style={[tw`text-xs font-bold`, { color: accent }]}>Swap</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={tw`flex-row gap-4`}>
                          <Text style={[tw`text-xs`, { color: textSecondary }]}>
                            {exercise.sets} sets
                          </Text>
                          <Text style={[tw`text-xs`, { color: textSecondary }]}>
                            {exercise.reps} reps
                          </Text>
                          <Text style={[tw`text-xs`, { color: textSecondary }]}>
                            {exercise.rest}s rest
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          <View
            style={[
              tw`p-6 gap-3`,
              { backgroundColor: bg, borderTopWidth: 1, borderColor: cardBorder },
            ]}
          >
            {userMode === 'CoachAssisted' ? (
              <>
                <Button
                  title={`Submit to ${coachName} for Review`}
                  size="lg"
                  onPress={handleSubmitForApproval}
                  icon={<MaterialIcons name="check" size={20} color="white" style={tw`mr-2`} />}
                />
                <TouchableOpacity
                  style={tw`items-center py-3`}
                  onPress={() => {
                    setShowPreview(false);
                    setGeneratedWorkout(null);
                  }}
                >
                  <Text style={[tw`font-bold text-base`, { color: accent }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Button
                  title="Add to Routine"
                  size="lg"
                  onPress={handleApproveWorkout}
                  icon={<MaterialIcons name="check" size={20} color="white" style={tw`mr-2`} />}
                />
                <TouchableOpacity
                  style={tw`items-center py-3`}
                  onPress={() => {
                    setShowPreview(false);
                    setGeneratedWorkout(null);
                    handleOpenQuestionnaire();
                  }}
                >
                  <Text style={[tw`font-bold text-base`, { color: accent }]}>Generate Another</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* ── Swap Exercise Sheet (inside preview modal to avoid stacking modals) ── */}
          {swapIndex !== null && (
            <View
              style={[
                tw`absolute inset-0 justify-end`,
                { backgroundColor: 'rgba(0,0,0,0.5)' },
              ]}
            >
              <TouchableOpacity
                style={tw`flex-1`}
                activeOpacity={1}
                onPress={() => setSwapIndex(null)}
              />
              <View
                style={[
                  tw`rounded-t-3xl`,
                  { backgroundColor: bg, maxHeight: '75%' },
                ]}
              >
                <View style={tw`p-4`}>
                  <View
                    style={[tw`w-10 h-1 rounded-full self-center mb-4`, { backgroundColor: cardBorder }]}
                  />
                  <View style={tw`flex-row items-center justify-between mb-4`}>
                    <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>
                      Swap Exercise
                    </Text>
                    <TouchableOpacity onPress={() => setSwapIndex(null)}>
                      <MaterialIcons name="close" size={24} color={accent} />
                    </TouchableOpacity>
                  </View>
                  <View
                    style={[
                      tw`flex-row items-center px-3 py-2 rounded-xl mb-3`,
                      { backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder },
                    ]}
                  >
                    <MaterialIcons name="search" size={18} color={textSecondary} />
                    <TextInput
                      style={[tw`flex-1 ml-2 text-sm`, { color: textPrimary }]}
                      placeholder="Search exercises..."
                      placeholderTextColor={textSecondary}
                      value={swapSearch}
                      onChangeText={setSwapSearch}
                    />
                  </View>
                </View>
                <ScrollView
                  contentContainerStyle={tw`px-4 pb-6 gap-2`}
                  showsVerticalScrollIndicator={false}
                >
                  {swapCandidates.slice(0, 40).map((ex, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => handleSwapExercise(ex)}
                      style={[
                        tw`p-3 rounded-xl flex-row items-center gap-3`,
                        { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder },
                      ]}
                    >
                      <View style={tw`flex-1`}>
                        <Text style={[tw`font-bold text-sm`, { color: textPrimary }]}>
                          {ex.name}
                        </Text>
                        <Text style={[tw`text-xs mt-0.5`, { color: textSecondary }]}>
                          {ex.muscleGroups.join(', ')} •{' '}
                          {ex.location === 'home' ? '🏠 Home' : '🏋️ Gym'}
                        </Text>
                      </View>
                      <Text style={[tw`text-xs`, { color: textSecondary }]}>
                        {ex.defaultSets}×{ex.defaultReps}
                      </Text>
                      <MaterialIcons name="swap-horiz" size={18} color={accent} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};
