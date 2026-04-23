/**
 * Workout Service
 * Handles all workout plan and session API calls.
 *
 * NOTE: Plan generation (generateWorkoutPlan) calls a backend route that currently
 * uses rule-based logic. Once the AI team integrates their model into
 * backend/SRC/Modules/Workout/workout.service.js (_generateWorkoutPlanForUser),
 * this frontend call will automatically use the AI-generated plans.
 */

import { apiGet, apiPost } from './api';

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
  assignedByCoachId?: number;
  assignedAt?: string;
  weekStartDate: string;
  createdAt: string;
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

export interface LogWorkoutRequest {
  date?: string;
  day?: string;
  exercises?: WorkoutExercise[];
  duration?: number;
  calories?: number;
  notes?: string;
  rating?: number;
}

/**
 * Trigger AI/rule-based workout plan generation for the current user.
 * Requires: active subscription + complete user profile with goal & experienceLevel.
 */
export const generateWorkoutPlan = async (): Promise<{ plan: WorkoutPlan }> => {
  const response: any = await apiPost('/workout/generate', {});
  return { plan: response.data?.plan };
};

/**
 * Get the currently active workout plan for the current user.
 */
export const getActiveWorkoutPlan = async (): Promise<{ plan: WorkoutPlan }> => {
  const response: any = await apiGet('/workout/active');
  return { plan: response.data?.plan };
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

export default {
  generateWorkoutPlan,
  getActiveWorkoutPlan,
  startWorkoutSession,
  finishWorkoutSession,
  logWorkout,
  getWorkoutHistory,
};
