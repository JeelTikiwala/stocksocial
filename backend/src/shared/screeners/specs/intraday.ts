import type { ScreenerSpec } from '../types';
import { interpretOi, listExpiries } from '../../analytics/chain';
import { contractLabel, optionContracts, pct, trendOf, EXPIRY_PARAM, SYMBOL_KIND_PARAM, kindFilter } from './helpers';

export const oiFinder: ScreenerSpec = {
  id: 'oi-finder',
  zone: 'intraday',
  name: 'OI Finder',
  tagline: 'Largest open-interest changes by contract',
  description: 'Ranks option contracts by change in open interest and interprets the build-up (long/short build-up, covering, unwinding) from price and OI together. NSE publishes OI intraday, so the live version refreshes every few seconds; EOD mode uses the day\'s net change.',
  mode: 'LIVE',
  availability: 'eod-approx',
  eodNote: 'EOD mode shows the full-day change in OI from the bhavcopy.',
  params: [
    { key: 'optionType', label: 'Type', type: 'select', default: 'all', options: [{ label: 'All', value: 'all' }, { label: 'Calls', value: 'CE' }, { label: 'Puts', value: 'PE' }] },
    { key: 'direction', label: 'Direction', type: 'select', default: 'build', options: [{ label: 'OI added', value: 'build' }, { label: 'OI unwound', value: 'unwind' }] },
    SYMBOL_KIND_PARAM,
    EXPIRY_PARAM,
  ],
  columns: [
    { key: 'contract', label: 'Contract', type: 'text', primary: true },
    { key: 'chgOi', label: 'ΔOI', type: 'compact', primary: true },
    { key: 'chgOiPct', label: 'ΔOI %', type: 'signedPct', primary: true },
    { key: 'oi', label: 'OI', type: 'compact' },
    { key: 'close', label: 'LTP', type: 'number' },
    { key: 'changePct', label: 'Chg', type: 'signedPct' },
    { key: 'interpretation', label: 'Read', type: 'badge' },
  ],
  run: (ds, p) => {
    const keep = kindFilter(ds, String(p.kind));
    const build = p.direction === 'build';
    return optionContracts(ds, String(p.expiryMode))
      .filter((c) => keep(c.symbol) && (p.optionType === 'all' || c.optionType === p.optionType) && c.oi > 0)
      .filter((c) => (build ? c.chgOi > 0 : c.chgOi < 0))
      .sort((a, b) => (build ? b.chgOi - a.chgOi : a.chgOi - b.chgOi))
      .map((c) => ({
        key: `${c.symbol}-${c.expiry}-${c.strike}-${c.optionType}`,
        symbol: c.symbol,
        trend: trendOf(c.chgOi),
        values: {
          contract: contractLabel(c),
          chgOi: c.chgOi,
          chgOiPct: c.oi - c.chgOi > 0 ? (c.chgOi / (c.oi - c.chgOi)) * 100 : 100,
          oi: c.oi,
          close: c.close,
          changePct: pct(c.close, c.prevClose),
          interpretation: interpretOi(c.close - c.prevClose, c.chgOi),
        },
      }));
  },
};

export const oiBreadth: ScreenerSpec = {
  id: 'oi-breadth',
  zone: 'intraday',
  name: 'OI Breadth',
  tagline: 'Call vs. put OI build-up across the universe',
  description: 'For every underlying, compares the change in call OI against put OI to read where writers are positioning. Positive net (puts added faster than calls) is read as support-building; negative as resistance-building.',
  mode: 'LIVE',
  availability: 'eod-approx',
  eodNote: 'EOD mode aggregates the day\'s ΔOI per underlying.',
  params: [SYMBOL_KIND_PARAM, EXPIRY_PARAM],
  columns: [
    { key: 'pcr', label: 'PCR', type: 'number', primary: true },
    { key: 'netChgOi', label: 'Put−Call ΔOI', type: 'compact', primary: true },
    { key: 'sentiment', label: 'Read', type: 'badge', primary: true },
    { key: 'callChgOi', label: 'Call ΔOI', type: 'compact' },
    { key: 'putChgOi', label: 'Put ΔOI', type: 'compact' },
    { key: 'callOi', label: 'Call OI', type: 'compact' },
    { key: 'putOi', label: 'Put OI', type: 'compact' },
    { key: 'changePct', label: 'Chg', type: 'signedPct' },
  ],
  run: (ds, p) => {
    const keep = kindFilter(ds, String(p.kind));
    const agg = new Map<string, { callOi: number; putOi: number; callChg: number; putChg: number }>();
    for (const c of optionContracts(ds, String(p.expiryMode))) {
      if (!keep(c.symbol)) continue;
      const a = agg.get(c.symbol) ?? { callOi: 0, putOi: 0, callChg: 0, putChg: 0 };
      if (c.optionType === 'CE') { a.callOi += c.oi; a.callChg += c.chgOi; } else { a.putOi += c.oi; a.putChg += c.chgOi; }
      agg.set(c.symbol, a);
    }
    return Array.from(agg.entries())
      .map(([symbol, a]) => {
        const u = ds.underlyings.find((x) => x.symbol === symbol);
        const net = a.putChg - a.callChg;
        const scale = Math.max(a.callOi + a.putOi, 1);
        const score = net / scale;
        const sentiment = score > 0.03 ? 'Bullish' : score < -0.03 ? 'Bearish' : 'Neutral';
        return {
          key: symbol,
          symbol,
          trend: trendOf(net),
          values: {
            pcr: a.callOi > 0 ? +(a.putOi / a.callOi).toFixed(2) : null,
            netChgOi: net,
            sentiment,
            callChgOi: a.callChg,
            putChgOi: a.putChg,
            callOi: a.callOi,
            putOi: a.putOi,
            changePct: u ? pct(u.close, u.prevClose) : null,
          },
          _score: Math.abs(score),
        };
      })
      .sort((a, b) => b._score - a._score)
      .map(({ _score, ...row }) => row);
  },
};

