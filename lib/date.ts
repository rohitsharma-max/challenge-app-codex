export function dateKey(input: Date = new Date()): string {
  const iso = new Date(input.getTime() - input.getTimezoneOffset() * 60000).toISOString();
  return iso.slice(0, 10);
}

export function parseDateKey(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

export function diffDays(fromDateKey: string, toDateKey: string): number {
  const from = parseDateKey(fromDateKey).getTime();
  const to = parseDateKey(toDateKey).getTime();
  return Math.floor((to - from) / (1000 * 60 * 60 * 24));
}

export function addDays(key: string, days: number): string {
  const dt = parseDateKey(key);
  dt.setDate(dt.getDate() + days);
  return dateKey(dt);
}

export function endOfDayIso(key: string): string {
  const dt = parseDateKey(key);
  dt.setHours(23, 59, 59, 999);
  return dt.toISOString();
}