import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const { tokens } = useAuthStore.getState();
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = useAuthStore.getState();
        await refreshToken();

        // Retry original request with new token
        const { tokens } = useAuthStore.getState();
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${tokens?.accessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        const { logout } = useAuthStore.getState();
        await logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient };

// API helper functions
export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      apiClient.post('/auth/login', { email, password }),
    register: (email: string, username: string, password: string) =>
      apiClient.post('/auth/register', { email, username, password }),
    refresh: (refreshToken: string) =>
      apiClient.post('/auth/refresh', { refreshToken }),
    logout: () => apiClient.post('/auth/logout'),
    changePassword: (currentPassword: string, newPassword: string) =>
      apiClient.post('/auth/change-password', { currentPassword, newPassword }),
    deleteAccount: () => apiClient.delete('/auth/account'),
  },

  // Portfolio
  portfolio: {
    getSummary: () => apiClient.get('/portfolio/summary'),
    getHoldings: () => apiClient.get('/portfolio/holdings'),
    getChartData: () => apiClient.get('/portfolio/chart-data'),
    getTrades: () => apiClient.get('/portfolio/trades'),
  },

  // Broker
  broker: {
    getStatus: () => apiClient.get('/broker/status'),
    getZerodhaAuthUrl: () => apiClient.get('/broker/zerodha/auth-url'),
    sync: () => apiClient.post('/broker/sync'),
  },

  // Feed
  feed: {
    get: (cursor?: string) =>
      apiClient.get('/feed', { params: { cursor } }),
    createPost: (data: { content: string; title?: string; attachedTicker?: string }) =>
      apiClient.post('/posts', data),
    getPost: (id: string) => apiClient.get(`/posts/${id}`),
    likePost: (id: string) => apiClient.post(`/posts/${id}/like`),
    unlikePost: (id: string) => apiClient.delete(`/posts/${id}/like`),
    savePost: (id: string) => apiClient.post(`/posts/${id}/save`),
    unsavePost: (id: string) => apiClient.delete(`/posts/${id}/save`),
    createComment: (postId: string, content: string) =>
      apiClient.post(`/posts/${postId}/comments`, { content }),
    deletePost: (id: string) => apiClient.delete(`/posts/${id}`),
  },

  // Users
  users: {
    getProfile: (username: string) => apiClient.get(`/users/${username}`),
    getHoldings: (username: string) => apiClient.get(`/users/${username}/holdings`),
    getPosts: (username: string) => apiClient.get(`/users/${username}/posts`),
    follow: (username: string) => apiClient.post(`/users/${username}/follow`),
    unfollow: (username: string) => apiClient.delete(`/users/${username}/follow`),
  },

  // Markets
  markets: {
    getEvents: () => apiClient.get('/markets/events'),
    getEarningsCalendar: (from: string, to: string) =>
      apiClient.get('/markets/earnings-calendar', { params: { from, to } }),
    getFeaturedLists: () => apiClient.get('/markets/featured-lists'),
    getFearGreed: () => apiClient.get('/markets/fear-greed'),
  },

  // Stocks - Real Indian market data
  stocks: {
    search: (query: string) =>
      apiClient.get('/stocks/search', { params: { q: query } }),
    getPopular: () => apiClient.get('/stocks/popular'),
    getIndices: () => apiClient.get('/stocks/indices'),
    getQuote: (ticker: string, exchange: string = 'NSE') =>
      apiClient.get(`/stocks/${ticker}`, { params: { exchange } }),
    getDetails: (ticker: string, exchange: string = 'NSE') =>
      apiClient.get(`/stocks/${ticker}/details`, { params: { exchange } }),
    getHistory: (
      ticker: string,
      exchange: string = 'NSE',
      range: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y' = '1mo',
      interval: '1m' | '5m' | '15m' | '1h' | '1d' | '1wk' | '1mo' = '1d'
    ) => apiClient.get(`/stocks/${ticker}/history`, { params: { exchange, range, interval } }),
    getNews: (ticker: string, companyName?: string) =>
      apiClient.get(`/stocks/${ticker}/news`, { params: { companyName } }),
    getActivity: (ticker: string, days: number = 30) =>
      apiClient.get(`/stocks/${ticker}/activity`, { params: { days } }),
    trackView: (ticker: string) =>
      apiClient.post(`/stocks/${ticker}/track`, { action: 'view' }),
  },

  // Social
  social: {
    getActivity: (cursor?: string, limit: number = 20) =>
      apiClient.get('/social/activity', { params: { cursor, limit } }),
    getLeaderboard: (period: string = '1m', limit: number = 20) =>
      apiClient.get('/social/leaderboard', { params: { period, limit } }),
    getDiscussions: (ticker?: string, cursor?: string, limit: number = 20) =>
      apiClient.get('/social/discussions', { params: { ticker, cursor, limit } }),
    discoverUsers: (query?: string, limit: number = 20) =>
      apiClient.get('/social/discover', { params: { q: query, limit } }),
    getTrendingTickers: (days: number = 7) =>
      apiClient.get('/social/trending-tickers', { params: { days } }),
    createActivity: (data: {
      type: string;
      ticker?: string;
      targetUserId?: string;
      postId?: string;
      metadata?: Record<string, unknown>;
      isPublic?: boolean;
    }) => apiClient.post('/social/activity', data),
  },

  // Settings
  settings: {
    get: () => apiClient.get('/settings'),
    update: (data: {
      portfolioGoal?: number;
      dividendGoalMonthly?: number;
      pushNotifications?: boolean;
      earningsNotifications?: boolean;
      socialNotifications?: boolean;
      priceAlertNotifications?: boolean;
      weeklyDigestEnabled?: boolean;
      privacyShowHoldings?: boolean;
      privacyShowTrades?: boolean;
      privacyShowActivity?: boolean;
      theme?: string;
      currency?: string;
    }) => apiClient.put('/settings', data),
    getProfile: () => apiClient.get('/settings/profile'),
    updateProfile: (data: {
      displayName?: string;
      bio?: string;
      avatarUrl?: string | null;
      isPublic?: boolean;
    }) => apiClient.put('/settings/profile', data),
    getNotifications: () => apiClient.get('/settings/notifications'),
    getPrivacy: () => apiClient.get('/settings/privacy'),
    updatePrivacy: (data: {
      profilePublic?: boolean;
      privacyShowHoldings?: boolean;
      privacyShowTrades?: boolean;
      privacyShowActivity?: boolean;
    }) => apiClient.put('/settings/privacy', data),
  },

  // Watchlist
  watchlist: {
    getAll: () => apiClient.get('/watchlist'),
    create: (name: string, isPublic: boolean = false) =>
      apiClient.post('/watchlist', { name, isPublic }),
    get: (id: string) => apiClient.get(`/watchlist/${id}`),
    update: (id: string, data: { name?: string; isPublic?: boolean }) =>
      apiClient.put(`/watchlist/${id}`, data),
    delete: (id: string) => apiClient.delete(`/watchlist/${id}`),
    addItem: (watchlistId: string, ticker: string, exchange: string = 'NSE') =>
      apiClient.post(`/watchlist/${watchlistId}/items`, { ticker, exchange }),
    removeItem: (watchlistId: string, ticker: string) =>
      apiClient.delete(`/watchlist/${watchlistId}/items/${ticker}`),
    browsePublic: (limit: number = 20) =>
      apiClient.get('/watchlist/public/browse', { params: { limit } }),
    getOrCreateDefault: () => apiClient.post('/watchlist/default'),
  },
};
