import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../../tw';
import { useTheme } from '../../context/ThemeContext';
import { useExerciseManagement, CustomWorkout } from '../../context/ExerciseManagementContext';
import { ExercisePickerModal } from '../../components/ExercisePickerModal';
import { Button } from '../../components/Button';
import { calculateWorkoutDuration } from '../../services/exerciseService';

export const WorkoutBuilderScreen = ({ navigation, route }: any) => {
  const { isDark, accent } = useTheme();
  const { exercises, saveWorkout, updateWorkout } = useExerciseManagement();
  const isEditing = route?.params?.workout as CustomWorkout | undefined;

  const [workoutName, setWorkoutName] = useState(isEditing?.name || '');
  const [selectedExercises, setSelectedExercises] = useState<
    Array<{ exerciseId: string; sets: number; reps: string; restSeconds: number }>
  >(isEditing?.exercises || []);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>(
    isEditing?.difficulty || 'intermediate'
  );
  const [isLoading, setIsLoading] = useState(false);

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const inputBg = isDark ? '#1e293b' : '#f1f5f9';
  const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  const estimatedDuration = calculateWorkoutDuration(selectedExercises);

  const handleAddExercise = (exerciseId: string, sets: number, reps: string, restSeconds: number) => {
    setSelectedExercises((prev) => [
      ...prev,
      {
        exerciseId,
        sets,
        reps,
        restSeconds,
      },
    ]);
  };

  const handleRemoveExercise = (index: number) => {
    setSelectedExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateExercise = (index: number, sets: number, reps: string, restSeconds: number) => {
    setSelectedExercises((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], sets, reps, restSeconds };
      return updated;
    });
  };

  const validateForm = (): boolean => {
    if (!workoutName.trim()) {
      Alert.alert('Validation Error', 'Please enter a workout name');
      return false;
    }
    if (selectedExercises.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one exercise to the workout');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const workout: Omit<CustomWorkout, 'id' | 'createdAt'> = {
        name: workoutName.trim(),
        exercises: selectedExercises,
        totalExercises: selectedExercises.length,
        estimatedDuration,
        difficulty,
      };

      if (isEditing) {
        await updateWorkout({ ...workout, id: isEditing.id, createdAt: isEditing.createdAt });
        Alert.alert('Success', 'Workout updated!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        await saveWorkout(workout);
        Alert.alert('Success', 'Workout saved!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save workout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView behavior="padding" style={tw`flex-1`}>
        {/* Header */}
        <View
          style={[
            tw`flex-row items-center p-4 justify-between z-10`,
            { backgroundColor: bgColor, borderBottomWidth: 1, borderColor: cardBorder },
          ]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`flex size-10 items-center justify-center`}>
            <MaterialIcons name="arrow-back" size={24} color={accent} />
          </TouchableOpacity>
          <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>
            {isEditing ? 'Edit Workout' : 'Create Workout'}
          </Text>
          <View style={tw`flex size-10`} />
        </View>

        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-5 py-4 gap-4`}>
          {/* Workout Info Section */}
          <View style={[tw`rounded-2xl p-4 gap-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}>
            <Text style={[tw`text-sm font-bold uppercase tracking-wider`, { color: textSecondary }]}>
              Workout Information
            </Text>

            {/* Workout Name */}
            <View style={tw`gap-1`}>
              <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Workout Name</Text>
              <TextInput
                style={[
                  tw`rounded-lg px-4 py-3 text-base`,
                  {
                    backgroundColor: inputBg,
                    color: textPrimary,
                    borderWidth: 1,
                    borderColor: inputBorder,
                  },
                ]}
                placeholder="e.g., Upper Body Push"
                placeholderTextColor={textSecondary}
                value={workoutName}
                onChangeText={setWorkoutName}
              />
            </View>

            {/* Difficulty */}
            <View style={tw`gap-2`}>
              <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Difficulty</Text>
              <View style={tw`flex-row gap-2`}>
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setDifficulty(level)}
                    style={[
                      tw`flex-1 py-2 rounded-lg items-center capitalize`,
                      {
                        backgroundColor: difficulty === level ? accent : inputBg,
                        borderWidth: difficulty === level ? 0 : 1,
                        borderColor: inputBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        tw`text-xs font-bold capitalize`,
                        { color: difficulty === level ? '#ffffff' : textSecondary },
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Exercises Section */}
          <View style={[tw`rounded-2xl p-4 gap-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}>
            <View style={tw`flex-row items-center justify-between mb-1`}>
              <Text style={[tw`text-sm font-bold uppercase tracking-wider`, { color: textSecondary }]}>
                Exercises ({selectedExercises.length})
              </Text>
              <TouchableOpacity
                onPress={() => setShowExercisePicker(true)}
                style={[tw`px-2 py-1 rounded-lg`, { backgroundColor: accent + '20' }]}
              >
                <Text style={[tw`text-xs font-bold`, { color: accent }]}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {selectedExercises.length > 0 ? (
              <View style={tw`gap-2 mt-2`}>
                {selectedExercises.map((item, index) => {
                  const exercise = exercises.find((ex) => ex.id === item.exerciseId);
                  if (!exercise) return null;

                  return (
                    <View
                      key={index}
                      style={[
                        tw`p-3 rounded-lg gap-2`,
                        { backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder },
                      ]}
                    >
                      <View style={tw`flex-row items-center justify-between`}>
                        <Text style={[tw`text-sm font-bold flex-1`, { color: textPrimary }]}>
                          {exercise.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveExercise(index)}
                          style={[tw`w-6 h-6 rounded items-center justify-center`, { backgroundColor: '#ef444420' }]}
                        >
                          <MaterialIcons name="close" size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>

                      <Text style={[tw`text-xs`, { color: textSecondary }]}>
                        {exercise.muscleGroups.join(', ')}
                      </Text>

                      {/* Adjustable params */}
                      <View style={tw`flex-row gap-2 items-center`}>
                        <View style={tw`flex-1 gap-1`}>
                          <Text style={[tw`text-xs font-bold`, { color: textSecondary }]}>Sets</Text>
                          <View style={tw`flex-row items-center gap-1`}>
                            <TouchableOpacity
                              onPress={() => handleUpdateExercise(index, Math.max(item.sets - 1, 1), item.reps, item.restSeconds)}
                              style={[
                                tw`w-5 h-5 rounded items-center justify-center`,
                                { backgroundColor: accent + '20' },
                              ]}
                            >
                              <Text style={[tw`text-xs font-bold`, { color: accent }]}>−</Text>
                            </TouchableOpacity>
                            <Text style={[tw`text-xs font-bold`, { color: textPrimary }]}>
                              {item.sets}
                            </Text>
                            <TouchableOpacity
                              onPress={() => handleUpdateExercise(index, item.sets + 1, item.reps, item.restSeconds)}
                              style={[
                                tw`w-5 h-5 rounded items-center justify-center`,
                                { backgroundColor: accent + '20' },
                              ]}
                            >
                              <Text style={[tw`text-xs font-bold`, { color: accent }]}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={tw`flex-1 gap-1`}>
                          <Text style={[tw`text-xs font-bold`, { color: textSecondary }]}>Reps</Text>
                          <TextInput
                            style={[
                              tw`rounded px-2 py-1 text-xs text-center`,
                              {
                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                color: textPrimary,
                              },
                            ]}
                            value={item.reps}
                            onChangeText={(text) => handleUpdateExercise(index, item.sets, text, item.restSeconds)}
                          />
                        </View>

                        <View style={tw`flex-1 gap-1`}>
                          <Text style={[tw`text-xs font-bold`, { color: textSecondary }]}>Rest (s)</Text>
                          <TextInput
                            style={[
                              tw`rounded px-2 py-1 text-xs text-center`,
                              {
                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                color: textPrimary,
                              },
                            ]}
                            value={item.restSeconds.toString()}
                            onChangeText={(text) => handleUpdateExercise(index, item.sets, item.reps, parseInt(text) || 0)}
                            keyboardType="number-pad"
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={[tw`text-sm text-center py-4`, { color: textSecondary }]}>
                {'No exercises added yet. Tap "+ Add" to get started.'}
              </Text>
            )}
          </View>

          {/* Summary Section */}
          {selectedExercises.length > 0 && (
            <View style={[tw`rounded-2xl p-4 gap-2`, { backgroundColor: accent + '10', borderWidth: 1, borderColor: accent + '40' }]}>
              <Text style={[tw`text-xs font-bold uppercase mb-1`, { color: textSecondary }]}>
                Workout Summary
              </Text>

              <View style={tw`gap-1.5`}>
                <View style={tw`flex-row justify-between`}>
                  <Text style={[tw`text-sm`, { color: textPrimary }]}>Total Exercises</Text>
                  <Text style={[tw`text-sm font-bold`, { color: accent }]}>
                    {selectedExercises.length}
                  </Text>
                </View>
                <View style={tw`flex-row justify-between`}>
                  <Text style={[tw`text-sm`, { color: textPrimary }]}>Estimated Duration</Text>
                  <Text style={[tw`text-sm font-bold`, { color: accent }]}>
                    {estimatedDuration} mins
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Buttons */}
        <View style={[tw`px-5 py-4 gap-3 flex-row`, { backgroundColor: bgColor }]}>
          <Button
            title="Cancel"
            variant="secondary"
            size="md"
            onPress={() => navigation.goBack()}
            style={tw`flex-1`}
            disabled={isLoading}
          />
          <Button
            title={isEditing ? 'Update Workout' : 'Save Workout'}
            variant="primary"
            size="md"
            onPress={handleSave}
            style={tw`flex-1`}
            loading={isLoading}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Exercise Picker Modal */}
      <ExercisePickerModal
        visible={showExercisePicker}
        exercises={exercises}
        onSelect={handleAddExercise}
        onClose={() => setShowExercisePicker(false)}
      />
    </SafeAreaView>
  );
};
