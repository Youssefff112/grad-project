/** Standard "glass" / plan cup used across the app (ml). */
export const WATER_ML_PER_GLASS = 250;

/** US legal cup (for nutrition labels); optional in calculator */
export const WATER_ML_PER_US_CUP = 236.588;

export function mlFromLitres(litres: number): number {
  const n = Number(litres);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 1000);
}

/** Cups where 1 cup = 250 ml (same as one "glass" in our tracker). */
export function mlFromMetricCups(cups: number): number {
  const n = Number(cups);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * WATER_ML_PER_GLASS);
}

export function mlFromUsCups(cups: number): number {
  const n = Number(cups);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * WATER_ML_PER_US_CUP);
}

export function glassesFromMl(ml: number): number {
  if (!Number.isFinite(ml) || ml <= 0) return 0;
  return ml / WATER_ML_PER_GLASS;
}

export function formatLitres(ml: number): string {
  return (ml / 1000).toFixed(ml >= 10000 ? 1 : 2);
}

export function capWaterToGoal(ml: number, goalMl: number): number {
  const goal = Math.max(0, goalMl || 2000);
  return Math.min(Math.max(0, ml), goal);
}

export function maxGlassesForGoal(goalMl: number): number {
  const goal = Math.max(WATER_ML_PER_GLASS, goalMl || 2000);
  return Math.max(1, Math.ceil(goal / WATER_ML_PER_GLASS));
}

/** Whole glasses only — "1 glass", "2 glasses", never "1.0 glasses". */
export function formatGlassLabel(glassCount: number): string {
  const n = Math.max(0, Math.round(glassCount));
  if (n === 0) return '0 glasses';
  if (n === 1) return '1 glass';
  return `${n} glasses`;
}

/** e.g. "1 of 8 glasses", "2 of 1 glass" */
export function formatGlassProgress(currentGlasses: number, goalGlasses: number): string {
  const current = Math.max(0, Math.round(currentGlasses));
  const goal = Math.max(1, Math.round(goalGlasses));
  return `${current} of ${goal} ${goal === 1 ? 'glass' : 'glasses'}`;
}
