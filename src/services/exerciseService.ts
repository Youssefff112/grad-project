/**
 * Exercise Service
 * Contains both:
 *   1. Real API functions — fetch exercises from the backend DB (use these in screens)
 *   2. Local utility data — static COMMON_EXERCISES, MUSCLE_GROUPS (used by workout builder UI)
 */

import { apiGet, apiPost, apiPatch, apiDelete } from './api';

// ─── API Types ────────────────────────────────────────────────────────────────

export interface Exercise {
  id: number;
  name: string;
  muscleGroups: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
  videoUrl?: string;
  imageUrl?: string;
  defaultSets?: number;
  defaultReps?: string;
  defaultRest?: number;
  isActive: boolean;
  createdAt: string;
}

export interface ExerciseFilters {
  category?: 'cardio' | 'strength' | 'flexibility' | 'balance' | 'sports' | 'other';
  muscleGroups?: string | string[];   // comma-separated string or array
  equipment?: string | string[];      // comma-separated string or array
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  search?: string;
  page?: number;
  limit?: number;
}

// ─── API Functions ─────────────────────────────────────────────────────────

/**
 * Fetch all exercises from the backend database.
 * Public endpoint — no auth required.
 */
export const fetchExercises = async (
  filters?: ExerciseFilters
): Promise<{ exercises: Exercise[]; pagination: any }> => {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.muscleGroups) {
    const mg = Array.isArray(filters.muscleGroups)
      ? filters.muscleGroups.join(',')
      : filters.muscleGroups;
    params.append('muscleGroups', mg);
  }
  if (filters?.equipment) {
    const eq = Array.isArray(filters.equipment)
      ? filters.equipment.join(',')
      : filters.equipment;
    params.append('equipment', eq);
  }
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const url = params.toString() ? `/exercises?${params.toString()}` : '/exercises';
  const response: any = await apiGet(url);
  return {
    exercises: response.data || [],
    pagination: response.pagination
  };
};

/**
 * Fetch a single exercise by ID from the backend.
 */
export const fetchExerciseById = async (id: number): Promise<{ exercise: Exercise }> => {
  const response: any = await apiGet(`/exercises/${id}`);
  return { exercise: response.data?.exercise };
};

/**
 * Create a new exercise (admin only).
 */
export const createExercise = async (
  data: Partial<Exercise>
): Promise<{ exercise: Exercise }> => {
  const response: any = await apiPost('/exercises', data);
  return { exercise: response.data?.exercise };
};

/**
 * Update an exercise (admin only).
 */
export const updateExercise = async (
  id: number,
  data: Partial<Exercise>
): Promise<{ exercise: Exercise }> => {
  const response: any = await apiPatch(`/exercises/${id}`, data);
  return { exercise: response.data?.exercise };
};

/**
 * Delete an exercise (admin only — soft delete).
 */
export const deleteExercise = async (id: number): Promise<void> => {
  await apiDelete(`/exercises/${id}`);
};

// ─── Local Utility Data (existing — do not remove) ────────────────────────────
// Exercise utility functions and constants


export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Legs',
  'Quadriceps',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
  'Abs',
] as const;

export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

