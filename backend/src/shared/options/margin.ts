/**
 * SPAN-style margin ESTIMATE for NSE F&O portfolios.
 *
 * NSE Clearing computes SPAN from daily risk-parameter files (risk arrays per contract).
 * Phase A does not ingest those files yet, so this module re-prices the portfolio with
 * Black–Scholes across the standard 16 SPAN scenarios using calibrated scan ranges, then
 * adds exposure margin and the 2025–26 SEBI add-ons. Results are labelled estimates in
 * the UI. Replace `SCAN_PARAMS` with values parsed from the .spn file when ingestion lands.
 */
import type { MarginBreakdown, StrategyLeg } from '../types';
import { bsPrice } from './blackScholes';

export interface MarginInputs {
  legs: StrategyLeg[];
  spot: number;
  lotSize: number;
  daysToExpiry: number;
  isIndex: boolean;
  /** True if the margin is being computed for expiry day (adds 2% ELM on short index options). */
  isExpiryDay?: boolean;
  rate?: number;
}

interface ScanParams {
  priceScanPct: number;   // ± range of underlying move scanned
  volScanPct: number;     // relative change in IV scanned (0.25 = ±25% of IV)
  exposurePct: number;    // exposure margin on notional
  shortOptionMinPct: number; // floor per short option as % of notional
}

/** Calibrated to approximate NSE levels in 2026; not authoritative. */
export const SCAN_PARAMS: Record<'index' | 'stock', ScanParams> = {
  index: { priceScanPct: 0.075, volScanPct: 0.25, exposurePct: 0.02, shortOptionMinPct: 0.03 },
  stock: { priceScanPct: 0.125, volScanPct: 0.35, exposurePct: 0.035, shortOptionMinPct: 0.05 },
};

/** The classic 16 SPAN scenarios: (price fraction of scan range, vol direction, weight). */
const SCENARIOS: Array<{ p: number; v: 1 | -1 | 0; w: number }> = [
  { p: 0, v: 1, w: 1 }, { p: 0, v: -1, w: 1 },
  { p: 1 / 3, v: 1, w: 1 }, { p: 1 / 3, v: -1, w: 1 },
  { p: -1 / 3, v: 1, w: 1 }, { p: -1 / 3, v: -1, w: 1 },
  { p: 2 / 3, v: 1, w: 1 }, { p: 2 / 3, v: -1, w: 1 },
  { p: -2 / 3, v: 1, w: 1 }, { p: -2 / 3, v: -1, w: 1 },
  { p: 1, v: 1, w: 1 }, { p: 1, v: -1, w: 1 },
  { p: -1, v: 1, w: 1 }, { p: -1, v: -1, w: 1 },
  { p: 3, v: 0, w: 0.32 }, { p: -3, v: 0, w: 0.32 },
];

const sign = (s: StrategyLeg['side']) => (s === 'BUY' ? 1 : -1);

function portfolioValue(legs: StrategyLeg[], spot: number, t: number, volMult: number, rate: number, lotSize: number): number {
  let v = 0;
  for (const leg of legs) {
    const qty = leg.lots * lotSize * sign(leg.side);
    if (leg.instrument === 'FUT') {
      v += qty * spot;
    } else {
      const iv = Math.max((leg.iv ?? 0.2) * volMult, 0.01);
      v += qty * bsPrice({ spot, strike: leg.strike, t, sigma: iv, rate, type: leg.instrument });
    }
  }
  return v;
}

function scanRisk(legs: StrategyLeg[], inp: MarginInputs, params: ScanParams): number {
  const { spot, lotSize, rate = 0.065 } = inp;
  const t = Math.max(inp.daysToExpiry, 0.25) / 365;
  const base = portfolioValue(legs, spot, t, 1, rate, lotSize);
  let worst = 0;
  for (const sc of SCENARIOS) {
    const s = spot * (1 + sc.p * params.priceScanPct);
    const volMult = 1 + sc.v * params.volScanPct;
    const v = portfolioValue(legs, s, t, volMult, rate, lotSize);
    const loss = (base - v) * sc.w;
    if (loss > worst) worst = loss;
  }
  return worst;
}

export function estimateMargin(inp: MarginInputs): MarginBreakdown {
  const params = SCAN_PARAMS[inp.isIndex ? 'index' : 'stock'];
  const { legs, spot, lotSize } = inp;
  const assumptions = [
    'SPAN estimated via Black–Scholes repricing over 16 standard scenarios; NSE risk-array files not yet ingested.',
    `Price scan ±${(params.priceScanPct * 100).toFixed(1)}%, vol scan ±${(params.volScanPct * 100).toFixed(0)}% of IV, exposure ${(params.exposurePct * 100).toFixed(1)}% of notional.`,
    'Broker house margins may be higher. Long options are fully paid (premium), not margined.',
  ];

  const marginedLegs = legs.filter((l) => !(l.instrument !== 'FUT' && l.side === 'BUY'));
  const longOptions = legs.filter((l) => l.instrument !== 'FUT' && l.side === 'BUY');
  const shortOptions = legs.filter((l) => l.instrument !== 'FUT' && l.side === 'SELL');

  // Scan risk on the netted portfolio (long options included — they hedge).
  const spanNet = marginedLegs.length === 0 ? 0 : scanRisk(legs, inp, params);
  // Sum of standalone scan risks for benefit reporting.
  const spanStandalone = marginedLegs.reduce((acc, l) => acc + scanRisk([l], inp, params), 0);

  // Short option minimum (floor), applied per short leg.
  const shortMin = shortOptions.reduce((acc, l) => acc + params.shortOptionMinPct * spot * l.lots * lotSize, 0);
  const spanMargin = Math.max(spanNet, shortMin);

  // Exposure margin on notional of margined legs (futures + short options). Long options exempt.
  const exposureMargin = marginedLegs.reduce((acc, l) => acc + params.exposurePct * spot * l.lots * lotSize, 0);

  // SEBI (Oct 2024): additional 2% ELM on short index options on expiry day.
  const expiryDayElm =
    inp.isExpiryDay && inp.isIndex
      ? shortOptions.reduce((acc, l) => acc + 0.02 * spot * l.lots * lotSize, 0)
      : 0;
  if (inp.isExpiryDay && inp.isIndex) assumptions.push('Expiry-day +2% ELM on short index options applied.');

  const premiumPayable = longOptions.reduce((acc, l) => acc + l.premium * l.lots * lotSize, 0);
  const premiumReceivable = shortOptions.reduce((acc, l) => acc + l.premium * l.lots * lotSize, 0);

  const total = spanMargin + exposureMargin + expiryDayElm + premiumPayable;
  const benefitVsNaked = Math.max(spanStandalone - spanNet, 0);

  return {
    spanMargin: round2(spanMargin),
    exposureMargin: round2(exposureMargin),
    expiryDayElm: round2(expiryDayElm),
    premiumPayable: round2(premiumPayable),
    premiumReceivable: round2(premiumReceivable),
    total: round2(total),
    benefitVsNaked: round2(benefitVsNaked),
    assumptions,
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
