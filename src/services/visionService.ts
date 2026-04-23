/**
 * Vision Service
 * Handles Computer Vision session management API calls.
 *
 * NOTE (CV Team): The actual real-time pose estimation and rep counting should
 * run on the device using TFLite / MediaPipe. This service only handles
 * persisting session data to the backend.
 *
 * Typical flow:
 *   1. Call `startVisionSession({ exerciseName })` to create a DB record.
 *   2. Run CV model on device and accumulate repsCount / accuracyScore.
 *   3. Call `updateVisionSession(id, { repsCount, accuracyScore, feedback, endedAt })`
 *      at the end of the exercise set.
 *   4. Call `progressService.addWorkoutAccuracy(...)` to save the accuracy score.
 */

import { apiGet, apiPatch, apiPost } from './api';

export interface VisionSession {
  id: number;
  userId: number;
  exerciseName: string;
  repsCount?: number;
  accuracyScore?: number;
  feedback?: string;
  rawData?: Record<string, any>;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
}

export interface StartVisionSessionRequest {
  exerciseName: string;
  startedAt?: string;
}

export interface UpdateVisionSessionRequest {
  repsCount?: number;
  accuracyScore?: number;
  feedback?: string;
  rawData?: Record<string, any>;
  endedAt?: string;
}

/**
 * Create a new computer vision session record in the DB.
 * Call this when the user starts an exercise with CV enabled.
 */
export const startVisionSession = async (
  data: StartVisionSessionRequest
): Promise<{ session: VisionSession }> => {
  const response: any = await apiPost('/vision/sessions', data);
  return { session: response.data?.session };
};

/**
 * Update a vision session with results from the CV model.
 * Call this after each set or when the exercise finishes.
 */
export const updateVisionSession = async (
  sessionId: number,
  data: UpdateVisionSessionRequest
): Promise<{ session: VisionSession }> => {
  const response: any = await apiPatch(`/vision/sessions/${sessionId}`, data);
  return { session: response.data?.session };
};

/**
 * Get CV session history for the current user.
 */
export const getVisionHistory = async (
  page = 1,
  limit = 10
): Promise<{ sessions: VisionSession[]; pagination: any }> => {
  const response: any = await apiGet(`/vision/sessions?page=${page}&limit=${limit}`);
  return {
    sessions: response.data || [],
    pagination: response.pagination
  };
};

export default {
  startVisionSession,
  updateVisionSession,
  getVisionHistory,
};
