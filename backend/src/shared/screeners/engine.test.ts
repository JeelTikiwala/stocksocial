import { describe, expect, it } from 'vitest';
import { generateMockMarket } from '../mock/generate';
import { listScreeners, getScreener, resolveParams, runScreener } from './engine';
import { SCREENERS } from './registry';

describe('screener engine', () => {
  const ds = generateMockMarket();

  it('registers all 18 screeners across four zones', () => {
    expect(SCREENERS.length).toBe(18);
    expect(new Set(SCREENERS.map((s) => s.zone)).size).toBe(4);
    expect(new Set(SCREENERS.map((s) => s.id)).size).toBe(18);
    for (const s of listScreeners()) expect('run' in s).toBe(false);
  });

  it('every table screener returns rows on the mock market', () => {
    for (const spec of SCREENERS) {
      if (spec.availability === 'placeholder' || spec.detailRoute) continue;
      const r = runScreener(spec.id, ds);
      expect(r.total, spec.id).toBeGreaterThan(0);
      expect(r.rows.length).toBeLessThanOrEqual(100);
      for (const col of spec.columns) expect(col.key in r.rows[0].values, `${spec.id}.${col.key}`).toBe(true);
    }
  });

  it('placeholders return no rows and no error', () => {
    expect(runScreener('hx3', ds).total).toBe(0);
    expect(runScreener('intraday-booster', ds).total).toBe(0);
  });

  it('clamps and defaults params', () => {
    const spec = getScreener('volume-spike')!;
    expect(resolveParams(spec, {})).toEqual({ minRelVol: 1.5, kind: 'all' });
    expect(resolveParams(spec, { minRelVol: '99', kind: 'bogus' })).toEqual({ minRelVol: 10, kind: 'all' });
    expect(resolveParams(spec, { minRelVol: 'abc' }).minRelVol).toBe(1.5);
  });

  it('honours filters and sort order', () => {
    const loose = runScreener('unusual-options', ds, { minRatio: 0.5, minVolume: 0 }, 500);
    const tight = runScreener('unusual-options', ds, { minRatio: 3, minVolume: 0 }, 500);
    expect(tight.total).toBeLessThan(loose.total);
    const ratios = loose.rows.map((r) => Number(r.values.ratio));
    expect([...ratios].sort((a, b) => b - a)).toEqual(ratios);

    const gainers = runScreener('gainers-losers', ds, { side: 'gainers' });
    const losers = runScreener('gainers-losers', ds, { side: 'losers' });
    expect(Number(gainers.rows[0].values.changePct)).toBeGreaterThan(Number(losers.rows[0].values.changePct));
    const idxOnly = runScreener('gainers-losers', ds, { kind: 'index' });
    expect(idxOnly.total).toBe(4);
  });

  it('throws on unknown id', () => {
    expect(() => runScreener('nope', ds)).toThrow(/Unknown screener/);
  });
});
