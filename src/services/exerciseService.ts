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

export type ExerciseLocation = 'home' | 'gym';

// Comprehensive exercise database organized by muscle group and location
export const COMMON_EXERCISES: Array<{
  name: string; muscleGroups: string[]; difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string; defaultSets: number; defaultReps: string; defaultRest: number;
  location: ExerciseLocation;
}> = [
  // ── CHEST – HOME ──
  { name: 'Push-ups', muscleGroups: ['Chest', 'Triceps', 'Shoulders'], difficulty: 'beginner', description: 'Classic bodyweight chest exercise', defaultSets: 3, defaultReps: '10-15', defaultRest: 60, location: 'home' },
  { name: 'Wide Push-ups', muscleGroups: ['Chest', 'Shoulders'], difficulty: 'beginner', description: 'Wide-grip push-up for outer chest', defaultSets: 3, defaultReps: '10-12', defaultRest: 60, location: 'home' },
  { name: 'Decline Push-ups', muscleGroups: ['Chest', 'Shoulders'], difficulty: 'intermediate', description: 'Feet-elevated push-up targeting upper chest', defaultSets: 3, defaultReps: '8-12', defaultRest: 60, location: 'home' },
  { name: 'Knee Push-ups', muscleGroups: ['Chest', 'Triceps'], difficulty: 'beginner', description: 'Modified push-up for beginners', defaultSets: 3, defaultReps: '12-15', defaultRest: 45, location: 'home' },
  { name: 'Chair Dips (Chest)', muscleGroups: ['Chest', 'Triceps'], difficulty: 'beginner', description: 'Lean forward on chair dips for chest emphasis', defaultSets: 3, defaultReps: '10-15', defaultRest: 60, location: 'home' },
  { name: 'Resistance Band Chest Press', muscleGroups: ['Chest', 'Triceps'], difficulty: 'beginner', description: 'Band anchored behind, press forward', defaultSets: 3, defaultReps: '12-15', defaultRest: 45, location: 'home' },
  { name: 'Floor Press (Dumbbell)', muscleGroups: ['Chest', 'Triceps'], difficulty: 'intermediate', description: 'Dumbbell press lying on the floor', defaultSets: 3, defaultReps: '10-12', defaultRest: 60, location: 'home' },
  // ── CHEST – GYM ──
  { name: 'Barbell Bench Press', muscleGroups: ['Chest', 'Triceps', 'Shoulders'], difficulty: 'intermediate', description: 'Compound chest exercise on flat bench', defaultSets: 4, defaultReps: '6-8', defaultRest: 120, location: 'gym' },
  { name: 'Dumbbell Bench Press', muscleGroups: ['Chest', 'Triceps'], difficulty: 'intermediate', description: 'Flat bench press with dumbbells', defaultSets: 3, defaultReps: '8-10', defaultRest: 90, location: 'gym' },
  { name: 'Incline Bench Press', muscleGroups: ['Chest', 'Shoulders'], difficulty: 'intermediate', description: 'Upper chest-focused incline press', defaultSets: 3, defaultReps: '8-10', defaultRest: 90, location: 'gym' },
  { name: 'Chest Fly (Machine)', muscleGroups: ['Chest'], difficulty: 'beginner', description: 'Machine fly for chest isolation', defaultSets: 3, defaultReps: '10-12', defaultRest: 60, location: 'gym' },
  { name: 'Cable Crossover', muscleGroups: ['Chest'], difficulty: 'intermediate', description: 'Cable fly for chest squeeze', defaultSets: 3, defaultReps: '12-15', defaultRest: 60, location: 'gym' },
  { name: 'Pec Deck Machine', muscleGroups: ['Chest'], difficulty: 'beginner', description: 'Isolation machine for pectoral muscles', defaultSets: 3, defaultReps: '12-15', defaultRest: 60, location: 'gym' },
  // ── SHOULDERS – HOME ──
  { name: 'Pike Push-ups', muscleGroups: ['Shoulders', 'Triceps'], difficulty: 'beginner', description: 'Inverted-V push-up targeting shoulders', defaultSets: 3, defaultReps: '8-12', defaultRest: 60, location: 'home' },
  { name: 'Shoulder Taps', muscleGroups: ['Shoulders', 'Core'], difficulty: 'beginner', description: 'Plank-position shoulder taps for stability', defaultSets: 3, defaultReps: '20 taps', defaultRest: 45, location: 'home' },
  { name: 'Dumbbell Shoulder Press (Home)', muscleGroups: ['Shoulders', 'Triceps'], difficulty: 'beginner', description: 'Seated or standing dumbbell overhead press', defaultSets: 3, defaultReps: '10-12', defaultRest: 60, location: 'home' },
  { name: 'Lateral Raises', muscleGroups: ['Shoulders'], difficulty: 'beginner', description: 'Raise weights to sides for lateral deltoid', defaultSets: 3, defaultReps: '12-15', defaultRest: 45, location: 'home' },
  { name: 'Front Raises', muscleGroups: ['Shoulders'], difficulty: 'beginner', description: 'Raise weights in front for anterior deltoid', defaultSets: 3, defaultReps: '12-15', defaultRest: 45, location: 'home' },
  { name: 'Resistance Band Raises', muscleGroups: ['Shoulders'], difficulty: 'beginner', description: 'Lateral or front raises with resistance band', defaultSets: 3, defaultReps: '12-15', defaultRest: 45, location: 'home' },
  // ── SHOULDERS – GYM ──
  { name: 'Overhead Barbell Press', muscleGroups: ['Shoulders', 'Triceps'], difficulty: 'intermediate', description: 'Standing barbell overhead press', defaultSets: 4, defaultReps: '6-8', defaultRest: 120, location: 'gym' },
  { name: 'Dumbbell Shoulder Press', muscleGroups: ['Shoulders', 'Triceps'], difficulty: 'intermediate', description: 'Seated dumbbell overhead press', defaultSets: 3, defaultReps: '8-10', defaultRest: 90, location: 'gym' },
  { name: 'Lateral Raise Machine', muscleGroups: ['Shoulders'], difficulty: 'beginner', description: 'Machine lateral raise for shoulder isolation', defaultSets: 3, defaultReps: '12-15', defaultRest: 60, location: 'gym' },
  { name: 'Cable Lateral Raises', muscleGroups: ['Shoulders'], difficulty: 'beginner', description: 'Cable machine lateral raise', defaultSets: 3, defaultReps: '12-15', defaultRest: 45, location: 'gym' },
  { name: 'Rear Delt Fly Machine', muscleGroups: ['Shoulders', 'Back'], difficulty: 'beginner', description: 'Machine fly for rear deltoids', defaultSets: 3, defaultReps: '12-15', defaultRest: 60, location: 'gym' },
  { name: 'Face Pulls', muscleGroups: ['Shoulders', 'Back'], difficulty: 'beginner', description: 'Cable pull to face for rear delts and rotator cuff', defaultSets: 3, defaultReps: '15-20', defaultRest: 45, location: 'gym' },
  // ── BACK – HOME ──
  { name: 'Pull-ups', muscleGroups: ['Back', 'Biceps'], difficulty: 'intermediate', description: 'Overhand-grip pull-up on door or park bar', defaultSets: 3, defaultReps: '5-8', defaultRest: 90, location: 'home' },
  { name: 'Chin-ups', muscleGroups: ['Back', 'Biceps'], difficulty: 'intermediate', description: 'Underhand-grip chin-up for back and biceps', defaultSets: 3, defaultReps: '5-8', defaultRest: 90, location: 'home' },
  { name: 'Inverted Rows', muscleGroups: ['Back', 'Biceps'], difficulty: 'beginner', description: 'Row with body under a table or low bar', defaultSets: 3, defaultReps: '8-12', defaultRest: 60, location: 'home' },
  { name: 'Resistance Band Rows', muscleGroups: ['Back', 'Biceps'], difficulty: 'beginner', description: 'Seated row with resistance band', defaultSets: 3, defaultReps: '12-15', defaultRest: 45, location: 'home' },
  { name: 'Superman Hold', muscleGroups: ['Back', 'Glutes'], difficulty: 'beginner', description: 'Prone back extension hold', defaultSets: 3, defaultReps: '10-12', defaultRest: 45, location: 'home' },
  { name: 'Dumbbell Rows (Home)', muscleGroups: ['Back', 'Biceps'], difficulty: 'beginner', description: 'Single-arm row with dumbbell', defaultSets: 3, defaultReps: '10-12', defaultRest: 60, location: 'home' },
  // ── BACK – GYM ──
  { name: 'Lat Pulldown', muscleGroups: ['Back', 'Biceps'], difficulty: 'beginner', description: 'Cable pulldown for lat development', defaultSets: 3, defaultReps: '8-10', defaultRest: 90, location: 'gym' },
  { name: 'Seated Cable Row', muscleGroups: ['Back', 'Biceps'], difficulty: 'beginner', description: 'Seated row for mid-back', defaultSets: 3, defaultReps: '10-12', defaultRest: 60, location: 'gym' },
  { name: 'Barbell Row', muscleGroups: ['Back', 'Biceps'], difficulty: 'intermediate', description: 'Bent-over barbell row', defaultSets: 4, defaultReps: '6-8', defaultRest: 120, location: 'gym' },
  { name: 'T-Bar Row', muscleGroups: ['Back', 'Biceps'], difficulty: 'intermediate', description: 'T-bar row for back thickness', defaultSets: 3, defaultReps: '8-10', defaultRest: 90, location: 'gym' },
  { name: 'Deadlifts', muscleGroups: ['Back', 'Glutes', 'Hamstrings'], difficulty: 'advanced', description: 'Ultimate compound posterior chain exercise', defaultSets: 3, defaultReps: '5-6', defaultRest: 180, location: 'gym' },
  { name: 'Assisted Pull-ups', muscleGroups: ['Back', 'Biceps'], difficulty: 'beginner', description: 'Pull-up machine with counterbalance weight', defaultSets: 3, defaultReps: '8-10', defaultRest: 60, location: 'gym' },
  // ── BICEPS – HOME ──
  { name: 'Dumbbell Curls', muscleGroups: ['Biceps'], difficulty: 'beginner', description: 'Standard dumbbell bicep curl', defaultSets: 3, defaultReps: '10-12', defaultRest: 60, location: 'home' },
  { name: 'Hammer Curls', muscleGroups: ['Biceps', 'Forearms'], difficulty: 'beginner', description: 'Neutral-grip curl for bicep and brachialis', defaultSets: 3, defaultReps: '10-12', defaultRest: 60, location: 'home' },
  { name: 'Resistance Band Curls', muscleGroups: ['Biceps'], difficulty: 'beginner', description: 'Bicep curl with resistance band', defaultSets: 3, defaultReps: '12-15', defaultRest: 45, location: 'home' },
  { name: 'Chin-ups (Biceps Focus)', muscleGroups: ['Biceps', 'Back'], difficulty: 'intermediate', description: 'Underhand chin-up emphasizing biceps', defaultSets: 3, defaultReps: '5-8', defaultRest: 90, location: 'home' },
  { name: 'Concentration Curls', muscleGroups: ['Biceps'], difficulty: 'beginner', description: 'Seated single-arm dumbbell curl', defaultSets: 3, defaultReps: '10-12', defaultRest: 45, location: 'home' },
  { name: 'Towel Curls', muscleGroups: ['Biceps', 'Forearms'], difficulty: 'beginner', description: 'Curl using towel wrapped around heavy object', defaultSets: 3, defaultReps: '10-12', defaultRest: 45, location: 'home' },
  // ── BICEPS – GYM ──
  { name: 'Barbell Curls', muscleGroups: ['Biceps'], difficulty: 'beginner', description: 'Classic barbell bicep curl', defaultSets: 3, defaultReps: '8-10', defaultRest: 60, location: 'gym' },
  { name: 'EZ-Bar Curls', muscleGroups: ['Biceps'], difficulty: 'beginner', description: 'EZ-bar curl for reduced wrist strain', defaultSets: 3, defaultReps: '10-12', defaultRest: 60, location: 'gym' },
  { name: 'Preacher Curls', muscleGroups: ['Biceps'], difficulty: 'beginner', description: 'Preacher bench isolation curl', defaultSets: 3, defaultReps: '10-12', defaultRest: 60, location: 'gym' },
  { name: 'Cable Curls', muscleGroups: ['Biceps'], difficulty: 'beginner', description: 'Cable curl for constant tension', defaultSets: 3, defaultReps: '12-15', defaultRest: 45, location: 'gym' },
  { name: 'Incline Dumbbell Curls', muscleGroups: ['Biceps'], difficulty: 'intermediate', description: 'Curl on incline bench for full stretch', defaultSets: 3, defaultReps: '10-12', defaultRest: 60, location: 'gym' },
  { name: 'Machine Curls', muscleGroups: ['Biceps'], difficulty: 'beginner', description: 'Bicep curl machine', defaultSets: 3, defaultReps: '12-15', defaultRest: 60, location: 'gym' },
  // ── TRICEPS – HOME ──
  { name: 'Diamond Push-ups', muscleGroups: ['Triceps', 'Chest'], difficulty: 'intermediate', description: 'Close-hand diamond push-up', defaultSets: 3, defaultReps: '8-12', defaultRest: 60, location: 'home' },
  { name: 'Chair Dips', muscleGroups: ['Triceps', 'Chest'], difficulty: 'beginner', description: 'Dips using a chair or bench', defaultSets: 3, defaultReps: '10-15', defaultRest: 60, location: 'home' },
  { name: 'Overhead Dumbbell Extension', muscleGroups: ['Triceps'], difficulty: 'beginner', description: 'Overhead single or double dumbbell tricep extension', defaultSets: 3, defaultReps: '10-12', defaultRest: 60, location: 'home' },
  { name: 'Close-Grip Push-ups', muscleGroups: ['Triceps', 'Chest'], difficulty: 'beginner', description: 'Narrow hand-placement push-up', defaultSets: 3, defaultReps: '10-12', defaultRest: 60, location: 'home' },
  { name: 'Resistance Band Pushdowns', muscleGroups: ['Triceps'], difficulty: 'beginner', description: 'Tricep pushdown with resistance band anchored overhead', defaultSets: 3, defaultReps: '12-15', defaultRest: 45, location: 'home' },
  // ── TRICEPS – GYM ──
  { name: 'Triceps Pushdown (Cable)', muscleGroups: ['Triceps'], difficulty: 'beginner', description: 'Cable pushdown with rope or straight bar', defaultSets: 3, defaultReps: '12-15', defaultRest: 60, location: 'gym' },
  { name: 'Skull Crushers', muscleGroups: ['Triceps'], difficulty: 'intermediate', description: 'EZ-bar tricep extension lying on bench', defaultSets: 3, defaultReps: '10-12', defaultRest: 60, location: 'gym' },
  { name: 'Close-Grip Bench Press', muscleGroups: ['Triceps', 'Chest'], difficulty: 'intermediate', description: 'Narrow-grip bench press for triceps', defaultSets: 3, defaultReps: '8-10', defaultRest: 90, location: 'gym' },
  { name: 'Overhead Cable Extension', muscleGroups: ['Triceps'], difficulty: 'beginner', description: 'Cable overhead tricep extension', defaultSets: 3, defaultReps: '12-15', defaultRest: 60, location: 'gym' },
  { name: 'Triceps Dip Machine', muscleGroups: ['Triceps'], difficulty: 'beginner', description: 'Machine dip with weight stack', defaultSets: 3, defaultReps: '12-15', defaultRest: 60, location: 'gym' },
  // ── LEGS – HOME ──
  { name: 'Squats', muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'], difficulty: 'beginner', description: 'Bodyweight squat', defaultSets: 3, defaultReps: '12-15', defaultRest: 60, location: 'home' },
  { name: 'Lunges', muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'], difficulty: 'beginner', description: 'Forward or reverse lunge', defaultSets: 3, defaultReps: '10-12 each', defaultRest: 60, location: 'home' },
  { name: 'Step-ups', muscleGroups: ['Quadriceps', 'Glutes'], difficulty: 'beginner', description: 'Step up onto a chair or stairs', defaultSets: 3, defaultReps: '10-12 each', defaultRest: 60, location: 'home' },
  { name: 'Glute Bridges', muscleGroups: ['Glutes', 'Hamstrings'], difficulty: 'beginner', description: 'Lie on back and bridge hips up', defaultSets: 3, defaultReps: '15-20', defaultRest: 45, location: 'home' },
  { name: 'Wall Sits', muscleGroups: ['Quadriceps', 'Glutes'], difficulty: 'beginner', description: 'Isometric hold against wall', defaultSets: 3, defaultReps: '30-60s', defaultRest: 60, location: 'home' },
  { name: 'Bulgarian Split Squats', muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'], difficulty: 'intermediate', description: 'Rear-elevated single-leg squat', defaultSets: 3, defaultReps: '8-10 each', defaultRest: 90, location: 'home' },
  { name: 'Calf Raises (Home)', muscleGroups: ['Calves'], difficulty: 'beginner', description: 'Standing calf raise on a step or flat', defaultSets: 3, defaultReps: '15-20', defaultRest: 45, location: 'home' },
  // ── LEGS – GYM ──
  { name: 'Barbell Squats', muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'], difficulty: 'intermediate', description: 'Barbell back squat', defaultSets: 4, defaultReps: '6-8', defaultRest: 120, location: 'gym' },
  { name: 'Leg Press', muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'], difficulty: 'beginner', description: 'Machine leg press', defaultSets: 4, defaultReps: '8-10', defaultRest: 90, location: 'gym' },
  { name: 'Leg Extension', muscleGroups: ['Quadriceps'], difficulty: 'beginner', description: 'Machine quad isolation', defaultSets: 3, defaultReps: '10-12', defaultRest: 60, location: 'gym' },
  { name: 'Leg Curl', muscleGroups: ['Hamstrings'], difficulty: 'beginner', description: 'Lying or seated hamstring curl machine', defaultSets: 3, defaultReps: '10-12', defaultRest: 60, location: 'gym' },
  { name: 'Romanian Deadlift', muscleGroups: ['Hamstrings', 'Glutes', 'Back'], difficulty: 'intermediate', description: 'Stiff-leg deadlift for hamstrings', defaultSets: 3, defaultReps: '8-10', defaultRest: 90, location: 'gym' },
  { name: 'Hip Thrust', muscleGroups: ['Glutes', 'Hamstrings'], difficulty: 'beginner', description: 'Barbell hip thrust for glutes', defaultSets: 3, defaultReps: '10-12', defaultRest: 90, location: 'gym' },
  { name: 'Standing Calf Raises', muscleGroups: ['Calves'], difficulty: 'beginner', description: 'Calf raise machine or smith machine', defaultSets: 3, defaultReps: '15-20', defaultRest: 45, location: 'gym' },
  { name: 'Hack Squat Machine', muscleGroups: ['Quadriceps', 'Glutes'], difficulty: 'intermediate', description: 'Machine hack squat', defaultSets: 3, defaultReps: '8-10', defaultRest: 90, location: 'gym' },
  // ── CORE – HOME ──
  { name: 'Planks', muscleGroups: ['Core', 'Abs'], difficulty: 'beginner', description: 'Isometric core hold', defaultSets: 3, defaultReps: '30-60s', defaultRest: 60, location: 'home' },
  { name: 'Ab Crunches', muscleGroups: ['Abs', 'Core'], difficulty: 'beginner', description: 'Standard crunch', defaultSets: 3, defaultReps: '15-20', defaultRest: 45, location: 'home' },
  { name: 'Bicycle Crunches', muscleGroups: ['Abs', 'Core'], difficulty: 'beginner', description: 'Alternating elbow-to-knee crunch', defaultSets: 3, defaultReps: '20 total', defaultRest: 45, location: 'home' },
  { name: 'Russian Twists', muscleGroups: ['Abs', 'Core'], difficulty: 'beginner', description: 'Seated rotation for obliques', defaultSets: 3, defaultReps: '20 total', defaultRest: 45, location: 'home' },
  { name: 'Leg Raises', muscleGroups: ['Abs', 'Core'], difficulty: 'intermediate', description: 'Lying leg raise for lower abs', defaultSets: 3, defaultReps: '12-15', defaultRest: 60, location: 'home' },
  { name: 'Mountain Climbers', muscleGroups: ['Core', 'Full Body'], difficulty: 'beginner', description: 'Plank-position running motion', defaultSets: 3, defaultReps: '20-30', defaultRest: 45, location: 'home' },
  // ── CARDIO / FULL BODY – HOME ──
  { name: 'Burpees', muscleGroups: ['Full Body', 'Core'], difficulty: 'intermediate', description: 'Full-body explosive cardio movement', defaultSets: 3, defaultReps: '10-15', defaultRest: 60, location: 'home' },
  { name: 'Jumping Jacks', muscleGroups: ['Full Body'], difficulty: 'beginner', description: 'Classic cardio warm-up exercise', defaultSets: 3, defaultReps: '30-40', defaultRest: 30, location: 'home' },
  { name: 'Jump Rope', muscleGroups: ['Calves', 'Full Body'], difficulty: 'beginner', description: 'Skipping rope cardio', defaultSets: 3, defaultReps: '1-2 min', defaultRest: 60, location: 'home' },
  // ── CARDIO – GYM ──
  { name: 'Treadmill Run', muscleGroups: ['Full Body'], difficulty: 'beginner', description: 'Running on treadmill', defaultSets: 1, defaultReps: '20-30 min', defaultRest: 0, location: 'gym' },
  { name: 'Rowing Machine', muscleGroups: ['Back', 'Full Body'], difficulty: 'beginner', description: 'Cardio rowing machine', defaultSets: 1, defaultReps: '15-20 min', defaultRest: 0, location: 'gym' },
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
