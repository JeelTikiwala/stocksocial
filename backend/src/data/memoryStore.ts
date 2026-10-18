import { generateMockMarket, type MarketDataset, type MarketStatus } from '../shared';
import type { DataStore } from './store';
import { statusOf } from './store';

/** In-process dataset. Defaults to the deterministic mock market; `set()` lets ingestion or tests swap it. */
export class MemoryDataStore implements DataStore {
  readonly kind = 'memory' as const;
  private dataset: MarketDataset | null = null;

  constructor(initial?: MarketDataset) {
    this.dataset = initial ?? null;
  }

  set(ds: MarketDataset): void {
    this.dataset = ds;
  }

  async getDataset(): Promise<MarketDataset> {
    if (!this.dataset) this.dataset = generateMockMarket();
    return this.dataset;
  }

  async getStatus(): Promise<MarketStatus> {
    return statusOf(await this.getDataset());
  }

  invalidate(): void {
    // Mock data is deterministic; nothing to drop unless a dataset was injected.
  }
}
