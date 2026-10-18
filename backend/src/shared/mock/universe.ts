import type { UniverseEntry } from '../types';

export interface MockUniverseEntry extends UniverseEntry {
  basePrice: number;
  baseIv: number;
  strikeStep: number;
}

/** Index lot sizes per NSE contract specs (NIFTY=65, BANKNIFTY=30 confirmed from the 2026-10-16 bhavcopy). */
export const MOCK_INDICES: MockUniverseEntry[] = [
  { symbol: 'NIFTY', name: 'Nifty 50', sector: 'Index', isIndex: true, lotSize: 65, basePrice: 23146, baseIv: 0.125, strikeStep: 50 },
  { symbol: 'BANKNIFTY', name: 'Nifty Bank', sector: 'Index', isIndex: true, lotSize: 30, basePrice: 55844, baseIv: 0.155, strikeStep: 100 },
  { symbol: 'FINNIFTY', name: 'Nifty Financial Services', sector: 'Index', isIndex: true, lotSize: 65, basePrice: 25387, baseIv: 0.145, strikeStep: 50 },
  { symbol: 'MIDCPNIFTY', name: 'Nifty Midcap Select', sector: 'Index', isIndex: true, lotSize: 140, basePrice: 13717, baseIv: 0.185, strikeStep: 25 },
];

export const MOCK_STOCKS: MockUniverseEntry[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', isIndex: false, lotSize: 500, basePrice: 1482, baseIv: 0.2, strikeStep: 10 },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', sector: 'Energy', isIndex: false, lotSize: 2250, basePrice: 246, baseIv: 0.27, strikeStep: 2.5 },
  { symbol: 'NTPC', name: 'NTPC', sector: 'Energy', isIndex: false, lotSize: 1500, basePrice: 341, baseIv: 0.22, strikeStep: 5 },
  { symbol: 'POWERGRID', name: 'Power Grid Corp', sector: 'Energy', isIndex: false, lotSize: 1900, basePrice: 289, baseIv: 0.2, strikeStep: 2.5 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', isIndex: false, lotSize: 175, basePrice: 3410, baseIv: 0.22, strikeStep: 50 },
  { symbol: 'INFY', name: 'Infosys', sector: 'IT', isIndex: false, lotSize: 400, basePrice: 1552, baseIv: 0.24, strikeStep: 20 },
  { symbol: 'WIPRO', name: 'Wipro', sector: 'IT', isIndex: false, lotSize: 3000, basePrice: 256, baseIv: 0.26, strikeStep: 2.5 },
  { symbol: 'HCLTECH', name: 'HCL Technologies', sector: 'IT', isIndex: false, lotSize: 350, basePrice: 1478, baseIv: 0.22, strikeStep: 20 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banks', isIndex: false, lotSize: 550, basePrice: 981, baseIv: 0.19, strikeStep: 10 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banks', isIndex: false, lotSize: 700, basePrice: 1421, baseIv: 0.2, strikeStep: 10 },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banks', isIndex: false, lotSize: 750, basePrice: 882, baseIv: 0.26, strikeStep: 10 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banks', isIndex: false, lotSize: 400, basePrice: 2152, baseIv: 0.22, strikeStep: 20 },
  { symbol: 'AXISBANK', name: 'Axis Bank', sector: 'Banks', isIndex: false, lotSize: 625, basePrice: 1183, baseIv: 0.25, strikeStep: 10 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', sector: 'Financial Services', isIndex: false, lotSize: 750, basePrice: 1024, baseIv: 0.28, strikeStep: 10 },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance', sector: 'Financial Services', isIndex: false, lotSize: 1100, basePrice: 762, baseIv: 0.24, strikeStep: 10 },
  { symbol: 'ABCAPITAL', name: 'Aditya Birla Capital', sector: 'Financial Services', isIndex: false, lotSize: 3100, basePrice: 379, baseIv: 0.3, strikeStep: 5 },
  { symbol: 'ITC', name: 'ITC', sector: 'FMCG', isIndex: false, lotSize: 1600, basePrice: 411, baseIv: 0.17, strikeStep: 5 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', sector: 'FMCG', isIndex: false, lotSize: 300, basePrice: 2484, baseIv: 0.18, strikeStep: 20 },
  { symbol: 'NESTLEIND', name: 'Nestle India', sector: 'FMCG', isIndex: false, lotSize: 500, basePrice: 1212, baseIv: 0.18, strikeStep: 10 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', sector: 'Auto', isIndex: false, lotSize: 50, basePrice: 15240, baseIv: 0.22, strikeStep: 100 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Auto', isIndex: false, lotSize: 800, basePrice: 691, baseIv: 0.32, strikeStep: 10 },
  { symbol: 'M&M', name: 'Mahindra & Mahindra', sector: 'Auto', isIndex: false, lotSize: 200, basePrice: 3452, baseIv: 0.25, strikeStep: 50 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom', isIndex: false, lotSize: 475, basePrice: 1948, baseIv: 0.21, strikeStep: 20 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', sector: 'Pharma', isIndex: false, lotSize: 350, basePrice: 1684, baseIv: 0.22, strikeStep: 20 },
  { symbol: 'DRREDDY', name: "Dr. Reddy's Labs", sector: 'Pharma', isIndex: false, lotSize: 625, basePrice: 1262, baseIv: 0.23, strikeStep: 10 },
  { symbol: 'CIPLA', name: 'Cipla', sector: 'Pharma', isIndex: false, lotSize: 375, basePrice: 1521, baseIv: 0.22, strikeStep: 20 },
  { symbol: 'LT', name: 'Larsen & Toubro', sector: 'Infrastructure', isIndex: false, lotSize: 150, basePrice: 3654, baseIv: 0.22, strikeStep: 50 },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', sector: 'Infrastructure', isIndex: false, lotSize: 300, basePrice: 2448, baseIv: 0.38, strikeStep: 20 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ', sector: 'Infrastructure', isIndex: false, lotSize: 475, basePrice: 1423, baseIv: 0.3, strikeStep: 10 },
  { symbol: 'TATASTEEL', name: 'Tata Steel', sector: 'Metals', isIndex: false, lotSize: 5500, basePrice: 166, baseIv: 0.3, strikeStep: 1 },
  { symbol: 'JSWSTEEL', name: 'JSW Steel', sector: 'Metals', isIndex: false, lotSize: 675, basePrice: 1082, baseIv: 0.28, strikeStep: 10 },
  { symbol: 'HINDALCO', name: 'Hindalco Industries', sector: 'Metals', isIndex: false, lotSize: 1400, basePrice: 761, baseIv: 0.3, strikeStep: 10 },
  { symbol: 'TITAN', name: 'Titan Company', sector: 'Consumer Durables', isIndex: false, lotSize: 175, basePrice: 3448, baseIv: 0.24, strikeStep: 50 },
  { symbol: 'DLF', name: 'DLF', sector: 'Realty', isIndex: false, lotSize: 825, basePrice: 792, baseIv: 0.33, strikeStep: 10 },
];

export const MOCK_UNIVERSE: MockUniverseEntry[] = [...MOCK_INDICES, ...MOCK_STOCKS];
