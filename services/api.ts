import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/v1';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
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

// API helper functions (account features; market analytics go through services/data)
export const api = {
  auth: {
    changePassword: (currentPassword: string, newPassword: string) =>
      apiClient.post('/auth/change-password', { currentPassword, newPassword }),
    deleteAccount: () => apiClient.delete('/auth/account'),
  },
  broker: {
    getStatus: () => apiClient.get('/broker/status'),
    getZerodhaAuthUrl: () => apiClient.get('/broker/zerodha/auth-url'),
    sync: () => apiClient.post('/broker/sync'),
  },
  settings: {
    get: () => apiClient.get('/settings'),
    update: (data: {
      portfolioGoal?: number;
      dividendGoalMonthly?: number;
      pushNotifications?: boolean;
      earningsNotifications?: boolean;
      priceAlertNotifications?: boolean;
      weeklyDigestEnabled?: boolean;
      theme?: string;
      currency?: string;
    }) => apiClient.put('/settings', data),
    getProfile: () => apiClient.get('/settings/profile'),
    updateProfile: (data: { displayName?: string; avatarUrl?: string | null }) => apiClient.put('/settings/profile', data),
  },
};
