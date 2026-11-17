// Browser-safe BDE/BDM pay rules. They mirror database/update-2026-11-17-sales-pay-volunteer-rewards.sql
// (crm_collection_present, crm_sales_month, hr_generate_payroll, crm_zero_collection_nudge); the
// database stays the source of truth, these power the dashboards.
import type { Collection } from './incentives';

export type PaySettings = { collection_attendance: boolean; min_daily_collection: number; work_start: string; zero_cutoff: string; nudge_every_minutes: number };
export const DEFAULT_PAY_SETTINGS: PaySettings = { collection_attendance: true, min_daily_collection: 1, work_start: '10:00', zero_cutoff: '12:00', nudge_every_minutes: 20 };
/** Daily wage = monthly gross ÷ 30 (the same divisor payroll uses for loss of pay). */
export const PAY_DAYS = 30;

const hhmm = (v: unknown, fallback: string) => { const m = /^(\d{1,2}):(\d{2})/.exec(String(v ?? '')); return m ? `${m[1]!.padStart(2, '0')}:${m[2]}` : fallback; };
export function readPaySettings(raw: Partial<Record<keyof PaySettings, unknown>> | null | undefined): PaySettings {
  if (!raw) return DEFAULT_PAY_SETTINGS;
  return {
    collection_attendance: raw.collection_attendance !== false,
    min_daily_collection: Math.max(1, Number(raw.min_daily_collection) || 1),
    work_start: hhmm(raw.work_start, DEFAULT_PAY_SETTINGS.work_start),
    zero_cutoff: hhmm(raw.zero_cutoff, DEFAULT_PAY_SETTINGS.zero_cutoff),
    nudge_every_minutes: Math.min(120, Math.max(5, Math.round(Number(raw.nudge_every_minutes) || 20))),
  };
}

const toMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return (h ?? 0) * 60 + (m ?? 0); };
/** "12:00" → "12:00 PM", "09:30" → "9:30 AM". */
export function clockLabel(t: string) { const mins = toMinutes(t); const h = Math.floor(mins / 60), m = mins % 60; return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; }
export const zeroMessage = (s: PaySettings = DEFAULT_PAY_SETTINGS) => `Remove your zero before ${clockLabel(s.zero_cutoff)}! Start today's collection to mark your daily attendance and protect your daily wage.`;

/** India time parts of a moment: calendar day, minutes since midnight, ISO weekday (Mon 1 … Sun 7). */
export function istClock(now: Date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(now).map(x => [x.type, x.value]));
  const iso = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[p['weekday'] as string] ?? 1;
  return { day: `${p['year']}-${p['month']}-${p['day']}`, minutes: Number(p['hour']) * 60 + Number(p['minute']), isoDow: iso };
}

/**
 * "Remove your zero": active from work start until the cut-off (India time, not Sundays) while nothing
 * has been recorded today and the person is not on leave. Stops as soon as one collection is recorded
 * (verified or waiting for Accounts — rejected entries do not count).
 */
export function zeroNudge(now: Date, recordedToday: number, s: PaySettings = DEFAULT_PAY_SETTINGS, onLeave = false) {
  const c = istClock(now); const start = toMinutes(s.work_start), end = toMinutes(s.zero_cutoff);
  const inWindow = c.minutes >= start && c.minutes < end && c.isoDow !== 7;
  const active = s.collection_attendance && inWindow && recordedToday <= 0 && !onLeave;
  return { active, minutesLeft: active ? end - c.minutes : 0, everyMinutes: s.nudge_every_minutes };
}

/** Recorded (not rejected) collections for the people on one India day. */
export const recordedOn = (rows: Collection[], ids: string[], day: string) => rows.filter(r => ids.includes(r.owner_id) && r.collected_on === day && r.status !== 'rejected').length;

/** Days of `month` (YYYY-MM) on which the people's verified collection reached the daily minimum. */
export function presentDays(rows: Collection[], ids: string[], month: string, minimum = 1): string[] {
  const byDay = new Map<string, number>();
  for (const r of rows) if (r.status === 'verified' && ids.includes(r.owner_id) && r.collected_on.startsWith(month)) byDay.set(r.collected_on, (byDay.get(r.collected_on) ?? 0) + Number(r.amount));
  return [...byDay].filter(([, v]) => v >= Math.max(1, minimum)).map(([d]) => d).sort();
}

/** Daily-wage pay: paid days = verified-collection days (at most 30); wage = monthly gross ÷ 30 × paid days. */
export function dailyWagePay(monthlyGrossOrDaily: { monthlyGross?: number; dailyWage?: number }, collectionDays: number) {
  const daily = Math.round((monthlyGrossOrDaily.dailyWage ?? (monthlyGrossOrDaily.monthlyGross ?? 0) / PAY_DAYS) * 100) / 100;
  const paidDays = Math.max(0, Math.min(PAY_DAYS, Math.floor(collectionDays)));
  return { daily, paidDays, lopDays: PAY_DAYS - paidDays, wage: Math.round(daily * paidDays * 100) / 100 };
}

/** Every calendar day of a month up to (and including) `today` when it is the current month. */
export function monthDays(month: string, today: string) {
  const [y, m] = month.split('-').map(Number); const last = new Date(Date.UTC(y!, m!, 0)).getUTCDate(); const out: string[] = [];
  for (let d = 1; d <= last; d++) { const day = `${month}-${String(d).padStart(2, '0')}`; if (day > today) break; out.push(day); }
  return out;
}
