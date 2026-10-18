import type { MarketDataset } from '../types';

/** NSE sectoral index for each sector, named exactly as in NSE's ind_close_all_DDMMYYYY.csv (null = no direct index). */
export const SECTOR_INDEX: Record<string, string | null> = {
  Banks: 'Nifty Bank',
  IT: 'Nifty IT',
  Auto: 'Nifty Auto',
  Pharma: 'Nifty Pharma',
  FMCG: 'Nifty FMCG',
  Metals: 'Nifty Metal',
  Energy: 'Nifty Energy',
  'Financial Services': 'Nifty Financial Services',
  Realty: 'Nifty Realty',
  Infrastructure: 'Nifty Infrastructure',
  'Consumer Durables': 'Nifty Consumer Durables',
  Telecom: null,
  Other: null,
};

export interface SectorConstituent {
  symbol: string;
  name: string;
  close: number;
  changePct: number;
  /** Size proxy: futures notional turnover (INR). We have no market cap in bhavcopy. */
  weight: number;
  oiInterpretation: string;
}

export interface SectorPerformance {
  sector: string;
  indexName: string | null;
  /** Index change if available, else equal-weighted constituent change */
  changePct: number;
  advancers: number;
  decliners: number;
  weight: number;
  constituents: SectorConstituent[];
}

function pct(a: number, b: number): number {
  return b > 0 ? ((a - b) / b) * 100 : 0;
}

export function sectorPerformance(ds: MarketDataset): SectorPerformance[] {
  const futBySymbol = new Map<string, { turnover: number; chgOi: number }>();
  for (const c of ds.contracts) {
    if (c.instrumentType === 'STF' || c.instrumentType === 'IDF') {
      const cur = futBySymbol.get(c.symbol) ?? { turnover: 0, chgOi: 0 };
      cur.turnover += c.turnover;
      cur.chgOi += c.chgOi;
      futBySymbol.set(c.symbol, cur);
    }
  }
  const bySector = new Map<string, SectorConstituent[]>();
  for (const u of ds.underlyings) {
    if (u.isIndex) continue;
    const meta = ds.universe.find((x) => x.symbol === u.symbol);
    const fut = futBySymbol.get(u.symbol);
    const changePct = pct(u.close, u.prevClose);
    const oiChg = fut?.chgOi ?? 0;
    const interp =
      changePct > 0 && oiChg > 0 ? 'Long Buildup' : changePct < 0 && oiChg > 0 ? 'Short Buildup' : changePct > 0 && oiChg < 0 ? 'Short Covering' : changePct < 0 && oiChg < 0 ? 'Long Unwinding' : 'Neutral';
    const list = bySector.get(u.sector) ?? [];
    list.push({
      symbol: u.symbol,
      name: meta?.name ?? u.symbol,
      close: u.close,
      changePct,
      weight: Math.max(fut?.turnover ?? 0, 1),
      oiInterpretation: interp,
    });
    bySector.set(u.sector, list);
  }

  const out: SectorPerformance[] = [];
  for (const [sector, constituents] of bySector) {
    const indexName = SECTOR_INDEX[sector] ?? null;
    const idx = indexName ? ds.indices.find((i) => i.name === indexName) : undefined;
    const eq = constituents.reduce((a, c) => a + c.changePct, 0) / Math.max(constituents.length, 1);
    out.push({
      sector,
      indexName,
      changePct: idx ? pct(idx.close, idx.prevClose) : eq,
      advancers: constituents.filter((c) => c.changePct > 0).length,
      decliners: constituents.filter((c) => c.changePct < 0).length,
      weight: constituents.reduce((a, c) => a + c.weight, 0),
      constituents: constituents.sort((a, b) => b.weight - a.weight),
    });
  }
  return out.sort((a, b) => b.changePct - a.changePct);
}
