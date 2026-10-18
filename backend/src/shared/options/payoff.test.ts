import { describe, expect, it } from 'vitest';
import { computePayoff } from './payoff';

describe('payoff engine', () => {
  const lotSize = 75;

  it('bull call spread: exact max profit, max loss and breakeven', () => {
    const r = computePayoff({
      legs: [
        { id: 'a', instrument: 'CE', side: 'BUY', strike: 23200, premium: 100, lots: 1 },
        { id: 'b', instrument: 'CE', side: 'SELL', strike: 23400, premium: 40, lots: 1 },
      ],
      spot: 23150,
      lotSize,
    });
    expect(r.maxProfit).toBeCloseTo((200 - 60) * lotSize, 6);
    expect(r.maxLoss).toBeCloseTo(-60 * lotSize, 6);
    expect(r.breakevens).toEqual([23260]);
    expect(r.netPremium).toBeCloseTo(-60 * lotSize, 6);
  });

  it('long call has unlimited profit and bounded loss', () => {
    const r = computePayoff({ legs: [{ id: 'a', instrument: 'CE', side: 'BUY', strike: 23200, premium: 100, lots: 2 }], spot: 23150, lotSize });
    expect(r.maxProfit).toBeNull();
    expect(r.maxLoss).toBeCloseTo(-100 * lotSize * 2, 6);
  });

  it('short straddle has unlimited loss and credit = max profit', () => {
    const r = computePayoff({
      legs: [
        { id: 'a', instrument: 'CE', side: 'SELL', strike: 23150, premium: 150, lots: 1 },
        { id: 'b', instrument: 'PE', side: 'SELL', strike: 23150, premium: 130, lots: 1 },
      ],
      spot: 23150,
      lotSize,
    });
    expect(r.maxLoss).toBeNull();
    expect(r.maxProfit).toBeCloseTo(280 * lotSize, 6);
    expect(r.breakevens).toHaveLength(2);
    expect(r.breakevens[0]).toBeCloseTo(22870, 0);
    expect(r.breakevens[1]).toBeCloseTo(23430, 0);
  });

  it('T+0 curve and greeks appear when iv and dte are given', () => {
    const r = computePayoff({
      legs: [{ id: 'a', instrument: 'CE', side: 'BUY', strike: 23200, premium: 100, lots: 1, iv: 0.14 }],
      spot: 23150,
      lotSize,
      daysToExpiry: 7,
    });
    expect(r.points.every((p) => p.todayPnl != null)).toBe(true);
    expect(r.greeks?.delta).toBeGreaterThan(0);
    expect(r.greeks?.theta).toBeLessThan(0);
  });
});
