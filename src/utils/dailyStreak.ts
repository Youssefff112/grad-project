import type { DietLog, DietPlan } from '../services/dietService';
import type { WorkoutPlan, WorkoutSession } from '../services/workoutService';
import { lastNLocalYmd, localDayNameForYmd, ymdFromLogDate } from './localDate';

export type DayAdherenceBreakdown = {
  meal: number | null;
  water: number | null;
  workout: number | null;
};

function normalizeExerciseName(name: string): string {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function mealScoreFromDlog(dlog: DietLog | null, totalPlannedMeals?: number): number | null {
  if (!dlog) return null;

  if (dlog.status === 'followed' || dlog.status === 'full') return 100;

  const mc = dlog.mealsCompleted && typeof dlog.mealsCompleted === 'object' ? dlog.mealsCompleted : {};
  const allKeys = Object.keys(mc);
  const done = allKeys.filter((k) => mc[k]).length;

  if (allKeys.length > 0) {
    const total =
      typeof totalPlannedMeals === 'number' && totalPlannedMeals > 0
        ? totalPlannedMeals
        : allKeys.length;
    if (total > 0 && done >= total) return 100;
    return total > 0 ? Math.round((done / total) * 100) : null;
  }

  if (dlog.status === 'partial') return 50;
  if (dlog.status === 'missed') return 0;
  return null;
}

function waterScoreFromDlog(dlog: DietLog | null, goalMl: number | null): number | null {
  if (!dlog || dlog.waterMl == null || goalMl == null || goalMl <= 0) return null;
  const w = Number(dlog.waterMl) || 0;
  if (w >= goalMl) return 100;
  return Math.min(99, Math.round((w / goalMl) * 100));
}

function trainingDayKeysFromSchedule(weeklySchedule: WorkoutPlan['weeklySchedule'] | undefined): string[] {
  if (!Array.isArray(weeklySchedule)) return [];
  return weeklySchedule
    .filter((day) => day && !day.isRestDay && day.day)
    .map((day) => String(day.day).toLowerCase());
}

function buildDayExerciseMap(weeklySchedule: WorkoutPlan['weeklySchedule'] | undefined): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  if (!Array.isArray(weeklySchedule)) return map;
  for (const day of weeklySchedule) {
    if (!day || day.isRestDay || !day.day) continue;
    const key = String(day.day).toLowerCase();
    if (Array.isArray(day.exercises) && day.exercises.length > 0) {
      map[key] = day.exercises
        .map((e) => normalizeExerciseName(String(e.name || '')))
        .filter(Boolean);
    }
  }
  return map;
}

function weekStartYmd(ymd: string): string {
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3) return ymd;
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  const dow = date.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  date.setDate(date.getDate() + diff);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function collectLoggedExerciseNames(logs: WorkoutSession[]): Set<string> {
  const loggedNames = new Set<string>();
  for (const log of logs) {
    if (log.status && log.status !== 'completed') continue;
    if (Array.isArray(log.exercises)) {
      for (const e of log.exercises) {
        const n = normalizeExerciseName(String(e?.name || ''));
        if (n) loggedNames.add(n);
      }
    }
    const metaName = log.sessionMeta?.exerciseName;
    if (metaName) {
      const n = normalizeExerciseName(String(metaName));
      if (n) loggedNames.add(n);
    }
  }
  return loggedNames;
}

function workoutLogsForTrainingDay(
  ymd: string,
  dayName: string,
  woByYmd: Map<string, WorkoutSession[]>,
  workoutLogs: WorkoutSession[],
): WorkoutSession[] {
  const direct = (woByYmd.get(ymd) || []).filter((l) => !l.status || l.status === 'completed');
  if (direct.length > 0) return direct;

  const weekStart = weekStartYmd(ymd);
  return workoutLogs.filter((l) => {
    if (l.status && l.status !== 'completed') return false;
    const logYmd = ymdFromLogDate(l.date || '');
    if (!logYmd) return false;
    return weekStartYmd(logYmd) === weekStart && String(l.day || '').toLowerCase() === dayName;
  });
}

function buildDayMealCountMap(weeklyMealPlan: DietPlan['weeklyMealPlan'] | undefined): Record<string, number> {
  const map: Record<string, number> = {};
  if (!Array.isArray(weeklyMealPlan)) return map;
  for (const dayPlan of weeklyMealPlan) {
    const dayName = String(dayPlan.day || '').toLowerCase();
    if (dayName && Array.isArray(dayPlan.meals)) {
      map[dayName] = dayPlan.meals.length;
    }
  }
  return map;
}

