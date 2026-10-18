/** Orchestrates one day's ingestion: fetch → derive → persist (Postgres) or print (dry run). */
import { prisma } from '../db';
import { parseIsoDate, toIsoDate, type FoContract, type HistoryPoint, type IvPoint, type MarketDataset, type StraddlePoint } from '../shared';
import { fetchBhavcopy } from './bhavcopy';
import { fetchIndices } from './indices';
import { deriveDataset } from './derive';

export interface IngestOptions {
  dryRun?: boolean;
  /** Pre-fetched contracts (tests / offline). */
  contracts?: FoContract[];
  indices?: MarketDataset['indices'];
  log?: (msg: string) => void;
}

export interface IngestSummary {
  tradeDate: string;
  contracts: number;
  underlyings: number;
  indices: number;
  ivComputed: number;
  persisted: boolean;
}

async function loadHistory(before: string) {
  const until = parseIsoDate(before);
  const since = new Date(until.getTime() - 400 * 86_400_000);
  const [u, iv] = await Promise.all([
    prisma.underlyingEod.findMany({ where: { tradeDate: { gte: since, lt: until } }, orderBy: { tradeDate: 'asc' }, select: { tradeDate: true, symbol: true, close: true, futVolume: true } }),
    prisma.ivDaily.findMany({ where: { tradeDate: { gte: since, lt: until } }, orderBy: { tradeDate: 'asc' } }),
  ]);
  const underlying: Record<string, HistoryPoint[]> = {};
  const prevClose = new Map<string, number>();
  for (const r of u) {
    (underlying[r.symbol] ??= []).push({ date: toIsoDate(r.tradeDate), close: r.close, volume: r.futVolume });
    prevClose.set(r.symbol, r.close); // ends at the latest prior day
  }
  const ivH: Record<string, IvPoint[]> = {};
  const strH: Record<string, StraddlePoint[]> = {};
  for (const r of iv) {
    if (r.atmIv != null) (ivH[r.symbol] ??= []).push({ date: toIsoDate(r.tradeDate), atmIv: r.atmIv });
    (strH[r.symbol] ??= []).push({ date: toIsoDate(r.tradeDate), expiry: toIsoDate(r.expiry), atmStrike: r.atmStrike, spot: r.spot, straddlePrice: r.straddlePrice, daysToExpiry: r.daysToExpiry });
  }
  const prevDate = u.length ? toIsoDate(u[u.length - 1].tradeDate) : undefined;
  return { history: { underlying, iv: ivH, straddle: strH }, prevClose, prevDate };
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

export async function ingestDate(isoDate: string, opts: IngestOptions = {}): Promise<IngestSummary> {
  const log = opts.log ?? (() => {});
  const contracts = opts.contracts ?? (await fetchBhavcopy(isoDate));
  if (contracts.length === 0) throw new Error(`No contracts in bhavcopy for ${isoDate} (holiday?)`);
  log(`bhavcopy: ${contracts.length} contracts`);
  let indices = opts.indices;
  if (!indices) {
    try {
      indices = await fetchIndices(isoDate);
      log(`indices: ${indices.length}`);
    } catch (e) {
      log(`indices unavailable: ${e instanceof Error ? e.message : e}`);
      indices = [];
    }
  }

  let history: Awaited<ReturnType<typeof loadHistory>> | null = null;
  if (!opts.dryRun) {
    history = await loadHistory(isoDate);
    log(`history: ${Object.keys(history.history.underlying).length} symbols, prev day ${history.prevDate ?? 'none'}`);
  }

  const ds = deriveDataset({
    tradeDate: isoDate,
    prevTradeDate: history?.prevDate,
    contracts,
    indices,
    prevUnderlyingClose: history?.prevClose,
    history: history?.history,
    source: 'bhavcopy',
  });
  const ivComputed = Object.values(ds.ivHistory).filter((h) => h[h.length - 1]?.date === isoDate).length;
  const summary: IngestSummary = { tradeDate: isoDate, contracts: ds.contracts.length, underlyings: ds.underlyings.length, indices: ds.indices.length, ivComputed, persisted: false };
  if (opts.dryRun) return summary;

  const td = parseIsoDate(isoDate);
  const run = await prisma.ingestionRun.create({ data: { tradeDate: td, source: 'bhavcopy', status: 'running' } });
  try {
    await prisma.$transaction(async (tx) => {
      await tx.foContractEod.deleteMany({ where: { tradeDate: td } });
      for (const part of chunk(ds.contracts, 4000)) {
        await tx.foContractEod.createMany({
          data: part.map((c) => ({ tradeDate: td, symbol: c.symbol, instrumentType: c.instrumentType, expiry: parseIsoDate(c.expiry), strike: c.strike, optionType: c.optionType, open: c.open, high: c.high, low: c.low, close: c.close, last: c.last, prevClose: c.prevClose, underlyingPrice: c.underlyingPrice, settle: c.settle, oi: c.oi, chgOi: c.chgOi, volume: c.volume, turnover: c.turnover, trades: c.trades, lotSize: c.lotSize })),
        });
      }
      await tx.underlyingEod.deleteMany({ where: { tradeDate: td } });
      await tx.underlyingEod.createMany({ data: ds.underlyings.map((u) => ({ tradeDate: td, symbol: u.symbol, close: u.close, prevClose: u.prevClose, futVolume: u.futVolume, futVolumeAvg20: u.futVolumeAvg20, isIndex: u.isIndex, sector: u.sector })) });
      await tx.indexEod.deleteMany({ where: { tradeDate: td } });
      if (ds.indices.length) await tx.indexEod.createMany({ data: ds.indices.map((i) => ({ tradeDate: td, name: i.name, close: i.close, prevClose: i.prevClose })) });
      await tx.ivDaily.deleteMany({ where: { tradeDate: td } });
      const ivRows = ds.underlyings.flatMap((u) => {
        const s = ds.straddleHistory[u.symbol]?.find((p) => p.date === isoDate);
        if (!s) return [];
        const iv = ds.ivHistory[u.symbol]?.find((p) => p.date === isoDate)?.atmIv ?? null;
        return [{ tradeDate: td, symbol: u.symbol, expiry: parseIsoDate(s.expiry), atmIv: iv, atmStrike: s.atmStrike, straddlePrice: s.straddlePrice, spot: s.spot, daysToExpiry: s.daysToExpiry }];
      });
      if (ivRows.length) await tx.ivDaily.createMany({ data: ivRows });
      for (const u of ds.universe) {
        await tx.universeSymbol.upsert({ where: { symbol: u.symbol }, update: { lotSize: u.lotSize, isIndex: u.isIndex, sector: u.sector }, create: { symbol: u.symbol, name: u.name, sector: u.sector, isIndex: u.isIndex, lotSize: u.lotSize } });
      }
    }, { timeout: 120_000 });
    await prisma.ingestionRun.update({ where: { id: run.id }, data: { status: 'success', rows: ds.contracts.length, finishedAt: new Date() } });
    summary.persisted = true;
    return summary;
  } catch (e) {
    await prisma.ingestionRun.update({ where: { id: run.id }, data: { status: 'failed', error: e instanceof Error ? e.message : String(e), finishedAt: new Date() } });
    throw e;
  }
}
