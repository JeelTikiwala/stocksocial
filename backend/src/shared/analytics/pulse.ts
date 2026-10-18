import type { MarketDataset } from '../types';
import { buildChain, straddleFromChain, listExpiries, interpretOi } from './chain';
import { sectorPerformance } from './sectors';

export interface MarketPulse {
  tradeDate: string;
  indices: Array<{ name: string; close: number; changePct: number }>;
  vix: { value: number; changePct: number } | null;
  breadth: { advancers: number; decliners: number; unchanged: number; advancePct: number };
  pcr: { niftyOi: number | null; niftyChgOi: number | null; universeOi: number };
  oiSentiment: Record<'Long Buildup' | 'Short Buildup' | 'Short Covering' | 'Long Unwinding' | 'Neutral', number>;
  topGainers: Array<{ symbol: string; changePct: number; close: number }>;
  topLosers: Array<{ symbol: string; changePct: number; close: number }>;
  niftyStraddle: { expiry: string; atmStrike: number; straddlePrice: number; daysToExpiry: number } | null;
  fiiDii: MarketDataset['fiiDii'];
  sectors: Array<{ sector: string; changePct: number }>;
}

const BROAD = ['Nifty 50', 'Nifty Bank', 'Nifty Financial Services', 'Nifty Midcap Select'];

export function marketPulse(ds: MarketDataset): MarketPulse {
  const idx = (name: string) => ds.indices.find((i) => i.name === name);
  const indices = BROAD.map((n) => idx(n))
    .filter((i): i is NonNullable<typeof i> => !!i)
    .map((i) => ({ name: i.name, close: i.close, changePct: i.prevClose > 0 ? ((i.close - i.prevClose) / i.prevClose) * 100 : 0 }));

  const vixIdx = idx('India VIX');
  const vix = vixIdx ? { value: vixIdx.close, changePct: vixIdx.prevClose > 0 ? ((vixIdx.close - vixIdx.prevClose) / vixIdx.prevClose) * 100 : 0 } : null;

  const stocks = ds.underlyings.filter((u) => !u.isIndex);
  const advancers = stocks.filter((u) => u.close > u.prevClose).length;
  const decliners = stocks.filter((u) => u.close < u.prevClose).length;
  const unchanged = stocks.length - advancers - decliners;

  // PCR
  let callOi = 0;
  let putOi = 0;
  for (const c of ds.contracts) {
    if (c.optionType === 'CE') callOi += c.oi;
    else if (c.optionType === 'PE') putOi += c.oi;
  }
  const niftyExp = listExpiries(ds, 'NIFTY')[0];
  const niftyChain = niftyExp ? buildChain(ds, 'NIFTY', niftyExp) : null;

  // Futures OI sentiment per stock
  const futChg = new Map<string, number>();
  for (const c of ds.contracts) {
    if (c.instrumentType === 'STF') futChg.set(c.symbol, (futChg.get(c.symbol) ?? 0) + c.chgOi);
  }
  const oiSentiment = { 'Long Buildup': 0, 'Short Buildup': 0, 'Short Covering': 0, 'Long Unwinding': 0, Neutral: 0 };
  for (const u of stocks) {
    oiSentiment[interpretOi(u.close - u.prevClose, futChg.get(u.symbol) ?? 0)]++;
  }

  const ranked = stocks
    .map((u) => ({ symbol: u.symbol, close: u.close, changePct: u.prevClose > 0 ? ((u.close - u.prevClose) / u.prevClose) * 100 : 0 }))
    .sort((a, b) => b.changePct - a.changePct);

  const straddle = niftyChain ? straddleFromChain(niftyChain) : null;

  return {
    tradeDate: ds.tradeDate,
    indices,
    vix,
    breadth: { advancers, decliners, unchanged, advancePct: stocks.length ? (advancers / stocks.length) * 100 : 0 },
    pcr: {
      niftyOi: niftyChain ? niftyChain.totals.pcrOi : null,
      niftyChgOi: niftyChain && niftyChain.totals.callChgOi !== 0 ? niftyChain.totals.putChgOi / niftyChain.totals.callChgOi : null,
      universeOi: callOi > 0 ? putOi / callOi : 0,
    },
    oiSentiment,
    topGainers: ranked.slice(0, 5),
    topLosers: ranked.slice(-5).reverse(),
    niftyStraddle: niftyChain && straddle ? { expiry: niftyChain.expiry, ...straddle, daysToExpiry: niftyChain.daysToExpiry } : null,
    fiiDii: ds.fiiDii.slice(-5),
    sectors: sectorPerformance(ds).map((s) => ({ sector: s.sector, changePct: s.changePct })),
  };
}

export interface HeatmapData {
  tradeDate: string;
  sectors: Array<{
    sector: string;
    changePct: number;
    weight: number;
    items: Array<{ symbol: string; name: string; changePct: number; weight: number; close: number }>;
  }>;
}

export function heatmapData(ds: MarketDataset): HeatmapData {
  return {
    tradeDate: ds.tradeDate,
    sectors: sectorPerformance(ds).map((s) => ({
      sector: s.sector,
      changePct: s.changePct,
      weight: s.weight,
      items: s.constituents.map((c) => ({ symbol: c.symbol, name: c.name, changePct: c.changePct, weight: c.weight, close: c.close })),
    })),
  };
}