// Common exercises database
export const COMMON_EXERCISES = [
  {
    name: 'Barbell Bench Press',
    muscleGroups: ['Chest', 'Triceps', 'Shoulders'],
    difficulty: 'intermediate' as const,
    description: 'Compound chest exercise performed on a flat bench',
    defaultSets: 4,
    defaultReps: '6-8',
    defaultRest: 120,
  },
  {
    name: 'Incline Dumbbell Press',
    muscleGroups: ['Chest', 'Shoulders'],
    difficulty: 'intermediate' as const,
    description: 'Upper chest isolation exercise with dumbbells',
    defaultSets: 3,
    defaultReps: '8-10',
    defaultRest: 90,
  },
  {
    name: 'Cable Flyes',
    muscleGroups: ['Chest'],
    difficulty: 'beginner' as const,
    description: 'Isolation exercise for chest contraction',
    defaultSets: 3,
    defaultReps: '10-12',
    defaultRest: 60,
  },
  {
    name: 'Bent-Over Barbell Row',
    muscleGroups: ['Back', 'Biceps'],
    difficulty: 'intermediate' as const,
    description: 'Compound back exercise',
    defaultSets: 4,
    defaultReps: '6-8',
    defaultRest: 120,
  },
  {
    name: 'Lat Pulldown',
    muscleGroups: ['Back', 'Biceps'],
    difficulty: 'beginner' as const,
    description: 'Back isolation exercise for lat development',
    defaultSets: 3,
    defaultReps: '8-10',
    defaultRest: 90,
  },
  {
    name: 'Dumbbell Rows',
    muscleGroups: ['Back', 'Biceps'],
    difficulty: 'beginner' as const,
    description: 'Unilateral back exercise with dumbbells',
    defaultSets: 3,
    defaultReps: '8-10',
    defaultRest: 60,
  },
  {
    name: 'Shoulder Press',
    muscleGroups: ['Shoulders', 'Triceps'],
    difficulty: 'intermediate' as const,
    description: 'Compound shoulder exercise',
    defaultSets: 4,
    defaultReps: '6-8',
    defaultRest: 120,
  },
  {
    name: 'Lateral Raises',
    muscleGroups: ['Shoulders'],
    difficulty: 'beginner' as const,
    description: 'Shoulder isolation exercise',
    defaultSets: 3,
    defaultReps: '12-15',
    defaultRest: 60,
  },
  {
    name: 'Barbell Curls',
    muscleGroups: ['Biceps'],
    difficulty: 'beginner' as const,
    description: 'Classic bicep exercise',
    defaultSets: 3,
    defaultReps: '8-10',
    defaultRest: 60,
  },
  {
    name: 'Tricep Dips',
    muscleGroups: ['Triceps', 'Chest'],
    difficulty: 'intermediate' as const,
    description: 'Compound tricep exercise',
    defaultSets: 3,
    defaultReps: '8-12',
    defaultRest: 90,
  },
  {
    name: 'Rope Pushdowns',
    muscleGroups: ['Triceps'],
    difficulty: 'beginner' as const,
    description: 'Tricep isolation exercise',
    defaultSets: 3,
    defaultReps: '10-12',
    defaultRest: 60,
  },
  {
    name: 'Squats',
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
    difficulty: 'intermediate' as const,
    description: 'Primary leg exercise',
    defaultSets: 4,
    defaultReps: '6-8',
    defaultRest: 120,
  },
  {
    name: 'Leg Press',
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
    difficulty: 'beginner' as const,
    description: 'Lower body compound exercise on machine',
    defaultSets: 4,
    defaultReps: '8-10',
    defaultRest: 90,
  },
  {
    name: 'Leg Curls',
    muscleGroups: ['Hamstrings'],
    difficulty: 'beginner' as const,
    description: 'Hamstring isolation exercise',
    defaultSets: 3,
    defaultReps: '10-12',
    defaultRest: 60,
  },
  {
    name: 'Leg Extensions',
    muscleGroups: ['Quadriceps'],
    difficulty: 'beginner' as const,
    description: 'Quadricep isolation exercise',
    defaultSets: 3,
    defaultReps: '10-12',
    defaultRest: 60,
  },
  {
    name: 'Calf Raises',
    muscleGroups: ['Calves'],
    difficulty: 'beginner' as const,
    description: 'Calf isolation exercise',
    defaultSets: 3,
    defaultReps: '12-15',
    defaultRest: 60,
  },
  {
    name: 'Deadlifts',
    muscleGroups: ['Back', 'Glutes', 'Hamstrings'],
    difficulty: 'advanced' as const,
    description: 'Ultimate compound posterior chain exercise',
    defaultSets: 3,
    defaultReps: '5-6',
    defaultRest: 180,
  },
  {
    name: 'Pull-ups',
    muscleGroups: ['Back', 'Biceps'],
    difficulty: 'intermediate' as const,
    description: 'Upper body pulling exercise',
    defaultSets: 3,
    defaultReps: '6-10',
    defaultRest: 90,
  },
  {
    name: 'Ab Crunches',
    muscleGroups: ['Abs', 'Core'],
    difficulty: 'beginner' as const,
    description: 'Core isolation exercise',
    defaultSets: 3,
    defaultReps: '12-15',
    defaultRest: 45,
  },
  {
    name: 'Planks',
    muscleGroups: ['Core', 'Abs'],
    difficulty: 'beginner' as const,
    description: 'Isometric core exercise',
    defaultSets: 3,
    defaultReps: '30-60s',
    defaultRest: 60,
  },
];

// Calculate estimated workout duration
export const calculateWorkoutDuration = (exercises: Array<{ sets: number; reps: string; restSeconds: number }>): number => {
  // Average 45-60 seconds per set including rest
  const avgSecondsPerSet = 60;
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  return Math.ceil((totalSets * avgSecondsPerSet) / 60);
};

// Validate exercise data
export const validateExercise = (
  name: string,
  muscleGroups: string[],
  sets: number,
  reps: string,
  restSeconds: number
): { valid: boolean; error?: string } => {
  if (!name.trim()) {
    return { valid: false, error: 'Exercise name is required' };
  }
  if (muscleGroups.length === 0) {
    return { valid: false, error: 'Please select at least one muscle group' };
  }
  if (sets < 1 || sets > 10) {
    return { valid: false, error: 'Sets must be between 1 and 10' };
  }
  if (!reps.trim()) {
    return { valid: false, error: 'Reps are required' };
  }
  if (restSeconds < 0 || restSeconds > 600) {
    return { valid: false, error: 'Rest time must be between 0 and 600 seconds' };
  }
  return { valid: true };
};
