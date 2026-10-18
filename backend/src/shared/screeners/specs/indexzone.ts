import type { ScreenerSpec } from '../types';

export const sectorScope: ScreenerSpec = {
  id: 'sector-scope',
  zone: 'index',
  name: 'Sector Scope',
  tagline: 'Sector indices and their constituents',
  description: 'NSE sectoral index moves with advance/decline and the futures OI read of every constituent.',
  mode: 'EOD',
  availability: 'ready',
  params: [],
  columns: [],
  detailRoute: '/tools/sector-scope',
};

export const optionsChain: ScreenerSpec = {
  id: 'options-chain',
  zone: 'index',
  name: 'Options Chain',
  tagline: 'Full chain with IV, greeks and FutEq OI',
  description: 'Strike-by-strike chain for any F&O underlying with Black–Scholes IV and greeks, OI change, max pain, PCR and SEBI\'s delta-adjusted (FutEq) open interest.',
  mode: 'BYOB',
  availability: 'ready',
  eodNote: 'EOD prices. Live quotes arrive with broker login in Phase B.',
  params: [],
  columns: [],
  detailRoute: '/tools/options-chain',
};

export const marginCalculator: ScreenerSpec = {
  id: 'margin-calculator',
  zone: 'index',
  name: 'Margin Calculator',
  tagline: 'SPAN + exposure estimate for any strategy',
  description: 'Estimates NSE SPAN and exposure margin for multi-leg positions, including spread benefit and the expiry-day 2% ELM on short index options. Labelled an estimate until SPAN risk files are ingested.',
  mode: 'EOD',
  availability: 'ready',
  params: [],
  columns: [],
  detailRoute: '/tools/margin',
};

export const strategyBuilder: ScreenerSpec = {
  id: 'strategy-builder',
  zone: 'index',
  name: 'Strategy Builder',
  tagline: 'Payoff, breakevens and greeks',
  description: 'Build multi-leg option strategies from the chain and see expiry payoff, T+0 curve, max profit/loss, breakevens and aggregate greeks.',
  mode: 'EOD',
  availability: 'ready',
  params: [],
  columns: [],
  detailRoute: '/tools/strategy',
};

export const INDEX_SPECS = [sectorScope, optionsChain, marginCalculator, strategyBuilder];
