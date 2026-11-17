import { describe, expect, it } from 'vitest';
import { gaugeReading, gaugeZone } from './target-gauge';

describe('target meter', () => {
  it('is red below 25%', () => { expect(gaugeZone(24)).toBe('red'); expect(gaugeReading(2400, 10000).zone).toBe('red'); });
  it('is yellow from 25% to 74%', () => { expect(gaugeReading(2500, 10000).zone).toBe('yellow'); expect(gaugeReading(7499, 10000).zone).toBe('yellow'); });
  it('is green from 75%', () => { expect(gaugeReading(7500, 10000).zone).toBe('green'); });
  it('stops the needle at 100% but shows overachievement', () => {
    const r = gaugeReading(12500, 10000);
    expect(r.needle).toBe(100); expect(r.percent).toBe(125); expect(r.remaining).toBe(0); expect(r.status).toBe('Target achieved');
  });
  it('shows remaining amount', () => { expect(gaugeReading(12000, 20000)).toMatchObject({ percent: 60, remaining: 8000 }); });
  it('never invents a target', () => { expect(gaugeReading(5000, 0)).toMatchObject({ set: false, percent: 0, needle: 0 }); });
});
