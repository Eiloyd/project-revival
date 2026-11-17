/** Roster weeks run Monday to Sunday (dates as YYYY-MM-DD, calendar dates without time zones). */
const iso = (d: Date) => d.toISOString().slice(0, 10);
export function weekStart(day: string): string {
  const d = new Date(`${day}T00:00:00Z`); const dow = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (dow === 0 ? 6 : dow - 1)); return iso(d);
}
export function weekDays(start: string): string[] {
  const d = new Date(`${weekStart(start)}T00:00:00Z`);
  return Array.from({ length: 7 }, (_, i) => iso(new Date(d.getTime() + i * 86_400_000)));
}
export const addDays = (day: string, n: number) => iso(new Date(new Date(`${day}T00:00:00Z`).getTime() + n * 86_400_000));
/** Default plan for a week: the given shift Monday–Saturday, week off on Sunday. */
export function defaultWeek(start: string, shift: string, off = 'WO'): Record<string, string> {
  return Object.fromEntries(weekDays(start).map((d, i) => [d, i === 6 ? off : shift]));
}
