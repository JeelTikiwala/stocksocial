import type { FoContract, LiveProviderKind, LiveStatus, LiveTick } from '../shared';

export interface LiveProvider {
  readonly kind: LiveProviderKind;
  /** Connect and subscribe to the given contracts. Resolves once the feed is up (or has started reconnecting). */
  connect(contracts: FoContract[]): Promise<void>;
  disconnect(): Promise<void>;
  onTicks(cb: (ticks: LiveTick[]) => void): void;
  onStatus(cb: (patch: Partial<LiveStatus>) => void): void;
  session(): { progress: number; open: boolean };
}
