import type { ChainRow, ChainSide, FoContract, MarketDataset, OptionChain } from '../types';
import { atmStrikeFor, bsGreeks, impliedVol } from '../options/blackScholes';
import { yearFraction, daysBetween } from '../calendar';

export function listExpiries(ds: MarketDataset, symbol: string): string[] {
  const set = new Set<string>();
  for (const c of ds.contracts) if (c.symbol === symbol && (c.instrumentType === 'IDO' || c.instrumentType === 'STO')) set.add(c.expiry);
  return Array.from(set).sort();
}

export function getSpot(ds: MarketDataset, symbol: string): number | null {
  const u = ds.underlyings.find((x) => x.symbol === symbol);
  if (u) return u.close;
  const c = ds.contracts.find((x) => x.symbol === symbol && x.underlyingPrice > 0);
  return c ? c.underlyingPrice : null;
}

export function getLotSize(ds: MarketDataset, symbol: string): number {
  const u = ds.universe.find((x) => x.symbol === symbol);
  if (u) return u.lotSize;
  const c = ds.contracts.find((x) => x.symbol === symbol);
  return c?.lotSize ?? 1;
}

export function isIndexSymbol(ds: MarketDataset, symbol: string): boolean {
  const u = ds.universe.find((x) => x.symbol === symbol);
  if (u) return u.isIndex;
  return ds.contracts.some((c) => c.symbol === symbol && (c.instrumentType === 'IDO' || c.instrumentType === 'IDF'));
}

export function futurePrice(ds: MarketDataset, symbol: string, expiry?: string): number | null {
  const futs = ds.contracts.filter((c) => c.symbol === symbol && (c.instrumentType === 'IDF' || c.instrumentType === 'STF'));
  if (futs.length === 0) return null;
  if (expiry) {
    const exact = futs.find((f) => f.expiry === expiry);
    if (exact) return exact.close;
  }
  return futs.sort((a, b) => a.expiry.localeCompare(b.expiry))[0].close;
}

export function maxPain(rows: ChainRow[]): number | null {
  if (rows.length === 0) return null;
  let best: number | null = null;
  let bestLoss = Infinity;
  for (const settle of rows) {
    let loss = 0;
    for (const r of rows) {
      if (r.call) loss += Math.max(settle.strike - r.strike, 0) * r.call.oi;
      if (r.put) loss += Math.max(r.strike - settle.strike, 0) * r.put.oi;
    }
    if (loss < bestLoss) {
      bestLoss = loss;
      best = settle.strike;
    }
  }
  return best;
}

function toSide(c: FoContract, spot: number, t: number, rate?: number): ChainSide {
  const iv = c.close > 0 && c.optionType ? impliedVol(c.close, { spot, strike: c.strike!, t, type: c.optionType }, { rate }) : null;
  const greeks = iv != null && c.optionType ? bsGreeks({ spot, strike: c.strike!, t, sigma: iv, type: c.optionType, rate }) : null;
  return {
    close: c.close,
    prevClose: c.prevClose,
    changePct: c.prevClose > 0 ? ((c.close - c.prevClose) / c.prevClose) * 100 : 0,
    oi: c.oi,
    chgOi: c.chgOi,
    volume: c.volume,
    iv,
    greeks,
    futEqOi: greeks ? Math.abs(greeks.delta) * c.oi : null,
  };
}

export function buildChain(ds: MarketDataset, symbol: string, expiry?: string, rate?: number): OptionChain | null {
  const expiries = listExpiries(ds, symbol);
  if (expiries.length === 0) return null;
  const exp = expiry && expiries.includes(expiry) ? expiry : expiries[0];
  const spot = getSpot(ds, symbol);
  if (spot == null) return null;
  const lotSize = getLotSize(ds, symbol);
  const t = yearFraction(ds.tradeDate, exp);
  const opts = ds.contracts.filter((c) => c.symbol === symbol && c.expiry === exp && c.strike != null && c.optionType);

  const byStrike = new Map<number, ChainRow>();
  for (const c of opts) {
    const row = byStrike.get(c.strike!) ?? { strike: c.strike!, call: null, put: null };
    const side = toSide(c, spot, t, rate);
    if (c.optionType === 'CE') row.call = side;
    else row.put = side;
    byStrike.set(c.strike!, row);
  }
  const rows = Array.from(byStrike.values()).sort((a, b) => a.strike - b.strike);
  const strikes = rows.map((r) => r.strike);
  const atm = atmStrikeFor(spot, strikes);

  const totals = rows.reduce(
    (acc, r) => {
      if (r.call) {
        acc.callOi += r.call.oi;
        acc.callChgOi += r.call.chgOi;
        acc.callFutEqOi += r.call.futEqOi ?? 0;
      }
      if (r.put) {
        acc.putOi += r.put.oi;
        acc.putChgOi += r.put.chgOi;
        acc.putFutEqOi += r.put.futEqOi ?? 0;
      }
      return acc;
    },
    { callOi: 0, putOi: 0, callChgOi: 0, putChgOi: 0, callFutEqOi: 0, putFutEqOi: 0 }
  );

  return {
    symbol,
    expiry: exp,
    tradeDate: ds.tradeDate,
    spot,
    futurePrice: futurePrice(ds, symbol, exp),
    atmStrike: atm,
    daysToExpiry: daysBetween(ds.tradeDate, exp),
    lotSize,
    rows,
    totals: {
      ...totals,
      pcrOi: totals.callOi > 0 ? totals.putOi / totals.callOi : 0,
      maxPainStrike: maxPain(rows),
    },
  };
}

/** ATM implied vol from a chain = mean of ATM call and put IVs (whichever solve). */
export function atmIvFromChain(chain: OptionChain): number | null {
  const row = chain.rows.find((r) => r.strike === chain.atmStrike);
  if (!row) return null;
  const ivs = [row.call?.iv, row.put?.iv].filter((v): v is number => v != null);
  if (ivs.length === 0) return null;
  return ivs.reduce((a, b) => a + b, 0) / ivs.length;
}

/** Straddle price at ATM = call close + put close. */
export function straddleFromChain(chain: OptionChain): { atmStrike: number; straddlePrice: number } | null {
  const row = chain.rows.find((r) => r.strike === chain.atmStrike);
  if (!row || !row.call || !row.put) return null;
  return { atmStrike: row.strike, straddlePrice: row.call.close + row.put.close };
}

/** Classic Indian F&O OI interpretation. */
export function interpretOi(priceChange: number, oiChange: number): 'Long Buildup' | 'Short Buildup' | 'Short Covering' | 'Long Unwinding' | 'Neutral' {
  if (priceChange === 0 || oiChange === 0) return 'Neutral';
  if (priceChange > 0 && oiChange > 0) return 'Long Buildup';
  if (priceChange < 0 && oiChange > 0) return 'Short Buildup';
  if (priceChange > 0 && oiChange < 0) return 'Short Covering';
  return 'Long Unwinding';
}
