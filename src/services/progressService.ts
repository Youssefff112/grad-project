/**
 * Progress Service
 * Handles body measurement tracking and workout accuracy logging.
 */

import { apiGet, apiPost } from './api';

export interface Measurement {
  id: number;
  userId: number;
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
  notes?: string;
  measuredAt: string;
  createdAt: string;
}

export interface MeasurementRequest {
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
  notes?: string;
  measuredAt?: string;
}

export interface WorkoutAccuracy {
  id: number;
  userId: number;
  workoutLogId?: number;
  accuracyScore: number;
  exerciseBreakdown?: Record<string, number>;
  notes?: string;
  recordedAt: string;
}

export interface WorkoutAccuracyRequest {
  workoutLogId?: number;
  accuracyScore: number;
  exerciseBreakdown?: Record<string, number>;
  notes?: string;
  recordedAt?: string;
}

/**
 * Add a new body measurement entry.
 */
export const addMeasurement = async (
  data: MeasurementRequest
): Promise<{ measurement: Measurement }> => {
  const response: any = await apiPost('/progress/measurements', data);
  return { measurement: response.data?.measurement };
};

/**
 * Get measurement history with pagination.
 */
export const getMeasurements = async (
  page = 1,
  limit = 10
): Promise<{ measurements: Measurement[]; pagination: any }> => {
  const response: any = await apiGet(`/progress/measurements?page=${page}&limit=${limit}`);
  return {
    measurements: response.data || [],
    pagination: response.pagination
  };
};

/**
 * Log workout accuracy (used after computer vision session or manual entry).
 *
 * NOTE (CV Team): Call this after a VisionSession ends to persist the accuracy
 * score from the pose estimation model alongside the workout log.
 */
export const addWorkoutAccuracy = async (
  data: WorkoutAccuracyRequest
): Promise<{ accuracyLog: WorkoutAccuracy }> => {
  const response: any = await apiPost('/progress/accuracy', data);
  return { accuracyLog: response.data?.accuracyLog };
};

/**
 * Get workout accuracy history with pagination.
 */
export const getWorkoutAccuracy = async (
  page = 1,
  limit = 10
): Promise<{ accuracyLogs: WorkoutAccuracy[]; pagination: any }> => {
  const response: any = await apiGet(`/progress/accuracy?page=${page}&limit=${limit}`);
  return {
    accuracyLogs: response.data || [],
    pagination: response.pagination
  };
};

export default {
  addMeasurement,
  getMeasurements,
  addWorkoutAccuracy,
  getWorkoutAccuracy,
};