export function scoreDayAdherence(
  ymd: string,
  dietLogs: DietLog[],
  workoutLogs: WorkoutSession[],
  options: {
    hasActiveDietPlan: boolean;
    hydrationGoalMl: number | null;
    weeklyMealPlan?: DietPlan['weeklyMealPlan'];
    weeklyWorkoutSchedule?: WorkoutPlan['weeklySchedule'];
  },
): DayAdherenceBreakdown {
  const trainSet = new Set(trainingDayKeysFromSchedule(options.weeklyWorkoutSchedule));
  const dayMealCount = buildDayMealCountMap(options.hasActiveDietPlan ? options.weeklyMealPlan : undefined);
  const dayExerciseMap = buildDayExerciseMap(options.weeklyWorkoutSchedule);
  const goal =
    options.hasActiveDietPlan && options.hydrationGoalMl != null && options.hydrationGoalMl > 0
      ? options.hydrationGoalMl
      : null;

  const dietByYmd = new Map<string, DietLog>();
  for (const row of dietLogs) {
    const y = ymdFromLogDate(row.date);
    if (y) dietByYmd.set(y, row);
  }

  const woByYmd = new Map<string, WorkoutSession[]>();
  for (const w of workoutLogs) {
    if (w.status && w.status !== 'completed') continue;
    const y = ymdFromLogDate(w.date || '');
    if (!y) continue;
    if (!woByYmd.has(y)) woByYmd.set(y, []);
    woByYmd.get(y)!.push(w);
  }

  const dlog = dietByYmd.get(ymd) || null;
  const dayName = localDayNameForYmd(ymd);
  const totalPlannedMeals = dayName && dayMealCount[dayName] != null ? dayMealCount[dayName] : undefined;
  const meal = options.hasActiveDietPlan ? mealScoreFromDlog(dlog, totalPlannedMeals) : null;
  const water = options.hasActiveDietPlan ? waterScoreFromDlog(dlog, goal) : null;

  let workout: number | null = null;
  if (dayName && trainSet.size > 0 && trainSet.has(dayName)) {
    const logs = workoutLogsForTrainingDay(ymd, dayName, woByYmd, workoutLogs);
    if (logs.length === 0) {
      workout = 0;
    } else {
      const plannedExercises = dayExerciseMap[dayName] || [];
      if (plannedExercises.length === 0) {
        workout = 100;
      } else {
        const loggedNames = collectLoggedExerciseNames(logs);
        const completedCount = plannedExercises.filter((name) =>
          loggedNames.has(normalizeExerciseName(name)),
        ).length;
        workout = completedCount >= plannedExercises.length
          ? 100
          : Math.round((completedCount / plannedExercises.length) * 100);
      }
    }
  }

  return { meal, water, workout };
}

/** A streak day = 100% meals + water; on training days also 100% exercises. */
export function isStreakDayComplete(
  breakdown: DayAdherenceBreakdown,
  isTrainingDay: boolean,
  hasActiveDietPlan: boolean,
): boolean {
  if (!hasActiveDietPlan) return false;
  if (breakdown.meal !== 100 || breakdown.water !== 100) return false;
  if (isTrainingDay && breakdown.workout !== 100) return false;
  return true;
}

export function computeDailyStreak(
  dietLogs: DietLog[],
  workoutLogs: WorkoutSession[],
  options: {
    hasActiveDietPlan: boolean;
    hydrationGoalMl: number | null;
    weeklyMealPlan?: DietPlan['weeklyMealPlan'];
    weeklyWorkoutSchedule?: WorkoutPlan['weeklySchedule'];
    lookbackDays?: number;
  },
): number {
  const trainSet = new Set(trainingDayKeysFromSchedule(options.weeklyWorkoutSchedule));
  const days = lastNLocalYmd(options.lookbackDays ?? 365);
  let streak = 0;

  for (let i = 0; i < days.length; i++) {
    const ymd = days[i];
    const dayName = localDayNameForYmd(ymd);
    const isTrainingDay = !!(dayName && trainSet.has(dayName));
    const breakdown = scoreDayAdherence(ymd, dietLogs, workoutLogs, options);
    if (isStreakDayComplete(breakdown, isTrainingDay, options.hasActiveDietPlan)) {
      streak++;
    } else if (i === 0) {
      // Today may still be in progress — don't break the streak yet.
      continue;
    } else {
      break;
    }
  }

  return streak;
}
