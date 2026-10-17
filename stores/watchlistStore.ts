import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

interface WatchlistState {
  tickers: string[];
  addTicker: (ticker: string) => void;
  removeTicker: (ticker: string) => void;
  toggleTicker: (ticker: string) => void;
  hasTicker: (ticker: string) => boolean;
}

const createStorage = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: (name: string) => localStorage.getItem(name),
      setItem: (name: string, value: string) => localStorage.setItem(name, value),
      removeItem: (name: string) => localStorage.removeItem(name),
    };
  }

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

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      tickers: [],
      addTicker: (ticker: string) =>
        set((state) => {
          const normalized = ticker.toUpperCase().trim();
          if (!normalized || state.tickers.includes(normalized)) return state;
          return { tickers: [...state.tickers, normalized] };
        }),
      removeTicker: (ticker: string) =>
        set((state) => ({
          tickers: state.tickers.filter((t) => t !== ticker.toUpperCase().trim()),
        })),
      toggleTicker: (ticker: string) => {
        const normalized = ticker.toUpperCase().trim();
        if (!normalized) return;
        const { tickers } = get();
        if (tickers.includes(normalized)) {
          get().removeTicker(normalized);
        } else {
          get().addTicker(normalized);
        }
      },
      hasTicker: (ticker: string) => get().tickers.includes(ticker.toUpperCase().trim()),
    }),
    {
      name: 'watchlist-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ tickers: state.tickers }),
    }
  )
);
