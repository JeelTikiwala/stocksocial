import type { FoContract, MarketDataset } from '../types';
import { listExpiries, getSpot } from '../analytics/chain';
import { atmStrikeFor } from '../options/blackScholes';

export interface LiveUniverseOptions {
  /** Hard cap on contracts (Kite allows 3,000 per WebSocket). */
  maxKeys?: number;
  /** Strikes each side of ATM for indices / stocks. */
  indexStrikes?: number;
  stockStrikes?: number;
}

/**
 * Pick the contracts worth streaming: near-expiry futures for every underlying, and
 * near-expiry options around the money. Stocks are ranked by futures turnover so the
 * cap drops the illiquid tail first.
 */
export function selectLiveUniverse(ds: MarketDataset, opts: LiveUniverseOptions = {}): FoContract[] {
  const { maxKeys = 2800, indexStrikes = 10, stockStrikes = 4 } = opts;
  const turnover = new Map<string, number>();
  for (const c of ds.contracts) if (c.optionType == null) turnover.set(c.symbol, (turnover.get(c.symbol) ?? 0) + c.turnover);
  const symbols = ds.universe
    .map((u) => u.symbol)
    .sort((a, b) => {
      const ia = ds.universe.find((u) => u.symbol === a)!.isIndex ? 1 : 0;
      const ib = ds.universe.find((u) => u.symbol === b)!.isIndex ? 1 : 0;
      if (ia !== ib) return ib - ia;
      return (turnover.get(b) ?? 0) - (turnover.get(a) ?? 0);
    });

  const out: FoContract[] = [];
  const futures: FoContract[] = [];
  const options: FoContract[][] = [];
  for (const symbol of symbols) {
    const isIndex = ds.universe.find((u) => u.symbol === symbol)?.isIndex ?? false;
    const exp = listExpiries(ds, symbol)[0];
    const fut = ds.contracts.filter((c) => c.symbol === symbol && c.optionType == null).sort((a, b) => a.expiry.localeCompare(b.expiry))[0];
    if (fut) futures.push(fut);
    if (!exp) continue;
    const spot = getSpot(ds, symbol);
    const opts_ = ds.contracts.filter((c) => c.symbol === symbol && c.expiry === exp && c.optionType != null);
    if (spot == null || opts_.length === 0) continue;
    const strikes = Array.from(new Set(opts_.map((c) => c.strike!))).sort((a, b) => a - b);
    const atm = atmStrikeFor(spot, strikes);
    const i = strikes.indexOf(atm);
    const n = isIndex ? indexStrikes : stockStrikes;
    const keep = new Set(strikes.slice(Math.max(i - n, 0), i + n + 1));
    options.push(opts_.filter((c) => keep.has(c.strike!)));
  }
  out.push(...futures);
  for (const group of options) {
    if (out.length + group.length > maxKeys) break;
    out.push(...group);
  }
  return out;
}
