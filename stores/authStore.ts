import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import axios from 'axios';
import { User, AuthTokens } from '@/types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  refreshToken: () => Promise<void>;
}

// Platform-specific storage adapter
const createStorage = () => {
  if (Platform.OS === 'web') {
    // Use localStorage for web
    return {
      getItem: (name: string) => {
        const value = localStorage.getItem(name);
        return value ?? null;
      },
      setItem: (name: string, value: string) => {
        localStorage.setItem(name, value);
      },
      removeItem: (name: string) => {
        localStorage.removeItem(name);
      },
    };
  }
  // Use SecureStore for native
  const SecureStore = require('expo-secure-store');
  return {
    getItem: async (name: string) => {
      const value = await SecureStore.getItemAsync(name);
      return value ?? null;
    },
    setItem: async (name: string, value: string) => {
      await SecureStore.setItemAsync(name, value);
    },
    removeItem: async (name: string) => {
      await SecureStore.deleteItemAsync(name);
    },
  };
};

const storage = createStorage();
const AUTH_API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/v1';

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const apiMessage = (error.response?.data as any)?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
      return apiMessage;
    }
    return fallback;
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
};

const parseAuthResponse = (response: { data?: any }) => {
  const payload = response.data?.data;
  const user = payload?.user as User | undefined;
  const accessToken = payload?.accessToken;
  const refreshToken = payload?.refreshToken;

  if (
    !user?.id ||
    typeof accessToken !== 'string' ||
    accessToken.length === 0 ||
    typeof refreshToken !== 'string' ||
    refreshToken.length === 0
  ) {
    throw new Error('The server returned an invalid authentication response.');
  }

  return {
    user,
    tokens: { accessToken, refreshToken } satisfies AuthTokens,
  };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      hasHydrated: false,

      login: async (email: string, password: string) => {
        try {
          const normalizedEmail = email.trim().toLowerCase();
          const response = await axios.post(`${AUTH_API_BASE_URL}/auth/login`, {
            email: normalizedEmail,
            password,
          });
          const { user, tokens } = parseAuthResponse(response);

          set({
            user,
            tokens,
            isAuthenticated: true,
          });
        } catch (error) {
          throw new Error(getApiErrorMessage(error, 'Unable to sign in. Please try again.'));
        }
      },

      register: async (email: string, username: string, password: string) => {
        try {
          const normalizedEmail = email.trim().toLowerCase();
          const normalizedUsername = username.trim();
          const response = await axios.post(`${AUTH_API_BASE_URL}/auth/register`, {
            email: normalizedEmail,
            username: normalizedUsername,
            password,
          });
          const { user, tokens } = parseAuthResponse(response);

          set({
            user,
            tokens,
            isAuthenticated: true,
          });
        } catch (error) {
          throw new Error(getApiErrorMessage(error, 'Unable to create account. Please try again.'));
        }
      },

      logout: async () => {
        const { tokens } = get();

        // Clear the local session immediately so navigation never waits on the
        // network or leaves stale credentials behind.
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
        });

        if (tokens?.accessToken) {
          try {
            await axios.post(
              `${AUTH_API_BASE_URL}/auth/logout`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${tokens.accessToken}`,
                },
              }
            );
          } catch {
            // Ignore remote logout failures and clear local state.
          }
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      setHasHydrated: (hasHydrated: boolean) => {
        set({ hasHydrated });
      },

      refreshToken: async () => {
        const { tokens } = get();
        if (!tokens?.refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${AUTH_API_BASE_URL}/auth/refresh`, {
          refreshToken: tokens.refreshToken,
        });
        const accessToken = response.data?.data?.accessToken;

        if (typeof accessToken !== 'string' || accessToken.length === 0) {
          throw new Error('The server returned an invalid token refresh response.');
        }

        set({
          tokens: {
            ...tokens,
            accessToken,
          },
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: (state) => (rehydratedState) => {
        (rehydratedState ?? state).setHasHydrated(true);
      },
    }
  )
);
