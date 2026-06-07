/**
 * AI Vision Service
 * Talks to the FastAPI AI backend (default :8000) for pose/form analysis.
 *
 * Endpoints used:
 *   POST /analyze-frame   — single-frame angle analysis + live feedback
 *
 * Provides:
 *  - Comprehensive exercise profile catalogue (90+ exercises)
 *  - Live feedback types
 *  - AngleSmoother (EMA per joint)
 *  - RepDetector (state machine, hysteresis + cooldown)
 *  - Session data accumulator for workout summary
 */

import { apiGet, apiPost } from './api';
import { unwrapApiData } from '../utils/apiResponse';

// ── Types ────────────────────────────────────────────────────────────────────

export interface FrameAngles {
  [joint: string]: number;
}

export interface FrameTargetsRaw {
  [joint: string]: string;
}

export interface LiveFeedback {
  /** Short human-readable correction messages — show in overlay. */
  messages: string[];
  /** Things the user is doing well. */
  doneWell: string[];
  /** Issues to fix (more detailed). */
  toFix: string[];
  /** Overall form score 0-100 from backend. */
  score: number;
}

export interface AnalyzeFrameResult {
  angles: FrameAngles;
  targets: FrameTargetsRaw;
  poseDetected: boolean;
  feedback: LiveFeedback;
}

export interface ParsedTarget {
  min: number;
  max: number;
}

export type ExerciseType = 'reps' | 'hold';

export interface ExerciseProfile {
  /** Slug recognised by the AI backend scorer registry. */
  slug: string;
  /** UI display name. */
  display: string;
  /** Whether this is rep-counted or isometric hold. */
  type: ExerciseType;
  /** For rep exercises: angle key + threshold band. */
  rep?: {
    angleKey: string;
    /** Bottom of range (deepest position). */
    down: number;
    /** Top of range (lockout / fully contracted). */
    up: number;
    /** Inverted exercises (curls, rows): "down" is extended, "up" is contracted. */
    inverted?: boolean;
  };
  /** For isometric holds. */
  hold?: {
    angleKey: string;
    minAngle: number;
    maxAngle: number;
  };
}

// ── Session data for workout summary ─────────────────────────────────────────

export interface RepRecord {
  repNumber: number;
  formScore: number;
  mistakes: string[];
}

export interface SessionSummaryData {
  exerciseName: string;
  targetReps: number;
  targetSets: number;
  totalReps: number;
  completedSets: number;
  durationSeconds: number;
  repRecords: RepRecord[];
  allFeedback: string[];
  peakFormScore: number;
  avgFormScore: number;
}

export function buildSessionSummary(data: SessionSummaryData) {
  const correctReps = data.repRecords.filter((r) => r.formScore >= 70).length;
  const incorrectReps = data.totalReps - correctReps;
  const formAccuracy = data.totalReps > 0 ? Math.round((correctReps / data.totalReps) * 100) : 0;

  // Frequency-count mistakes
  const mistakeCount: Record<string, number> = {};
  for (const r of data.repRecords) {
    for (const m of r.mistakes) {
      const key = m.replace(/\d+°/g, 'X°').slice(0, 60);
      mistakeCount[key] = (mistakeCount[key] ?? 0) + 1;
    }
  }
  const topMistakes = Object.entries(mistakeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([msg, count]) => ({ msg, count }));

  // Performance score (rep completion + form)
  const repCompletion = data.targetReps > 0
    ? Math.min(100, Math.round((data.totalReps / (data.targetReps * data.targetSets)) * 100))
    : 100;
  const performanceScore = Math.round(formAccuracy * 0.6 + repCompletion * 0.4);

  // Personalized tips based on top mistakes
  const tips = generateTips(topMistakes.map((m) => m.msg), data.exerciseName);

  return {
    totalReps: data.totalReps,
    correctReps,
    incorrectReps,
    formAccuracy,
    durationSeconds: data.durationSeconds,
    completedSets: data.completedSets,
    peakFormScore: data.peakFormScore,
    avgFormScore: data.avgFormScore,
    topMistakes,
    performanceScore,
    tips,
    exerciseName: data.exerciseName,
  };
}

