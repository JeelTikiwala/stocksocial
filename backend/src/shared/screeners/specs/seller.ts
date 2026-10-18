import type { ScreenerSpec } from '../types';
import { ivStats } from '../../analytics/iv';
import { interpretOi } from '../../analytics/chain';
import { contractLabel, optionContracts, pct, trendOf, EXPIRY_PARAM, SYMBOL_KIND_PARAM, kindFilter } from './helpers';

export const ivChart: ScreenerSpec = {
  id: 'iv-chart',
  zone: 'seller',
  name: 'IV Chart',
  tagline: 'ATM implied volatility over time',
  description: 'Daily at-the-money implied volatility history per underlying, computed with Black–Scholes from settlement prices (all NSE options are European-style).',
  mode: 'EOD',
  availability: 'ready',
  params: [],
  columns: [],
  detailRoute: '/tools/iv-chart',
};

export const strikeOpen: ScreenerSpec = {
  id: 'strike-open',
  zone: 'seller',
  name: 'Strike Open',
  tagline: 'Open interest by strike',
  description: 'Call and put OI (and the day\'s change) across strikes for a chosen expiry, with max-pain and the PCR. The classic support/resistance read for option writers.',
  mode: 'EOD',
  availability: 'ready',
  params: [],
  columns: [],
  detailRoute: '/tools/strike-open',
};

export const unusualOptions: ScreenerSpec = {
  id: 'unusual-options',
  zone: 'seller',
  name: 'Unusual Options',
  tagline: 'Volume far above open interest',
  description: 'Contracts where the day\'s volume is a large multiple of existing open interest — fresh, aggressive positioning rather than routine rolls.',
  mode: 'EOD',
  availability: 'ready',
  params: [
    { key: 'minRatio', label: 'Min vol/OI', type: 'number', default: 1.5, min: 0.5, max: 20, step: 0.5, unit: 'x' },
    { key: 'minVolume', label: 'Min volume', type: 'number', default: 1000, min: 0, max: 200000, step: 500 },
    SYMBOL_KIND_PARAM,
    EXPIRY_PARAM,
  ],
  columns: [
    { key: 'contract', label: 'Contract', type: 'text', primary: true },
    { key: 'ratio', label: 'Vol/OI', type: 'number', primary: true },
    { key: 'volume', label: 'Volume', type: 'compact', primary: true },
    { key: 'oi', label: 'OI', type: 'compact' },
    { key: 'chgOi', label: 'ΔOI', type: 'compact' },
    { key: 'close', label: 'LTP', type: 'number' },
    { key: 'changePct', label: 'Chg', type: 'signedPct' },
  ],
  run: (ds, p) => {
    const keep = kindFilter(ds, String(p.kind));
    return optionContracts(ds, String(p.expiryMode))
      .filter((c) => keep(c.symbol) && c.oi > 0 && c.volume >= Number(p.minVolume))
      .map((c) => ({ c, ratio: c.volume / c.oi }))
      .filter((x) => x.ratio >= Number(p.minRatio))
      .sort((a, b) => b.ratio - a.ratio)
      .map(({ c, ratio }) => ({
        key: `${c.symbol}-${c.expiry}-${c.strike}-${c.optionType}`,
        symbol: c.symbol,
        trend: trendOf(c.close - c.prevClose),
        values: { contract: contractLabel(c), ratio: +ratio.toFixed(2), volume: c.volume, oi: c.oi, chgOi: c.chgOi, close: c.close, changePct: pct(c.close, c.prevClose) },
      }));
  },
};

