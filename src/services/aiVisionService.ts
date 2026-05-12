/**
 * AI Vision Service
 * Talks to the FastAPI AI backend (default :8000) for pose/form analysis.
 *
 * Endpoints used:
 *   POST /analyze-frame       — single-frame angle analysis
 *
 * This module also provides:
 *  - target-string parsing (the backend sends "70-90°", "170°+", "180° straight")
 *  - a live `RepDetector` that counts reps from angle cycles
 *  - exercise type metadata (rep-based vs isometric hold)
 *  - form score computation given parsed targets
 */

import axios from 'axios';
import { environment } from '../config/environment';

const aiClient = axios.create({
  baseURL: environment.AI_BACKEND_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Types ────────────────────────────────────────────────────────────────────
export interface FrameAngles {
  [joint: string]: number;
}

export interface FrameTargetsRaw {
  [joint: string]: string;
}

export interface AnalyzeFrameResult {
  angles: FrameAngles;
  targets: FrameTargetsRaw;
  /** True when MediaPipe successfully detected a person in the frame. */
  poseDetected: boolean;
}

export interface ParsedTarget {
  min: number;
  max: number;
}

export type ExerciseType = 'reps' | 'hold';

export interface ExerciseProfile {
  /** Slug recognised by the AI backend. */
  slug: string;
  /** UI label. */
  display: string;
  /** Whether this is rep-counted or hold-timed. */
  type: ExerciseType;
  /** For rep-counted exercises: the joint angle key (e.g. 'knee_avg') and the
   * angle thresholds that define the "bottom" and "top" of one rep. */
  rep?: {
    angleKey: string;
    /** Going below `down` is the bottom of a rep. */
    down: number;
    /** Going above `up` is the top of a rep. */
    up: number;
    /** Some exercises (like curls) are inverted — "down" is the high-angle
     * extended position, "up" is the low-angle contracted position. */
    inverted?: boolean;
  };
  /** For hold exercises: the joint angle key and the range that counts as "in form". */
  hold?: {
    angleKey: string;
    minAngle: number;
    maxAngle: number;
  };
}

// ── Exercise profiles ────────────────────────────────────────────────────────
const EXERCISE_PROFILES: ExerciseProfile[] = [
  {
    slug: 'squat',
    display: 'Squat',
    type: 'reps',
    rep: { angleKey: 'knee_avg', down: 110, up: 160 },
  },
  {
    slug: 'deadlift',
    display: 'Deadlift',
    type: 'reps',
    rep: { angleKey: 'knee_avg', down: 130, up: 165 },
  },
  {
    slug: 'pushup',
    display: 'Push-Up',
    type: 'reps',
    rep: { angleKey: 'elbow_avg', down: 110, up: 160 },
  },
  {
    slug: 'bench',
    display: 'Bench Press',
    type: 'reps',
    rep: { angleKey: 'elbow_avg', down: 100, up: 160 },
  },
  {
    slug: 'bicep_curl',
    display: 'Bicep Curl',
    type: 'reps',
    rep: { angleKey: 'elbow_avg', down: 60, up: 150, inverted: true },
  },
  {
    slug: 'ohp',
    display: 'Overhead Press',
    type: 'reps',
    rep: { angleKey: 'elbow_avg', down: 90, up: 160 },
  },
  {
    slug: 'row',
    display: 'Row',
    type: 'reps',
    rep: { angleKey: 'elbow_avg', down: 80, up: 160, inverted: true },
  },
  {
    slug: 'lunge',
    display: 'Lunge',
    type: 'reps',
    rep: { angleKey: 'knee_avg', down: 110, up: 165 },
  },
  {
    slug: 'plank',
    display: 'Plank',
    type: 'hold',
    hold: { angleKey: 'body_avg', minAngle: 160, maxAngle: 195 },
  },
];

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Resolve a UI exercise name to a profile (slug, type, thresholds).
 * Falls back to "Squat" for unknown names.
 */
export const getExerciseProfile = (name: string): ExerciseProfile => {
  const n = (name || '').toLowerCase().trim();
  if (n.includes('plank')) return EXERCISE_PROFILES.find((p) => p.slug === 'plank')!;
  if (n.includes('curl') || n.includes('bicep')) return EXERCISE_PROFILES.find((p) => p.slug === 'bicep_curl')!;
  if (n.includes('overhead') || n.includes('ohp') || n.includes('shoulder press')) return EXERCISE_PROFILES.find((p) => p.slug === 'ohp')!;
  if (n.includes('bench')) return EXERCISE_PROFILES.find((p) => p.slug === 'bench')!;
  if (n.includes('push')) return EXERCISE_PROFILES.find((p) => p.slug === 'pushup')!;
  if (n.includes('deadlift')) return EXERCISE_PROFILES.find((p) => p.slug === 'deadlift')!;
  if (n.includes('row')) return EXERCISE_PROFILES.find((p) => p.slug === 'row')!;
  if (n.includes('lunge')) return EXERCISE_PROFILES.find((p) => p.slug === 'lunge')!;
  if (n.includes('squat')) return EXERCISE_PROFILES.find((p) => p.slug === 'squat')!;
  return EXERCISE_PROFILES[0];
};

/** Backwards-compat helper used by older code. */
export const normalizeExerciseName = (name: string): string => getExerciseProfile(name).slug;

/**
 * Send a single frame (base64 JPEG/PNG, with or without data: prefix) to the
 * AI backend and get back joint angles plus per-joint target strings.
 */
export const analyzeFrame = async (
  imageBase64: string,
  exerciseName: string,
): Promise<AnalyzeFrameResult> => {
  const profile = getExerciseProfile(exerciseName);
  const res = await aiClient.post('/analyze-frame', {
    image_base64: imageBase64,
    exercise_name: profile.slug,
  });
  const angles = (res.data?.angles ?? {}) as FrameAngles;
  const targets = (res.data?.targets ?? {}) as FrameTargetsRaw;
  return {
    angles,
    targets,
    poseDetected: Object.keys(angles).length > 0,
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
 * Parse a target string from the backend into a {min, max} numeric range.
 * Examples handled:
 *   "70-90°"          → { min: 70, max: 90 }
 *   "170°+"           → { min: 170, max: 195 }
 *   "180° straight"   → { min: 175, max: 195 }
 *   "30-45°"          → { min: 30, max: 45 }
 *   "165-180°"        → { min: 165, max: 195 }
 */
export const parseTarget = (raw: string): ParsedTarget | null => {
  if (!raw || typeof raw !== 'string') return null;

  // "min-max"
  const range = raw.match(/(\d+)\s*-\s*(\d+)/);
  if (range) {
    const min = parseInt(range[1], 10);
    let max = parseInt(range[2], 10);
    // Treat "165-180°" as "165 and above" — straight extension.
    if (max >= 165 && max <= 180) max = 195;
    return { min, max };
  }

  // "N+"
  const plus = raw.match(/(\d+)\s*°?\s*\+/);
  if (plus) {
    const n = parseInt(plus[1], 10);
    return { min: n, max: 195 };
  }

  // "180° straight" / "180°" → a tight band around N
  const single = raw.match(/(\d+)\s*°/);
  if (single) {
    const n = parseInt(single[1], 10);
    return { min: Math.max(0, n - 10), max: Math.min(195, n + 15) };
  }

  return null;
};

/**
 * Compute an overall form score (0–100) from joint angles and target strings.
 * Each joint inside its target range scores 100; outside drops linearly with
 * the distance from the nearest bound.
 *
 * The backend keys for *targets* don't always match the *angle* keys exactly
 * (e.g. target key "knee_bottom" but angle keys "knee_left/knee_right/knee_avg").
 * For each target, we pick the closest matching angle.
 */
export const computeFormScore = (
  angles: FrameAngles,
  targets: FrameTargetsRaw,
): number => {
  const angleKeys = Object.keys(angles);
  if (angleKeys.length === 0) return 0;

  const targetEntries = Object.entries(targets || {});
  if (targetEntries.length === 0) return 0;

  let total = 0;
  let count = 0;

  for (const [targetKey, rawTarget] of targetEntries) {
    const parsed = parseTarget(rawTarget);
    if (!parsed) continue;

    // Find an angle whose name shares the joint prefix with the target key.
    const tk = targetKey.toLowerCase();
    const joint =
      tk.startsWith('knee') ? 'knee' :
      tk.startsWith('elbow') ? 'elbow' :
      tk.startsWith('hip') ? 'hip' :
      tk.startsWith('body') ? 'body' :
      tk.startsWith('shoulder') ? 'shoulder' :
      null;
    if (!joint) continue;

    const matchKey = angleKeys.find((k) => k.startsWith(`${joint}_avg`))
                  ?? angleKeys.find((k) => k.startsWith(joint));
    if (!matchKey) continue;

    const angle = angles[matchKey];
    if (typeof angle !== 'number') continue;

    let s: number;
    if (angle >= parsed.min && angle <= parsed.max) {
      s = 100;
    } else {
      const distance = angle < parsed.min ? parsed.min - angle : angle - parsed.max;
      s = Math.max(0, 100 - distance * 2);
    }
    total += s;
    count += 1;
  }

  return count === 0 ? 0 : Math.round(total / count);
};

// ── Angle smoothing (EMA, per joint) ────────────────────────────────────────
/**
 * Exponential moving average over each joint angle. Pose Landmarker Lite has
 * ~±5–10° of noise frame-to-frame, which makes both the form score and the
 * rep detector jitter. Pass every fresh `analyze-frame` response through
 * `smooth.update()` and use the returned smoothed angles instead.
 */
export class AngleSmoother {
  private values: FrameAngles = {};
  private alpha: number;

  /** `alpha` is the new-sample weight. 0.4 = balanced; lower = smoother but laggier. */
  constructor(alpha: number = 0.45) {
    this.alpha = alpha;
  }

  update(angles: FrameAngles): FrameAngles {
    const out: FrameAngles = {};
    for (const key of Object.keys(angles)) {
      const v = angles[key];
      if (typeof v !== 'number') continue;
      const prev = this.values[key];
      out[key] = typeof prev === 'number' ? prev * (1 - this.alpha) + v * this.alpha : v;
      this.values[key] = out[key];
    }
    return out;
  }

  reset() {
    this.values = {};
  }
}

// ── Rep detector (live, frontend-side) ──────────────────────────────────────
/**
 * Cycle-based rep counter with hysteresis + cooldown to ignore MediaPipe noise.
 *
 * State machine:
 *   - The angle must clearly cross BOTH the bottom and top thresholds (with a
 *     dead-band of ~10–15°) before counting one rep.
 *   - After a rep is counted, a short cooldown prevents double-counts caused
 *     by jitter sitting on the threshold.
 *
 * For "normal" exercises (squat, push-up):
 *   bottom = angle ≤ rep.down   (deep)
 *   top    = angle ≥ rep.up     (lockout)
 *   1 rep  = bottom → top
 *
 * For "inverted" exercises (bicep curl, row):
 *   bottom (extended) = angle ≥ rep.up    (arm straight / arm out)
 *   top    (contracted) = angle ≤ rep.down (arm curled / row tucked)
 *   1 rep  = bottom → top
 */
export class RepDetector {
  private profile: ExerciseProfile;
  private phase: 'top' | 'bottom' | 'unknown' = 'unknown';
  private lastRepAt: number = 0;
  /** Min ms between two counted reps — guards against jitter double-counts. */
  private cooldownMs: number;

  constructor(profile: ExerciseProfile, cooldownMs: number = 500) {
    this.profile = profile;
    this.cooldownMs = cooldownMs;
  }

  /** Returns 1 when a new rep is detected, 0 otherwise. */
  update(angles: FrameAngles): number {
    const rep = this.profile.rep;
    if (!rep) return 0;
    const value = angles[rep.angleKey];
    if (typeof value !== 'number') return 0;

    const inverted = !!rep.inverted;
    const isBottom = inverted ? value >= rep.up : value <= rep.down;
    const isTop = inverted ? value <= rep.down : value >= rep.up;

    let counted = 0;
    const now = Date.now();

    if (isBottom) {
      // Entering bottom resets the rep cycle.
      if (this.phase !== 'bottom') this.phase = 'bottom';
    } else if (isTop) {
      if (this.phase === 'bottom' && now - this.lastRepAt > this.cooldownMs) {
        counted = 1;
        this.lastRepAt = now;
      }
      this.phase = 'top';
    }
    // Mid-range angles don't change phase — they're the "dead-band" that
    // gives us hysteresis.
    return counted;
  }

  reset() {
    this.phase = 'unknown';
    this.lastRepAt = 0;
  }
}

/**
 * Returns true when the current angle indicates the user is holding good form
 * for an isometric exercise (used by plank-style hold timers).
 */
export const isHoldingForm = (
  profile: ExerciseProfile,
  angles: FrameAngles,
): boolean => {
  const hold = profile.hold;
  if (!hold) return false;
  const value = angles[hold.angleKey];
  if (typeof value !== 'number') return false;
  return value >= hold.minAngle && value <= hold.maxAngle;
};

export default {
  analyzeFrame,
  checkAIBackendHealth,
  computeFormScore,
  normalizeExerciseName,
  getExerciseProfile,
  parseTarget,
  RepDetector,
  AngleSmoother,
  isHoldingForm,
};