function generateTips(mistakes: string[], exerciseName: string): string[] {
  const tips: string[] = [];
  const n = exerciseName.toLowerCase();

  if (mistakes.some((m) => m.includes('knee') && m.includes('cav')))
    tips.push('Strengthen your hip abductors — clamshells and resistance band walks help keep knees from caving.');
  if (mistakes.some((m) => m.includes('back') || m.includes('round')))
    tips.push('Engage your core before every rep. A neutral spine protects your lower back under load.');
  if (mistakes.some((m) => m.includes('depth') || m.includes('deeper') || m.includes('lower')))
    tips.push('Work on ankle and hip mobility with daily stretches to achieve full depth comfortably.');
  if (mistakes.some((m) => m.includes('uneven') || m.includes('asymmetr')))
    tips.push('Do single-limb accessory work (single-leg press, single-arm curls) to correct imbalances.');
  if (mistakes.some((m) => m.includes('elbow') && m.includes('flar')))
    tips.push('Keep elbows tucked at ~45° to your body. Widen your grip slightly if flaring persists.');
  if (mistakes.some((m) => m.includes('shoulder') && m.includes('shrug')))
    tips.push('Consciously depress and retract your shoulder blades before each rep begins.');
  if (mistakes.some((m) => m.includes('lean') || m.includes('torso')))
    tips.push('Brace your core throughout the movement. A stronger anterior core fixes forward lean.');
  if (mistakes.some((m) => m.includes('range') || m.includes('rom')))
    tips.push('Use a lighter weight that lets you complete the full range of motion on every rep.');

  if (tips.length === 0) {
    if (n.includes('squat') || n.includes('lunge'))
      tips.push('Focus on controlled descent — 2-3 sec down, explosive drive up.');
    else if (n.includes('push') || n.includes('bench'))
      tips.push('Retract scapulae before lowering. This protects shoulders and activates more chest.');
    else if (n.includes('curl') || n.includes('bicep'))
      tips.push('Avoid swinging hips. Slow the eccentric (lowering) phase to 3 seconds for max growth.');
    else if (n.includes('row') || n.includes('pull'))
      tips.push('Lead with your elbows, not your hands. Think "elbow to hip" for maximum lat activation.');
    else
      tips.push('Prioritise controlled tempo — slow eccentrics build strength and reduce injury risk.');
  }

  tips.push('Record a video of your sets periodically to spot form drift that AI may miss.');
  return tips.slice(0, 5);
}

// ── Exercise profiles catalogue ───────────────────────────────────────────────
// Covers all exercises mentioned in the feature request.
// slug must match the keyword patterns in the Python scorer registry.

