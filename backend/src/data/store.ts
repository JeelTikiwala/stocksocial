import type { MarketDataset, MarketStatus } from '../shared';
import { MemoryDataStore } from './memoryStore';
import { PrismaDataStore } from './prismaStore';

export interface DataStore {
  readonly kind: 'memory' | 'prisma';
  getDataset(): Promise<MarketDataset>;
  getStatus(): Promise<MarketStatus>;
  /** Drop any cached dataset so the next read reloads (used after ingestion). */
  invalidate(): void;
}

let instance: DataStore | null = null;

export function resolveStoreKind(): 'memory' | 'prisma' {
  const forced = process.env.DATA_STORE;
  if (forced === 'memory' || forced === 'prisma') return forced;
  return process.env.DATABASE_URL ? 'prisma' : 'memory';
}

export function getDataStore(): DataStore {
  if (!instance) {
    instance = resolveStoreKind() === 'prisma' ? new PrismaDataStore() : new MemoryDataStore();
  }
  return instance;
}

/** Test hook. */
export function setDataStore(store: DataStore | null): void {
  instance = store;
}

export function statusOf(ds: MarketDataset): MarketStatus {
  return {
    tradeDate: ds.tradeDate,
    prevTradeDate: ds.prevTradeDate,
    dataMode: 'EOD',
    source: ds.source,
    generatedAt: ds.generatedAt,
    contractCount: ds.contracts.length,
    underlyingCount: ds.underlyings.length,
  };
}
