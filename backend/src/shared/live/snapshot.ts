import type { ContractKey, LiveTick } from './types';

interface Sample { ts: number; ltp: number; volume: number }

const SAMPLE_EVERY_MS = 1000;
const MAX_SAMPLES = 900; // 15 minutes at 1/s

/** Latest tick per contract plus a short rolling history for N-minute change math. */
export class LiveSnapshot {
  private ticks = new Map<ContractKey, LiveTick>();
  private history = new Map<ContractKey, Sample[]>();
  lastTickAt: number | null = null;

  apply(tick: LiveTick): void {
    this.ticks.set(tick.key, tick);
    this.lastTickAt = tick.ts;
    let h = this.history.get(tick.key);
    if (!h) {
      h = [];
      this.history.set(tick.key, h);
    }
    const last = h[h.length - 1];
    if (!last || tick.ts - last.ts >= SAMPLE_EVERY_MS) {
      h.push({ ts: tick.ts, ltp: tick.ltp, volume: tick.volume });
      if (h.length > MAX_SAMPLES) h.splice(0, h.length - MAX_SAMPLES);
    } else {
      last.ltp = tick.ltp;
      last.volume = tick.volume;
    }
  }

  get(key: ContractKey): LiveTick | undefined {
    return this.ticks.get(key);
  }

  all(): IterableIterator<LiveTick> {
    return this.ticks.values();
  }

  get size(): number {
    return this.ticks.size;
  }

  /** Change versus the oldest sample within `windowMs` (null until there is history). */
  changeOver(key: ContractKey, windowMs: number, now?: number): { ltpChangePct: number; volumeDelta: number; spanMs: number } | null {
    const h = this.history.get(key);
    const cur = this.ticks.get(key);
    if (!h || !cur || h.length < 2) return null;
    const t = (now ?? cur.ts) - windowMs;
    let base: Sample = h[0];
    for (let i = 0; i < h.length; i++) {
      if (h[i].ts <= t) base = h[i];
      else break;
    }
    if (base.ts === cur.ts) return null;
    return {
      ltpChangePct: base.ltp > 0 ? ((cur.ltp - base.ltp) / base.ltp) * 100 : 0,
      volumeDelta: Math.max(cur.volume - base.volume, 0),
      spanMs: cur.ts - base.ts,
    };
  }

  clear(): void {
    this.ticks.clear();
    this.history.clear();
    this.lastTickAt = null;
  }
}
