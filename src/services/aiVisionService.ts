/**
 * AI Vision Service
 * Talks to the FastAPI AI backend (default :8000) for pose/form analysis.
 *
 * Endpoints used:
 *   POST /analyze-frame       — single-frame angle analysis
 *   POST /test-exercise-base64 — full video clip analysis (base64)
 */

import axios from 'axios';
import { environment } from '../config/environment';

const aiClient = axios.create({
  baseURL: environment.AI_BACKEND_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

export interface FrameAngles {
  [joint: string]: number;
}

export interface FrameTargets {
  [joint: string]: [number, number] | { min: number; max: number };
}

export interface AnalyzeFrameResult {
  angles: FrameAngles;
  targets: FrameTargets;
}

/**
 * Map UI exercise names → AI backend slugs.
 * Backend recognises: squat, deadlift, bench, pushup, plank, lunge, row, ohp
 */
export const normalizeExerciseName = (name: string): string => {
  const n = (name || '').toLowerCase().trim();
  if (n.includes('squat')) return 'squat';
  if (n.includes('deadlift')) return 'deadlift';
  if (n.includes('bench')) return 'bench';
  if (n.includes('push')) return 'pushup';
  if (n.includes('plank')) return 'plank';
  if (n.includes('lunge')) return 'lunge';
  if (n.includes('row')) return 'row';
  if (n.includes('overhead') || n.includes('press') || n.includes('ohp')) return 'ohp';
  return 'squat';
};

/**
 * Send a single frame (base64 JPEG/PNG, with or without data: prefix) to the
 * AI backend and get back joint angles plus per-joint target ranges.
 */
export const analyzeFrame = async (
  imageBase64: string,
  exerciseName: string,
): Promise<AnalyzeFrameResult> => {
  const res = await aiClient.post('/analyze-frame', {
    image_base64: imageBase64,
    exercise_name: normalizeExerciseName(exerciseName),
  });
  return {
    angles: (res.data?.angles ?? {}) as FrameAngles,
    targets: (res.data?.targets ?? {}) as FrameTargets,
  };
};

/**
 * Health check — quick GET to see if AI backend is reachable.
 */
export const checkAIBackendHealth = async (): Promise<boolean> => {
  try {
    const res = await axios.get(`${environment.AI_BACKEND_URL}/`, { timeout: 3000 });
    return res.status === 200;
  } catch {
    return false;
  }
};

/**
 * Compute an overall "form score" 0–100 from joint angles vs target ranges.
 * Each joint inside its target range scores 100; outside drops linearly with the
 * distance from the nearest bound (clamped at 0).
 */
export const computeFormScore = (
  angles: FrameAngles,
  targets: FrameTargets,
): number => {
  const entries = Object.entries(targets);
  if (entries.length === 0) return 0;

  let total = 0;
  let count = 0;

  for (const [joint, target] of entries) {
    const angle = angles[joint];
    if (typeof angle !== 'number') continue;

    let min: number;
    let max: number;
    if (Array.isArray(target)) {
      [min, max] = target;
    } else if (target && typeof target === 'object' && 'min' in target && 'max' in target) {
      min = (target as { min: number; max: number }).min;
      max = (target as { min: number; max: number }).max;
    } else {
      continue;
    }

    let score: number;
    if (angle >= min && angle <= max) {
      score = 100;
    } else {
      const distance = angle < min ? min - angle : angle - max;
      // Lose 2 points per degree out of range, floor at 0
      score = Math.max(0, 100 - distance * 2);
    }

    total += score;
    count += 1;
  }

  return count === 0 ? 0 : Math.round(total / count);
};

export default {
  analyzeFrame,
  checkAIBackendHealth,
  computeFormScore,
  normalizeExerciseName,
};
