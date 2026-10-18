/**
 * Offline data source: runs the shared analytics engine on the deterministic mock market,
 * entirely on-device. Used by default so the app is testable on web and iOS without a backend.
 */
import {
  generateMockMarket, marketPulse, sectorPerformance, heatmapData, underlyingDetail, listScreeners, runScreener,
  listExpiries, buildChain, ivStats, marginForRequest, payoffForRequest, watchlistRows, generateMockNews,
  type MarketDataset,
} from '@/backend/src/shared';
import type { DataSource } from './types';
import { NotFoundError } from './types';

let dataset: MarketDataset | null = null;
function ds(): MarketDataset {
  if (!dataset) dataset = generateMockMarket();
  return dataset;
}

/** Small artificial latency so loading states are exercised like a network source. */
const latency = () => new Promise<void>((r) => setTimeout(r, 120));

export const mockSource: DataSource = {
  kind: 'mock',
  async status() {
    await latency();
    const d = ds();
    return { tradeDate: d.tradeDate, prevTradeDate: d.prevTradeDate, dataMode: 'EOD', source: d.source, generatedAt: d.generatedAt, contractCount: d.contracts.length, underlyingCount: d.underlyings.length };
  },
  async pulse() { await latency(); return marketPulse(ds()); },
  async sectors() { await latency(); return sectorPerformance(ds()); },
  async heatmap() { await latency(); return heatmapData(ds()); },
  async universe() { await latency(); return ds().universe; },
  async underlying(symbol) {
    await latency();
    const d = underlyingDetail(ds(), symbol);
    if (!d) throw new NotFoundError(`Unknown underlying ${symbol}`);
    return d;
  },
  async screeners() { await latency(); return listScreeners(); },
  async runScreener(id, params = {}, limit = 100) { await latency(); return runScreener(id, ds(), params, limit); },
  async expiries(symbol) {
    await latency();
    const e = listExpiries(ds(), symbol.toUpperCase());
    if (e.length === 0) throw new NotFoundError(`No option contracts for ${symbol}`);
    return e;
  },
  async chain(symbol, expiry) {
    await latency();
    const c = buildChain(ds(), symbol.toUpperCase(), expiry);
    if (!c) throw new NotFoundError(`No option chain for ${symbol}`);
    return c;
  },
  async ivHistory(symbol) {
    await latency();
    const points = ds().ivHistory[symbol.toUpperCase()];
    if (!points) throw new NotFoundError(`No IV history for ${symbol}`);
    return { symbol: symbol.toUpperCase(), points, stats: ivStats(points) };
  },
  async straddleHistory(symbol) {
    await latency();
    const points = ds().straddleHistory[symbol.toUpperCase()];
    if (!points) throw new NotFoundError(`No straddle history for ${symbol}`);
    return { symbol: symbol.toUpperCase(), points };
  },
  async margin(req) {
    await latency();
    const r = marginForRequest(ds(), req);
    if (!r) throw new NotFoundError(`Unknown underlying ${req.symbol}`);
    return r;
  },
  async payoff(req) {
    await latency();
    const r = payoffForRequest(ds(), req);
    if (!r) throw new NotFoundError(`Unknown underlying ${req.symbol}`);
    return r;
  },
  async watchlist(symbols) { await latency(); return watchlistRows(ds(), symbols.map((s) => s.toUpperCase())); },
  async news() { await latency(); return { items: generateMockNews(ds()), source: 'mock' as const }; },
};
