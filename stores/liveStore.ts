import { create } from 'zustand';
import type { LiveStatus, LiveQuote, ScreenerRow, ParamValue, LiveScreenerId } from '@/backend/src/shared';

export interface LiveScreenerState { rows: ScreenerRow[]; total: number; params: Record<string, ParamValue>; asOf: number }

interface LiveState {
  enabled: boolean;
  status: LiveStatus | null;
  quotes: Record<string, LiveQuote>;
  screeners: Partial<Record<LiveScreenerId, LiveScreenerState>>;
  setEnabled: (v: boolean) => void;
  setStatus: (s: LiveStatus) => void;
  setQuotes: (q: LiveQuote[]) => void;
  setScreener: (id: LiveScreenerId, s: LiveScreenerState) => void;
  reset: () => void;
}

export const useLiveStore = create<LiveState>()((set) => ({
  enabled: true,
  status: null,
  quotes: {},
  screeners: {},
  setEnabled: (v) => set({ enabled: v }),
  setStatus: (status) => set({ status }),
  setQuotes: (list) => set((st) => {
    const quotes = { ...st.quotes };
    for (const q of list) quotes[q.symbol] = q;
    return { quotes };
  }),
  setScreener: (id, s) => set((st) => ({ screeners: { ...st.screeners, [id]: s } })),
  reset: () => set({ status: null, quotes: {}, screeners: {} }),
}));
