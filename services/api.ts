import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
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

let refreshPromise: Promise<void> | null = null;

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
    const authState = useAuthStore.getState();
    const storedRefreshToken = authState.tokens?.refreshToken;

    // Only refresh an expired session when a refresh token actually exists.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      storedRefreshToken
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = authState.refreshToken().finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;

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

    // Recover from stale persisted auth state without replacing the API's 401
    // with a misleading "No refresh token available" error.
    if (
      error.response?.status === 401 &&
      !storedRefreshToken &&
      authState.isAuthenticated
    ) {
      await authState.logout();
    }

    return Promise.reject(error);
  }
);

// API helper functions
export const api = {
  // Auth
  auth: {
    changePassword: (currentPassword: string, newPassword: string) =>
      apiClient.post('/auth/change-password', { currentPassword, newPassword }),
    deleteAccount: () => apiClient.delete('/auth/account'),
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
    follow: (username: string) => apiClient.post(`/users/${username}/follow`),
    unfollow: (username: string) => apiClient.delete(`/users/${username}/follow`),
  },

  // Markets
  markets: {
    getEarningsCalendar: (from: string, to: string) =>
      apiClient.get('/markets/earnings-calendar', { params: { from, to } }),
    getFeaturedLists: () => apiClient.get('/markets/featured-lists'),
    getFearGreed: () => apiClient.get('/markets/fear-greed'),
  },

  // Stocks - Real Indian market data
  stocks: {
    getIndices: () => apiClient.get('/stocks/indices'),
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
    updatePrivacy: (data: {
      profilePublic?: boolean;
      privacyShowHoldings?: boolean;
      privacyShowTrades?: boolean;
      privacyShowActivity?: boolean;
    }) => apiClient.put('/settings/privacy', data),
  },
};
