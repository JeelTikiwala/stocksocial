import { prisma } from '../db';
import { toIsoDate, type FoContract, type HistoryPoint, type IvPoint, type MarketDataset, type MarketStatus, type StraddlePoint } from '../shared';
import type { DataStore } from './store';
import { statusOf } from './store';

const CACHE_TTL_MS = 5 * 60 * 1000;
const HISTORY_DAYS = 260;

/** Reads the latest ingested trading day (plus history) from Postgres into a MarketDataset. */
export class PrismaDataStore implements DataStore {
  readonly kind = 'prisma' as const;
  private cache: { ds: MarketDataset; at: number } | null = null;

  invalidate(): void {
    this.cache = null;
  }

  async getStatus(): Promise<MarketStatus> {
    return statusOf(await this.getDataset());
  }

  async getDataset(): Promise<MarketDataset> {
    if (this.cache && Date.now() - this.cache.at < CACHE_TTL_MS) return this.cache.ds;
    const ds = await this.load();
    this.cache = { ds, at: Date.now() };
    return ds;
  }

  private async load(): Promise<MarketDataset> {
    const dates = await prisma.foContractEod.findMany({ distinct: ['tradeDate'], orderBy: { tradeDate: 'desc' }, take: 2, select: { tradeDate: true } });
    if (dates.length === 0) throw new Error('No ingested data. Run `npm run ingest -- <YYYY-MM-DD>` first.');
    const latest = dates[0].tradeDate;
    const prev = dates[1]?.tradeDate ?? latest;

    const [rows, underlyings, indices, universe, hist, ivRows, fii] = await Promise.all([
      prisma.foContractEod.findMany({ where: { tradeDate: latest } }),
      prisma.underlyingEod.findMany({ where: { tradeDate: latest } }),
      prisma.indexEod.findMany({ where: { tradeDate: latest } }),
      prisma.universeSymbol.findMany(),
      prisma.underlyingEod.findMany({ orderBy: { tradeDate: 'asc' }, where: { tradeDate: { gte: new Date(latest.getTime() - HISTORY_DAYS * 1.6 * 86_400_000) } }, select: { tradeDate: true, symbol: true, close: true, futVolume: true } }),
      prisma.ivDaily.findMany({ orderBy: { tradeDate: 'asc' }, where: { tradeDate: { gte: new Date(latest.getTime() - HISTORY_DAYS * 1.6 * 86_400_000) } } }),
      prisma.fiiDiiDaily.findMany({ orderBy: { tradeDate: 'asc' }, take: 30 }),
    ]);

    const contracts: FoContract[] = rows.map((r) => ({
      tradeDate: toIsoDate(r.tradeDate),
      symbol: r.symbol,
      instrumentType: r.instrumentType as FoContract['instrumentType'],
      expiry: toIsoDate(r.expiry),
      strike: r.strike,
      optionType: (r.optionType as FoContract['optionType']) ?? null,
      open: r.open, high: r.high, low: r.low, close: r.close, last: r.last, prevClose: r.prevClose,
      underlyingPrice: r.underlyingPrice, settle: r.settle, oi: r.oi, chgOi: r.chgOi, volume: r.volume,
      turnover: r.turnover, trades: r.trades, lotSize: r.lotSize,
    }));

    const underlyingHistory: Record<string, HistoryPoint[]> = {};
    for (const h of hist) (underlyingHistory[h.symbol] ??= []).push({ date: toIsoDate(h.tradeDate), close: h.close, volume: h.futVolume });

    const ivHistory: Record<string, IvPoint[]> = {};
    const straddleHistory: Record<string, StraddlePoint[]> = {};
    for (const r of ivRows) {
      if (r.atmIv != null) (ivHistory[r.symbol] ??= []).push({ date: toIsoDate(r.tradeDate), atmIv: r.atmIv });
      (straddleHistory[r.symbol] ??= []).push({ date: toIsoDate(r.tradeDate), expiry: toIsoDate(r.expiry), atmStrike: r.atmStrike, spot: r.spot, straddlePrice: r.straddlePrice, daysToExpiry: r.daysToExpiry });
    }
    // Straddle history is only meaningful for the current near expiry.
    for (const s of Object.keys(straddleHistory)) {
      const cur = straddleHistory[s][straddleHistory[s].length - 1]?.expiry;
      straddleHistory[s] = straddleHistory[s].filter((p) => p.expiry === cur);
    }

    return {
      tradeDate: toIsoDate(latest),
      prevTradeDate: toIsoDate(prev),
      source: 'bhavcopy',
      generatedAt: new Date().toISOString(),
      universe: universe.map((u) => ({ symbol: u.symbol, name: u.name, sector: u.sector, isIndex: u.isIndex, lotSize: u.lotSize })),
      contracts,
      underlyings: underlyings.map((u) => ({ tradeDate: toIsoDate(u.tradeDate), symbol: u.symbol, close: u.close, prevClose: u.prevClose, futVolume: u.futVolume, futVolumeAvg20: u.futVolumeAvg20, isIndex: u.isIndex, sector: u.sector })),
      indices: indices.map((i) => ({ tradeDate: toIsoDate(i.tradeDate), name: i.name, close: i.close, prevClose: i.prevClose })),
      underlyingHistory,
      ivHistory,
      straddleHistory,
      fiiDii: fii.map((f) => ({ date: toIsoDate(f.tradeDate), fiiNet: f.fiiNet, diiNet: f.diiNet })),
    };
  }
}
