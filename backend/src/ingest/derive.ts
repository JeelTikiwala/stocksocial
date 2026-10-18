/**
 * Turn a day's raw contracts (+ indices + prior history) into a full MarketDataset.
 * Shared between the real ingestion pipeline and tests; the mock generator produces the
 * same shape directly.
 */
import { buildChain, listExpiries, straddleFromChain, atmIvFromChain, previousWeekday, daysBetween } from '../shared';
import type { FiiDiiPoint, FoContract, HistoryPoint, IndexEod, IvPoint, MarketDataset, StraddlePoint, UnderlyingEod, UniverseEntry } from '../shared';
import { sectorFor } from './sectorMap';

export interface DeriveInputs {
  tradeDate: string;
  prevTradeDate?: string;
  contracts: FoContract[];
  indices: IndexEod[];
  /** symbol → previous session's underlying close (from the prior bhavcopy). */
  prevUnderlyingClose?: Map<string, number>;
  history?: {
    underlying: Record<string, HistoryPoint[]>;
    iv: Record<string, IvPoint[]>;
    straddle: Record<string, StraddlePoint[]>;
  };
  fiiDii?: FiiDiiPoint[];
  universeOverride?: UniverseEntry[];
  source?: MarketDataset['source'];
}

export function deriveUniverse(contracts: FoContract[]): UniverseEntry[] {
  const bySym = new Map<string, { isIndex: boolean; lot: number; expiry: string }>();
  for (const c of contracts) {
    const isIndex = c.instrumentType === 'IDO' || c.instrumentType === 'IDF';
    const cur = bySym.get(c.symbol);
    // Prefer the nearest expiry's lot size (lot sizes change at introduction of far contracts).
    if (!cur || c.expiry < cur.expiry) bySym.set(c.symbol, { isIndex, lot: c.lotSize, expiry: c.expiry });
  }
  return Array.from(bySym.entries())
    .map(([symbol, v]) => ({ symbol, name: symbol, sector: sectorFor(symbol, v.isIndex), isIndex: v.isIndex, lotSize: v.lot }))
    .sort((a, b) => (a.isIndex === b.isIndex ? a.symbol.localeCompare(b.symbol) : a.isIndex ? -1 : 1));
}

export function deriveDataset(inp: DeriveInputs): MarketDataset {
  const { tradeDate, contracts } = inp;
  const prevTradeDate = inp.prevTradeDate ?? previousWeekday(tradeDate);
  const universe = inp.universeOverride ?? deriveUniverse(contracts);
  const history = inp.history ?? { underlying: {}, iv: {}, straddle: {} };

  // Underlyings
  const futBySym = new Map<string, { vol: number; nearClose: number; nearPrev: number; nearExp: string }>();
  const spotBySym = new Map<string, number>();
  for (const c of contracts) {
    if (c.underlyingPrice > 0 && !spotBySym.has(c.symbol)) spotBySym.set(c.symbol, c.underlyingPrice);
    if (c.optionType == null) {
      const f = futBySym.get(c.symbol) ?? { vol: 0, nearClose: 0, nearPrev: 0, nearExp: '9999-99-99' };
      f.vol += c.volume;
      if (c.expiry < f.nearExp && c.close > 0) {
        f.nearExp = c.expiry;
        f.nearClose = c.close;
        f.nearPrev = c.prevClose;
      }
      futBySym.set(c.symbol, f);
    }
  }
  const underlyings: UnderlyingEod[] = [];
  const underlyingHistory: Record<string, HistoryPoint[]> = {};
  for (const u of universe) {
    const spot = spotBySym.get(u.symbol);
    if (spot == null) continue;
    const fut = futBySym.get(u.symbol);
    let prevClose = inp.prevUnderlyingClose?.get(u.symbol);
    if (prevClose == null) {
      // Fallback: scale spot by the near-future's own prev/close ratio.
      prevClose = fut && fut.nearClose > 0 && fut.nearPrev > 0 ? spot * (fut.nearPrev / fut.nearClose) : spot;
    }
    const prior = history.underlying[u.symbol] ?? [];
    const futVolume = fut?.vol ?? 0;
    const last20 = prior.slice(-20);
    const avg20 = last20.length >= 5 ? Math.round(last20.reduce((a, p) => a + p.volume, 0) / last20.length) : null;
    underlyings.push({ tradeDate, symbol: u.symbol, close: spot, prevClose: +prevClose.toFixed(2), futVolume, futVolumeAvg20: avg20, isIndex: u.isIndex, sector: u.sector });
    underlyingHistory[u.symbol] = [...prior.filter((p) => p.date !== tradeDate), { date: tradeDate, close: spot, volume: futVolume }];
  }

  const partial: MarketDataset = {
    tradeDate,
    prevTradeDate,
    source: inp.source ?? 'bhavcopy',
    generatedAt: new Date().toISOString(),
    universe,
    contracts,
    underlyings,
    indices: inp.indices,
    underlyingHistory,
    ivHistory: {},
    straddleHistory: {},
    fiiDii: inp.fiiDii ?? [],
  };

  // IV & straddle for the near expiry of every underlying
  const ivHistory: Record<string, IvPoint[]> = {};
  const straddleHistory: Record<string, StraddlePoint[]> = {};
  for (const u of underlyings) {
    const exp = listExpiries(partial, u.symbol)[0];
    const priorIv = (history.iv[u.symbol] ?? []).filter((p) => p.date !== tradeDate);
    const priorStr = (history.straddle[u.symbol] ?? []).filter((p) => p.date !== tradeDate);
    if (!exp) {
      if (priorIv.length) ivHistory[u.symbol] = priorIv;
      continue;
    }
    const chain = buildChain(partial, u.symbol, exp);
    const iv = chain ? atmIvFromChain(chain) : null;
    const str = chain ? straddleFromChain(chain) : null;
    ivHistory[u.symbol] = iv != null ? [...priorIv, { date: tradeDate, atmIv: +iv.toFixed(4) }] : priorIv;
    if (str && chain) {
      const point: StraddlePoint = { date: tradeDate, expiry: exp, atmStrike: str.atmStrike, spot: chain.spot, straddlePrice: +str.straddlePrice.toFixed(2), daysToExpiry: daysBetween(tradeDate, exp) };
      straddleHistory[u.symbol] = [...priorStr.filter((p) => p.expiry === exp), point];
    } else if (priorStr.length) {
      straddleHistory[u.symbol] = priorStr;
    }
  }

  return { ...partial, ivHistory, straddleHistory };
}
