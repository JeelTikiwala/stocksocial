// Account types
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  isPro: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Portfolio types
export interface Holding {
  id: string;
  ticker: string;
  companyName: string;
  exchange: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  todayChangePct: number;
  allocationPct: number;
  colorHex: string;
  logoUrl?: string;
}

export interface ChartSegment {
  ticker: string;
  allocationPct: number;
  todayChangePct: number;
  color: string;
  logoUrl?: string;
  companyName?: string;
  currentValue?: number;
}

// Market analytics types are shared with the backend engine.
export type {
  MarketDataset,
  MarketStatus,
  UniverseEntry,
  FoContract,
  UnderlyingEod,
  IndexEod,
  HistoryPoint,
  IvPoint,
  StraddlePoint,
  FiiDiiPoint,
  OptionChain,
  ChainRow,
  ChainSide,
  Greeks,
  StrategyLeg,
  PayoffResult,
  PayoffPoint,
  MarginBreakdown,
  DataMode,
  Availability,
  Zone,
} from '@/backend/src/shared';
export type { ScreenerSpec, ScreenerSummary, ScreenerResult, ScreenerRow, ColumnDef, ColumnType, ParamDef, ParamValue } from '@/backend/src/shared';
export type { MarketPulse, HeatmapData, SectorPerformance, SectorConstituent, IvStats, UnderlyingDetail, ToolRequest, MarginResponse, PayoffResponse, WatchlistRow, NewsItem, LiveStatus, LiveQuote, LiveScreenerId } from '@/backend/src/shared';
