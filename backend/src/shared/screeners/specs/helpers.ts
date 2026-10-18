import type { FoContract, MarketDataset } from '../../types';
import { listExpiries } from '../../analytics/chain';

export const pct = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : 0);
export const trendOf = (x: number): 'up' | 'down' | 'flat' => (x > 0 ? 'up' : x < 0 ? 'down' : 'flat');

export function contractLabel(c: FoContract): string {
  if (c.instrumentType === 'IDF' || c.instrumentType === 'STF') return `${c.symbol} FUT ${c.expiry.slice(5)}`;
  return `${c.symbol} ${c.strike} ${c.optionType} ${c.expiry.slice(5)}`;
}

/** Option contracts filtered to near expiry per symbol when expiryMode === 'near'. */
export function optionContracts(ds: MarketDataset, expiryMode: string): FoContract[] {
  const opts = ds.contracts.filter((c) => c.optionType != null);
  if (expiryMode !== 'near') return opts;
  const near = new Map<string, string>();
  for (const c of opts) if (!near.has(c.symbol)) near.set(c.symbol, listExpiries(ds, c.symbol)[0]);
  return opts.filter((c) => near.get(c.symbol) === c.expiry);
}

export const EXPIRY_PARAM = {
  key: 'expiryMode',
  label: 'Expiry',
  type: 'select' as const,
  default: 'near',
  options: [
    { label: 'Near', value: 'near' },
    { label: 'All', value: 'all' },
  ],
};

export const SYMBOL_KIND_PARAM = {
  key: 'kind',
  label: 'Universe',
  type: 'select' as const,
  default: 'all',
  options: [
    { label: 'All', value: 'all' },
    { label: 'Indices', value: 'index' },
    { label: 'Stocks', value: 'stock' },
  ],
};

export function kindFilter(ds: MarketDataset, kind: string): (symbol: string) => boolean {
  if (kind === 'all') return () => true;
  const idx = new Set(ds.universe.filter((u) => u.isIndex).map((u) => u.symbol));
  return kind === 'index' ? (s) => idx.has(s) : (s) => !idx.has(s);
}
