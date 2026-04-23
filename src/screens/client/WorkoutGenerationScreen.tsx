import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { hasFeatureAccess } from '../../utils/planUtils';
import { FeatureLocked } from '../../components/FeatureLocked';
import { Button } from '../../components/Button';
import * as workoutService from '../../services/workoutService';

interface GeneratedWorkout {
  id: string;
  name: string;
  duration: number;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  focus: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    rest: number;
  }>;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
}

const mapExperienceToDifficulty = (level?: string): 'Easy' | 'Moderate' | 'Hard' => {
  if (level === 'beginner') return 'Easy';
  if (level === 'advanced') return 'Hard';
  return 'Moderate';
};

const planToWorkout = (plan: workoutService.WorkoutPlan): GeneratedWorkout[] => {
  const workoutDays = plan.weeklySchedule?.filter(d => !d.isRestDay) || [];
  return workoutDays.map(day => ({
    id: `${plan.id}-${day.day}`,
    name: `${day.day}: ${day.focus || 'Workout'}`,
    duration: day.duration || 60,
    difficulty: mapExperienceToDifficulty(plan.experienceLevel),
    focus: day.focus || 'Full Body',
    exercises: (day.exercises || []).map(e => ({
      name: e.name,
      sets: e.sets,
      reps: e.reps,
      rest: e.restTime,
    })),
    notes: `${workoutDays.length} workout days per week · Goal: ${plan.goal || 'Fitness'}`,
    status: 'approved' as const,
  }));
};

