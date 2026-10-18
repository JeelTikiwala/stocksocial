/**
 * Single live connection per app, driven by what mounted screens want. Hooks register
 * desired screeners/symbols; the manager debounces into one subscribe message and picks the
 * client from the active data source (mock → on-device simulator, api → backend WebSocket).
 */
import { useAppSettingsStore } from '@/stores/appSettingsStore';
import { useLiveStore } from '@/stores/liveStore';
import type { LiveScreenerId, ParamValue } from '@/backend/src/shared';
import type { LiveClient, LiveEvent } from './types';
import { LocalLiveClient } from './localClient';
import { WsLiveClient, wsUrlFromApi } from './wsClient';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/v1';

class LiveManager {
  private client: LiveClient | null = null;
  private clientKind: 'local' | 'ws' | null = null;
  private screenerRefs = new Map<string, { id: LiveScreenerId; params: Record<string, ParamValue>; count: number }>();
  private watchRefs = new Map<string, number>();
  private pending: ReturnType<typeof setTimeout> | null = null;
  private started = false;

  private onEvent = (e: LiveEvent) => {
    const st = useLiveStore.getState();
    if (e.type === 'status') st.setStatus(e.status);
    else if (e.type === 'quotes') st.setQuotes(e.quotes);
    else st.setScreener(e.id, { rows: e.rows, total: e.total, params: e.params, asOf: e.asOf });
  };

  /** Call once (root layout). Re-evaluates the client when the data source or enabled flag changes. */
  start(): void {
    if (this.started) return;
    this.started = true;
    this.ensureClient();
    useAppSettingsStore.subscribe((s, prev) => { if (s.dataSource !== prev.dataSource) this.ensureClient(true); });
    useLiveStore.subscribe((s, prev) => { if (s.enabled !== prev.enabled) this.ensureClient(true); });
  }

  private ensureClient(force = false): void {
    const enabled = useLiveStore.getState().enabled;
    const wanted: 'local' | 'ws' | null = !enabled ? null : useAppSettingsStore.getState().dataSource === 'api' ? 'ws' : 'local';
    if (!force && wanted === this.clientKind && this.client) return;
    this.client?.disconnect();
    this.client = null;
    this.clientKind = wanted;
    useLiveStore.getState().reset();
    if (!wanted) return;
    this.client = wanted === 'ws' ? new WsLiveClient(wsUrlFromApi(API_URL)) : new LocalLiveClient();
    this.client.connect(this.onEvent);
    this.flush();
  }

  private key(id: string, params: Record<string, ParamValue>) {
    return `${id}:${JSON.stringify(params)}`;
  }

  addScreener(id: LiveScreenerId, params: Record<string, ParamValue>): () => void {
    const k = this.key(id, params);
    const cur = this.screenerRefs.get(k) ?? { id, params, count: 0 };
    cur.count++;
    this.screenerRefs.set(k, cur);
    this.schedule();
    return () => {
      const c = this.screenerRefs.get(k);
      if (!c) return;
      c.count--;
      if (c.count <= 0) this.screenerRefs.delete(k);
      this.schedule();
    };
  }

  addWatch(symbols: string[]): () => void {
    for (const s of symbols) this.watchRefs.set(s, (this.watchRefs.get(s) ?? 0) + 1);
    this.schedule();
    return () => {
      for (const s of symbols) {
        const c = (this.watchRefs.get(s) ?? 1) - 1;
        if (c <= 0) this.watchRefs.delete(s);
        else this.watchRefs.set(s, c);
      }
      this.schedule();
    };
  }

  private schedule(): void {
    if (this.pending) clearTimeout(this.pending);
    this.pending = setTimeout(() => this.flush(), 150);
  }

  private flush(): void {
    this.pending = null;
    if (!this.client) return;
    // One entry per screener id: the most recently registered params win.
    const byId = new Map<LiveScreenerId, Record<string, ParamValue>>();
    for (const r of this.screenerRefs.values()) byId.set(r.id, r.params);
    this.client.subscribe({ screeners: Array.from(byId, ([id, params]) => ({ id, params })), watch: Array.from(this.watchRefs.keys()) });
  }
}

export const liveManager = new LiveManager();
