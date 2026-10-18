import type { MarketDataset } from '../types';
import type { ColumnDef, ParamDef, ParamValue, ScreenerRow } from '../screeners/types';
import type { LiveSnapshot } from './snapshot';
import { contractKey, type LiveScreenerId, type LiveQuote } from './types';
import { contractLabel, trendOf } from '../screeners/specs/helpers';

const FIVE_MIN = 5 * 60_000;

export const LIVE_PARAMS: Record<LiveScreenerId, ParamDef[]> = {
  'premium-spike': [
    { key: 'minPct5m', label: 'Min 5-min jump', type: 'number', default: 12, min: 2, max: 200, step: 2, unit: '%' },
    { key: 'minLots', label: 'Min volume (lots)', type: 'number', default: 50, min: 0, max: 100000, step: 50 },
  ],
  'volume-spike': [
    { key: 'minRelVol', label: 'Min rel. volume', type: 'number', default: 1.5, min: 1, max: 10, step: 0.25, unit: 'x' },
  ],
  'unusual-options': [
    { key: 'minRatio', label: 'Min vol/OI (today)', type: 'number', default: 0.8, min: 0.1, max: 20, step: 0.1, unit: 'x' },
    { key: 'minLots', label: 'Min volume (lots)', type: 'number', default: 200, min: 0, max: 100000, step: 100 },
  ],
};

export const LIVE_COLUMNS: Record<LiveScreenerId, ColumnDef[]> = {
  'premium-spike': [
    { key: 'contract', label: 'Contract', type: 'text', primary: true },
    { key: 'ltp', label: 'LTP', type: 'number', primary: true },
    { key: 'chg5m', label: '5m', type: 'signedPct', primary: true },
    { key: 'chgPrev', label: 'vs prev close', type: 'signedPct' },
    { key: 'volume', label: 'Volume', type: 'compact' },
    { key: 'oi', label: 'OI', type: 'compact' },
  ],
  'volume-spike': [
    { key: 'ltp', label: 'Fut LTP', type: 'number', primary: true },
    { key: 'changePct', label: 'Chg', type: 'signedPct', primary: true },
    { key: 'relVol', label: 'Rel Vol', type: 'number', primary: true },
    { key: 'burst5m', label: '5m burst', type: 'number' },
    { key: 'liveVol', label: 'Vol today', type: 'compact' },
    { key: 'expected', label: 'Expected', type: 'compact' },
  ],
  'unusual-options': [
    { key: 'contract', label: 'Contract', type: 'text', primary: true },
    { key: 'ratio', label: 'Vol/OI', type: 'number', primary: true },
    { key: 'oiChgPct', label: 'OI Δ today', type: 'signedPct', primary: true },
    { key: 'volume', label: 'Volume', type: 'compact' },
    { key: 'ltp', label: 'LTP', type: 'number' },
    { key: 'chgPrev', label: 'vs prev', type: 'signedPct' },
  ],
};

export function resolveLiveParams(id: LiveScreenerId, raw: Record<string, unknown> = {}): Record<string, ParamValue> {
  const out: Record<string, ParamValue> = {};
  for (const p of LIVE_PARAMS[id]) {
    const v = raw[p.key];
    const n = v == null || v === '' ? NaN : Number(v);
    out[p.key] = Number.isFinite(n) ? Math.min(Math.max(n, p.min ?? -Infinity), p.max ?? Infinity) : p.default;
  }
  return out;
}

export interface LiveContext {
  ds: MarketDataset;
  snap: LiveSnapshot;
  sessionProgress: number;
  now?: number;
}

export function runLiveScreener(id: LiveScreenerId, ctx: LiveContext, raw: Record<string, unknown> = {}, limit = 50): { rows: ScreenerRow[]; total: number; params: Record<string, ParamValue> } {
  const params = resolveLiveParams(id, raw);
  let rows: ScreenerRow[] = [];
  if (id === 'premium-spike') rows = premiumSpike(ctx, params);
  else if (id === 'volume-spike') rows = volumeSpike(ctx, params);
  else rows = unusualOptions(ctx, params);
  return { rows: rows.slice(0, limit), total: rows.length, params };
}

function eodByKey(ds: MarketDataset) {
  const m = new Map<string, (typeof ds.contracts)[number]>();
  for (const c of ds.contracts) m.set(contractKey(c), c);
  return m;
}

