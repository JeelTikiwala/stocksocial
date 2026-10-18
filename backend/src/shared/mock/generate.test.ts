import { describe, expect, it } from 'vitest';
import { generateMockMarket } from './generate';
import { buildChain, listExpiries } from '../analytics/chain';

describe('mock market generator', () => {
  const ds = generateMockMarket();

  it('is deterministic for a given seed', () => {
    const again = generateMockMarket();
    expect(again.contracts.length).toBe(ds.contracts.length);
    expect(again.contracts[123]).toEqual(ds.contracts[123]);
    expect(again.ivHistory['NIFTY'].at(-1)).toEqual(ds.ivHistory['NIFTY'].at(-1));
    expect(generateMockMarket({ seed: 7 }).contracts[123]).not.toEqual(ds.contracts[123]);
  });

  it('covers the full universe with sane shapes', () => {
    expect(ds.underlyings.length).toBe(ds.universe.length);
    expect(ds.contracts.length).toBeGreaterThan(3000);
    expect(listExpiries(ds, 'NIFTY').length).toBeGreaterThanOrEqual(4); // weeklies
    expect(listExpiries(ds, 'RELIANCE').length).toBe(2); // monthlies only
    expect(ds.indices.some((i) => i.name === 'India VIX')).toBe(true);
    expect(ds.ivHistory['BANKNIFTY'].length).toBe(260);
    for (const u of ds.underlyings) expect(u.futVolumeAvg20).toBeGreaterThan(0);
  });

  it('produces option prices whose IV solves near the ATM', () => {
    for (const sym of ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TATASTEEL']) {
      const chain = buildChain(ds, sym)!;
      const i = chain.rows.findIndex((r) => r.strike === chain.atmStrike);
      const near = chain.rows.slice(Math.max(i - 5, 0), i + 6);
      const solved = near.flatMap((r) => [r.call?.iv, r.put?.iv]).filter((v) => v != null).length;
      expect(solved / (near.length * 2)).toBeGreaterThan(0.9);
      expect(chain.totals.pcrOi).toBeGreaterThan(0.3);
      expect(chain.totals.pcrOi).toBeLessThan(3);
      expect(chain.totals.maxPainStrike).not.toBeNull();
    }
  });

  it('keeps notional turnover within the range NSE actually prints', () => {
    // NSE's TtlTrfVal is notional (strike + premium) × qty; a NIFTY ATM weekly can exceed ₹1 lakh crore.
    const max = Math.max(...ds.contracts.map((c) => c.turnover));
    expect(max).toBeLessThan(5e12);
    expect(max).toBeGreaterThan(1e10);
  });
});
