import type { MarketDataset } from '../types';
import { interpretOi } from './chain';
import { ivStats } from './iv';

export interface WatchlistRow {
  symbol: string;
  name: string;
  sector: string;
  isIndex: boolean;
  lotSize: number;
  close: number;
  prevClose: number;
  changePct: number;
  sparkline: number[];
  futChgOi: number;
  oiRead: string;
  atmIv: number | null;
  ivRank: number | null;
}

export function watchlistRows(ds: MarketDataset, symbols: string[]): WatchlistRow[] {
  const futChg = new Map<string, number>();
  for (const c of ds.contracts) if (c.optionType == null) futChg.set(c.symbol, (futChg.get(c.symbol) ?? 0) + c.chgOi);
  const out: WatchlistRow[] = [];
  for (const symbol of symbols) {
    const u = ds.underlyings.find((x) => x.symbol === symbol);
    const meta = ds.universe.find((x) => x.symbol === symbol);
    if (!u || !meta) continue;
    const st = ivStats(ds.ivHistory[symbol] ?? []);
    out.push({
      symbol,
      name: meta.name,
      sector: meta.sector,
      isIndex: meta.isIndex,
      lotSize: meta.lotSize,
      close: u.close,
      prevClose: u.prevClose,
      changePct: u.prevClose > 0 ? ((u.close - u.prevClose) / u.prevClose) * 100 : 0,
      sparkline: (ds.underlyingHistory[symbol] ?? []).slice(-30).map((h) => h.close),
      futChgOi: futChg.get(symbol) ?? 0,
      oiRead: interpretOi(u.close - u.prevClose, futChg.get(symbol) ?? 0),
      atmIv: st.current,
      ivRank: st.rank,
    });
  }
  return out;
}