function premiumSpike({ ds, snap, now }: LiveContext, p: Record<string, ParamValue>): ScreenerRow[] {
  const eod = eodByKey(ds);
  const rows: Array<ScreenerRow & { _s: number }> = [];
  for (const t of snap.all()) {
    if (!t.optionType) continue;
    const base = eod.get(t.key);
    if (!base) continue;
    if (t.volume < Number(p.minLots) * base.lotSize) continue;
    const w = snap.changeOver(t.key, FIVE_MIN, now);
    const chg5m = w?.ltpChangePct ?? 0;
    const chgPrev = base.prevClose > 0 ? ((t.ltp - base.prevClose) / base.prevClose) * 100 : 0;
    if (chg5m < Number(p.minPct5m)) continue;
    rows.push({ key: t.key, symbol: t.symbol, trend: 'up', values: { contract: contractLabel(base), ltp: t.ltp, chg5m, chgPrev, volume: t.volume, oi: t.oi ?? base.oi }, _s: chg5m });
  }
  return rows.sort((a, b) => b._s - a._s).map(({ _s, ...r }) => r);
}

function volumeSpike({ ds, snap, sessionProgress, now }: LiveContext, p: Record<string, ParamValue>): ScreenerRow[] {
  const prog = Math.max(sessionProgress, 0.02);
  const rows: Array<ScreenerRow & { _s: number }> = [];
  for (const u of ds.underlyings) {
    const futs = ds.contracts.filter((c) => c.symbol === u.symbol && c.optionType == null);
    let liveVol = 0;
    let burst = 0;
    let ltp: number | null = null;
    let futPrev = 0;
    for (const f of futs) {
      const t = snap.get(contractKey(f));
      if (!t) continue;
      liveVol += t.volume;
      const w = snap.changeOver(t.key, FIVE_MIN, now);
      if (w) burst += w.volumeDelta;
      if (ltp == null) { ltp = t.ltp; futPrev = f.prevClose; }
    }
    if (ltp == null || !u.futVolumeAvg20) continue;
    const expected = u.futVolumeAvg20 * prog;
    const relVol = expected > 0 ? liveVol / expected : 0;
    const expected5m = u.futVolumeAvg20 * (5 / 375);
    const burst5m = expected5m > 0 ? burst / expected5m : 0;
    if (relVol < Number(p.minRelVol)) continue;
    rows.push({ key: u.symbol, symbol: u.symbol, trend: trendOf(ltp - futPrev), values: { ltp, changePct: futPrev > 0 ? ((ltp - futPrev) / futPrev) * 100 : 0, relVol: +relVol.toFixed(2), burst5m: +burst5m.toFixed(2), liveVol, expected: Math.round(expected) }, _s: relVol });
  }
  return rows.sort((a, b) => b._s - a._s).map(({ _s, ...r }) => r);
}

function unusualOptions({ ds, snap }: LiveContext, p: Record<string, ParamValue>): ScreenerRow[] {
  const eod = eodByKey(ds);
  const rows: Array<ScreenerRow & { _s: number }> = [];
  for (const t of snap.all()) {
    if (!t.optionType) continue;
    const base = eod.get(t.key);
    if (!base || base.oi <= 0) continue;
    if (t.volume < Number(p.minLots) * base.lotSize) continue;
    const ratio = t.volume / base.oi;
    if (ratio < Number(p.minRatio)) continue;
    const oiChgPct = t.oi != null ? ((t.oi - base.oi) / base.oi) * 100 : null;
    const chgPrev = base.prevClose > 0 ? ((t.ltp - base.prevClose) / base.prevClose) * 100 : 0;
    rows.push({ key: t.key, symbol: t.symbol, trend: trendOf(chgPrev), values: { contract: contractLabel(base), ratio: +ratio.toFixed(2), oiChgPct, volume: t.volume, ltp: t.ltp, chgPrev }, _s: ratio });
  }
  return rows.sort((a, b) => b._s - a._s).map(({ _s, ...r }) => r);
}

/** Underlying-level quotes from the near future (falls back to EOD close when no tick yet). */
export function liveQuotes(ds: MarketDataset, snap: LiveSnapshot, symbols: string[]): LiveQuote[] {
  const out: LiveQuote[] = [];
  for (const symbol of symbols) {
    const u = ds.underlyings.find((x) => x.symbol === symbol);
    if (!u) continue;
    const fut = ds.contracts.filter((c) => c.symbol === symbol && c.optionType == null).sort((a, b) => a.expiry.localeCompare(b.expiry))[0];
    const t = fut ? snap.get(contractKey(fut)) : undefined;
    if (t && fut) {
      out.push({ symbol, ltp: t.ltp, prevClose: fut.prevClose, changePct: fut.prevClose > 0 ? ((t.ltp - fut.prevClose) / fut.prevClose) * 100 : 0, ts: t.ts, source: 'fut' });
    } else {
      out.push({ symbol, ltp: u.close, prevClose: u.prevClose, changePct: u.prevClose > 0 ? ((u.close - u.prevClose) / u.prevClose) * 100 : 0, ts: 0, source: 'spot' });
    }
  }
  return out;
}
