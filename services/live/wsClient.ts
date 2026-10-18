/** Backend WebSocket feed (`/ws`) with reconnect/backoff. Uses RN's built-in WebSocket (works on web). */
import type { LiveClient, LiveEvent, LiveSubscription } from './types';

export function wsUrlFromApi(apiUrl: string): string {
  return apiUrl.replace(/^http/, 'ws').replace(/\/v1\/?$/, '') + '/ws';
}

export class WsLiveClient implements LiveClient {
  readonly kind = 'ws' as const;
  private ws: WebSocket | null = null;
  private onEvent: ((e: LiveEvent) => void) | null = null;
  private sub: LiveSubscription = { screeners: [], watch: [] };
  private attempts = 0;
  private closedByUser = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private url: string) {}

  connect(onEvent: (e: LiveEvent) => void): void {
    this.closedByUser = false;
    this.onEvent = onEvent;
    this.open();
  }

  private open(): void {
    try {
      const ws = new WebSocket(this.url);
      this.ws = ws;
      ws.onopen = () => {
        this.attempts = 0;
        this.sendSub();
      };
      ws.onmessage = (ev) => {
        try {
          const m = JSON.parse(String(ev.data));
          if (m.type === 'status' || m.type === 'quotes' || m.type === 'screener') this.onEvent?.(m as LiveEvent);
        } catch { /* ignore malformed */ }
      };
      ws.onerror = () => { /* onclose follows */ };
      ws.onclose = () => {
        this.onEvent?.({ type: 'status', status: { provider: 'none', connected: false, subscribed: 0, lastTickAt: null, ticksPerSec: 0, sessionProgress: 0, marketOpen: false, note: this.closedByUser ? undefined : 'Reconnecting to live server…' } });
        if (!this.closedByUser) this.scheduleReconnect();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(1000 * 2 ** this.attempts, 15000);
    this.attempts++;
    this.reconnectTimer = setTimeout(() => this.open(), delay);
  }

  private sendSub(): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: 'subscribe', ...this.sub }));
  }

  subscribe(sub: LiveSubscription): void {
    this.sub = sub;
    this.sendSub();
  }

  disconnect(): void {
    this.closedByUser = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}
