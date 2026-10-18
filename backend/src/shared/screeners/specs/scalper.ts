import type { ScreenerSpec } from '../types';
import { contractLabel, optionContracts, pct, trendOf, EXPIRY_PARAM, SYMBOL_KIND_PARAM, kindFilter } from './helpers';

export const volumeSpike: ScreenerSpec = {
  id: 'volume-spike',
  zone: 'scalper',
  name: 'Volume Spike',
  tagline: 'Futures volume vs. 20-day average',
  description: 'Flags underlyings whose futures volume ran well above their 20-day average. Intraday this fires on 1-minute buckets; in EOD mode it compares the full session.',
  mode: 'LIVE',
  availability: 'eod-approx',
  eodNote: 'EOD mode compares the full-day futures volume to the trailing 20-session average.',
  params: [
    { key: 'minRelVol', label: 'Min rel. volume', type: 'number', default: 1.5, min: 1, max: 10, step: 0.25, unit: 'x' },
    SYMBOL_KIND_PARAM,
  ],
  columns: [
    { key: 'close', label: 'Close', type: 'number', primary: true },
    { key: 'changePct', label: 'Chg', type: 'signedPct', primary: true },
    { key: 'relVol', label: 'Rel Vol', type: 'number', primary: true },
    { key: 'futVolume', label: 'Fut Vol', type: 'compact' },
    { key: 'avgVol', label: 'Avg 20D', type: 'compact' },
  ],
  run: (ds, p) => {
    const keep = kindFilter(ds, String(p.kind));
    return ds.underlyings
      .filter((u) => keep(u.symbol) && u.futVolumeAvg20 && u.futVolumeAvg20 > 0)
      .map((u) => ({ u, relVol: u.futVolume / (u.futVolumeAvg20 as number) }))
      .filter((x) => x.relVol >= Number(p.minRelVol))
      .sort((a, b) => b.relVol - a.relVol)
      .map(({ u, relVol }) => ({
        key: u.symbol,
        symbol: u.symbol,
        trend: trendOf(u.close - u.prevClose),
        values: { close: u.close, changePct: pct(u.close, u.prevClose), relVol: +relVol.toFixed(2), futVolume: u.futVolume, avgVol: u.futVolumeAvg20 },
      }));
  },
};

export const hx3: ScreenerSpec = {
  id: 'hx3',
  zone: 'scalper',
  name: 'HX3',
  tagline: 'Proprietary strategy — coming soon',
  description: 'Reserved for your HX3 strategy. The screener shell, parameter UI and results table are wired; the rule set will be added once the specification is finalised.',
  mode: 'LIVE',
  availability: 'placeholder',
  params: [],
  columns: [],
};

export const premiumSpike: ScreenerSpec = {
  id: 'premium-spike',
  zone: 'scalper',
  name: 'Premium Spike',
  tagline: 'Option premiums that jumped the most',
  description: 'Liquid option contracts whose premium rose sharply versus the previous close. Intraday this is a tick-level alert; EOD mode uses close-to-close.',
  mode: 'LIVE',
  availability: 'eod-approx',
  eodNote: 'EOD mode ranks close-to-close premium change for contracts above the volume floor.',
  params: [
    { key: 'minPct', label: 'Min jump', type: 'number', default: 40, min: 10, max: 500, step: 10, unit: '%' },
    { key: 'minVolume', label: 'Min volume', type: 'number', default: 500, min: 0, max: 100000, step: 500 },
    { key: 'minPremium', label: 'Min premium', type: 'number', default: 5, min: 0.05, max: 1000, step: 5, unit: '₹' },
    EXPIRY_PARAM,
  ],
  columns: [
    { key: 'contract', label: 'Contract', type: 'text', primary: true },
    { key: 'close', label: 'LTP', type: 'number', primary: true },
    { key: 'changePct', label: 'Chg', type: 'signedPct', primary: true },
    { key: 'volume', label: 'Volume', type: 'compact' },
    { key: 'oi', label: 'OI', type: 'compact' },
    { key: 'chgOi', label: 'ΔOI', type: 'compact' },
  ],
  run: (ds, p) =>
    optionContracts(ds, String(p.expiryMode))
      .filter((c) => c.volume >= Number(p.minVolume) && c.prevClose >= Number(p.minPremium) && c.close > 0)
      .map((c) => ({ c, chg: pct(c.close, c.prevClose) }))
      .filter((x) => x.chg >= Number(p.minPct))
      .sort((a, b) => b.chg - a.chg)
      .map(({ c, chg }) => ({
        key: `${c.symbol}-${c.expiry}-${c.strike}-${c.optionType}`,
        symbol: c.symbol,
        trend: 'up' as const,
        values: { contract: contractLabel(c), close: c.close, changePct: chg, volume: c.volume, oi: c.oi, chgOi: c.chgOi },
      })),
};
