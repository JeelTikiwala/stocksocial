/**
 * Black–Scholes pricing, greeks and implied-volatility solver.
 *
 * All NSE index and stock options have been European-style since Jan 2011, so BS is the
 * correct model here (no early-exercise adjustment needed). Dividends are ignored in
 * Phase A (q = 0); for stock options around ex-dates this slightly overstates call IV.
 */
import type { Greeks, OptionType } from '../types';

/** Default INR risk-free rate (approx. 91-day T-bill, 2026). Override per call if needed. */
export const DEFAULT_RATE = 0.065;

const SQRT_2PI = Math.sqrt(2 * Math.PI);

export function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / SQRT_2PI;
}

/** Abramowitz–Stegun 7.1.26 erf-based CDF; |error| < 1.5e-7, plenty for IV work. */
export function normCdf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-ax * ax);
  return 0.5 * (1 + sign * y);
}

export interface BsInputs {
  spot: number;
  strike: number;
  /** Time to expiry in years */
  t: number;
  /** Annualised volatility, e.g. 0.14 */
  sigma: number;
  rate?: number;
  type: OptionType;
}

function d1d2({ spot, strike, t, sigma, rate = DEFAULT_RATE }: BsInputs) {
  const sqrtT = Math.sqrt(t);
  const d1 = (Math.log(spot / strike) + (rate + 0.5 * sigma * sigma) * t) / (sigma * sqrtT);
  return { d1, d2: d1 - sigma * sqrtT, sqrtT };
}

export function bsPrice(inp: BsInputs): number {
  const { spot, strike, t, sigma, rate = DEFAULT_RATE, type } = inp;
  if (t <= 0 || sigma <= 0) {
    return Math.max(type === 'CE' ? spot - strike : strike - spot, 0);
  }
  const { d1, d2 } = d1d2(inp);
  const df = Math.exp(-rate * t);
  return type === 'CE'
    ? spot * normCdf(d1) - strike * df * normCdf(d2)
    : strike * df * normCdf(-d2) - spot * normCdf(-d1);
}

export function bsGreeks(inp: BsInputs): Greeks {
  const { spot, strike, t, sigma, rate = DEFAULT_RATE, type } = inp;
  if (t <= 0 || sigma <= 0) {
    const itm = type === 'CE' ? spot > strike : spot < strike;
    return { delta: itm ? (type === 'CE' ? 1 : -1) : 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
  }
  const { d1, d2, sqrtT } = d1d2(inp);
  const df = Math.exp(-rate * t);
  const pdf = normPdf(d1);
  const delta = type === 'CE' ? normCdf(d1) : normCdf(d1) - 1;
  const gamma = pdf / (spot * sigma * sqrtT);
  const vegaRaw = spot * pdf * sqrtT; // per 1.0 vol
  const thetaAnnual =
    type === 'CE'
      ? -(spot * pdf * sigma) / (2 * sqrtT) - rate * strike * df * normCdf(d2)
      : -(spot * pdf * sigma) / (2 * sqrtT) + rate * strike * df * normCdf(-d2);
  const rhoRaw = type === 'CE' ? strike * t * df * normCdf(d2) : -strike * t * df * normCdf(-d2);
  return {
    delta,
    gamma,
    theta: thetaAnnual / 365,
    vega: vegaRaw / 100,
    rho: rhoRaw / 100,
  };
}

export interface IvSolveOptions {
  rate?: number;
  lo?: number;
  hi?: number;
  tol?: number;
  maxIter?: number;
}

/**
 * Implied volatility: Newton–Raphson with a bisection fallback. Returns null when the
 * price is below intrinsic/discounted bounds or no root exists in [lo, hi].
 */
export function impliedVol(
  price: number,
  base: Omit<BsInputs, 'sigma'>,
  opts: IvSolveOptions = {}
): number | null {
  const { rate = DEFAULT_RATE, lo = 0.01, hi = 5, tol = 1e-6, maxIter = 100 } = opts;
  const { spot, strike, t, type } = base;
  if (!(price > 0) || !(spot > 0) || !(strike > 0) || !(t > 0)) return null;

  const df = Math.exp(-rate * t);
  const intrinsic = Math.max(type === 'CE' ? spot - strike * df : strike * df - spot, 0);
  if (price <= intrinsic + 1e-9) return null;
  const upper = type === 'CE' ? spot : strike * df;
  if (price >= upper) return null;

  const f = (s: number) => bsPrice({ spot, strike, t, sigma: s, rate, type }) - price;

  // Bracket check
  let fLo = f(lo);
  let fHi = f(hi);
  if (fLo > 0 || fHi < 0) return null;

  // Newton from a Brenner–Subrahmanyam seed
  let sigma = Math.sqrt((2 * Math.PI) / t) * (price / spot);
  sigma = Math.min(Math.max(sigma, lo), hi);
  for (let i = 0; i < maxIter; i++) {
    const diff = f(sigma);
    if (Math.abs(diff) < tol) return sigma;
    const vega = bsGreeks({ spot, strike, t, sigma, rate, type }).vega * 100;
    if (vega < 1e-10) break;
    const next = sigma - diff / vega;
    if (next <= lo || next >= hi || !Number.isFinite(next)) break;
    if (Math.abs(next - sigma) < tol) return next;
    sigma = next;
  }

  // Bisection fallback
  let a = lo;
  let b = hi;
  for (let i = 0; i < 200; i++) {
    const mid = 0.5 * (a + b);
    const fm = f(mid);
    if (Math.abs(fm) < tol || b - a < tol) return mid;
    if ((fLo < 0 && fm < 0) || (fLo > 0 && fm > 0)) {
      a = mid;
      fLo = fm;
    } else {
      b = mid;
      fHi = fm;
    }
  }
  return 0.5 * (a + b);
}

/** Nearest strike to spot from a sorted list of strikes. */
export function atmStrikeFor(spot: number, strikes: number[]): number {
  let best = strikes[0];
  let bestDiff = Math.abs(spot - best);
  for (const k of strikes) {
    const d = Math.abs(spot - k);
    if (d < bestDiff) {
      best = k;
      bestDiff = d;
    }
  }
  return best;
}
