import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RiskPersona, TradingMode } from '@/services/trading';

// Zustand's ESM middleware currently emits `import.meta.env`, while Metro's
// development web bundle is loaded as a classic script. Resolve the published
// CommonJS entry to keep the same persistence API across web and native.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createJSONStorage, persist }: typeof import('zustand/middleware') = require('zustand/middleware');

export interface TradingSession {
  id: string;
  title: string;
  symbol: string;
  messages: { id: string; role: 'user' | 'assistant'; content: string }[];
  updatedAt: number;
}

interface TradingState {
  mode: TradingMode;
  riskPersona: RiskPersona;
  sessions: TradingSession[];
  activeSessionId: string;
  setMode: (mode: TradingMode) => void;
  setRiskPersona: (persona: RiskPersona) => void;
  createSession: () => void;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  setSymbol: (symbol: string) => void;
}

const initialId = `session-${Date.now()}`;

export const useTradingStore = create<TradingState>()(persist((set) => ({
  mode: 'paper',
  riskPersona: 'balanced',
  activeSessionId: initialId,
  sessions: [{ id: initialId, title: 'Market research', symbol: 'NIFTY', messages: [], updatedAt: Date.now() }],
  setMode: (mode) => set({ mode }),
  setRiskPersona: (riskPersona) => set({ riskPersona }),
  createSession: () => set((state) => {
    const id = `session-${Date.now()}`;
    return {
      activeSessionId: id,
      sessions: [{ id, title: 'New analysis', symbol: 'NIFTY', messages: [], updatedAt: Date.now() }, ...state.sessions],
    };
  }),
  switchSession: (activeSessionId) => set({ activeSessionId }),
  deleteSession: (id) => set((state) => {
    const remaining = state.sessions.filter((session) => session.id !== id);
    if (remaining.length > 0) {
      return {
        sessions: remaining,
        activeSessionId: state.activeSessionId === id ? remaining[0].id : state.activeSessionId,
      };
    }
    const nextId = `session-${Date.now()}`;
    return {
      activeSessionId: nextId,
      sessions: [{ id: nextId, title: 'New analysis', symbol: 'NIFTY', messages: [], updatedAt: Date.now() }],
    };
  }),
  addMessage: (role, content) => set((state) => ({
    sessions: state.sessions.map((session) => session.id === state.activeSessionId ? {
      ...session,
      title: session.messages.length === 0 && role === 'user' ? content.slice(0, 36) : session.title,
      messages: [...session.messages, { id: `${Date.now()}-${role}`, role, content }],
      updatedAt: Date.now(),
    } : session),
  })),
  setSymbol: (symbol) => set((state) => ({
    sessions: state.sessions.map((session) =>
      session.id === state.activeSessionId ? { ...session, symbol: symbol.toUpperCase() } : session),
  })),
}), {
  name: 'stockcircle-trading-sessions',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({
    riskPersona: state.riskPersona,
    sessions: state.sessions,
    activeSessionId: state.activeSessionId,
  }),
}));
