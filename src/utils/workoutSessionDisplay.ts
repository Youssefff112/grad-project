import type { WorkoutSession } from '../services/workoutService';

export interface WorkoutSessionMeta {
  exerciseName: string;
  planDay: string;
  /** Plan split label, e.g. "Day 1" or "Push" — not the calendar weekday. */
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

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const titleCase = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();

/** AI plans often label splits "Day 1" — not an exercise name. */
const isGenericWorkoutLabel = (name: string): boolean =>
  /^day\s*\d+$/i.test(name.trim()) || /^workout\s*\d+$/i.test(name.trim());

const prettyLabel = (s?: string) => titleCase(s || '');

const parseFormFromNotes = (notes?: string): number | null => {
  if (!notes) return null;
  const m = notes.match(/Form:\s*(\d+(?:\.\d+)?)%/i);
  return m ? Math.round(Number(m[1])) : null;
};

/** Prefer structured sessionMeta; fall back to legacy notes/exercises. */
export const getSessionMeta = (session: WorkoutSession): WorkoutSessionMeta | null => {
  const raw = (session as any).sessionMeta;
  if (raw && typeof raw === 'object' && raw.exerciseName) {
    return raw as WorkoutSessionMeta;
  }
  return null;
};

export const getExerciseName = (session: WorkoutSession): string => {
  const meta = getSessionMeta(session);
  const fromEx = Array.isArray(session.exercises) ? session.exercises[0]?.name : null;

  if (fromEx && !isGenericWorkoutLabel(fromEx)) return fromEx;
  if (meta?.exerciseName && !isGenericWorkoutLabel(meta.exerciseName)) return meta.exerciseName;

  const notesMatch = session.notes?.match(/^([^·]+)/)?.[1]?.trim();
  if (notesMatch && !isGenericWorkoutLabel(notesMatch)) return notesMatch;

  if (meta?.exerciseName) return meta.exerciseName;
  if (fromEx) return fromEx;
  return 'Workout';
};

/** Calendar weekday from the plan (Monday, Tuesday, …). */
export const getPlanDayLabel = (session: WorkoutSession): string => {
  const meta = getSessionMeta(session);
  const raw = (meta?.planDay || session.day || '').toLowerCase().trim();
  if (WEEKDAYS.includes(raw)) return titleCase(raw);
  if (session.date) {
    return new Date(session.date).toLocaleDateString('en-US', { weekday: 'long' });
  }
  return '—';
};

/** Split name from the generated plan, e.g. "Day 1". */
export const getWorkoutFocusLabel = (session: WorkoutSession): string | null => {
  const meta = getSessionMeta(session);
  if (meta?.planFocus) return prettyLabel(meta.planFocus);
  const guessed = meta?.exerciseName || session.exercises?.[0]?.name;
  if (guessed && isGenericWorkoutLabel(guessed)) return prettyLabel(guessed);
  const notesMatch = session.notes?.match(/^([^·]+)/)?.[1]?.trim();
  if (notesMatch && isGenericWorkoutLabel(notesMatch)) return prettyLabel(notesMatch);
  return null;
};

export const getSessionContextLine = (session: WorkoutSession): string => {
  const parts: string[] = [];
  const weekday = getPlanDayLabel(session);
  if (weekday !== '—') parts.push(weekday);

  const focus = getWorkoutFocusLabel(session);
  if (focus) {
    parts.push(isGenericWorkoutLabel(focus) ? `Workout ${focus}` : `${focus} day`);
  }

  return parts.join(' · ');
};

/** Returns "Redo 1" for the first redo, null for the initial attempt. */
export const getRedoLabel = (session: WorkoutSession): string | null => {
  const meta = getSessionMeta(session);
  if (meta) {
    return meta.isRedo && meta.redoNumber > 0 ? `Redo ${meta.redoNumber}` : null;
  }
  return null;
};

export const getSessionTitle = (session: WorkoutSession): string => {
  const exercise = getExerciseName(session);
  const redo = getRedoLabel(session);
  return redo ? `${exercise} · ${redo}` : exercise;
};

export const getFormScore = (session: WorkoutSession): number | null => {
  const meta = getSessionMeta(session);
  if (meta?.performanceScore != null) return meta.performanceScore;
  if (meta?.formScore != null) return meta.formScore;
  return parseFormFromNotes(session.notes);
};

export const getDurationSeconds = (session: WorkoutSession): number | null => {
  const meta = getSessionMeta(session);
  if (meta?.durationSeconds != null) return meta.durationSeconds;
  if (session.duration != null) return session.duration * 60;
  return null;
};

export const formatDurationSeconds = (seconds?: number | null): string => {
  if (seconds == null || seconds <= 0) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

export const getTrackAgainButtonLabel = (session: WorkoutSession): string => {
  const name = getExerciseName(session);
  const redo = getRedoLabel(session);
  if (redo) return `${redo} — Track ${name} Again`;
  return `Track ${name} Again`;
};

export const getHistorySubtitle = (session: WorkoutSession): string => {
  const parts: string[] = [];
  const context = getSessionContextLine(session);
  if (context) parts.push(context);

  const dateLabel = session.date
    ? new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';
  if (dateLabel) parts.push(dateLabel);

  const duration = formatDurationSeconds(getDurationSeconds(session));
  if (duration !== '--') parts.push(duration);

  const score = getFormScore(session);
  if (score != null) parts.push(`${score}% form`);

  const redo = getRedoLabel(session);
  if (redo) parts.push(redo);

  return parts.join(' · ');
};
