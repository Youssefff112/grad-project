import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
import { SafeAreaView } from 'react-native-safe-area-context';
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { Exercise } from '../context/ExerciseManagementContext';
import { ExerciseCard } from './ExerciseCard';

interface ExercisePickerModalProps {
  visible: boolean;
  exercises: Exercise[];
  onSelect: (exerciseId: string, sets: number, reps: string, restSeconds: number) => void;
  onClose: () => void;
  isDark?: boolean;
  accent?: string;
}

export const ExercisePickerModal: React.FC<ExercisePickerModalProps> = ({
  visible,
  exercises,
  onSelect,
  onClose,
  isDark: forcedDark,
  accent: forcedAccent }) => {
  const { isDark, accent } = useTheme();
  const actualDark = forcedDark !== undefined ? forcedDark : isDark;
  const actualAccent = forcedAccent || accent;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('8-10');
  const [restSeconds, setRestSeconds] = useState('60');

  const bgColor = actualDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = actualDark ? '#111128' : '#ffffff';
  const cardBorder = actualDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = actualDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = actualDark ? '#94a3b8' : '#64748b';
  const inputBg = actualDark ? '#1e293b' : '#f1f5f9';
  const inputBorder = actualDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return exercises;
    const query = searchQuery.toLowerCase();
    return exercises.filter((ex) => ex.name.toLowerCase().includes(query) || ex.muscleGroups.some((m) => m.toLowerCase().includes(query)));
  }, [exercises, searchQuery]);

  const selectedExercise = selectedExerciseId ? exercises.find((ex) => ex.id === selectedExerciseId) : null;

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExerciseId(exercise.id);
    setSets(exercise.sets.toString());
    setReps(exercise.reps);
    setRestSeconds(exercise.restSeconds.toString());
  };

  const handleConfirm = () => {
    if (!selectedExercise) return;

    const parsedSets = parseInt(sets) || 3;
    const parsedRest = parseInt(restSeconds) || 60;

    if (parsedSets < 1 || parsedSets > 10) {
      alert('Sets must be between 1 and 10');
      return;
    }

    onSelect(selectedExercise.id, parsedSets, reps.trim(), parsedRest);

    // Reset
    setSelectedExerciseId(null);
    setSets('3');
    setReps('8-10');
    setRestSeconds('60');
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]}>
        <KeyboardAvoidingView behavior="padding" style={tw`flex-1`}>
          {/* Header */}
          <View
            style={[
              tw`flex-row items-center p-4 justify-between z-10`,
              { backgroundColor: bgColor, borderBottomWidth: 1, borderColor: cardBorder },
            ]}
          >
            <TouchableOpacity onPress={onClose} style={tw`flex size-10 items-center justify-center`}>
              <MaterialIcons name="close" size={24} color={actualAccent} />
            </TouchableOpacity>
            <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>
              {selectedExercise ? 'Add to Workout' : 'Select Exercise'}
            </Text>
            <View style={tw`flex size-10`} />
          </View>

          {selectedExercise ? (
            // Customization View
            <View style={tw`flex-1 px-5 py-6 gap-4`}>
              {/* Selected Exercise Card */}
              <View
                style={[
                  tw`p-4 rounded-2xl border`,
                  { backgroundColor: cardBg, borderColor: actualAccent + '40' },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setSelectedExerciseId(null)}
                  style={tw`flex-row items-center gap-2 mb-3`}
                >
                  <MaterialIcons name="arrow-back" size={20} color={actualAccent} />
                  <Text style={[tw`text-sm font-bold`, { color: actualAccent }]}>Change Exercise</Text>
                </TouchableOpacity>

                <Text style={[tw`text-xl font-bold mb-1`, { color: textPrimary }]}>
                  {selectedExercise.name}
                </Text>
                <Text style={[tw`text-sm mb-2`, { color: textSecondary }]}>
                  {selectedExercise.muscleGroups.join(', ')}
                </Text>

                {selectedExercise.description && (
                  <Text style={[tw`text-xs mb-3`, { color: textSecondary }]}>
                    {selectedExercise.description}
                  </Text>
                )}
              </View>

              {/* Configuration */}
              <View style={tw`gap-4`}>
                {/* Sets */}
                <View style={tw`gap-2`}>
                  <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                    Sets
                  </Text>
                  <View style={tw`flex-row items-center gap-3`}>
                    <TouchableOpacity
                      onPress={() => setSets((prev) => `${Math.max(parseInt(prev || '3') - 1, 1)}`)}
                      style={[
                        tw`w-12 h-12 rounded-lg items-center justify-center`,
                        { backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder },
                      ]}
                    >
                      <MaterialIcons name="remove" size={20} color={textSecondary} />
                    </TouchableOpacity>

                    <TextInput
                      style={[
                        tw`flex-1 text-center text-lg font-bold rounded-lg py-3`,
                        { backgroundColor: inputBg, color: textPrimary, borderWidth: 1, borderColor: inputBorder },
                      ]}
                      value={sets}
                      onChangeText={setSets}
                      keyboardType="number-pad"
                      placeholder="3"
                    />

                    <TouchableOpacity
                      onPress={() => setSets((prev) => `${Math.min(parseInt(prev || '3') + 1, 10)}`)}
                      style={[
                        tw`w-12 h-12 rounded-lg items-center justify-center`,
                        { backgroundColor: actualAccent + '20' },
                      ]}
                    >
                      <MaterialIcons name="add" size={20} color={actualAccent} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Reps */}
                <View style={tw`gap-2`}>
                  <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                    Reps
                  </Text>
                  <TextInput
                    style={[
                      tw`rounded-lg px-4 py-3`,
                      { backgroundColor: inputBg, color: textPrimary, borderWidth: 1, borderColor: inputBorder },
                    ]}
                    value={reps}
                    onChangeText={setReps}
                    placeholder="8-10"
                  />
                </View>

                {/* Rest */}
                <View style={tw`gap-2`}>
                  <Text style={[tw`text-sm font-bold`, { color: textPrimary }]}>
                    Rest (seconds)
                  </Text>
                  <TextInput
                    style={[
                      tw`rounded-lg px-4 py-3`,
                      { backgroundColor: inputBg, color: textPrimary, borderWidth: 1, borderColor: inputBorder },
                    ]}
                    value={restSeconds}
                    onChangeText={setRestSeconds}
                    keyboardType="number-pad"
                    placeholder="60"
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View style={tw`flex-row gap-3 mt-auto`}>
                <TouchableOpacity
                  onPress={() => setSelectedExerciseId(null)}
                  style={[
                    tw`flex-1 py-3 rounded-lg items-center`,
                    { backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder },
                  ]}
                >
                  <Text style={[tw`font-bold`, { color: textSecondary }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirm}
                  style={[tw`flex-1 py-3 rounded-lg items-center`, { backgroundColor: actualAccent }]}
                >
                  <Text style={tw`font-bold text-white`}>Add to Workout</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Exercise Selection View
            <>
              {/* Search Bar */}
              <View style={[tw`mx-4 mt-4 px-4 py-2.5 rounded-full flex-row items-center gap-2`, { backgroundColor: inputBg, borderWidth: 1, borderColor: inputBorder }]}>
                <MaterialIcons name="search" size={20} color={textSecondary} />
                <TextInput
                  style={[tw`flex-1 text-sm`, { color: textPrimary }]}
                  placeholder="Search exercises..."
                  placeholderTextColor={textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialIcons name="close" size={18} color={textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Exercises List */}
              <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-4 gap-1 pb-4`}>
                {filteredExercises.length > 0 ? (
                  filteredExercises.map((exercise) => (
                    <TouchableOpacity key={exercise.id} onPress={() => handleSelectExercise(exercise)}>
                      <ExerciseCard exercise={exercise} showActions={false} />
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={tw`flex-1 items-center justify-center py-8 gap-2`}>
                    <MaterialIcons name="search-off" size={32} color={textSecondary} />
                    <Text style={[tw`text-sm`, { color: textSecondary }]}>No exercises found</Text>
                  </View>
                )}
              </ScrollView>
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};