import type {
  MarketStatus, MarketPulse, SectorPerformance, HeatmapData, UniverseEntry, UnderlyingDetail,
  ScreenerSummary, ScreenerResult, OptionChain, IvPoint, IvStats, StraddlePoint, ToolRequest, MarginResponse, PayoffResponse, WatchlistRow, NewsItem,
} from '@/types';

export type DataSourceKind = 'mock' | 'api';

export interface DataSource {
  readonly kind: DataSourceKind;
  status(): Promise<MarketStatus>;
  pulse(): Promise<MarketPulse>;
  sectors(): Promise<SectorPerformance[]>;
  heatmap(): Promise<HeatmapData>;
  universe(): Promise<UniverseEntry[]>;
  underlying(symbol: string): Promise<UnderlyingDetail>;
  screeners(): Promise<ScreenerSummary[]>;
  runScreener(id: string, params?: Record<string, string | number>, limit?: number): Promise<ScreenerResult>;
  expiries(symbol: string): Promise<string[]>;
  chain(symbol: string, expiry?: string): Promise<OptionChain>;
  ivHistory(symbol: string): Promise<{ symbol: string; points: IvPoint[]; stats: IvStats }>;
  straddleHistory(symbol: string): Promise<{ symbol: string; points: StraddlePoint[] }>;
  margin(req: ToolRequest): Promise<MarginResponse>;
  payoff(req: ToolRequest): Promise<PayoffResponse>;
  watchlist(symbols: string[]): Promise<WatchlistRow[]>;
  news(symbols: string[]): Promise<{ items: NewsItem[]; source: 'google-news' | 'mock' }>;
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}
