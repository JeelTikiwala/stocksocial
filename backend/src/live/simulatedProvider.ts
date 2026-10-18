import { TickSimulator, type FoContract, type LiveStatus, type LiveTick, type MarketDataset, type SimulatorOptions } from '../shared';
import type { LiveProvider } from './provider';

/** Synthetic feed for development, tests and closed-market hours. */
export class SimulatedProvider implements LiveProvider {
  readonly kind = 'simulated' as const;
  private sim: TickSimulator | null = null;
  private tickCb: ((t: LiveTick[]) => void) | null = null;
  private statusCb: ((p: Partial<LiveStatus>) => void) | null = null;

  constructor(private ds: MarketDataset, private opts: SimulatorOptions = {}) {}

  async connect(contracts: FoContract[]): Promise<void> {
    this.sim?.stop();
    this.sim = new TickSimulator(this.ds, { ...this.opts, maxKeys: contracts.length });
    this.statusCb?.({ connected: true, subscribed: this.sim.contracts.length, note: 'Simulated ticks (market closed or no broker)' });
    this.sim.start((ticks) => this.tickCb?.(ticks));
  }

  async disconnect(): Promise<void> {
    this.sim?.stop();
    this.statusCb?.({ connected: false, subscribed: 0 });
  }

  onTicks(cb: (ticks: LiveTick[]) => void): void {
    this.tickCb = cb;
  }

  onStatus(cb: (p: Partial<LiveStatus>) => void): void {
    this.statusCb = cb;
  }

  session(): { progress: number; open: boolean } {
    return { progress: this.sim?.progress() ?? 0, open: !!this.sim?.running };
  }
}
