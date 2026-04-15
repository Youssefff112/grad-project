import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../tw';
import { useTheme } from '../context/ThemeContext';
import { useExerciseManagement } from '../context/ExerciseManagementContext';
import { ExerciseCard } from '../components/ExerciseCard';

export const ExerciseLibraryScreen = ({ navigation }: any) => {
  const { isDark, accent } = useTheme();
  const { exercises, deleteExercise } = useExerciseManagement();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [filterMuscle, setFilterMuscle] = useState<string>('all');

  const bgColor = isDark ? '#0a0a12' : '#f8f7f5';
  const cardBg = isDark ? '#111128' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const inputBg = isDark ? '#1e293b' : '#f1f5f9';
  const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  // Get unique muscle groups from exercises
  const uniqueMuscleGroups = useMemo(() => {
    const muscles = new Set<string>();
    if (Array.isArray(exercises) && exercises.length > 0) {
      exercises.forEach((ex) => {
        if (ex && Array.isArray(ex.muscleGroups)) {
          ex.muscleGroups.forEach((m) => {
            if (m) muscles.add(m);
          });
        }
      });
    }
    return Array.from(muscles).sort();
  }, [exercises]);

  // Filter and search exercises
  const filteredExercises = useMemo(() => {
    let result = exercises;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((ex) => ex.name.toLowerCase().includes(query));
    }

    // Filter by difficulty
    if (filterDifficulty !== 'all') {
      result = result.filter((ex) => ex.difficulty === filterDifficulty);
    }

    // Filter by muscle group
    if (filterMuscle !== 'all') {
      result = result.filter((ex) => ex.muscleGroups.includes(filterMuscle));
    }

    return result;
  }, [exercises, searchQuery, filterDifficulty, filterMuscle]);

  const handleDeleteExercise = (exerciseId: string, exerciseName: string) => {
    Alert.alert('Delete Exercise', `Are you sure you want to delete "${exerciseName}"?`, [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteExercise(exerciseId);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete exercise');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const isEmpty = exercises.length === 0;
  const isFiltered = filteredExercises.length === 0 && !isEmpty;

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: bgColor }]}>
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
        <Text style={[tw`text-lg font-bold`, { color: textPrimary }]}>Exercise Library</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddExercise')}
          style={[tw`w-10 h-10 rounded-lg items-center justify-center`, { backgroundColor: accent + '20' }]}
        >
          <MaterialIcons name="add" size={24} color={accent} />
        </TouchableOpacity>
      </View>

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

      {/* Filter Buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mt-3 px-4`}>
        {/* Difficulty Filter */}
        <View style={tw`flex-row gap-2 mr-4`}>
          {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() => setFilterDifficulty(level)}
              style={[
                tw`px-3 py-1.5 rounded-full`,
                {
                  backgroundColor: filterDifficulty === level ? accent : inputBg,
                  borderWidth: filterDifficulty === level ? 0 : 1,
                  borderColor: inputBorder,
                },
              ]}
            >
              <Text
                style={[
                  tw`text-xs font-bold capitalize`,
                  { color: filterDifficulty === level ? '#ffffff' : textSecondary },
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Muscle Group Filter */}
        <View style={tw`flex-row gap-2`}>
          {(['all', ...uniqueMuscleGroups] as const).map((muscle) => (
            <TouchableOpacity
              key={muscle}
              onPress={() => setFilterMuscle(muscle)}
              style={[
                tw`px-3 py-1.5 rounded-full`,
                {
                  backgroundColor: filterMuscle === muscle ? accent : inputBg,
                  borderWidth: filterMuscle === muscle ? 0 : 1,
                  borderColor: inputBorder,
                },
              ]}
            >
              <Text
                style={[
                  tw`text-xs font-bold capitalize`,
                  { color: filterMuscle === muscle ? '#ffffff' : textSecondary },
                ]}
              >
                {muscle === 'all' ? 'All Muscles' : muscle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Content */}
      {isEmpty ? (
        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`flex-1 items-center justify-center px-5 gap-4`}>
          <View style={[tw`w-16 h-16 rounded-full items-center justify-center`, { backgroundColor: accent + '20' }]}>
            <MaterialIcons name="fitness-center" size={32} color={accent} />
          </View>
          <Text style={[tw`text-lg font-bold text-center`, { color: textPrimary }]}>
            No exercises yet
          </Text>
          <Text style={[tw`text-sm text-center`, { color: textSecondary }]}>
            Add your first exercise or create a custom workout to get started.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddExercise')}
            style={[
              tw`mt-4 px-6 py-3 rounded-xl items-center`,
              { backgroundColor: accent },
            ]}
          >
            <Text style={tw`text-white font-bold`}>Add Exercise</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : isFiltered ? (
        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`flex-1 items-center justify-center px-5 gap-4`}>
          <MaterialIcons name="search-off" size={40} color={textSecondary} />
          <Text style={[tw`text-base font-bold text-center`, { color: textPrimary }]}>
            No exercises found
          </Text>
          <Text style={[tw`text-sm text-center`, { color: textSecondary }]}>
            Try a different search or filter combination.
          </Text>
        </ScrollView>
      ) : (
        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-4 py-4 gap-1 pb-8`}>
          <View style={tw`flex-row items-center justify-between mb-2`}>
            <Text style={[tw`text-xs font-bold uppercase tracking-wider`, { color: textSecondary }]}>
              Exercises ({filteredExercises.length})
            </Text>
          </View>

          {filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onEdit={() => navigation.navigate('AddExercise', { exercise })}
              onDelete={() => handleDeleteExercise(exercise.id, exercise.name)}
              showActions={true}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};