export const WorkoutGenerationScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { userMode, subscriptionPlan, coachId, coachName, experienceLevel } = useUser();

  // All hooks must be declared before any conditional return
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [availableWorkouts, setAvailableWorkouts] = useState<GeneratedWorkout[]>([]);

  useEffect(() => {
    if (hasFeatureAccess(subscriptionPlan, 'hasAIWorkoutGeneration')) {
      loadActivePlan();
    }
  }, [subscriptionPlan]);

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

  const loadActivePlan = async () => {
    setIsLoadingPlan(true);
    try {
      const { plan } = await workoutService.getActiveWorkoutPlan();
      if (plan) {
        setAvailableWorkouts(planToWorkout(plan));
      }
    } catch {
      // no active plan yet
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const handleGenerateWorkout = async () => {
    setIsGenerating(true);
    try {
      const { plan } = await workoutService.generateWorkoutPlan();
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
      Alert.alert(
        'Generation Failed',
        error?.message || 'Unable to generate workout plan. Make sure your profile is complete and you have an active subscription.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGenerating(false);
    }
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
          handleGenerateWorkout();
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
      ]
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

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
      <View style={[tw`p-4 flex-row items-center gap-4`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-10 items-center justify-center`}>
          <MaterialIcons name="arrow-back" size={24} color={accent} />
        </TouchableOpacity>
        <Text style={[tw`text-xl font-bold flex-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
          Generate Workout
        </Text>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-6`}>
        {/* Mode Info Banner */}
        <View style={[tw`mb-6 rounded-xl p-4`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}>
          <View style={tw`flex-row items-start gap-3 mb-2`}>
            <MaterialIcons name="info" size={20} color={accent} />
            <Text style={[tw`flex-1 text-sm font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              {userMode === 'CoachAssisted'
                ? 'Coach Review Required'
                : userMode === 'AIDriven'
                ? 'AI-Generated Workouts'
                : 'Browse Workouts'}
            </Text>
          </View>
          <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
            {userMode === 'CoachAssisted'
              ? `Generated workouts will be reviewed by ${coachName} before appearing in your routine.`
              : userMode === 'AIDriven'
              ? 'Your AI generates personalized workouts based on your fitness level and goals.'
              : 'You can browse our exercise library and create custom workouts.'}
          </Text>
        </View>

        {/* Experience Level Info */}
        <View style={[tw`mb-6 rounded-xl p-4 flex-row items-center gap-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <MaterialIcons name="fitness-center" size={24} color={accent} />
          <View style={tw`flex-1`}>
            <Text style={[tw`font-bold text-sm`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Experience Level
            </Text>
            <Text style={[tw`text-xs mt-1 capitalize`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
              {experienceLevel || 'Not set'}
            </Text>
          </View>
        </View>

        {/* Generation Section */}
        {!generatedWorkout && (
          <View>
            <Text style={[tw`text-lg font-bold mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Create New Workout
            </Text>

            <View style={tw`gap-3 mb-6`}>
              <TouchableOpacity
                disabled={isGenerating}
                onPress={handleGenerateWorkout}
                style={[tw`rounded-xl p-4 flex-row items-center gap-3`, { backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '28' }]}
              >
                <View style={[tw`p-3 rounded-lg`, { backgroundColor: accent }]}>
                  <MaterialIcons name="auto-awesome" size={24} color="white" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`font-bold text-base`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    Generate Auto
                  </Text>
                  <Text style={[tw`text-xs mt-1`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    Let AI create a workout plan for you
                  </Text>
                </View>
                {isGenerating && <ActivityIndicator color={accent} />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('WorkoutBuilder')}
                style={[tw`rounded-xl p-4 flex-row items-center gap-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
              >
                <View style={[tw`p-3 rounded-lg`, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                  <MaterialIcons name="edit" size={24} color={accent} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`font-bold text-base`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    Build Custom
                  </Text>
                  <Text style={[tw`text-xs mt-1`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    Choose exercises manually
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={[tw`rounded-xl p-4`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <Text style={[tw`font-bold text-sm mb-3`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                💡 Quick Tips
              </Text>
              <View style={tw`gap-2`}>
                <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  • {userMode === 'CoachAssisted' ? 'Your coach customizes workouts' : 'AI learns from your preferences'}
                </Text>
                <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  • Generating a new plan replaces your current one
                </Text>
                <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  • All changes are saved to your profile automatically
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Active Workout Plan Days */}
        {!isLoadingPlan && availableWorkouts.length > 0 && (
          <View style={tw`mt-8`}>
            <Text style={[tw`text-lg font-bold mb-4`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Your Current Plan
            </Text>
            {availableWorkouts.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                onPress={() => {
                  setGeneratedWorkout(workout);
                  setShowPreview(true);
                }}
                style={[tw`rounded-xl p-4 mb-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
              >
                <View style={tw`flex-row items-start justify-between mb-2`}>
                  <View style={tw`flex-1`}>
                    <Text style={[tw`font-bold text-base`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                      {workout.name}
                    </Text>
                    <Text style={[tw`text-xs mt-1`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      {workout.focus} • {workout.duration} mins
                    </Text>
                  </View>
                  <View style={[tw`px-2 py-1 rounded`, { backgroundColor: getDifficultyColor(workout.difficulty) + '20' }]}>
                    <Text style={[tw`text-xs font-bold`, { color: getDifficultyColor(workout.difficulty) }]}>
                      {workout.difficulty}
                    </Text>
                  </View>
                </View>
                <View style={[tw`w-full h-px`, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
                <View style={tw`mt-2 flex-row items-center gap-1`}>
                  <MaterialIcons name="fitness-center" size={14} color={accent} />
                  <Text style={[tw`text-xs`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
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
            <Text style={[tw`text-xs mt-2`, { color: isDark ? '#94a3b8' : '#64748b' }]}>Loading your plan...</Text>
          </View>
        )}
      </ScrollView>

      {/* Workout Preview Modal */}
      <Modal visible={showPreview} animationType="slide" transparent onRequestClose={() => { setShowPreview(false); setGeneratedWorkout(null); }}>
        <SafeAreaView style={[tw`flex-1`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5' }]}>
          <View style={[tw`p-4 flex-row items-center justify-between`, { borderBottomWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <TouchableOpacity onPress={() => { setShowPreview(false); setGeneratedWorkout(null); }} style={tw`flex size-10 items-center justify-center`}>
              <MaterialIcons name="close" size={24} color={accent} />
            </TouchableOpacity>
            <Text style={[tw`text-lg font-bold flex-1 text-center`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
              Workout Preview
            </Text>
            <View style={tw`w-10`} />
          </View>

          <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-6 gap-4`}>
            {generatedWorkout && (
              <>
                <View>
                  <View style={tw`flex-row items-start justify-between mb-3`}>
                    <View style={tw`flex-1`}>
                      <Text style={[tw`text-2xl font-bold`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                        {generatedWorkout.name}
                      </Text>
                      <Text style={[tw`text-sm mt-2`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                        {generatedWorkout.focus}
                      </Text>
                    </View>
                    <View style={[tw`px-3 py-1 rounded-full`, { backgroundColor: getDifficultyColor(generatedWorkout.difficulty) + '20' }]}>
                      <Text style={[tw`text-xs font-bold`, { color: getDifficultyColor(generatedWorkout.difficulty) }]}>
                        {generatedWorkout.difficulty}
                      </Text>
                    </View>
                  </View>

                  <View style={tw`flex-row gap-6 mt-4`}>
                    <View style={tw`flex-row items-center gap-2`}>
                      <MaterialIcons name="schedule" size={18} color={accent} />
                      <Text style={[tw`text-sm font-bold`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                        {generatedWorkout.duration} min
                      </Text>
                    </View>
                    <View style={tw`flex-row items-center gap-2`}>
                      <MaterialIcons name="fitness-center" size={18} color={accent} />
                      <Text style={[tw`text-sm font-bold`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                        {generatedWorkout.exercises.length} exercises
                      </Text>
                    </View>
                  </View>
                </View>

                {generatedWorkout.notes && (
                  <View style={[tw`rounded-xl p-4`, { backgroundColor: accent + '0a', borderWidth: 1, borderColor: accent + '18' }]}>
                    <Text style={[tw`text-sm`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      {generatedWorkout.notes}
                    </Text>
                  </View>
                )}

                <View>
                  <Text style={[tw`text-lg font-bold mb-3`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                    Exercises
                  </Text>
                  <View style={tw`gap-2`}>
                    {generatedWorkout?.exercises && Array.isArray(generatedWorkout.exercises) ? generatedWorkout.exercises.map((exercise, idx) => (
                      <View key={idx} style={[tw`rounded-xl p-3`, { backgroundColor: isDark ? '#111128' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                        <View style={tw`flex-row items-start justify-between mb-2`}>
                          <Text style={[tw`font-bold text-sm flex-1`, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
                            {idx + 1}. {exercise.name}
                          </Text>
                        </View>
                        <View style={tw`flex-row gap-4 text-xs`}>
                          <Text style={[tw`text-xs`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                            {exercise.sets} sets
                          </Text>
                          <Text style={[tw`text-xs`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                            {exercise.reps} reps
                          </Text>
                          <Text style={[tw`text-xs`, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                            {exercise.rest}s rest
                          </Text>
                        </View>
                      </View>
                    )) : null}
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          <View style={[tw`p-6 gap-3`, { backgroundColor: isDark ? '#0a0a12' : '#f8f7f5', borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            {userMode === 'CoachAssisted' ? (
              <>
                <Button
                  title={`Submit to ${coachName} for Review`}
                  size="lg"
                  onPress={handleSubmitForApproval}
                  icon={<MaterialIcons name="check" size={20} color="white" style={tw`mr-2`} />}
                />
                <TouchableOpacity style={tw`items-center py-3`} onPress={() => { setShowPreview(false); setGeneratedWorkout(null); }}>
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
                <TouchableOpacity style={tw`items-center py-3`} onPress={handleGenerateWorkout}>
                  <Text style={[tw`font-bold text-base`, { color: accent }]}>Generate Another</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};