const EXERCISE_PROFILES: ExerciseProfile[] = [
  // ── Chest at Home ─────────────────────────────────────────────────────────
  { slug: 'push up', display: 'Push-Up', type: 'reps', rep: { angleKey: 'elbow_avg', down: 100, up: 155 } },
  { slug: 'wide push up', display: 'Wide Push-Up', type: 'reps', rep: { angleKey: 'elbow_avg', down: 105, up: 155 } },
  { slug: 'decline push up', display: 'Decline Push-Up', type: 'reps', rep: { angleKey: 'elbow_avg', down: 95, up: 153 } },
  { slug: 'knee push up', display: 'Knee Push-Up', type: 'reps', rep: { angleKey: 'elbow_avg', down: 105, up: 155 } },
  { slug: 'diamond push up', display: 'Diamond Push-Up', type: 'reps', rep: { angleKey: 'elbow_avg', down: 95, up: 155 } },
  { slug: 'chair dip', display: 'Chair Dip', type: 'reps', rep: { angleKey: 'elbow_avg', down: 100, up: 158 } },
  { slug: 'floor press', display: 'Floor Press', type: 'reps', rep: { angleKey: 'elbow_avg', down: 100, up: 153 } },
  // ── Chest at Gym ──────────────────────────────────────────────────────────
  { slug: 'bench press', display: 'Bench Press', type: 'reps', rep: { angleKey: 'elbow_avg', down: 100, up: 155 } },
  { slug: 'incline bench press', display: 'Incline Bench Press', type: 'reps', rep: { angleKey: 'elbow_avg', down: 100, up: 155 } },
  { slug: 'chest fly', display: 'Chest Fly', type: 'reps', rep: { angleKey: 'elbow_avg', down: 115, up: 158 } },
  { slug: 'cable crossover', display: 'Cable Crossover', type: 'reps', rep: { angleKey: 'elbow_avg', down: 120, up: 160 } },
  { slug: 'pec deck', display: 'Pec Deck', type: 'reps', rep: { angleKey: 'elbow_avg', down: 100, up: 155 } },
  // ── Shoulders at Home ─────────────────────────────────────────────────────
  { slug: 'pike push up', display: 'Pike Push-Up', type: 'reps', rep: { angleKey: 'elbow_avg', down: 80, up: 158 } },
  { slug: 'shoulder tap', display: 'Shoulder Tap', type: 'reps', rep: { angleKey: 'elbow_avg', down: 155, up: 175 } },
  { slug: 'dumbbell shoulder press', display: 'Dumbbell Shoulder Press', type: 'reps', rep: { angleKey: 'elbow_avg', down: 80, up: 162 } },
  { slug: 'lateral raise', display: 'Lateral Raise', type: 'reps', rep: { angleKey: 'shoulder_avg', down: 15, up: 80 } },
  { slug: 'front raise', display: 'Front Raise', type: 'reps', rep: { angleKey: 'shoulder_avg', down: 15, up: 85 } },
  // ── Shoulders at Gym ──────────────────────────────────────────────────────
  { slug: 'overhead press', display: 'Overhead Press', type: 'reps', rep: { angleKey: 'elbow_avg', down: 78, up: 162 } },
  { slug: 'cable lateral raise', display: 'Cable Lateral Raise', type: 'reps', rep: { angleKey: 'shoulder_avg', down: 15, up: 80 } },
  { slug: 'rear delt fly', display: 'Rear Delt Fly', type: 'reps', rep: { angleKey: 'shoulder_avg', down: 20, up: 85 } },
  { slug: 'face pull', display: 'Face Pull', type: 'reps', rep: { angleKey: 'elbow_avg', down: 65, up: 155 } },
  // ── Back at Home ──────────────────────────────────────────────────────────
  { slug: 'pull up', display: 'Pull-Up', type: 'reps', rep: { angleKey: 'elbow_avg', down: 45, up: 160, inverted: true } },
  { slug: 'chin up', display: 'Chin-Up', type: 'reps', rep: { angleKey: 'elbow_avg', down: 45, up: 158, inverted: true } },
  { slug: 'inverted row', display: 'Inverted Row', type: 'reps', rep: { angleKey: 'elbow_avg', down: 70, up: 158, inverted: true } },
  { slug: 'band row', display: 'Resistance Band Row', type: 'reps', rep: { angleKey: 'elbow_avg', down: 70, up: 160, inverted: true } },
  { slug: 'superman', display: 'Superman Hold', type: 'hold', hold: { angleKey: 'hip_avg', minAngle: 155, maxAngle: 195 } },
  { slug: 'dumbbell row', display: 'Dumbbell Row', type: 'reps', rep: { angleKey: 'elbow_avg', down: 70, up: 160, inverted: true } },
  // ── Back at Gym ───────────────────────────────────────────────────────────
  { slug: 'lat pulldown', display: 'Lat Pulldown', type: 'reps', rep: { angleKey: 'elbow_avg', down: 55, up: 160, inverted: true } },
  { slug: 'seated cable row', display: 'Seated Cable Row', type: 'reps', rep: { angleKey: 'elbow_avg', down: 70, up: 158, inverted: true } },
  { slug: 'barbell row', display: 'Barbell Row', type: 'reps', rep: { angleKey: 'elbow_avg', down: 70, up: 160, inverted: true } },
  { slug: 't-bar row', display: 'T-Bar Row', type: 'reps', rep: { angleKey: 'elbow_avg', down: 70, up: 160, inverted: true } },
  { slug: 'deadlift', display: 'Deadlift', type: 'reps', rep: { angleKey: 'hip_avg', down: 80, up: 165 } },
  { slug: 'assisted pull up', display: 'Assisted Pull-Up', type: 'reps', rep: { angleKey: 'elbow_avg', down: 50, up: 158, inverted: true } },
  // ── Biceps at Home ────────────────────────────────────────────────────────
  { slug: 'dumbbell curl', display: 'Dumbbell Curl', type: 'reps', rep: { angleKey: 'elbow_avg', down: 40, up: 158, inverted: true } },
  { slug: 'hammer curl', display: 'Hammer Curl', type: 'reps', rep: { angleKey: 'elbow_avg', down: 40, up: 158, inverted: true } },
  { slug: 'band curl', display: 'Resistance Band Curl', type: 'reps', rep: { angleKey: 'elbow_avg', down: 40, up: 158, inverted: true } },
  { slug: 'concentration curl', display: 'Concentration Curl', type: 'reps', rep: { angleKey: 'elbow_avg', down: 35, up: 155, inverted: true } },
  // ── Biceps at Gym ─────────────────────────────────────────────────────────
  { slug: 'barbell curl', display: 'Barbell Curl', type: 'reps', rep: { angleKey: 'elbow_avg', down: 40, up: 162, inverted: true } },
  { slug: 'ez bar curl', display: 'EZ-Bar Curl', type: 'reps', rep: { angleKey: 'elbow_avg', down: 40, up: 160, inverted: true } },
  { slug: 'preacher curl', display: 'Preacher Curl', type: 'reps', rep: { angleKey: 'elbow_avg', down: 35, up: 155, inverted: true } },
  { slug: 'cable curl', display: 'Cable Curl', type: 'reps', rep: { angleKey: 'elbow_avg', down: 40, up: 158, inverted: true } },
  { slug: 'incline dumbbell curl', display: 'Incline Dumbbell Curl', type: 'reps', rep: { angleKey: 'elbow_avg', down: 38, up: 155, inverted: true } },
  { slug: 'machine curl', display: 'Machine Curl', type: 'reps', rep: { angleKey: 'elbow_avg', down: 38, up: 158, inverted: true } },
  // ── Triceps at Home ───────────────────────────────────────────────────────
  { slug: 'bench dip', display: 'Bench/Chair Dip', type: 'reps', rep: { angleKey: 'elbow_avg', down: 85, up: 162 } },
  { slug: 'overhead dumbbell extension', display: 'Overhead Dumbbell Extension', type: 'reps', rep: { angleKey: 'elbow_avg', down: 70, up: 160 } },
  { slug: 'close grip push up', display: 'Close-Grip Push-Up', type: 'reps', rep: { angleKey: 'elbow_avg', down: 80, up: 158 } },
  // ── Triceps at Gym ────────────────────────────────────────────────────────
  { slug: 'tricep pushdown', display: 'Triceps Pushdown', type: 'reps', rep: { angleKey: 'elbow_avg', down: 20, up: 95 } },
  { slug: 'skull crusher', display: 'Skull Crusher', type: 'reps', rep: { angleKey: 'elbow_avg', down: 70, up: 162 } },
  { slug: 'close grip bench press', display: 'Close-Grip Bench Press', type: 'reps', rep: { angleKey: 'elbow_avg', down: 80, up: 158 } },
  { slug: 'overhead cable extension', display: 'Overhead Cable Extension', type: 'reps', rep: { angleKey: 'elbow_avg', down: 70, up: 158 } },
  { slug: 'tricep dip machine', display: 'Tricep Dip Machine', type: 'reps', rep: { angleKey: 'elbow_avg', down: 82, up: 160 } },
  // ── Legs at Home ──────────────────────────────────────────────────────────
  { slug: 'squat', display: 'Squat', type: 'reps', rep: { angleKey: 'knee_avg', down: 125, up: 158 } },
  { slug: 'lunge', display: 'Lunge', type: 'reps', rep: { angleKey: 'knee_avg', down: 120, up: 158 } },
  { slug: 'step up', display: 'Step-Up', type: 'reps', rep: { angleKey: 'knee_avg', down: 125, up: 158 } },
  { slug: 'glute bridge', display: 'Glute Bridge', type: 'reps', rep: { angleKey: 'hip_avg', down: 110, up: 158 } },
  { slug: 'wall sit', display: 'Wall Sit', type: 'hold', hold: { angleKey: 'knee_avg', minAngle: 80, maxAngle: 110 } },
  { slug: 'bulgarian split squat', display: 'Bulgarian Split Squat', type: 'reps', rep: { angleKey: 'knee_avg', down: 118, up: 158 } },
  { slug: 'calf raise', display: 'Calf Raise', type: 'reps', rep: { angleKey: 'knee_avg', down: 158, up: 175 } },
  // ── Legs at Gym ───────────────────────────────────────────────────────────
  { slug: 'barbell squat', display: 'Barbell Squat', type: 'reps', rep: { angleKey: 'knee_avg', down: 115, up: 158 } },
  { slug: 'leg press', display: 'Leg Press', type: 'reps', rep: { angleKey: 'knee_avg', down: 100, up: 158 } },
  { slug: 'leg extension', display: 'Leg Extension', type: 'reps', rep: { angleKey: 'knee_avg', down: 100, up: 158 } },
  { slug: 'leg curl', display: 'Leg Curl', type: 'reps', rep: { angleKey: 'knee_avg', down: 65, up: 152, inverted: true } },
  { slug: 'romanian deadlift', display: 'Romanian Deadlift', type: 'reps', rep: { angleKey: 'hip_avg', down: 75, up: 162 } },
  { slug: 'hip thrust', display: 'Hip Thrust', type: 'reps', rep: { angleKey: 'hip_avg', down: 100, up: 165 } },
  { slug: 'standing calf raise', display: 'Standing Calf Raise', type: 'reps', rep: { angleKey: 'knee_avg', down: 160, up: 175 } },
  { slug: 'hack squat', display: 'Hack Squat', type: 'reps', rep: { angleKey: 'knee_avg', down: 88, up: 160 } },
  // ── Core ──────────────────────────────────────────────────────────────────
  { slug: 'plank', display: 'Plank', type: 'hold', hold: { angleKey: 'body_avg', minAngle: 160, maxAngle: 195 } },
  { slug: 'side plank', display: 'Side Plank', type: 'hold', hold: { angleKey: 'body_avg', minAngle: 158, maxAngle: 195 } },
  // ── Cardio / Full-body ────────────────────────────────────────────────────
  // down = angle at the "contracted/low" phase; up = angle at the "extended/high" phase
  { slug: 'burpee', display: 'Burpee', type: 'reps', rep: { angleKey: 'knee_avg', down: 110, up: 155 } },
  // Jumping jacks: shoulder_avg = angle hip→shoulder→wrist. Arms at sides ≈20-40°, arms overhead ≈150-180°
  { slug: 'jumping jack', display: 'Jumping Jack', type: 'reps', rep: { angleKey: 'shoulder_avg', down: 45, up: 110 } },
  { slug: 'mountain climber', display: 'Mountain Climber', type: 'reps', rep: { angleKey: 'knee_avg', down: 90, up: 148 } },
  { slug: 'high knee', display: 'High Knees', type: 'reps', rep: { angleKey: 'knee_avg', down: 90, up: 148 } },
  { slug: 'box jump', display: 'Box Jump', type: 'reps', rep: { angleKey: 'knee_avg', down: 110, up: 158 } },
  { slug: 'jump squat', display: 'Jump Squat', type: 'reps', rep: { angleKey: 'knee_avg', down: 118, up: 158 } },
  { slug: 'skater', display: 'Skaters', type: 'reps', rep: { angleKey: 'knee_avg', down: 120, up: 158 } },
  { slug: 'bear crawl', display: 'Bear Crawl', type: 'reps', rep: { angleKey: 'elbow_avg', down: 100, up: 155 } },
];

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Resolve any UI exercise name to a profile.
 * Uses keyword matching so partial / natural-language names work.
 * Falls back to Squat profile if nothing matches.
 */
