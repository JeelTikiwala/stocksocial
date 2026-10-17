import axios from 'axios';

export const TRADING_API_URL =
  process.env.EXPO_PUBLIC_TRADING_API_URL || 'http://127.0.0.1:8765';

const tradingClient = axios.create({
  baseURL: TRADING_API_URL,
  timeout: 120_000,
  headers: { 'Content-Type': 'application/json' },
});

export type TradingMode = 'paper' | 'live';
export type RiskPersona = 'conservative' | 'balanced' | 'aggressive';

export interface BrokerStatus {
  configured: boolean;
  authenticated: boolean;
  role?: 'data' | 'execution' | 'both' | '';
}

export interface SkillResponse<T = unknown> {
  status: 'ok' | 'error';
  data: T;
}

export interface OrderTicket {
  symbol: string;
  exchange: string;
  transaction_type: 'BUY' | 'SELL';
  quantity: number;
  order_type: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
  product: 'CNC' | 'MIS' | 'NRML';
  price?: number;
  trigger_price?: number;
  mode: TradingMode;
  acknowledge_live_risk: boolean;
  sebi_static_ip_confirmed: boolean;
}

export interface PdfExport {
  filename: string;
  mime_type: 'application/pdf';
  base64: string;
}

export const tradingApi = {
  health: () => tradingClient.get('/health'),
  status: () => tradingClient.get<Record<string, BrokerStatus>>('/api/status'),
  setBrokerRole: (broker: string, role: 'data' | 'execution' | 'both') =>
    tradingClient.post('/api/broker/role', { broker, role }),
  testProvider: (provider: string, apiKey = '', model = '') =>
    tradingClient.post<{ ok: boolean; message?: string; error?: string }>('/api/onboarding/test-provider', {
      provider, api_key: apiKey, model,
    }),
  skill: <T = unknown>(name: string, payload: Record<string, unknown> = {}) =>
    tradingClient.post<SkillResponse<T>>(`/skills/${name}`, payload),
  skillGet: <T = unknown>(name: string) =>
    tradingClient.get<SkillResponse<T>>(`/skills/${name}`),
  analyze: (symbol: string) =>
    tradingClient.post<SkillResponse>('/skills/analyze', { symbol, channel: 'api' }),
  analyzeStreamUrl: (symbol: string, exchange = 'NSE') =>
    `${TRADING_API_URL}/skills/analyze/stream?symbol=${encodeURIComponent(symbol)}&exchange=${encodeURIComponent(exchange)}`,
  chat: (message: string, sessionId: string) =>
    tradingClient.post<SkillResponse>('/skills/chat', { message, session_id: sessionId }),
  injectHint: (streamId: string, hint: string) =>
    tradingClient.post('/skills/analyze/hint', { stream_id: streamId, hint }),
  placeOrder: (ticket: OrderTicket) =>
    tradingClient.post<SkillResponse>('/skills/orders/place', ticket),
  cancelOrder: (orderId: string, mode: TradingMode, acknowledgeLiveRisk = false, staticIpConfirmed = false) =>
    tradingClient.post<SkillResponse>('/skills/orders/cancel', {
      order_id: orderId, mode, acknowledge_live_risk: acknowledgeLiveRisk,
      sebi_static_ip_confirmed: staticIpConfirmed,
    }),
  exportPdf: (content: string, title: string) =>
    tradingClient.post<SkillResponse<PdfExport>>('/skills/export-pdf', {
      content, title, response_format: 'base64',
    }),
  brokerLoginUrl: (broker: 'fyers' | 'zerodha') =>
    `${TRADING_API_URL}/${broker}/login`,
};