export const ivRank: ScreenerSpec = {
  id: 'iv-rank',
  zone: 'seller',
  name: 'IV Rank & Percentile',
  tagline: 'Where today\'s IV sits in its 1-year range',
  description: 'IV Rank = (IV − 52w low) / (52w high − 52w low). IV Percentile = share of days in the last year with lower IV. High readings favour premium selling; low readings favour buying.',
  mode: 'EOD',
  availability: 'ready',
  params: [
    { key: 'sort', label: 'Sort', type: 'select', default: 'rankDesc', options: [{ label: 'Rank ↓', value: 'rankDesc' }, { label: 'Rank ↑', value: 'rankAsc' }, { label: 'IV ↓', value: 'ivDesc' }] },
    SYMBOL_KIND_PARAM,
  ],
  columns: [
    { key: 'iv', label: 'ATM IV', type: 'iv', primary: true },
    { key: 'rank', label: 'IV Rank', type: 'number', primary: true },
    { key: 'percentile', label: 'IV %ile', type: 'number', primary: true },
    { key: 'change1d', label: 'Δ1D', type: 'number' },
    { key: 'change30d', label: 'Δ30D', type: 'number' },
    { key: 'min', label: '52w Lo', type: 'iv' },
    { key: 'max', label: '52w Hi', type: 'iv' },
  ],
  run: (ds, p) => {
    const keep = kindFilter(ds, String(p.kind));
    const rows = Object.entries(ds.ivHistory)
      .filter(([s]) => keep(s))
      .map(([symbol, pts]) => {
        const st = ivStats(pts);
        return {
          key: symbol,
          symbol,
          trend: trendOf(st.change1d ?? 0),
          values: { iv: st.current, rank: st.rank == null ? null : +st.rank.toFixed(0), percentile: st.percentile == null ? null : +st.percentile.toFixed(0), change1d: st.change1d == null ? null : +st.change1d.toFixed(2), change30d: st.change30d == null ? null : +st.change30d.toFixed(2), min: st.min, max: st.max },
        };
      });
    const n = (v: string | number | null) => (typeof v === 'number' ? v : -Infinity);
    if (p.sort === 'rankAsc') rows.sort((a, b) => n(a.values.rank) - n(b.values.rank));
    else if (p.sort === 'ivDesc') rows.sort((a, b) => n(b.values.iv) - n(a.values.iv));
    else rows.sort((a, b) => n(b.values.rank) - n(a.values.rank));
    return rows;
  },
};

export const gainersLosers: ScreenerSpec = {
  id: 'gainers-losers',
  zone: 'seller',
  name: 'Gainers & Losers',
  tagline: 'Biggest movers in the F&O universe',
  description: 'Underlyings ranked by the day\'s move, with futures OI interpretation so you can tell a short-covering pop from a long build-up.',
  mode: 'EOD',
  availability: 'ready',
  params: [
    { key: 'side', label: 'Side', type: 'select', default: 'gainers', options: [{ label: 'Gainers', value: 'gainers' }, { label: 'Losers', value: 'losers' }] },
    SYMBOL_KIND_PARAM,
  ],
  columns: [
    { key: 'close', label: 'Close', type: 'number', primary: true },
    { key: 'changePct', label: 'Chg', type: 'signedPct', primary: true },
    { key: 'interpretation', label: 'Fut OI read', type: 'badge', primary: true },
    { key: 'futChgOi', label: 'Fut ΔOI', type: 'compact' },
    { key: 'futVolume', label: 'Fut Vol', type: 'compact' },
  ],
  run: (ds, p) => {
    const keep = kindFilter(ds, String(p.kind));
    const futChg = new Map<string, number>();
    for (const c of ds.contracts) if (c.optionType == null) futChg.set(c.symbol, (futChg.get(c.symbol) ?? 0) + c.chgOi);
    const rows = ds.underlyings
      .filter((u) => keep(u.symbol))
      .map((u) => {
        const chg = pct(u.close, u.prevClose);
        return {
          key: u.symbol,
          symbol: u.symbol,
          trend: trendOf(chg),
          values: { close: u.close, changePct: chg, interpretation: interpretOi(u.close - u.prevClose, futChg.get(u.symbol) ?? 0), futChgOi: futChg.get(u.symbol) ?? 0, futVolume: u.futVolume },
          _chg: chg,
        };
      });
    rows.sort((a, b) => (p.side === 'losers' ? a._chg - b._chg : b._chg - a._chg));
    return rows.map(({ _chg, ...r }) => r);
  },
};

export const straddleChart: ScreenerSpec = {
  id: 'straddle-chart',
  zone: 'seller',
  name: 'Straddle Chart',
  tagline: 'ATM straddle price into expiry',
  description: 'The at-the-money call + put premium for the near expiry over the trailing sessions. Weekly contracts exist only on NIFTY (Tuesday) now; everything else is monthly.',
  mode: 'EOD',
  availability: 'ready',
  params: [],
  columns: [],
  detailRoute: '/tools/straddle',
};

export const SELLER_SPECS = [ivChart, strikeOpen, unusualOptions, ivRank, gainersLosers, straddleChart];
