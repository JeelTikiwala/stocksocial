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

// Authentication
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
