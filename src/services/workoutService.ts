/**
 * Workout Service
 * Handles all workout plan and session API calls.
 *
 * NOTE: Plan generation (generateWorkoutPlan) calls a backend route that currently
 * uses rule-based logic. Once the AI team integrates their model into
 * backend/SRC/Modules/Workout/workout.service.js (_generateWorkoutPlanForUser),
 * this frontend call will automatically use the AI-generated plans.
 */

import { apiGet, apiPost, apiDelete } from './api';

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  restTime: number;
}

export interface WorkoutDay {
  day: string;
  isRestDay: boolean;
  focus: string;
  exercises: WorkoutExercise[];
  duration: number;
  calories: number;
}

export interface WorkoutPlan {
  id: number;
  userId: number;
  goal: string;
  experienceLevel: string;
  weeklySchedule: WorkoutDay[];
  isActive: boolean;
  pendingCoachReview?: boolean;
  assignedByCoachId?: number;
  assignedAt?: string;
  weekStartDate: string;
  createdAt: string;
}

export interface WorkoutSessionMeta {
  exerciseName: string;
  planDay: string;
  planFocus?: string;
  redoNumber: number;
  isRedo: boolean;
  formScore: number;
  avgFormScore: number;
  peakFormScore: number;
  performanceScore: number;
  formAccuracy: number;
  totalReps: number;
  correctReps: number;
  incorrectReps: number;
  completedSets: number;
  targetSets: number;
  targetReps: number;
  durationSeconds: number;
  isHold?: boolean;
  holdSeconds?: number;
  topMistakes?: Array<{ msg: string; count: number }>;
  tips?: string[];
}

export interface WorkoutSession {
  id: number;
  userId: number;
  workoutPlanId?: number;
  date: string;
  startTime?: string;
  endTime?: string;
  day: string;
  exercises?: WorkoutExercise[];
  duration?: number;
  calories?: number;
  notes?: string;
  sessionMeta?: WorkoutSessionMeta | null;
  rating?: number;
  status: 'in_progress' | 'completed' | 'cancelled';
}

export interface StartSessionRequest {
  day?: string;
  workoutPlanId?: number;
}

export interface FinishSessionRequest {
  exercises?: WorkoutExercise[];
  calories?: number;
  notes?: string;
  rating?: number;
  status?: 'completed' | 'cancelled';
  endTime?: string;
}

export type WeekdayName = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface LogWorkoutRequest {
  date?: string;
  /** Must be a weekday name — the DB column is an ENUM */
  day?: WeekdayName;
  exercises?: WorkoutExercise[];
  duration?: number;
  calories?: number;
  notes?: string;
  rating?: number;
  /** AI form score (0-100) — forwarded to coach notifications */
  formScore?: number;
  /** Total reps counted by the AI rep detector */
  totalReps?: number;
  /** Links this log entry to the parent WorkoutPlan */
  workoutPlanId?: number;
  /** Full CV session snapshot for history + detail screens */
  sessionMeta?: WorkoutSessionMeta;
}

/**
 * Trigger AI/rule-based workout plan generation for the current user.
 * Requires: active subscription + complete user profile with goal & experienceLevel.
 * @param location   'home' | 'gym' — where the user will work out
 * @param equipment  list of available equipment IDs (e.g. ['dumbbells', 'resistance_bands'])
 */
export const generateWorkoutPlan = async (
  location?: 'home' | 'gym' | null,
  equipment?: string[],
): Promise<{ plan: WorkoutPlan }> => {
  // AI generation can take 60-120 s on a cold start — use a generous timeout.
  const response: any = await apiPost('/workout/generate', {
    location: location ?? undefined,
    equipment: equipment && equipment.length > 0 ? equipment : undefined,
  }, { timeout: 120000 });
  return { plan: response.data?.plan };
};

/**
 * Get the currently active workout plan for the current user.
 * Returns ``{ plan: null }`` if the user has no active plan.
 */
export const getActiveWorkoutPlan = async (): Promise<{ plan: WorkoutPlan | null }> => {
  const response: any = await apiGet('/workout/active');
  return { plan: response.data?.plan ?? null };
};

export const deleteActiveWorkoutPlan = async (): Promise<void> => {
  await apiDelete('/workout/active');
};

/**
 * Start a new live workout session.
 */
export const startWorkoutSession = async (
  data: StartSessionRequest
): Promise<{ session: WorkoutSession }> => {
  const response: any = await apiPost('/workout/start', data);
  return { session: response.data?.session };
};

/**
 * Finish an active workout session.
 */
export const finishWorkoutSession = async (
  sessionId: number,
  data: FinishSessionRequest
): Promise<{ session: WorkoutSession }> => {
  const response: any = await apiPost(`/workout/finish/${sessionId}`, data);
  return { session: response.data?.session };
};

/**
 * Log a completed workout (without using sessions).
 */
export const logWorkout = async (
  data: LogWorkoutRequest
): Promise<{ log: WorkoutSession }> => {
  const response: any = await apiPost('/workout/log', data);
  return { log: response.data?.log };
};

/**
 * Get workout history with pagination.
 */
export const getWorkoutHistory = async (
  page = 1,
  limit = 10
): Promise<{ logs: WorkoutSession[]; pagination: any }> => {
  const response: any = await apiGet(`/workout/history?page=${page}&limit=${limit}`);
  return {
    logs: response.data || [],
    pagination: response.pagination
  };
};

/**
 * Returns the weekday names (e.g. ['monday', 'wednesday']) that have at least
 * one completed WorkoutLog in the current Mon–Sun week for the signed-in user.
 */
export const getCompletedDays = async (): Promise<string[]> => {
  const response: any = await apiGet('/workout/completed-days');
  return response.data?.completedDays ?? [];
};

/**
 * Returns lowercase exercise names that have been completed (i.e. logged with
 * status = 'completed') in the current Mon–Sun week.
 * Example: ['jumping jacks', 'burpees']
 */
export const getCompletedExercises = async (): Promise<string[]> => {
  const response: any = await apiGet('/workout/completed-exercises');
  return response.data?.completedExercises ?? [];
};

export default {
  generateWorkoutPlan,
  getActiveWorkoutPlan,
  startWorkoutSession,
  finishWorkoutSession,
  logWorkout,
  getWorkoutHistory,
  getCompletedDays,
  getCompletedExercises,
};
