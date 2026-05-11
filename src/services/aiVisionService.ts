/**
 * AI Vision Service
 * Connects the React Native app to the Python AI backend for:
 *  - Real-time camera frame analysis (live joint angles)
 *  - Recorded video analysis (score, feedback, rep count)
 *
 * Two routing strategies are supported:
 *  1. DIRECT  — app calls Python AI backend at AI_BASE_URL:8000 (low latency, recommended)
 *  2. PROXIED — app calls Node.js backend which proxies to Python AI (goes through auth)
 *
 * Set `USE_PROXY = true` to route through the Node.js backend (requires auth token).
 * Set `USE_PROXY = false` to call the Python AI directly (no auth required for CV).
 */

import axios from 'axios';
import { environment } from '../config/environment';
import { apiPost } from './api';

const USE_PROXY = false; // Set true to route CV through Node.js backend

const aiAxios = axios.create({
  baseURL: environment.AI_BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FrameAngles {
  [key: string]: number | Record<string, string>;
  targets: Record<string, string>;
}

export interface VideoAnalysisResult {
  angles_observed: Record<string, { min: number; max: number; avg: number }>;
  targets: Record<string, string>;
  summary: string;
  reps_detected: number;
  score: number;
  mistakes_detected: string[];
  improvement_notes: string;
  done_well: string[];
}

// ─── Frame Analysis ───────────────────────────────────────────────────────────

/**
 * Analyze a single camera frame.
 * Call this repeatedly from your camera loop for live angle display.
 *
 * @param imageBase64 - base64-encoded JPEG/PNG frame (with or without data: prefix)
 * @param exerciseName - e.g. 'squat', 'push_up', 'bicep_curl', 'plank'
 */
export const analyzeFrame = async (
  imageBase64: string,
  exerciseName: string = 'squat'
): Promise<FrameAngles> => {
  if (USE_PROXY) {
    const res: any = await apiPost('/vision/analyze-frame', {
      image_base64: imageBase64,
      exercise_name: exerciseName,
    });
    return res.data || {};
  }

  const res = await aiAxios.post('/analyze-frame', {
    image_base64: imageBase64,
    exercise_name: exerciseName,
  });
  return res.data;
};

// ─── Video Analysis ───────────────────────────────────────────────────────────

/**
 * Analyze a full recorded exercise video.
 * Returns score (0-100), detected mistakes, improvement notes, and rep count.
 *
 * @param videoBase64 - base64-encoded video (with or without data: prefix)
 * @param exerciseName - e.g. 'squat', 'push_up', 'bicep_curl', 'plank'
 * @param saveResult - if true, Node.js backend saves the result (only relevant when USE_PROXY=true)
 */
export const analyzeVideo = async (
  videoBase64: string,
  exerciseName: string = 'squat',
  saveResult: boolean = true
): Promise<VideoAnalysisResult> => {
  if (USE_PROXY) {
    const res: any = await apiPost('/vision/analyze-video', {
      video_base64: videoBase64,
      exercise_name: exerciseName,
      save: saveResult,
    });
    return res.data || buildEmptyResult();
  }

  const res = await aiAxios.post('/test-exercise-base64', {
    video_base64: videoBase64,
    exercise_name: exerciseName,
  });
  return res.data;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert a camera frame (from expo-camera) to base64 string.
 * Pass the uri from CameraView's takePictureAsync or captureRef.
 */
export const frameUriToBase64 = async (uri: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the data:image/...;base64, prefix
      resolve(result.split(',')[1] || result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Format the angles dict into human-readable display lines.
 */
export const formatAnglesForDisplay = (angles: FrameAngles): string[] => {
  const lines: string[] = [];
  const targets = (angles.targets as Record<string, string>) || {};

  for (const [key, value] of Object.entries(angles)) {
    if (key === 'targets') continue;
    if (typeof value === 'number') {
      lines.push(`${key.replace(/_/g, ' ')}: ${value}°`);
    }
  }

  if (Object.keys(targets).length > 0) {
    lines.push('─── Targets ───');
    for (const [k, v] of Object.entries(targets)) {
      lines.push(`${k.replace(/_/g, ' ')}: ${v}`);
    }
  }

  return lines.length > 0 ? lines : ['No pose detected'];
};

/**
 * Build an empty VideoAnalysisResult (used as fallback on error).
 */
export const buildEmptyResult = (): VideoAnalysisResult => ({
  angles_observed: {},
  targets: {},
  summary: 'Analysis unavailable',
  reps_detected: 0,
  score: 0,
  mistakes_detected: [],
  improvement_notes: '',
  done_well: [],
});

export default {
  analyzeFrame,
  analyzeVideo,
  frameUriToBase64,
  formatAnglesForDisplay,
  buildEmptyResult,
};
