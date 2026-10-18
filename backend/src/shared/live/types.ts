import type { FoContract, InstrumentType, OptionType } from '../types';

/** Stable identity for a contract across EOD data and live ticks. */
export type ContractKey = string;

export function contractKey(c: Pick<FoContract, 'symbol' | 'instrumentType' | 'expiry' | 'strike' | 'optionType'>): ContractKey {
  return `${c.symbol}|${c.instrumentType}|${c.expiry}|${c.strike ?? ''}|${c.optionType ?? ''}`;
}

export function parseContractKey(key: ContractKey): { symbol: string; instrumentType: InstrumentType; expiry: string; strike: number | null; optionType: OptionType | null } {
  const [symbol, instrumentType, expiry, strike, optionType] = key.split('|');
  return { symbol, instrumentType: instrumentType as InstrumentType, expiry, strike: strike ? Number(strike) : null, optionType: (optionType || null) as OptionType | null };
}

export interface LiveTick {
  key: ContractKey;
  symbol: string;
  instrumentType: InstrumentType;
  expiry: string;
  strike: number | null;
  optionType: OptionType | null;
  ltp: number;
  /** Cumulative traded quantity today, in UNITS (same convention as the bhavcopy). */
  volume: number;
  /** Open interest in units, when the provider supplies it (Kite "full" mode does). */
  oi: number | null;
  bid?: number;
  ask?: number;
  /** Epoch ms */
  ts: number;
}

export type LiveProviderKind = 'simulated' | 'kite' | 'none';

export interface LiveStatus {
  provider: LiveProviderKind;
  connected: boolean;
  subscribed: number;
  lastTickAt: number | null;
  ticksPerSec: number;
  /** 0..1 through the 09:15–15:30 IST session (virtual for the simulator). */
  sessionProgress: number;
  marketOpen: boolean;
  note?: string;
}

export interface LiveQuote {
  symbol: string;
  ltp: number;
  prevClose: number;
  changePct: number;
  ts: number;
  source: 'fut' | 'spot';
}

export const LIVE_SCREENER_IDS = ['premium-spike', 'volume-spike', 'unusual-options'] as const;
export type LiveScreenerId = (typeof LIVE_SCREENER_IDS)[number];
export const isLiveScreener = (id: string): id is LiveScreenerId => (LIVE_SCREENER_IDS as readonly string[]).includes(id);

/** NSE cash/F&O session in IST minutes from midnight. */
export const SESSION_START_MIN = 9 * 60 + 15;
export const SESSION_END_MIN = 15 * 60 + 30;
export const SESSION_MINUTES = SESSION_END_MIN - SESSION_START_MIN; // 375

/** Session progress for a real wall-clock instant (IST). */
export function sessionProgressAt(epochMs: number): { progress: number; open: boolean } {
  const ist = new Date(epochMs + 330 * 60_000);
  const day = ist.getUTCDay();
  const mins = ist.getUTCHours() * 60 + ist.getUTCMinutes() + ist.getUTCSeconds() / 60;
  if (day === 0 || day === 6) return { progress: 0, open: false };
  if (mins < SESSION_START_MIN) return { progress: 0, open: false };
  if (mins >= SESSION_END_MIN) return { progress: 1, open: false };
  return { progress: (mins - SESSION_START_MIN) / SESSION_MINUTES, open: true };
}
