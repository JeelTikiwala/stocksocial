/**
 * Shared domain types for the Delta analytics engine.
 *
 * This module is consumed by BOTH the Express backend (via relative imports) and the
 * Expo app (via the `@/backend/src/shared/*` alias) so that the mock data, screener
 * engine and options math are a single source of truth. Keep it free of Node/RN deps.
 */

export type InstrumentType = 'IDO' | 'STO' | 'IDF' | 'STF';
export type OptionType = 'CE' | 'PE';
export type Side = 'BUY' | 'SELL';

/** Which data posture a feature needs to be genuinely useful (see docs/DELTA_PORT_PLAN_INDIA.md §2). */
export type DataMode = 'EOD' | 'BYOB' | 'LIVE';

/** Availability of a screener in the current phase. */
export type Availability =
  | 'ready'        // fully served by EOD data
  | 'eod-approx'   // works, but is a daily approximation of an intraday idea
  | 'placeholder'; // UI shell only; needs live data or a spec

export type Zone = 'scalper' | 'intraday' | 'seller' | 'index';

export interface UniverseEntry {
  symbol: string;
  name: string;
  sector: string;
  isIndex: boolean;
  lotSize: number;
}

/** One row of the NSE F&O bhavcopy (UDiFF), normalised. */
export interface FoContract {
  tradeDate: string;        // YYYY-MM-DD
  symbol: string;
  instrumentType: InstrumentType;
  expiry: string;           // YYYY-MM-DD
  strike: number | null;
  optionType: OptionType | null;
  open: number;
  high: number;
  low: number;
  close: number;
  last: number;
  prevClose: number;
  underlyingPrice: number;
  settle: number;
  /** Open interest in UNITS (shares), exactly as the NSE bhavcopy reports it — not contracts. */
  oi: number;
  chgOi: number;
  /** Traded quantity in UNITS (shares). Divide by lotSize for contracts. */
  volume: number;
  /** Notional traded value in INR = units × (strike + premium) for options, units × price for futures. */
  turnover: number;
  trades: number;
  lotSize: number;
}

export interface UnderlyingEod {
  tradeDate: string;
  symbol: string;
  close: number;
  prevClose: number;
  /** Futures volume (contracts) summed across expiries — the EOD proxy for activity. */
  futVolume: number;
  /** 20-day average of futVolume (null when history is too short). */
  futVolumeAvg20: number | null;
  isIndex: boolean;
  sector: string;
}

export interface IndexEod {
  tradeDate: string;
  name: string;
  close: number;
  prevClose: number;
}

export interface HistoryPoint {
  date: string;
  close: number;
  volume: number;
}

export interface IvPoint {
  date: string;
  atmIv: number;        // annualised, e.g. 0.14 = 14%
}

export interface StraddlePoint {
  date: string;
  expiry: string;
  atmStrike: number;
  spot: number;
  straddlePrice: number;
  daysToExpiry: number;
}

export interface FiiDiiPoint {
  date: string;
  fiiNet: number; // INR crore, +buy / -sell
  diiNet: number;
}

export interface MarketDataset {
  tradeDate: string;
  prevTradeDate: string;
  source: 'mock' | 'bhavcopy';
  generatedAt: string;
  universe: UniverseEntry[];
  contracts: FoContract[];
  underlyings: UnderlyingEod[];
  indices: IndexEod[];               // broad + sectoral indices (+ INDIA VIX)
  underlyingHistory: Record<string, HistoryPoint[]>;
  ivHistory: Record<string, IvPoint[]>;
  straddleHistory: Record<string, StraddlePoint[]>;
  fiiDii: FiiDiiPoint[];
}

export interface MarketStatus {
  tradeDate: string;
  prevTradeDate: string;
  dataMode: DataMode;
  source: MarketDataset['source'];
  generatedAt: string;
  contractCount: number;
  underlyingCount: number;
}

// ---------- Options analytics ----------

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number; // per calendar day
  vega: number;  // per 1 vol point (1%)
  rho: number;   // per 1% rate
}

export interface ChainRow {
  strike: number;
  call: ChainSide | null;
  put: ChainSide | null;
}

export interface ChainSide {
  close: number;
  prevClose: number;
  changePct: number;
  oi: number;
  chgOi: number;
  volume: number;
  iv: number | null;
  greeks: Greeks | null;
  /** SEBI FutEq exposure = |delta| × OI (units) → underlying-equivalent units. */
  futEqOi: number | null;
}

export interface OptionChain {
  symbol: string;
  expiry: string;
  tradeDate: string;
  spot: number;
  futurePrice: number | null;
  atmStrike: number;
  daysToExpiry: number;
  lotSize: number;
  rows: ChainRow[];
  totals: {
    callOi: number;
    putOi: number;
    callChgOi: number;
    putChgOi: number;
    pcrOi: number;
    maxPainStrike: number | null;
    callFutEqOi: number;
    putFutEqOi: number;
  };
}

export interface StrategyLeg {
  id: string;
  instrument: 'CE' | 'PE' | 'FUT';
  side: Side;
  strike: number;     // ignored for FUT
  premium: number;    // per unit (per share), not per lot
  lots: number;
  expiry?: string;
  iv?: number;        // for T+0 curve
}

export interface PayoffPoint {
  spot: number;
  expiryPnl: number;
  todayPnl: number | null;
}

export interface PayoffResult {
  points: PayoffPoint[];
  maxProfit: number | null;   // null = unlimited
  maxLoss: number | null;     // null = unlimited
  breakevens: number[];
  netPremium: number;         // per lot-unit total (INR), + = credit
  greeks: Greeks | null;      // aggregate at current spot (requires iv & days)
}

export interface MarginBreakdown {
  spanMargin: number;
  exposureMargin: number;
  expiryDayElm: number;
  premiumPayable: number;       // for net long premium
  premiumReceivable: number;    // for net short premium (upfront collection)
  total: number;
  benefitVsNaked: number;       // how much netting saved vs summing legs
  assumptions: string[];
}
