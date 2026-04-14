import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
  sets: number;
  reps: string; // e.g., "8-12" or "5"
  restSeconds: number;
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

  // Load exercises from AsyncStorage on mount
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const stored = await AsyncStorage.getItem('exercises');
        if (stored) {
          setExercises(JSON.parse(stored));
        }
      } catch (error) {
        console.error('[ExerciseContext] Error loading exercises:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadExercises();
  }, []);

  // Load workouts from AsyncStorage on mount
  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const stored = await AsyncStorage.getItem('workouts');
        if (stored) {
          setWorkouts(JSON.parse(stored));
        }
      } catch (error) {
        console.error('[ExerciseContext] Error loading workouts:', error);
      }
    };
    loadWorkouts();
  }, []);

  // Save exercises to AsyncStorage whenever they change
  useEffect(() => {
    const saveExercises = async () => {
      try {
        await AsyncStorage.setItem('exercises', JSON.stringify(exercises));
      } catch (error) {
        console.error('[ExerciseContext] Error saving exercises:', error);
      }
    };
    if (!isLoading) {
      saveExercises();
    }
  }, [exercises, isLoading]);

  // Save workouts to AsyncStorage whenever they change
  useEffect(() => {
    const saveWorkouts = async () => {
      try {
        await AsyncStorage.setItem('workouts', JSON.stringify(workouts));
      } catch (error) {
        console.error('[ExerciseContext] Error saving workouts:', error);
      }
    };
    saveWorkouts();
  }, [workouts]);

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
