/** Local calendar date as YYYY-MM-DD (avoids UTC drift from toISOString). */
export function localYmd(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function localDayNameForYmd(ymd: string): string | null {
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

export function ymdFromLogDate(value: string | Date): string | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return localYmd(date);
}

export function lastNLocalYmd(n: number): string[] {
  const out: string[] = [];
  const anchor = new Date();
  anchor.setHours(12, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() - i);
    out.push(localYmd(d));
  }
  return out;
}
