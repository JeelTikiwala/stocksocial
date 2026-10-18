import { useEffect, useMemo } from 'react';
import { useLiveStore, type LiveScreenerState } from '@/stores/liveStore';
import { liveManager } from '@/services/live/manager';
import type { LiveScreenerId, LiveQuote, LiveStatus, ParamValue } from '@/backend/src/shared';

export function useLiveStatus(): LiveStatus | null {
  return useLiveStore((s) => s.status);
}

export function useLiveEnabled(): [boolean, (v: boolean) => void] {
  const enabled = useLiveStore((s) => s.enabled);
  const setEnabled = useLiveStore((s) => s.setEnabled);
  return [enabled, setEnabled];
}

/** Subscribe to streaming quotes for symbols; returns the quote map slice. */
export function useLiveQuotes(symbols: string[]): Record<string, LiveQuote> {
  const key = symbols.join(',');
  useEffect(() => {
    if (!key) return;
    return liveManager.addWatch(key.split(','));
  }, [key]);
  const all = useLiveStore((s) => s.quotes);
  return useMemo(() => {
    const out: Record<string, LiveQuote> = {};
    for (const s of symbols) if (all[s]) out[s] = all[s];
    return out;
  }, [all, key]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useLiveQuote(symbol: string | undefined): LiveQuote | undefined {
  useEffect(() => (symbol ? liveManager.addWatch([symbol]) : undefined), [symbol]);
  return useLiveStore((s) => (symbol ? s.quotes[symbol] : undefined));
}

/** Subscribe to a live screener with params; returns latest rows. */
export function useLiveScreener(id: LiveScreenerId | undefined, params: Record<string, ParamValue>): LiveScreenerState | undefined {
  const pk = JSON.stringify(params);
  useEffect(() => {
    if (!id) return;
    return liveManager.addScreener(id, JSON.parse(pk));
  }, [id, pk]);
  return useLiveStore((s) => (id ? s.screeners[id] : undefined));
}
