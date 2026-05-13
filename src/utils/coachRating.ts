/** One-decimal display so browse cards and profile screens stay consistent. */
export function formatCoachRating(rating: unknown): string {
  const n = Number(rating);
  if (!Number.isFinite(n) || n < 0) return '0.0';
  return (Math.round(n * 10) / 10).toFixed(1);
}

export function numericCoachRating(rating: unknown): number {
  const n = Number(rating);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 10) / 10;
}
