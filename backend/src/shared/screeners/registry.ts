import type { ScreenerSpec } from './types';
import { volumeSpike, hx3, premiumSpike } from './specs/scalper';
import { INTRADAY_SPECS } from './specs/intraday';
import { SELLER_SPECS } from './specs/seller';
import { INDEX_SPECS } from './specs/indexzone';

export const SCALPER_SPECS = [volumeSpike, hx3, premiumSpike];

export const SCREENERS: ScreenerSpec[] = [...SCALPER_SPECS, ...INTRADAY_SPECS, ...SELLER_SPECS, ...INDEX_SPECS];

export const ZONES: Array<{ id: ScreenerSpec['zone']; name: string; tagline: string }> = [
  { id: 'scalper', name: 'Scalper Zone', tagline: 'Fast moves in volume and premium' },
  { id: 'intraday', name: 'Intraday Zone', tagline: 'Open interest, flow and breadth' },
  { id: 'seller', name: 'Seller Zone', tagline: 'Volatility and premium-selling tools' },
  { id: 'index', name: 'Index Zone', tagline: 'Sectors, chains, margin and strategies' },
];
