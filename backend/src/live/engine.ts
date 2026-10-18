import type { WebSocket } from 'ws';
import {
  LiveSnapshot, selectLiveUniverse, runLiveScreener, liveQuotes, isLiveScreener,
  type LiveStatus, type LiveTick, type MarketDataset, type LiveProviderKind, type LiveScreenerId, type ParamValue,
} from '../shared';
import type { LiveProvider } from './provider';
import { SimulatedProvider } from './simulatedProvider';
import { KiteProvider } from './kiteProvider';
import { getKiteConfig, isSessionValid, loadKiteSession } from './kiteSession';

interface ClientState {
  ws: WebSocket;
  screeners: Map<LiveScreenerId, Record<string, ParamValue>>;
  watch: Set<string>;
}

export interface LiveEngineOptions {
  screenerIntervalMs?: number;
  quoteIntervalMs?: number;
  simulator?: { intervalMs?: number; speed?: number; seed?: number; startProgress?: number };
  log?: (m: string) => void;
}

/**
 * Owns the single upstream feed, the in-memory snapshot, periodic live-screener runs, and
 * fan-out to WebSocket clients. One instance per process.
 */
export class LiveEngine {
  readonly snap = new LiveSnapshot();
  private provider: LiveProvider | null = null;
  private status: LiveStatus = { provider: 'none', connected: false, subscribed: 0, lastTickAt: null, ticksPerSec: 0, sessionProgress: 0, marketOpen: false };
  private clients = new Set<ClientState>();
  private timers: ReturnType<typeof setInterval>[] = [];
  private tickCount = 0;
  private screenerCache = new Map<string, { rows: ReturnType<typeof runLiveScreener>; at: number }>();
  private readonly log: (m: string) => void;

  constructor(private getDataset: () => Promise<MarketDataset>, private opts: LiveEngineOptions = {}) {
    this.log = opts.log ?? (() => {});
  }

  getStatus(): LiveStatus {
    return { ...this.status, ...this.sessionPatch() };
  }

  private sessionPatch(): Pick<LiveStatus, 'sessionProgress' | 'marketOpen'> {
    const s = this.provider?.session() ?? { progress: 0, open: false };
    return { sessionProgress: s.progress, marketOpen: s.open };
  }

  /** Resolve the provider from env + Kite session state. */
  async resolveProviderKind(): Promise<LiveProviderKind> {
    const env = (process.env.LIVE_PROVIDER || 'simulated').toLowerCase();
    if (env === 'off' || env === 'none') return 'none';
    if (env === 'kite') {
      const cfg = getKiteConfig();
      const session = await loadKiteSession();
      if (cfg && isSessionValid(session)) return 'kite';
      this.status.note = cfg ? 'Kite configured but not logged in — using simulated ticks' : 'Kite API key not configured — using simulated ticks';
      return 'simulated';
    }
    return 'simulated';
  }

  async start(kind?: LiveProviderKind): Promise<void> {
    await this.stop();
    const ds = await this.getDataset();
    const resolved = kind ?? (await this.resolveProviderKind());
    if (resolved === 'none') {
      this.status = { ...this.status, provider: 'none', connected: false, subscribed: 0 };
      this.broadcastStatus();
      return;
    }
    let provider: LiveProvider;
    if (resolved === 'kite') {
      const cfg = getKiteConfig()!;
      const session = (await loadKiteSession())!;
      provider = new KiteProvider({ apiKey: cfg.apiKey, accessToken: session.accessToken, log: this.log });
    } else {
      provider = new SimulatedProvider(ds, this.opts.simulator);
    }
    this.provider = provider;
    this.status = { ...this.status, provider: provider.kind, connected: false, note: undefined };
    provider.onStatus((patch) => {
      this.status = { ...this.status, ...patch };
      this.broadcastStatus();
    });
    provider.onTicks((ticks) => this.ingest(ticks));
    const contracts = selectLiveUniverse(ds, { maxKeys: resolved === 'kite' ? 2800 : 1200 });
    try {
      await provider.connect(contracts);
    } catch (e) {
      this.status = { ...this.status, connected: false, note: `Connect failed: ${e instanceof Error ? e.message : e}` };
      this.log(`live: connect failed: ${e instanceof Error ? e.message : e}`);
    }
    this.timers.push(setInterval(() => this.pushScreeners(ds), this.opts.screenerIntervalMs ?? 2000));
    this.timers.push(setInterval(() => this.pushQuotes(ds), this.opts.quoteIntervalMs ?? 1000));
    this.timers.push(setInterval(() => { this.status.ticksPerSec = this.tickCount / 5; this.tickCount = 0; this.broadcastStatus(); }, 5000));
    this.broadcastStatus();
  }

