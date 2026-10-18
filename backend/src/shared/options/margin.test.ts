import { describe, expect, it } from 'vitest';
import { estimateMargin } from './margin';

describe('margin estimator', () => {
  const ctx = { spot: 23146, lotSize: 75, daysToExpiry: 7, isIndex: true };
  const shortCall = { id: 's', instrument: 'CE' as const, side: 'SELL' as const, strike: 23400, premium: 60, lots: 1, iv: 0.14 };
  const longCall = { id: 'l', instrument: 'CE' as const, side: 'BUY' as const, strike: 23600, premium: 25, lots: 1, iv: 0.145 };

  it('a spread needs less margin than the naked short', () => {
    const naked = estimateMargin({ ...ctx, legs: [shortCall] });
    const spread = estimateMargin({ ...ctx, legs: [shortCall, longCall] });
    expect(spread.spanMargin).toBeLessThan(naked.spanMargin);
    expect(spread.benefitVsNaked).toBeGreaterThan(0);
    expect(spread.premiumPayable).toBeCloseTo(25 * 75, 6);
  });

  it('a long option alone is premium-only', () => {
    const r = estimateMargin({ ...ctx, legs: [longCall] });
    expect(r.spanMargin).toBe(0);
    expect(r.exposureMargin).toBe(0);
    expect(r.total).toBeCloseTo(25 * 75, 6);
  });

  it('expiry day adds 2% ELM on short index options', () => {
    const normal = estimateMargin({ ...ctx, legs: [shortCall] });
    const expiry = estimateMargin({ ...ctx, legs: [shortCall], isExpiryDay: true });
    expect(expiry.expiryDayElm).toBeCloseTo(0.02 * ctx.spot * 75, 2);
    expect(expiry.total - normal.total).toBeCloseTo(expiry.expiryDayElm, 2);
    const stock = estimateMargin({ ...ctx, isIndex: false, legs: [shortCall], isExpiryDay: true });
    expect(stock.expiryDayElm).toBe(0);
  });

  it('futures margin scales with lots', () => {
    const one = estimateMargin({ ...ctx, legs: [{ id: 'f', instrument: 'FUT', side: 'BUY', strike: 0, premium: 23200, lots: 1 }] });
    const two = estimateMargin({ ...ctx, legs: [{ id: 'f', instrument: 'FUT', side: 'BUY', strike: 0, premium: 23200, lots: 2 }] });
    expect(two.total).toBeCloseTo(one.total * 2, 0);
    expect(one.total / (ctx.spot * 75)).toBeGreaterThan(0.08);
    expect(one.total / (ctx.spot * 75)).toBeLessThan(0.2);
  });
});