export const getExerciseProfile = (name: string): ExerciseProfile => {
  const n = (name ?? '').toLowerCase().trim().replace(/-/g, ' ');

  // Exact-slug match first
  const exactMatch = EXERCISE_PROFILES.find((p) => p.slug === n);
  if (exactMatch) return exactMatch;

  // Keyword matching (order matters — more specific first)
  if (n.includes('bulgarian')) return find('bulgarian split squat');
  if (n.includes('romanian') || n.includes('rdl')) return find('romanian deadlift');
  if (n.includes('glute bridge') || (n.includes('glute') && !n.includes('thrust'))) return find('glute bridge');
  if (n.includes('hip thrust')) return find('hip thrust');
  if (n.includes('wall sit')) return find('wall sit');
  if (n.includes('calf')) return find('calf raise');
  if (n.includes('hack squat')) return find('hack squat');
  if (n.includes('leg press')) return find('leg press');
  if (n.includes('leg extension')) return find('leg extension');
  if (n.includes('leg curl')) return find('leg curl');
  if (n.includes('squat') || n.includes('goblet')) return find('squat');
  if (n.includes('lunge') || n.includes('split squat') || n.includes('step up')) return find('lunge');
  if (n.includes('deadlift')) return find('deadlift');

  if (n.includes('pike push')) return find('pike push up');
  if (n.includes('diamond push')) return find('diamond push up');
  if (n.includes('decline push')) return find('decline push up');
  if (n.includes('wide push')) return find('wide push up');
  if (n.includes('knee push')) return find('knee push up');
  if (n.includes('close grip push')) return find('close grip push up');
  if (n.includes('push')) return find('push up');

  if (n.includes('pec deck')) return find('pec deck');
  if (n.includes('cable crossover') || n.includes('crossover')) return find('cable crossover');
  if (n.includes('chest fly') || (n.includes('fly') && n.includes('chest'))) return find('chest fly');
  if (n.includes('incline') && n.includes('bench')) return find('incline bench press');
  if (n.includes('bench')) return find('bench press');
  if (n.includes('floor press')) return find('floor press');
  if (n.includes('chair dip') || (n.includes('chair') && n.includes('dip'))) return find('chair dip');

  if (n.includes('face pull')) return find('face pull');
  if (n.includes('rear delt')) return find('rear delt fly');
  if (n.includes('cable lateral')) return find('cable lateral raise');
  if (n.includes('lateral raise') || n.includes('side raise')) return find('lateral raise');
  if (n.includes('front raise')) return find('front raise');
  if (n.includes('shoulder tap')) return find('shoulder tap');
  if (n.includes('overhead press') || n.includes('military press') || n.includes('ohp')) return find('overhead press');
  if (n.includes('shoulder press') || (n.includes('shoulder') && n.includes('press'))) return find('dumbbell shoulder press');
  if (n.includes('arnold')) return find('dumbbell shoulder press');

  if (n.includes('assisted pull')) return find('assisted pull up');
  if (n.includes('chin up') || n.includes('chinup')) return find('chin up');
  if (n.includes('pull up') || n.includes('pullup')) return find('pull up');
  if (n.includes('lat pulldown') || n.includes('pulldown')) return find('lat pulldown');
  if (n.includes('inverted row')) return find('inverted row');
  if (n.includes('t-bar') || n.includes('tbar')) return find('t-bar row');
  if (n.includes('seated cable row') || n.includes('seated row')) return find('seated cable row');
  if (n.includes('barbell row')) return find('barbell row');
  if (n.includes('dumbbell row') || n.includes('one arm row')) return find('dumbbell row');
  if (n.includes('band row') || n.includes('resistance band row')) return find('band row');
  if (n.includes('superman')) return find('superman');
  if (n.includes('row')) return find('barbell row');

  if (n.includes('preacher curl')) return find('preacher curl');
  if (n.includes('incline') && n.includes('curl')) return find('incline dumbbell curl');
  if (n.includes('ez bar curl') || n.includes('ez-bar')) return find('ez bar curl');
  if (n.includes('cable curl')) return find('cable curl');
  if (n.includes('concentration curl')) return find('concentration curl');
  if (n.includes('machine curl')) return find('machine curl');
  if (n.includes('hammer curl')) return find('hammer curl');
  if (n.includes('barbell curl')) return find('barbell curl');
  if (n.includes('band curl') || (n.includes('resistance') && n.includes('curl'))) return find('band curl');
  if (n.includes('curl') || n.includes('bicep')) return find('dumbbell curl');

  if (n.includes('skull crusher') || n.includes('skull')) return find('skull crusher');
  if (n.includes('close grip bench') || n.includes('close grip press')) return find('close grip bench press');
  if (n.includes('overhead cable ext') || n.includes('overhead ext')) return find('overhead cable extension');
  if (n.includes('overhead') && n.includes('extension')) return find('overhead dumbbell extension');
  if (n.includes('tricep dip machine') || n.includes('dip machine')) return find('tricep dip machine');
  if (n.includes('pushdown') || n.includes('tricep pushdown')) return find('tricep pushdown');
  if (n.includes('dip')) return find('bench dip');
  if (n.includes('tricep')) return find('tricep pushdown');

  if (n.includes('side plank')) return find('side plank');
  if (n.includes('plank')) return find('plank');

  if (n.includes('burpee')) return find('burpee');
  if (n.includes('jumping jack') || n.includes('jumping jacks')) return find('jumping jack');
  if (n.includes('mountain climber')) return find('mountain climber');
  if (n.includes('high knee')) return find('high knee');
  if (n.includes('box jump')) return find('box jump');
  if (n.includes('jump squat')) return find('jump squat');
  if (n.includes('skater')) return find('skater');
  if (n.includes('bear crawl')) return find('bear crawl');

  // ── Generic fallback — preserve the actual name so the UI never shows a wrong exercise ──
  // Use knee angle tracking which works for most standing movements.
  const displayName = (name || '').trim() || 'Exercise';
  return {
    slug: n || 'generic',
    display: displayName.replace(/\b\w/g, (c) => c.toUpperCase()),
    type: 'reps',
    rep: { angleKey: 'knee_avg', down: 110, up: 160 },
  };
};

