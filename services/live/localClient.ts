/** On-device simulated feed for mock mode: same simulator + live screeners as the backend. */
import { generateMockMarket, TickSimulator, LiveSnapshot, runLiveScreener, liveQuotes, type MarketDataset } from '@/backend/src/shared';
import type { LiveClient, LiveEvent, LiveSubscription } from './types';

export class LocalLiveClient implements LiveClient {
  readonly kind = 'local' as const;
  private ds: MarketDataset | null = null;
  private sim: TickSimulator | null = null;
  private snap = new LiveSnapshot();
  private sub: LiveSubscription = { screeners: [], watch: [] };
  private onEvent: ((e: LiveEvent) => void) | null = null;
  private timers: ReturnType<typeof setInterval>[] = [];
  private tickCount = 0;

  connect(onEvent: (e: LiveEvent) => void): void {
    this.disconnect();
    this.onEvent = onEvent;
    this.ds = generateMockMarket();
    this.sim = new TickSimulator(this.ds, { seed: 11, intervalMs: 1000, speed: 45, maxKeys: 700, startProgress: 0.2 });
    this.sim.start((ticks) => {
      for (const t of ticks) this.snap.apply(t);
      this.tickCount += ticks.length;
    });
    this.emitStatus();
    this.timers.push(setInterval(() => this.pushQuotes(), 1000));
    this.timers.push(setInterval(() => this.pushScreeners(), 2000));
    this.timers.push(setInterval(() => { this.emitStatus(this.tickCount / 5); this.tickCount = 0; }, 5000));
  }

  private emitStatus(tps = 0): void {
    if (!this.sim) return;
    this.onEvent?.({ type: 'status', status: { provider: 'simulated', connected: this.sim.running, subscribed: this.sim.contracts.length, lastTickAt: this.snap.lastTickAt, ticksPerSec: tps, sessionProgress: this.sim.progress(), marketOpen: this.sim.running, note: 'Simulated on-device (mock mode)' } });
  }

  subscribe(sub: LiveSubscription): void {
    this.sub = sub;
    this.pushQuotes();
    this.pushScreeners();
  }

  private pushQuotes(): void {
    if (!this.ds || this.sub.watch.length === 0) return;
    this.onEvent?.({ type: 'quotes', quotes: liveQuotes(this.ds, this.snap, this.sub.watch) });
  }

  private pushScreeners(): void {
    if (!this.ds || !this.sim) return;
    const ctx = { ds: this.ds, snap: this.snap, sessionProgress: this.sim.progress(), now: Date.now() };
    for (const s of this.sub.screeners) {
      const r = runLiveScreener(s.id, ctx, s.params, 50);
      this.onEvent?.({ type: 'screener', id: s.id, ...r, asOf: Date.now() });
    }
  }

  disconnect(): void {
    this.sim?.stop();
    this.sim = null;
    for (const t of this.timers) clearInterval(t);
    this.timers = [];
    this.snap.clear();
  }
}