export const intradayBooster: ScreenerSpec = {
  id: 'intraday-booster',
  zone: 'intraday',
  name: 'Intraday Booster',
  tagline: 'Opening Range Breakout (ORB) scanner',
  description: 'Scans F&O stocks for a breakout above (or below) the first 15-minute opening range with volume confirmation. This needs intraday bars and will go live with the licensed feed (Phase C); on this build it is a shell showing the rule set.',
  mode: 'LIVE',
  availability: 'placeholder',
  eodNote: 'Rule set: range = high/low of 09:15–09:30; signal when a 5-min close breaks the range with volume ≥ 1.5× the 20-day same-bucket average. Not computable from EOD data.',
  params: [],
  columns: [],
};

export const heavyTrades: ScreenerSpec = {
  id: 'heavy-trades',
  zone: 'intraday',
  name: 'Heavy Trades',
  tagline: 'Contracts with the largest value traded',
  description: 'Ranks contracts by notional turnover and average trade size. India has no trade-condition codes (no sweep/block flags), so large prints are inferred from turnover and trades. Live mode needs a tick feed.',
  mode: 'LIVE',
  availability: 'eod-approx',
  eodNote: 'EOD mode uses total traded value and number of trades from the bhavcopy.',
  params: [
    { key: 'instrument', label: 'Instrument', type: 'select', default: 'options', options: [{ label: 'Options', value: 'options' }, { label: 'Futures', value: 'futures' }, { label: 'Both', value: 'both' }] },
    SYMBOL_KIND_PARAM,
  ],
  columns: [
    { key: 'contract', label: 'Contract', type: 'text', primary: true },
    { key: 'turnover', label: 'Value', type: 'inr', primary: true },
    { key: 'avgTrade', label: 'Avg trade', type: 'inr', primary: true },
    { key: 'trades', label: 'Trades', type: 'compact' },
    { key: 'volume', label: 'Volume', type: 'compact' },
    { key: 'oi', label: 'OI', type: 'compact' },
    { key: 'close', label: 'LTP', type: 'number' },
  ],
  run: (ds, p) => {
    const keep = kindFilter(ds, String(p.kind));
    return ds.contracts
      .filter((c) => keep(c.symbol) && c.trades > 0)
      .filter((c) => (p.instrument === 'both' ? true : p.instrument === 'options' ? c.optionType != null : c.optionType == null))
      .sort((a, b) => b.turnover - a.turnover)
      .map((c) => ({
        key: `${c.symbol}-${c.instrumentType}-${c.expiry}-${c.strike ?? ''}-${c.optionType ?? ''}`,
        symbol: c.symbol,
        trend: trendOf(c.close - c.prevClose),
        values: { contract: contractLabel(c), turnover: c.turnover, avgTrade: c.turnover / c.trades, trades: c.trades, volume: c.volume, oi: c.oi, close: c.close },
      }));
  },
};

export const marketPulseSpec: ScreenerSpec = {
  id: 'market-pulse',
  zone: 'intraday',
  name: 'Market Pulse',
  tagline: 'Breadth, VIX, PCR, FII/DII at a glance',
  description: 'A one-screen read of the market: index moves, India VIX, advance/decline, put-call ratio, futures OI sentiment and institutional flows.',
  mode: 'EOD',
  availability: 'ready',
  params: [],
  columns: [],
  detailRoute: '/tools/market-pulse',
};

export const INTRADAY_SPECS = [oiFinder, oiBreadth, intradayBooster, heavyTrades, marketPulseSpec];
// Re-export so the registry can confirm near-expiry helpers compile under both consumers.
export { listExpiries };
