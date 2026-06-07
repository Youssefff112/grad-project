import type { WorkoutSession } from '../services/workoutService';
import { ymdFromLogDate } from './localDate';

export function normalizeExerciseName(name: string): string {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function isExerciseCompleted(planExerciseName: string, completedNames: string[]): boolean {
  const target = normalizeExerciseName(planExerciseName);
  if (!target) return false;
  return completedNames.some((c) => normalizeExerciseName(c) === target);
}

/** Exercise names completed today (from workout logs). */
export function completedExerciseNamesForDate(
  logs: WorkoutSession[],
  ymd: string,
): string[] {
  const names = new Set<string>();
  for (const log of logs) {
    if (log.status && log.status !== 'completed') continue;
    if (ymdFromLogDate(log.date || '') !== ymd) continue;
    if (Array.isArray(log.exercises)) {
      for (const e of log.exercises) {
        if (e?.name) names.add(String(e.name));
      }
    }
    if (log.sessionMeta?.exerciseName) {
      names.add(String(log.sessionMeta.exerciseName));
    }
  }
  return [...names];
}
