import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COMMON_EXERCISES } from '../services/exerciseService';

export interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
  sets: number;
  reps: string; // e.g., "8-12" or "5"
  restSeconds: number;
  location?: 'home' | 'gym';
  source: 'user' | 'api';
  apiId?: string;
  createdAt: number;
}

export interface CustomWorkout {
  id: string;
  name: string;
  exercises: Array<{ exerciseId: string; sets: number; reps: string; restSeconds: number }>;
  totalExercises: number;
  estimatedDuration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: number;
}

interface ExerciseManagementContextType {
  exercises: Exercise[];
  workouts: CustomWorkout[];
  isLoading: boolean;
  addExercise: (exercise: Omit<Exercise, 'id' | 'createdAt'>) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  updateExercise: (exercise: Exercise) => Promise<void>;
  saveWorkout: (workout: Omit<CustomWorkout, 'id' | 'createdAt'>) => Promise<void>;
  updateWorkout: (workout: CustomWorkout) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
}

const ExerciseManagementContext = createContext<ExerciseManagementContextType | undefined>(undefined);

export const ExerciseManagementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workouts, setWorkouts] = useState<CustomWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Bump this version whenever COMMON_EXERCISES is updated to force a re-seed
  const EXERCISES_SEED_VERSION = '2';

  const buildSeeded = (): Exercise[] =>
    COMMON_EXERCISES.map((ex, i) => ({
      ...ex,
      id: `seed_${i}`,
      sets: ex.defaultSets,
      reps: ex.defaultReps,
      restSeconds: ex.defaultRest,
      source: 'api' as const,
      createdAt: Date.now(),
    }));

  // Load all data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [exercisesData, workoutsData, seedVersion] = await Promise.all([
          AsyncStorage.getItem('exercises').catch(() => null),
          AsyncStorage.getItem('workouts').catch(() => null),
          AsyncStorage.getItem('exercises_seed_version').catch(() => null),
        ]);

        const needsReseed = seedVersion !== EXERCISES_SEED_VERSION;

        if (!needsReseed && exercisesData) {
          try {
            const parsed: Exercise[] = JSON.parse(exercisesData);
            // Keep user-added exercises (source === 'user') and merge with fresh seed
            const userExercises = parsed.filter((e) => e.source === 'user');
            const freshSeed = buildSeeded();
            setExercises([...freshSeed, ...userExercises]);
          } catch {
            setExercises(buildSeeded());
          }
        } else {
          // Re-seed: preserve user-created exercises
          let userExercises: Exercise[] = [];
          if (exercisesData) {
            try {
              const parsed: Exercise[] = JSON.parse(exercisesData);
              userExercises = parsed.filter((e) => e.source === 'user');
            } catch { /* ignore */ }
          }
          const seeded = [...buildSeeded(), ...userExercises];
          setExercises(seeded);
          await Promise.all([
            AsyncStorage.setItem('exercises', JSON.stringify(seeded)).catch(() => {}),
            AsyncStorage.setItem('exercises_seed_version', EXERCISES_SEED_VERSION).catch(() => {}),
          ]);
        }

        if (workoutsData) {
          try {
            setWorkouts(JSON.parse(workoutsData));
          } catch (parseError) {
            console.warn('[ExerciseContext] Failed to parse workouts:', parseError);
          }
        }

        console.log('[ExerciseContext] Data loaded from AsyncStorage');
      } catch (error) {
        console.warn('[ExerciseContext] Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save exercises to AsyncStorage (with debounce via dependency array)
  useEffect(() => {
    if (isLoading) return; // Don't save while loading

    const saveExercises = async () => {
      try {
        await AsyncStorage.setItem('exercises', JSON.stringify(exercises)).catch((error) => {
          console.warn('[ExerciseContext] Error saving exercises:', error);
        });
      } catch (error) {
        console.warn('[ExerciseContext] Unexpected error in saveExercises:', error);
      }
    };

    saveExercises();
  }, [exercises, isLoading]);

  // Save workouts to AsyncStorage (with debounce via dependency array)
  useEffect(() => {
    if (isLoading) return; // Don't save while loading

    const saveWorkouts = async () => {
      try {
        await AsyncStorage.setItem('workouts', JSON.stringify(workouts)).catch((error) => {
          console.warn('[ExerciseContext] Error saving workouts:', error);
        });
      } catch (error) {
        console.warn('[ExerciseContext] Unexpected error in saveWorkouts:', error);
      }
    };

    saveWorkouts();
  }, [workouts, isLoading]);

  const addExercise = useCallback(async (exercise: Omit<Exercise, 'id' | 'createdAt'>) => {
    const id = Date.now().toString();
    const newExercise: Exercise = {
      ...exercise,
      id,
      createdAt: Date.now(),
    };
    setExercises((prev) => [...prev, newExercise]);
  }, []);

  const deleteExercise = useCallback(async (id: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  }, []);

  const updateExercise = useCallback(async (exercise: Exercise) => {
    setExercises((prev) => prev.map((ex) => (ex.id === exercise.id ? exercise : ex)));
  }, []);

  const saveWorkout = useCallback(async (workout: Omit<CustomWorkout, 'id' | 'createdAt'>) => {
    const id = Date.now().toString();
    const newWorkout: CustomWorkout = {
      ...workout,
      id,
      createdAt: Date.now(),
    };
    setWorkouts((prev) => [...prev, newWorkout]);
  }, []);

  const updateWorkout = useCallback(async (workout: CustomWorkout) => {
    setWorkouts((prev) => prev.map((w) => (w.id === workout.id ? workout : w)));
  }, []);

  const deleteWorkout = useCallback(async (id: string) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return (
    <ExerciseManagementContext.Provider
      value={{
        exercises,
        workouts,
        isLoading,
        addExercise,
        deleteExercise,
        updateExercise,
        saveWorkout,
        updateWorkout,
        deleteWorkout,
      }}
    >
      {children}
    </ExerciseManagementContext.Provider>
  );
};

export const useExerciseManagement = () => {
  const context = useContext(ExerciseManagementContext);
  if (!context) {
    throw new Error('useExerciseManagement must be used within ExerciseManagementProvider');
  }
  return context;
};
