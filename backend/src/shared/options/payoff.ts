/**
 * Strategy payoff engine: expiry P&L, optional T+0 curve, breakevens, aggregate greeks.
 * Quantities are in lots × lotSize units; premiums are per share.
 */
import type { Greeks, PayoffPoint, PayoffResult, StrategyLeg } from '../types';
import { bsGreeks, bsPrice } from './blackScholes';

export interface PayoffInputs {
  legs: StrategyLeg[];
  spot: number;
  lotSize: number;
  /** Days to expiry for the T+0 curve; omit to skip */
  daysToExpiry?: number;
  rate?: number;
  /** Spot range as fraction of spot, default ±15% */
  rangePct?: number;
  steps?: number;
}

function legExpiryValue(leg: StrategyLeg, spot: number): number {
  if (leg.instrument === 'FUT') return spot - leg.premium; // premium = entry price for FUT
  const intrinsic = leg.instrument === 'CE' ? Math.max(spot - leg.strike, 0) : Math.max(leg.strike - spot, 0);
  return intrinsic - leg.premium;
}

function legTodayValue(leg: StrategyLeg, spot: number, t: number, rate: number): number | null {
  if (leg.instrument === 'FUT') return spot - leg.premium;
  if (leg.iv == null || !(leg.iv > 0)) return null;
  const px = bsPrice({ spot, strike: leg.strike, t, sigma: leg.iv, rate, type: leg.instrument });
  return px - leg.premium;
}

const sign = (s: StrategyLeg['side']) => (s === 'BUY' ? 1 : -1);

export function computePayoff(inp: PayoffInputs): PayoffResult {
  const { legs, spot, lotSize, daysToExpiry, rate = 0.065, rangePct = 0.15, steps = 120 } = inp;
  const t = daysToExpiry != null ? Math.max(daysToExpiry, 0.25) / 365 : null;
  const lo = spot * (1 - rangePct);
  const hi = spot * (1 + rangePct);
  const points: PayoffPoint[] = [];

  // Include every strike as an exact sample so kinks are captured.
  const grid = new Set<number>();
  for (let i = 0; i <= steps; i++) grid.add(lo + ((hi - lo) * i) / steps);
  for (const l of legs) if (l.instrument !== 'FUT' && l.strike >= lo && l.strike <= hi) grid.add(l.strike);
  const xs = Array.from(grid).sort((a, b) => a - b);

  for (const s of xs) {
    let exp = 0;
    let today: number | null = 0;
    for (const leg of legs) {
      const qty = leg.lots * lotSize * sign(leg.side);
      exp += qty * legExpiryValue(leg, s);
      if (today != null) {
        const tv = t != null ? legTodayValue(leg, s, t, rate) : null;
        today = tv == null ? null : today + qty * tv;
      }
    }
    points.push({ spot: s, expiryPnl: exp, todayPnl: today });
  }

  // Unbounded detection: net slope beyond the range.
  const slopeAt = (s: number) => {
    let slope = 0;
    for (const leg of legs) {
      const qty = leg.lots * lotSize * sign(leg.side);
      if (leg.instrument === 'FUT') slope += qty;
      else if (leg.instrument === 'CE' && s > leg.strike) slope += qty;
      else if (leg.instrument === 'PE' && s < leg.strike) slope -= qty;
    }
    return slope;
  };
  const slopeHi = slopeAt(hi * 10);
  const slopeLo = slopeAt(0.0001);
  const pnls = points.map((p) => p.expiryPnl);
  const maxProfit = slopeHi > 0 || slopeLo < 0 ? null : Math.max(...pnls);
  const maxLoss = slopeHi < 0 || slopeLo > 0 ? null : Math.min(...pnls);

  const breakevens: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if ((a.expiryPnl <= 0 && b.expiryPnl > 0) || (a.expiryPnl >= 0 && b.expiryPnl < 0)) {
      const frac = a.expiryPnl / (a.expiryPnl - b.expiryPnl);
      breakevens.push(+(a.spot + frac * (b.spot - a.spot)).toFixed(2));
    }
  }

  let netPremium = 0;
  for (const leg of legs) {
    if (leg.instrument === 'FUT') continue;
    netPremium += -sign(leg.side) * leg.premium * leg.lots * lotSize;
  }

  let greeks: Greeks | null = null;
  if (t != null) {
    const agg: Greeks = { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
    let ok = true;
    for (const leg of legs) {
      const qty = leg.lots * lotSize * sign(leg.side);
      if (leg.instrument === 'FUT') {
        agg.delta += qty;
        continue;
      }
      if (leg.iv == null) {
        ok = false;
        break;
      }
      const g = bsGreeks({ spot, strike: leg.strike, t, sigma: leg.iv, rate, type: leg.instrument });
      agg.delta += qty * g.delta;
      agg.gamma += qty * g.gamma;
      agg.theta += qty * g.theta;
      agg.vega += qty * g.vega;
      agg.rho += qty * g.rho;
    }
    greeks = ok ? agg : null;
  }

  return { points, maxProfit, maxLoss, breakevens, netPremium, greeks };
}
