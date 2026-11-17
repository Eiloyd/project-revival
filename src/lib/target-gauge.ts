/** Analog target meter rules shared by every dashboard (browser-safe). */
export type GaugeZone = 'red' | 'yellow' | 'green';
export type GaugeReading = { set: boolean; percent: number; needle: number; zone: GaugeZone; remaining: number; status: string };

/** Red below 25%, yellow 25–74%, green from 75%. */
export function gaugeZone(percent: number): GaugeZone {
  return percent >= 75 ? 'green' : percent >= 25 ? 'yellow' : 'red';
}

/**
 * Achievement % = achieved / target × 100 (rounded down, so 99.6% never reads as done).
 * The needle stops at 100% while the percentage keeps the real overachievement.
 * Without a target nothing is invented: the meter reads "not set".
 */
export function gaugeReading(achieved: number, target: number): GaugeReading {
  const done = Math.max(0, Number.isFinite(achieved) ? achieved : 0);
  if (!(target > 0)) return { set: false, percent: 0, needle: 0, zone: 'red', remaining: 0, status: 'Target not set' };
  const percent = Math.floor((done / target) * 100);
  const zone = gaugeZone(percent);
  return {
    set: true, percent, needle: Math.min(100, percent), zone, remaining: Math.max(0, target - done),
    status: percent >= 100 ? 'Target achieved' : zone === 'green' ? 'On track' : zone === 'yellow' ? 'Needs attention' : 'Behind target',
  };
}
