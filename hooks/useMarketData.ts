import { useMutation, useQuery } from '@tanstack/react-query';
import { getDataSource } from '@/services/data';
import { useAppSettingsStore } from '@/stores/appSettingsStore';
import type { ToolRequest } from '@/types';

/** All queries are keyed by the active data source so switching mock ↔ api refetches cleanly. */
function useSourceKey() {
  return useAppSettingsStore((s) => s.dataSource);
}

const STALE = 5 * 60 * 1000; // EOD data: nothing changes intraday

export function useMarketStatus() {
  const k = useSourceKey();
  return useQuery({ queryKey: [k, 'status'], queryFn: () => getDataSource().status(), staleTime: STALE });
}
export function useMarketPulse() {
  const k = useSourceKey();
  return useQuery({ queryKey: [k, 'pulse'], queryFn: () => getDataSource().pulse(), staleTime: STALE });
}
export function useSectors() {
  const k = useSourceKey();
  return useQuery({ queryKey: [k, 'sectors'], queryFn: () => getDataSource().sectors(), staleTime: STALE });
}
export function useHeatmap() {
  const k = useSourceKey();
  return useQuery({ queryKey: [k, 'heatmap'], queryFn: () => getDataSource().heatmap(), staleTime: STALE });
}
export function useUniverse() {
  const k = useSourceKey();
  return useQuery({ queryKey: [k, 'universe'], queryFn: () => getDataSource().universe(), staleTime: STALE });
}
export function useUnderlying(symbol: string | undefined) {
  const k = useSourceKey();
  return useQuery({ queryKey: [k, 'underlying', symbol], queryFn: () => getDataSource().underlying(symbol!), enabled: !!symbol, staleTime: STALE });
}
export function useScreeners() {
  const k = useSourceKey();
  return useQuery({ queryKey: [k, 'screeners'], queryFn: () => getDataSource().screeners(), staleTime: Infinity });
}
export function useScreenerRun(id: string | undefined, params: Record<string, string | number>, limit = 100) {
  const k = useSourceKey();
  return useQuery({ queryKey: [k, 'screener', id, params, limit], queryFn: () => getDataSource().runScreener(id!, params, limit), enabled: !!id, staleTime: STALE, placeholderData: (prev) => prev });
}
export function useExpiries(symbol: string | undefined) {
  const k = useSourceKey();
  return useQuery({ queryKey: [k, 'expiries', symbol], queryFn: () => getDataSource().expiries(symbol!), enabled: !!symbol, staleTime: STALE });
}
export function useChain(symbol: string | undefined, expiry?: string) {
  const k = useSourceKey();
  return useQuery({ queryKey: [k, 'chain', symbol, expiry ?? 'near'], queryFn: () => getDataSource().chain(symbol!, expiry), enabled: !!symbol, staleTime: STALE, placeholderData: (prev) => prev });
}
export function useIvHistory(symbol: string | undefined) {
  const k = useSourceKey();
  return useQuery({ queryKey: [k, 'iv', symbol], queryFn: () => getDataSource().ivHistory(symbol!), enabled: !!symbol, staleTime: STALE });
}
export function useStraddleHistory(symbol: string | undefined) {
  const k = useSourceKey();
  return useQuery({ queryKey: [k, 'straddle', symbol], queryFn: () => getDataSource().straddleHistory(symbol!), enabled: !!symbol, staleTime: STALE });
}
export function useMarginMutation() {
  return useMutation({ mutationFn: (req: ToolRequest) => getDataSource().margin(req) });
}
export function usePayoffMutation() {
  return useMutation({ mutationFn: (req: ToolRequest) => getDataSource().payoff(req) });
}
/** Query form of payoff/margin for live-updating builders (re-runs when legs change). */
export function usePayoffQuery(req: ToolRequest | null) {
  const k = useSourceKey();
  return useQuery({ queryKey: [k, 'payoff', req], queryFn: () => getDataSource().payoff(req!), enabled: !!req && req.legs.length > 0, staleTime: STALE, placeholderData: (prev) => prev });
}
export function useMarginQuery(req: ToolRequest | null) {
  const k = useSourceKey();
  return useQuery({ queryKey: [k, 'margin', req], queryFn: () => getDataSource().margin(req!), enabled: !!req && req.legs.length > 0, staleTime: STALE, placeholderData: (prev) => prev });
}
export function useWatchlistRows(symbols: string[]) {
  const k = useSourceKey();
  const key = symbols.join(',');
  return useQuery({ queryKey: [k, 'watchlist', key], queryFn: () => getDataSource().watchlist(key ? key.split(',') : []), staleTime: STALE, placeholderData: (prev) => prev });
}
export function useNews(symbols: string[]) {
  const k = useSourceKey();
  const key = symbols.join(',');
  return useQuery({ queryKey: [k, 'news', key], queryFn: () => getDataSource().news(key ? key.split(',') : []), staleTime: 10 * 60 * 1000 });
}
