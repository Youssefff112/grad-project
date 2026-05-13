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
