import React, { useState, useRef } from 'react';
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
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useExerciseManagement, Exercise } from '../context/ExerciseManagementContext';
import { Button } from '../components/Button';
import { validateExercise, MUSCLE_GROUPS, DIFFICULTY_LEVELS } from '../services/exerciseService';

export const AddExerciseScreen = ({ navigation, route }: any) => {
  const { isDark, accent } = useTheme();
  const { addExercise, updateExercise } = useExerciseManagement();
  const isEditing = route?.params?.exercise as Exercise | undefined;

  const [name, setName] = useState(isEditing?.name || '');
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>(
    isEditing?.muscleGroups || []
  );
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>(
    isEditing?.difficulty || 'beginner'
  );
  const [description, setDescription] = useState(isEditing?.description || '');
  const [sets, setSets] = useState(isEditing?.sets.toString() || '3');
  const [reps, setReps] = useState(isEditing?.reps || '8-10');
  const [restSeconds, setRestSeconds] = useState(isEditing?.restSeconds.toString() || '60');
  const [isLoading, setIsLoading] = useState(false);

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const inputBg = isDark ? '#1e293b' : '#f1f5f9';
  const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  const toggleMuscleGroup = (muscle: string) => {
    setSelectedMuscleGroups((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  };

  const validateForm = (): boolean => {
    const validation = validateExercise(name, selectedMuscleGroups, parseInt(sets) || 0, reps, parseInt(restSeconds) || 0);
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.error);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const exerciseData = {
        name: name.trim(),
        muscleGroups: selectedMuscleGroups,
        difficulty,
        description: description.trim(),
        sets: parseInt(sets) || 3,
        reps: reps.trim(),
        restSeconds: parseInt(restSeconds) || 60,
        source: 'user' as const,
      };

      if (isEditing) {
        await updateExercise({
          ...exerciseData,
          id: isEditing.id,
          createdAt: isEditing.createdAt,
        });
        Alert.alert('Success', 'Exercise updated!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        await addExercise(exerciseData);
        Alert.alert('Success', 'Exercise added!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save exercise');
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
            {isEditing ? 'Edit Exercise' : 'Add Exercise'}
          </Text>
          <View style={tw`flex size-10`} />
        </View>

        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-5 py-4 gap-4`}>
          {/* Exercise Name */}
          <View style={[tw`rounded-2xl p-4 gap-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}>
            <Text style={[tw`text-sm font-bold uppercase tracking-wider`, { color: textSecondary }]}>
              Basic Information
            </Text>

            <View style={tw`gap-1`}>
              <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Exercise Name</Text>
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
                placeholder="e.g., Barbell Bench Press"
                placeholderTextColor={textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={tw`gap-1`}>
              <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Description (Optional)</Text>
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
                placeholder="How to perform this exercise..."
                placeholderTextColor={textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Muscle Groups */}
          <View style={[tw`rounded-2xl p-4 gap-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}>
            <Text style={[tw`text-sm font-bold uppercase tracking-wider`, { color: textSecondary }]}>
              Target Muscle Groups
            </Text>

            <View style={tw`flex-row flex-wrap gap-2`}>
              {MUSCLE_GROUPS.map((muscle) => (
                <TouchableOpacity
                  key={muscle}
                  onPress={() => toggleMuscleGroup(muscle)}
                  style={[
                    tw`px-3 py-2 rounded-full`,
                    {
                      backgroundColor: selectedMuscleGroups.includes(muscle) ? accent : inputBg,
                      borderWidth: selectedMuscleGroups.includes(muscle) ? 0 : 1,
                      borderColor: inputBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      tw`text-xs font-bold`,
                      {
                        color: selectedMuscleGroups.includes(muscle) ? '#ffffff' : textSecondary,
                      },
                    ]}
                  >
                    {muscle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Difficulty & Configuration */}
          <View style={[tw`rounded-2xl p-4 gap-3`, { backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder }]}>
            <Text style={[tw`text-sm font-bold uppercase tracking-wider`, { color: textSecondary }]}>
              Difficulty & Configuration
            </Text>

            {/* Difficulty Selection */}
            <View style={tw`gap-2`}>
              <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Difficulty Level</Text>
              <View style={tw`flex-row gap-2`}>
                {DIFFICULTY_LEVELS.map((level) => (
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

            {/* Sets, Reps, Rest */}
            <View style={tw`gap-3`}>
              {/* Sets */}
              <View style={tw`gap-1`}>
                <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Sets</Text>
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
                  placeholder="3"
                  placeholderTextColor={textSecondary}
                  value={sets}
                  onChangeText={setSets}
                  keyboardType="number-pad"
                />
              </View>

              {/* Reps */}
              <View style={tw`gap-1`}>
                <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Reps</Text>
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
                  placeholder="e.g., 8-10 or 5"
                  placeholderTextColor={textSecondary}
                  value={reps}
                  onChangeText={setReps}
                />
              </View>

              {/* Rest */}
              <View style={tw`gap-1`}>
                <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>Rest Between Sets (seconds)</Text>
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
                  placeholder="60"
                  placeholderTextColor={textSecondary}
                  value={restSeconds}
                  onChangeText={setRestSeconds}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>
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
            title={isEditing ? 'Update Exercise' : 'Add Exercise'}
            variant="primary"
            size="md"
            onPress={handleSave}
            style={tw`flex-1`}
            loading={isLoading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};