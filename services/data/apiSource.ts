/** Backend-backed data source — same interface as the mock, over the Express API. */
import { apiClient } from '@/services/api';
import type { DataSource } from './types';

async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await apiClient.get(url, { params });
  return res.data.data as T;
}
async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await apiClient.post(url, body);
  return res.data.data as T;
}

export const apiSource: DataSource = {
  kind: 'api',
  status: () => get('/market/status'),
  pulse: () => get('/market/pulse'),
  sectors: () => get('/market/sectors'),
  heatmap: () => get('/market/heatmap'),
  universe: () => get('/market/universe'),
  underlying: (symbol) => get(`/market/underlying/${encodeURIComponent(symbol)}`),
  screeners: () => get('/screeners'),
  runScreener: (id, params = {}, limit = 100) => get(`/screeners/${id}`, { ...params, limit }),
  expiries: (symbol) => get(`/options/${encodeURIComponent(symbol)}/expiries`),
  chain: (symbol, expiry) => get(`/options/${encodeURIComponent(symbol)}/chain`, expiry ? { expiry } : undefined),
  ivHistory: (symbol) => get(`/options/${encodeURIComponent(symbol)}/iv-history`),
  straddleHistory: (symbol) => get(`/options/${encodeURIComponent(symbol)}/straddle-history`),
  margin: (req) => post('/tools/margin', req),
  payoff: (req) => post('/tools/payoff', req),
  watchlist: (symbols) => get('/market/watchlist', { symbols: symbols.join(',') }),
  news: (symbols) => get('/news', symbols.length ? { symbols: symbols.join(',') } : undefined),
};
