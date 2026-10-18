import { describe, expect, it } from 'vitest';
import { bsPrice, bsGreeks, impliedVol, normCdf, atmStrikeFor } from './blackScholes';

describe('Black-Scholes', () => {
  const base = { spot: 23146, strike: 23150, t: 7 / 365, rate: 0.065 };

  it('normCdf matches known values', () => {
    expect(normCdf(0)).toBeCloseTo(0.5, 6);
    expect(normCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normCdf(-1.96)).toBeCloseTo(0.025, 3);
  });

  it('satisfies put-call parity', () => {
    const c = bsPrice({ ...base, sigma: 0.14, type: 'CE' });
    const p = bsPrice({ ...base, sigma: 0.14, type: 'PE' });
    const parity = base.spot - base.strike * Math.exp(-base.rate * base.t);
    expect(c - p).toBeCloseTo(parity, 6);
  });

  it('round-trips implied vol across the smile', () => {
    for (const strike of [22400, 22800, 23150, 23500, 23900]) {
      for (const sigma of [0.09, 0.14, 0.3]) {
        for (const type of ['CE', 'PE'] as const) {
          const px = bsPrice({ ...base, strike, sigma, type });
          const iv = impliedVol(px, { ...base, strike, type });
          // Deep ITM/OTM prices can be below solver tolerance; only assert where the price is meaningful.
          if (px > 0.5) expect(iv).toBeCloseTo(sigma, 3);
        }
      }
    }
  });

  it('returns null for prices at/below intrinsic or above the upper bound', () => {
    expect(impliedVol(0, { ...base, type: 'CE' })).toBeNull();
    expect(impliedVol(base.spot - 20000, { ...base, strike: 20000, type: 'CE' })).toBeNull(); // = intrinsic (no time value)
    expect(impliedVol(base.spot + 1, { ...base, type: 'CE' })).toBeNull();
  });

  it('produces sane greeks', () => {
    const c = bsGreeks({ ...base, sigma: 0.14, type: 'CE' });
    const p = bsGreeks({ ...base, sigma: 0.14, type: 'PE' });
    expect(c.delta).toBeGreaterThan(0.45);
    expect(c.delta).toBeLessThan(0.6);
    expect(c.delta - p.delta).toBeCloseTo(1, 6);
    expect(c.gamma).toBeGreaterThan(0);
    expect(c.gamma).toBeCloseTo(p.gamma, 10);
    expect(c.vega).toBeCloseTo(p.vega, 10);
    expect(c.theta).toBeLessThan(0);
    expect(c.rho).toBeGreaterThan(0);
    expect(p.rho).toBeLessThan(0);
  });

  it('picks the nearest strike', () => {
    expect(atmStrikeFor(23146, [23000, 23050, 23100, 23150, 23200])).toBe(23150);
    expect(atmStrikeFor(23120, [23000, 23050, 23100, 23150, 23200])).toBe(23100);
  });
});
