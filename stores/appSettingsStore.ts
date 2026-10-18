import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

export type DataSourceKind = 'mock' | 'api';

interface AppSettingsState {
  brokerConnected: boolean;
  brokerName: string | null;
  portfolioGoal: number;
  dividendGoalMonthly: number;
  pushNotifications: boolean;
  earningsNotifications: boolean;
  dataSource: DataSourceKind;
  setBrokerConnection: (connected: boolean, brokerName?: string | null) => void;
  setPortfolioGoal: (goal: number) => void;
  setDividendGoalMonthly: (goal: number) => void;
  setPushNotifications: (enabled: boolean) => void;
  setEarningsNotifications: (enabled: boolean) => void;
  setDataSource: (kind: DataSourceKind) => void;
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

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set) => ({
      brokerConnected: false,
      brokerName: null,
      portfolioGoal: 800000,
      dividendGoalMonthly: 2000,
      pushNotifications: true,
      earningsNotifications: true,
      dataSource: process.env.EXPO_PUBLIC_DATA_SOURCE === 'api' ? 'api' : 'mock',
      setBrokerConnection: (connected: boolean, brokerName: string | null = null) =>
        set({
          brokerConnected: connected,
          brokerName: connected ? brokerName : null,
        }),
      setPortfolioGoal: (goal: number) =>
        set({ portfolioGoal: Math.max(0, Math.floor(goal || 0)) }),
      setDividendGoalMonthly: (goal: number) =>
        set({ dividendGoalMonthly: Math.max(0, Math.floor(goal || 0)) }),
      setPushNotifications: (enabled: boolean) => set({ pushNotifications: !!enabled }),
      setEarningsNotifications: (enabled: boolean) => set({ earningsNotifications: !!enabled }),
      setDataSource: (kind: DataSourceKind) => set({ dataSource: kind === 'api' ? 'api' : 'mock' }),
    }),
    {
      name: 'delta-app-settings', // new key: the StockCircle-era store carried social fields
      storage: createJSONStorage(() => storage),
    }
  )
);
