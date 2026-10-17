import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

interface AppSettingsState {
  brokerConnected: boolean;
  brokerName: string | null;
  portfolioGoal: number;
  dividendGoalMonthly: number;
  pushNotifications: boolean;
  earningsNotifications: boolean;
  socialNotifications: boolean;
  setBrokerConnection: (connected: boolean, brokerName?: string | null) => void;
  setPortfolioGoal: (goal: number) => void;
  setDividendGoalMonthly: (goal: number) => void;
  setPushNotifications: (enabled: boolean) => void;
  setEarningsNotifications: (enabled: boolean) => void;
  setSocialNotifications: (enabled: boolean) => void;
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
      socialNotifications: true,
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
      setSocialNotifications: (enabled: boolean) => set({ socialNotifications: !!enabled }),
    }),
    {
      name: 'app-settings-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);
