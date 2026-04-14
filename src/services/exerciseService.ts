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
