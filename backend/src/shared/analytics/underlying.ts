import type { FoContract, HistoryPoint, MarketDataset, OptionChain, UnderlyingEod, UniverseEntry } from '../types';
import { buildChain, listExpiries } from './chain';
import { ivStats, type IvStats } from './iv';

export interface UnderlyingDetail {
  underlying: UnderlyingEod;
  meta: UniverseEntry | null;
  history: HistoryPoint[];
  ivStats: IvStats;
  expiries: string[];
  futures: FoContract[];
  nearChain: { expiry: string; atmStrike: number; daysToExpiry: number; totals: OptionChain['totals'] } | null;
}

export function underlyingDetail(ds: MarketDataset, symbolRaw: string, historyDays = 60): UnderlyingDetail | null {
  const symbol = symbolRaw.toUpperCase();
  const u = ds.underlyings.find((x) => x.symbol === symbol);
  if (!u) return null;
  const expiries = listExpiries(ds, symbol);
  const chain = expiries[0] ? buildChain(ds, symbol, expiries[0]) : null;
  return {
    underlying: u,
    meta: ds.universe.find((x) => x.symbol === symbol) ?? null,
    history: (ds.underlyingHistory[symbol] ?? []).slice(-historyDays),
    ivStats: ivStats(ds.ivHistory[symbol] ?? []),
    expiries,
    futures: ds.contracts.filter((c) => c.symbol === symbol && c.optionType == null).sort((a, b) => a.expiry.localeCompare(b.expiry)),
    nearChain: chain ? { expiry: chain.expiry, atmStrike: chain.atmStrike, daysToExpiry: chain.daysToExpiry, totals: chain.totals } : null,
  };
}