function find(slug: string): ExerciseProfile {
  return EXERCISE_PROFILES.find((p) => p.slug === slug) ?? EXERCISE_PROFILES[0];
}

/** Backwards-compat helper. */
export const normalizeExerciseName = (name: string): string => getExerciseProfile(name).slug;

/**
 * Send a single base64 frame to the AI backend.
 * Returns angles, targets, pose detected flag, and live feedback.
 */
export const analyzeFrame = async (
  imageBase64: string,
  exerciseName: string,
): Promise<AnalyzeFrameResult> => {
  const profile = getExerciseProfile(exerciseName);
  const body = await apiPost('/vision/analyze-frame', {
    image_base64: imageBase64,
    exercise_name: profile.slug,
  }, { timeout: 12000 });
  const data = unwrapApiData<Record<string, unknown>>(body) ?? {};
  const angles = (data.angles ?? {}) as FrameAngles;
  const targets = (data.targets ?? {}) as FrameTargetsRaw;

  // Sanitize feedback strings coming from backend
  const rawFeedback: string[] = Array.isArray(data.feedback) ? data.feedback : [];
  const rawDoneWell: string[] = Array.isArray(data.done_well) ? data.done_well : [];
  const rawToFix: string[] = Array.isArray(data.to_fix) ? data.to_fix : [];
  const score: number = typeof data.score === 'number' ? data.score : 0;

  return {
    angles,
    targets,
    poseDetected: Object.keys(angles).length > 0,
    feedback: {
      messages: rawFeedback.slice(0, 4),
      doneWell: rawDoneWell.slice(0, 3),
      toFix: rawToFix.slice(0, 4),
      score,
    },
  };
};