  async stop(): Promise<void> {
    for (const t of this.timers) clearInterval(t);
    this.timers = [];
    await this.provider?.disconnect();
    this.provider = null;
    this.snap.clear();
    this.screenerCache.clear();
  }

  private ingest(ticks: LiveTick[]): void {
    for (const t of ticks) this.snap.apply(t);
    this.tickCount += ticks.length;
    this.status.lastTickAt = this.snap.lastTickAt;
  }

  async screener(id: LiveScreenerId, params: Record<string, unknown> = {}, limit = 50) {
    const ds = await this.getDataset();
    return runLiveScreener(id, { ds, snap: this.snap, sessionProgress: this.sessionPatch().sessionProgress }, params, limit);
  }

  async quotes(symbols: string[]) {
    const ds = await this.getDataset();
    return liveQuotes(ds, this.snap, symbols);
  }

  // ---------- WebSocket fan-out ----------

  addClient(ws: WebSocket): void {
    const client: ClientState = { ws, screeners: new Map(), watch: new Set() };
    this.clients.add(client);
    ws.on('message', (data) => this.handleMessage(client, data.toString()));
    ws.on('close', () => this.clients.delete(client));
    ws.on('error', () => this.clients.delete(client));
    this.send(client, { type: 'status', status: this.getStatus() });
  }

  private handleMessage(client: ClientState, raw: string): void {
    let msg: any;
    try { msg = JSON.parse(raw); } catch { return; }
    if (msg?.type === 'ping') return this.send(client, { type: 'pong', ts: Date.now() });
    if (msg?.type === 'subscribe') {
      if (Array.isArray(msg.screeners)) {
        client.screeners.clear();
        for (const s of msg.screeners) if (s && isLiveScreener(s.id)) client.screeners.set(s.id, s.params ?? {});
      }
      if (Array.isArray(msg.watch)) client.watch = new Set(msg.watch.map((s: unknown) => String(s).toUpperCase()));
      // Immediate snapshot so the UI doesn't wait for the next tick cycle
      void this.getDataset().then((ds) => { this.pushScreeners(ds, client); this.pushQuotes(ds, client); });
    }
  }

  private send(client: ClientState, payload: unknown): void {
    if (client.ws.readyState === client.ws.OPEN) client.ws.send(JSON.stringify(payload));
  }

  private broadcastStatus(): void {
    const payload = { type: 'status', status: this.getStatus() };
    for (const c of this.clients) this.send(c, payload);
  }

  private pushScreeners(ds: MarketDataset, only?: ClientState): void {
    const targets = only ? [only] : Array.from(this.clients);
    const now = Date.now();
    const ctx = { ds, snap: this.snap, sessionProgress: this.sessionPatch().sessionProgress, now };
    for (const c of targets) {
      for (const [id, params] of c.screeners) {
        const cacheKey = `${id}:${JSON.stringify(params)}`;
        let hit = this.screenerCache.get(cacheKey);
        if (!hit || now - hit.at > 1500) {
          hit = { rows: runLiveScreener(id, ctx, params, 50), at: now };
          this.screenerCache.set(cacheKey, hit);
        }
        this.send(c, { type: 'screener', id, ...hit.rows, asOf: now });
      }
    }
  }

  private pushQuotes(ds: MarketDataset, only?: ClientState): void {
    const targets = only ? [only] : Array.from(this.clients);
    for (const c of targets) {
      if (c.watch.size === 0) continue;
      this.send(c, { type: 'quotes', quotes: liveQuotes(ds, this.snap, Array.from(c.watch)) });
    }
  }

  get clientCount(): number {
    return this.clients.size;
  }
}

let engine: LiveEngine | null = null;
export function getLiveEngine(getDataset: () => Promise<MarketDataset>, opts?: LiveEngineOptions): LiveEngine {
  if (!engine) engine = new LiveEngine(getDataset, opts);
  return engine;
}
export function setLiveEngine(e: LiveEngine | null): void {
  engine = e;
}
