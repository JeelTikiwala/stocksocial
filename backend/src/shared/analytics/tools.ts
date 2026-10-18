import type { MarginBreakdown, MarketDataset, PayoffResult, StrategyLeg } from '../types';
import { getLotSize, getSpot, isIndexSymbol, listExpiries } from './chain';
import { daysBetween } from '../calendar';
import { estimateMargin } from '../options/margin';
import { computePayoff } from '../options/payoff';

export interface ToolRequest {
  symbol: string;
  legs: StrategyLeg[];
  daysToExpiry?: number;
  isExpiryDay?: boolean;
  rangePct?: number;
}

export interface ToolContext {
  symbol: string;
  spot: number;
  lotSize: number;
  daysToExpiry: number;
  isIndex: boolean;
}

export type MarginResponse = MarginBreakdown & { context: ToolContext };
export type PayoffResponse = PayoffResult & { context: ToolContext };

export function resolveToolContext(ds: MarketDataset, req: ToolRequest): ToolContext | null {
  const symbol = req.symbol.toUpperCase();
  const spot = getSpot(ds, symbol);
  if (spot == null) return null;
  const expiry = req.legs.find((l) => l.expiry)?.expiry ?? listExpiries(ds, symbol)[0];
  const dte = req.daysToExpiry ?? (expiry ? daysBetween(ds.tradeDate, expiry) : 7);
  return { symbol, spot, lotSize: getLotSize(ds, symbol), daysToExpiry: Math.max(dte, 0), isIndex: isIndexSymbol(ds, symbol) };
}

export function marginForRequest(ds: MarketDataset, req: ToolRequest): MarginResponse | null {
  const context = resolveToolContext(ds, req);
  if (!context) return null;
  const legs = req.legs.map((l, i) => ({ ...l, id: l.id || `leg-${i + 1}` }));
  return { ...estimateMargin({ legs, spot: context.spot, lotSize: context.lotSize, daysToExpiry: context.daysToExpiry, isIndex: context.isIndex, isExpiryDay: req.isExpiryDay }), context };
}

export function payoffForRequest(ds: MarketDataset, req: ToolRequest): PayoffResponse | null {
  const context = resolveToolContext(ds, req);
  if (!context) return null;
  const legs = req.legs.map((l, i) => ({ ...l, id: l.id || `leg-${i + 1}` }));
  return { ...computePayoff({ legs, spot: context.spot, lotSize: context.lotSize, daysToExpiry: context.daysToExpiry, rangePct: req.rangePct }), context };
}
