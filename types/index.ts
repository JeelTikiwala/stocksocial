// User types
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  isPro: boolean;
  isPublic: boolean;
  createdAt: string;
  followersCount?: number;
  followingCount?: number;
}

export interface PublicProfile extends User {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
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

export interface PortfolioSummary {
  totalValue: number;
  todayChangePct: number;
  todayChangePnl: number;
  allTimeChangePct: number;
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

// Trade types
export type TradeType = 'BUY' | 'SELL';

export interface Trade {
  id: string;
  ticker: string;
  type: TradeType;
  quantity: number;
  price: number;
  executedAt: string;
}

// Post types
export interface Post {
  id: string;
  userId: string;
  user: User;
  content: string;
  title: string | null;
  attachedTicker: string | null;
  imageUrl: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: User;
  content: string;
  createdAt: string;
}

// Feed types
export interface FeedResponse {
  posts: Post[];
  nextCursor: string | null;
}

// Markets types
export interface MarketEvent {
  id: string;
  title: string;
  subtitle: string;
  dateTime: string;
  type: 'webinar' | 'ipo' | 'earnings' | 'dividend';
}

export interface EarningsDay {
  date: string;
  companies: {
    ticker: string;
    companyName: string;
    logoUrl?: string;
  }[];
}

export interface FeaturedList {
  id: string;
  name: string;
  description: string;
  stocks: {
    ticker: string;
    companyName: string;
    logoUrl?: string;
  }[];
}

export interface FearGreedIndex {
  score: number;
  label: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
}

// Broker types
export type BrokerName = 'ZERODHA' | 'GROWW' | 'UPSTOX';

export interface BrokerStatus {
  connected: boolean;
  broker: BrokerName | null;
  lastSynced: string | null;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

// Navigation types
export type RootStackParamList = {
  '(tabs)': undefined;
  '(auth)/welcome': undefined;
  '(auth)/login': undefined;
  '(auth)/register': undefined;
  '(auth)/link-broker': undefined;
  'stock/[ticker]': { ticker: string };
  'profile/[username]': { username: string };
  'post/[id]': { id: string };
};
