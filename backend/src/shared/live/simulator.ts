/**
 * Synthetic tick generator driven by the EOD dataset. Used by the backend's `simulated`
 * provider and by the app's offline mock mode, so live screeners can be exercised end to
 * end when the market is closed or no broker is connected.
 */
import type { FoContract, MarketDataset } from '../types';
import { Prng } from '../prng';
import { bsPrice } from '../options/blackScholes';
import { yearFraction } from '../calendar';
import { contractKey, SESSION_MINUTES, type LiveTick } from './types';
import { selectLiveUniverse } from './universe';

export interface SimulatorOptions {
  seed?: number;
  /** Real-time interval between tick batches. */
  intervalMs?: number;
  /** Virtual session seconds advanced per real second (60 → a 6h15m session in ~6 minutes). */
  speed?: number;
  /** Start the virtual clock this far into the session (0..1). */
  startProgress?: number;
  maxKeys?: number;
  /** Probability per contract per batch of an activity burst. */
  burstProbability?: number;
  /** Restart the virtual session when it ends (default true) so a dev server never goes quiet. */
  loop?: boolean;
}

interface SymState { spot: number; prevClose: number; dailyVol: number; atmIv: number; ivShock: number; ivShockLeft: number }
interface ContractState { c: FoContract; volume: number; oi: number; burstLeft: number; burstMult: number; prevLtp: number }

export class TickSimulator {
  readonly contracts: FoContract[];
  private rng: Prng;
  private sym = new Map<string, SymState>();
  private state = new Map<string, ContractState>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private virtualSec: number;
  private readonly speed: number;
  private readonly intervalMs: number;
  private readonly burstProbability: number;
  private readonly loop: boolean;
  private wall = 0;
  /** Completed virtual sessions (increments on loop). */
  sessions = 0;

  constructor(private ds: MarketDataset, opts: SimulatorOptions = {}) {
    this.rng = new Prng(opts.seed ?? 7);
    this.speed = opts.speed ?? 60;
    this.intervalMs = opts.intervalMs ?? 1000;
    this.burstProbability = opts.burstProbability ?? 0.004;
    this.loop = opts.loop ?? true;
    this.virtualSec = (opts.startProgress ?? 0.15) * SESSION_MINUTES * 60;
    this.contracts = selectLiveUniverse(ds, { maxKeys: opts.maxKeys ?? 1200 });
    for (const u of ds.underlyings) {
      const iv = ds.ivHistory[u.symbol]?.at(-1)?.atmIv ?? 0.2;
      this.sym.set(u.symbol, { spot: u.close, prevClose: u.prevClose, dailyVol: iv / Math.sqrt(252), atmIv: iv, ivShock: 0, ivShockLeft: 0 });
    }
    for (const c of this.contracts) {
      this.state.set(contractKey(c), { c, volume: Math.round(c.volume * this.progress() * this.rng.range(0.6, 1.2)), oi: c.oi, burstLeft: 0, burstMult: 1, prevLtp: c.close });
    }
  }

  progress(): number {
    return Math.min(this.virtualSec / (SESSION_MINUTES * 60), 1);
  }

  /** Virtual IST timestamp for the current step, anchored to the dataset's trade date. */
  virtualTs(): number {
    const [y, m, d] = this.ds.tradeDate.split('-').map(Number);
    const sessionStartUtc = Date.UTC(y, m - 1, d, 3, 45, 0); // 09:15 IST
    return sessionStartUtc + this.virtualSec * 1000;
  }

  step(): LiveTick[] {
    const dtSec = (this.intervalMs / 1000) * this.speed;
    if (this.virtualSec >= SESSION_MINUTES * 60 && this.loop) {
      // New virtual day: reset cumulative volume, keep prices/OI where they drifted to.
      this.virtualSec = 0;
      this.sessions++;
      for (const st of this.state.values()) st.volume = 0;
    }
    this.virtualSec = Math.min(this.virtualSec + dtSec, SESSION_MINUTES * 60);
    this.wall += this.intervalMs;
    const ts = Date.now();
    const frac = dtSec / (SESSION_MINUTES * 60);

    // Underlying random walk + occasional IV shock
    for (const s of this.sym.values()) {
      const stepVol = s.dailyVol * Math.sqrt(dtSec / (6.25 * 3600));
      s.spot *= Math.exp(this.rng.normal() * stepVol);
      if (s.ivShockLeft > 0) s.ivShockLeft -= dtSec;
      else if (this.rng.next() < 0.002) { s.ivShock = this.rng.range(0.15, 0.45); s.ivShockLeft = this.rng.range(60, 240); }
      else s.ivShock *= 0.9;
    }

    const out: LiveTick[] = [];
    for (const st of this.state.values()) {
      const { c } = st;
      const s = this.sym.get(c.symbol);
      if (!s) continue;
      const t = yearFraction(this.ds.tradeDate, c.expiry) - this.virtualSec / (365 * 86400);
      let ltp: number;
      if (c.optionType == null) {
        ltp = s.spot * (c.close / c.underlyingPrice) * (1 + this.rng.normal() * 0.0003);
      } else {
        const m = Math.log(c.strike! / s.spot) / Math.sqrt(Math.max(t, 0.005));
        const skew = c.symbol === 'NIFTY' || c.symbol === 'BANKNIFTY' ? -0.22 : -0.12;
        const iv = Math.max(s.atmIv * (1 + s.ivShock) * (1 + skew * m + 0.3 * m * m), 0.04);
        ltp = Math.max(bsPrice({ spot: s.spot, strike: c.strike!, t: Math.max(t, 0.0005), sigma: iv, type: c.optionType }) * (1 + this.rng.normal() * 0.01), 0.05);
        ltp = Math.round(ltp * 20) / 20;
      }
      // Volume: pace towards the EOD total, with bursts
      if (st.burstLeft > 0) st.burstLeft -= dtSec;
      else if (this.rng.next() < this.burstProbability) { st.burstLeft = this.rng.range(60, 300); st.burstMult = this.rng.range(4, 14); }
      const mult = st.burstLeft > 0 ? st.burstMult : 1;
      st.volume += Math.round(c.volume * frac * this.rng.range(0.3, 1.7) * mult);
      st.oi = Math.max(Math.round(st.oi * (1 + (this.rng.normal() * 0.0008 + (mult > 1 ? 0.002 : 0)) * (dtSec / 60))), 0);
      // Burst also lifts premium a touch (aggressive buying)
      if (mult > 1 && c.optionType) ltp = Math.round(ltp * (1 + 0.004 * mult) * 20) / 20;
      st.prevLtp = ltp;
      const spread = ltp * (c.optionType ? 0.004 : 0.0003);
      out.push({ key: contractKey(c), symbol: c.symbol, instrumentType: c.instrumentType, expiry: c.expiry, strike: c.strike, optionType: c.optionType, ltp: +ltp.toFixed(2), volume: st.volume, oi: st.oi, bid: +(ltp - spread / 2).toFixed(2), ask: +(ltp + spread / 2).toFixed(2), ts });
    }
    return out;
  }

  start(onTicks: (ticks: LiveTick[]) => void): void {
    this.stop();
    onTicks(this.step());
    this.timer = setInterval(() => onTicks(this.step()), this.intervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  get running(): boolean {
    return this.timer != null;
  }
}
