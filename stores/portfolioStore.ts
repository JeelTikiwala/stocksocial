import { create } from 'zustand';
import { Holding, PortfolioSummary, ChartSegment, BrokerStatus } from '@/types';
import { api } from '@/services/api';
import { colors } from '@/constants';

interface PortfolioState {
  holdings: Holding[];
  summary: PortfolioSummary | null;
  chartData: ChartSegment[];
  brokerStatus: BrokerStatus;
  isLoading: boolean;
  error: string | null;
  fetchPortfolio: () => Promise<void>;
  syncPortfolio: () => Promise<void>;
  setBrokerStatus: (status: BrokerStatus) => void;
}

const CHART_COLORS = colors.chart;

const MOCK_HOLDINGS: Holding[] = [
  { id: 'h1', ticker: 'RELIANCE', companyName: 'Reliance Industries', exchange: 'NSE', quantity: 50, avgBuyPrice: 2400, currentPrice: 2890, todayChangePct: 0.88, allocationPct: 25, colorHex: CHART_COLORS[0] },
  { id: 'h2', ticker: 'TCS', companyName: 'Tata Consultancy Services', exchange: 'NSE', quantity: 30, avgBuyPrice: 3600, currentPrice: 3942, todayChangePct: -0.89, allocationPct: 20, colorHex: CHART_COLORS[1] },
  { id: 'h3', ticker: 'HDFCBANK', companyName: 'HDFC Bank', exchange: 'NSE', quantity: 60, avgBuyPrice: 1500, currentPrice: 1687, todayChangePct: 0.91, allocationPct: 18, colorHex: CHART_COLORS[2] },
  { id: 'h4', ticker: 'INFY', companyName: 'Infosys', exchange: 'NSE', quantity: 45, avgBuyPrice: 1400, currentPrice: 1534, todayChangePct: -0.95, allocationPct: 15, colorHex: CHART_COLORS[3] },
  { id: 'h5', ticker: 'ICICIBANK', companyName: 'ICICI Bank', exchange: 'NSE', quantity: 40, avgBuyPrice: 1100, currentPrice: 1245, todayChangePct: 0.58, allocationPct: 12, colorHex: CHART_COLORS[4] },
  { id: 'h6', ticker: 'BHARTIARTL', companyName: 'Bharti Airtel', exchange: 'NSE', quantity: 25, avgBuyPrice: 1400, currentPrice: 1645, todayChangePct: 0.81, allocationPct: 5, colorHex: CHART_COLORS[5] },
  { id: 'h7', ticker: 'WIPRO', companyName: 'Wipro', exchange: 'NSE', quantity: 35, avgBuyPrice: 460, currentPrice: 478, todayChangePct: -0.77, allocationPct: 3, colorHex: CHART_COLORS[6] },
  { id: 'h8', ticker: 'TATAMOTORS', companyName: 'Tata Motors', exchange: 'NSE', quantity: 20, avgBuyPrice: 890, currentPrice: 945, todayChangePct: 0.71, allocationPct: 2, colorHex: CHART_COLORS[7] },
];

const MOCK_SUMMARY: PortfolioSummary = {
  totalValue: 542890,
  todayChangePct: 1.47,
  todayChangePnl: 7890,
  allTimeChangePct: 29.5,
};

export const usePortfolioStore = create<PortfolioState>()((set, get) => ({
  holdings: [],
  summary: null,
  chartData: [],
  brokerStatus: {
    connected: false,
    broker: null,
    lastSynced: null,
  },
  isLoading: false,
  error: null,

  fetchPortfolio: async () => {
    set({ isLoading: true, error: null });

    try {
      const [holdingsRes, summaryRes] = await Promise.allSettled([
        api.portfolio.getHoldings(),
        api.portfolio.getSummary(),
      ]);

      const apiHoldings = holdingsRes.status === 'fulfilled' ? holdingsRes.value.data?.data || [] : [];
      const apiSummary = summaryRes.status === 'fulfilled' ? summaryRes.value.data?.data || null : null;

      const holdings: Holding[] = apiHoldings.length > 0
        ? apiHoldings.map((h: any, i: number) => ({
            id: h.id,
            ticker: h.ticker,
            companyName: h.companyName,
            exchange: h.exchange || 'NSE',
            quantity: h.quantity,
            avgBuyPrice: h.avgBuyPrice,
            currentPrice: h.currentPrice,
            todayChangePct: h.todayChangePct,
            allocationPct: h.allocationPct,
            colorHex: h.colorHex || CHART_COLORS[i % CHART_COLORS.length],
          }))
        : MOCK_HOLDINGS;

      const summary: PortfolioSummary = apiSummary || MOCK_SUMMARY;

      set({
        holdings,
        summary,
        chartData: holdings.map((h) => ({
          ticker: h.ticker,
          allocationPct: h.allocationPct,
          todayChangePct: h.todayChangePct,
          color: h.colorHex,
          companyName: h.companyName,
        })),
        isLoading: false,
      });
    } catch {
      // Use mock data as fallback
      set({
        holdings: MOCK_HOLDINGS,
        summary: MOCK_SUMMARY,
        chartData: MOCK_HOLDINGS.map((h) => ({
          ticker: h.ticker,
          allocationPct: h.allocationPct,
          todayChangePct: h.todayChangePct,
          color: h.colorHex,
          companyName: h.companyName,
        })),
        isLoading: false,
      });
    }
  },

  syncPortfolio: async () => {
    set({ isLoading: true, error: null });

    try {
      await api.broker.sync();

      set({
        brokerStatus: {
          ...get().brokerStatus,
          lastSynced: new Date().toISOString(),
        },
        isLoading: false,
      });

      // Refetch portfolio data
      await get().fetchPortfolio();
    } catch {
      set({ isLoading: false, error: 'Failed to sync portfolio' });
      // Still refetch to show latest cached data
      await get().fetchPortfolio();
    }
  },

  setBrokerStatus: (status: BrokerStatus) => {
    set({ brokerStatus: status });
  },
}));
