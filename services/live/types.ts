import type { LiveStatus, LiveQuote, ScreenerRow, ParamValue, LiveScreenerId } from '@/backend/src/shared';

export type LiveEvent =
  | { type: 'status'; status: LiveStatus }
  | { type: 'quotes'; quotes: LiveQuote[] }
  | { type: 'screener'; id: LiveScreenerId; rows: ScreenerRow[]; total: number; params: Record<string, ParamValue>; asOf: number };

export interface LiveSubscription {
  screeners: Array<{ id: LiveScreenerId; params: Record<string, ParamValue> }>;
  watch: string[];
}

export interface LiveClient {
  readonly kind: 'local' | 'ws';
  connect(onEvent: (e: LiveEvent) => void): void;
  subscribe(sub: LiveSubscription): void;
  disconnect(): void;
}