/** Health check — proxied through Node API (phone cannot reach :8000 directly). */
export const checkAIBackendHealth = async (): Promise<boolean> => {
  try {
    await apiGet('/vision/health', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
};

/**
 * Parse a target string from the backend into a {min, max} numeric range.
 * e.g. "70-90°" → {min:70, max:90}, "170°+" → {min:170, max:195}
 */
export const parseTarget = (raw: string): ParsedTarget | null => {
  if (!raw || typeof raw !== 'string') return null;
  const range = raw.match(/(\d+)\s*-\s*(\d+)/);
  if (range) {
    const min = parseInt(range[1], 10);
    let max = parseInt(range[2], 10);
    if (max >= 165 && max <= 180) max = 195;
    return { min, max };
  }
  const plus = raw.match(/(\d+)\s*°?\s*\+/);
  if (plus) return { min: parseInt(plus[1], 10), max: 195 };
  const single = raw.match(/(\d+)\s*°/);
  if (single) {
    const n = parseInt(single[1], 10);
    return { min: Math.max(0, n - 10), max: Math.min(195, n + 15) };
  }
  return null;
};

/**
 * Compute overall form score 0-100 from joint angles vs target strings.
 * Used when the backend score field is unavailable.
 */
export const computeFormScore = (
  angles: FrameAngles,
  targets: FrameTargetsRaw,
): number => {
  const angleKeys = Object.keys(angles);
  if (angleKeys.length === 0) return 0;
  const targetEntries = Object.entries(targets ?? {});
  if (targetEntries.length === 0) return 0;

  let total = 0;
  let count = 0;

  for (const [targetKey, rawTarget] of targetEntries) {
    const parsed = parseTarget(rawTarget);
    if (!parsed) continue;
    const tk = targetKey.toLowerCase();
    const joint =
      tk.startsWith('knee') ? 'knee' :
      tk.startsWith('elbow') ? 'elbow' :
      tk.startsWith('hip') ? 'hip' :
      tk.startsWith('body') ? 'body' :
      tk.startsWith('shoulder') ? 'shoulder' : null;
    if (!joint) continue;
    const matchKey =
      angleKeys.find((k) => k.startsWith(`${joint}_avg`)) ??
      angleKeys.find((k) => k.startsWith(joint));
    if (!matchKey) continue;
    const angle = angles[matchKey];
    if (typeof angle !== 'number') continue;
    const s = angle >= parsed.min && angle <= parsed.max
      ? 100
      : Math.max(0, 100 - (angle < parsed.min ? parsed.min - angle : angle - parsed.max) * 2);
    total += s;
    count += 1;
  }
  return count === 0 ? 0 : Math.round(total / count);
};

// ── Angle smoothing (EMA, per joint) ─────────────────────────────────────────
export class AngleSmoother {
  private values: FrameAngles = {};
  private alpha: number;

  /**
   * @param alpha  EMA weight for the newest sample (0–1).
   *               Higher = faster response to real movement, more noise.
   *               Lower  = smoother but lags behind fast movements.
   *               0.65 gives ~3-frame settling time at 2.5 fps — good for
   *               typical workout speeds without losing fast reps.
   */
  constructor(alpha: number = 0.65) {
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

  reset() { this.values = {}; }
}

// ── Rep detector (live, frontend-side) ───────────────────────────────────────
export class RepDetector {
  private profile: ExerciseProfile;
  private phase: 'top' | 'bottom' | 'unknown' = 'unknown';
  private lastRepAt: number = 0;
  private cooldownMs: number;

  /**
   * @param cooldownMs  Minimum ms between counted reps.
   *                    350 ms allows up to ~2.9 reps/sec while blocking
   *                    double-counts within a single movement cycle.
   */
  constructor(profile: ExerciseProfile, cooldownMs: number = 350) {
    this.profile = profile;
    this.cooldownMs = cooldownMs;
  }

  /**
   * Feed the latest smoothed angles; returns 1 when a rep is completed, else 0.
   *
   * Phase machine:
   *   unknown → bottom  (seeds on first detectable position)
   *   unknown → top
   *   top     → bottom
   *   bottom  → top  ← REP COUNTED here
   *
   * Hysteresis bands (40 % of the exercise's angle range, capped at 25°):
   *   Instead of requiring the angle to cross the exact profile threshold,
   *   a "bottom" is detected once the angle enters the bottom-side zone and
   *   a "top" is detected once the angle enters the top-side zone.  This
   *   means the user does not need perfect form or full range-of-motion for
   *   reps to be counted — natural workout movement is sufficient.
   */
  update(angles: FrameAngles): number {
    const rep = this.profile.rep;
    if (!rep) return 0;
    const value = angles[rep.angleKey];
    if (typeof value !== 'number') return 0;

    const inverted = !!rep.inverted;
    // Hysteresis: 40 % of the exercise's total angle range, capped at 25°.
    // Example — squat (range 33°): hyst ≈ 13° → top zone starts at 145° not 158°.
    // Example — jumping jack (range 65°): hyst = 25° → top zone starts at 85°.
    // Example — curl (range 118°): hyst = 25° → contracted zone is ≤ 65°.
    const range = Math.abs(rep.up - rep.down);
    const hyst  = Math.min(25, range * 0.40);

    let enterBottom: boolean;
    let enterTop: boolean;

    if (inverted) {
      // Inverted exercises (curls, rows, pull-ups):
      //   bottom phase = arm extended   (large angle, near rep.up)
      //   top    phase = arm contracted (small angle, near rep.down)
      enterBottom = value >= (rep.up   - hyst);  // arm mostly extended
      enterTop    = value <= (rep.down + hyst);  // arm mostly contracted
    } else {
      // Normal exercises (squats, push-ups, overhead press, jumping jacks…):
      //   bottom phase = bent / deep position (small angle, near rep.down)
      //   top    phase = extended / standing  (large angle, near rep.up)
      enterBottom = value <= (rep.down + hyst);  // reached lower position
      enterTop    = value >= (rep.up   - hyst);  // reached upper position
    }

    let counted = 0;
    const now = Date.now();

    if (enterBottom) {
      this.phase = 'bottom';
    } else if (enterTop) {
      if (this.phase === 'bottom' && now - this.lastRepAt > this.cooldownMs) {
        counted = 1;
        this.lastRepAt = now;
      }
      this.phase = 'top';
    }
    return counted;
  }

  /** True once the detector has left the 'unknown' seed state. */
  isActive(): boolean {
    return this.phase !== 'unknown';
  }

  /** Returns current phase for debug logging. */
  getPhase(): string {
    return this.phase;
  }

  reset() {
    this.phase = 'unknown';
    this.lastRepAt = 0;
  }
}

/** True when the user is holding good form for an isometric exercise. */
export const isHoldingForm = (profile: ExerciseProfile, angles: FrameAngles): boolean => {
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
  buildSessionSummary,
  RepDetector,
  AngleSmoother,
  isHoldingForm,
};
