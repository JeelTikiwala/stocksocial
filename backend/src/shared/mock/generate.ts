/**
 * Deterministic mock market generator. Produces a full `MarketDataset` that is shape-
 * identical to what the bhavcopy ingestion produces, so screens, screeners and tests run
 * without a backend or network. Same seed → same data, on every platform.
 */
import type { FiiDiiPoint, FoContract, HistoryPoint, IndexEod, IvPoint, MarketDataset, StraddlePoint, UnderlyingEod } from '../types';
import { Prng } from '../prng';
import { bsPrice, atmStrikeFor } from '../options/blackScholes';
import { mockExpiriesFor, tradingDaysEndingAt, previousWeekday, yearFraction, daysBetween, lastWeekdayOfMonth, TUESDAY } from '../calendar';
import { MOCK_UNIVERSE, type MockUniverseEntry } from './universe';
import { SECTOR_INDEX } from '../analytics/sectors';

export interface MockOptions {
  seed?: number;
  tradeDate?: string;
  historyDays?: number;
  strikesEachSide?: number;
}

const roundTick = (x: number, tick = 0.05) => Math.max(Math.round(x / tick) * tick, tick);
const round2 = (x: number) => Math.round(x * 100) / 100;

function genUnderlyingHistory(e: MockUniverseEntry, dates: string[], rng: Prng): HistoryPoint[] {
  const n = dates.length;
  const dailyVol = (e.baseIv * 0.9) / Math.sqrt(252);
  // Walk backwards from basePrice so the final close equals basePrice (nice for the demo).
  const closes = new Array<number>(n);
  closes[n - 1] = e.basePrice;
  for (let i = n - 2; i >= 0; i--) {
    const r = rng.normal() * dailyVol - 0.0002;
    closes[i] = closes[i + 1] / Math.exp(r);
  }
  // Futures volume in units (shares): contracts × lot
  const baseVol = (e.isIndex ? 180_000 : Math.round(2_500_000_000 / (e.basePrice * e.lotSize))) * e.lotSize;
  return dates.map((date, i) => ({
    date,
    close: round2(closes[i]),
    volume: Math.max(Math.round(baseVol * Math.exp(rng.normal() * 0.35)), 100),
  }));
}

function genIvHistory(e: MockUniverseEntry, hist: HistoryPoint[], rng: Prng): IvPoint[] {
  const out: IvPoint[] = [];
  let iv = e.baseIv * rng.range(0.85, 1.15);
  for (let i = 0; i < hist.length; i++) {
    const ret = i > 0 ? Math.log(hist[i].close / hist[i - 1].close) : 0;
    // Mean-reverting with a negative price/vol correlation
    iv += 0.06 * (e.baseIv - iv) + rng.normal() * 0.006 - ret * 0.8;
    iv = Math.min(Math.max(iv, e.baseIv * 0.55), e.baseIv * 2.2);
    out.push({ date: hist[i].date, atmIv: +iv.toFixed(4) });
  }
  return out;
}

function skewIv(atmIv: number, strike: number, fwd: number, t: number, isIndex: boolean): number {
  const m = Math.log(strike / fwd) / Math.sqrt(Math.max(t, 0.01));
  const putSkew = isIndex ? -0.22 : -0.12;
  const smile = isIndex ? 0.25 : 0.35;
  return Math.max(atmIv * (1 + putSkew * m + smile * m * m), 0.04);
}

export function generateMockMarket(opts: MockOptions = {}): MarketDataset {
  const seed = opts.seed ?? 20261016;
  const tradeDate = opts.tradeDate ?? '2026-10-16';
  const prevTradeDate = previousWeekday(tradeDate);
  const historyDays = opts.historyDays ?? 260;
  const strikesEachSide = opts.strikesEachSide ?? 12;
  const dates = tradingDaysEndingAt(tradeDate, historyDays);
  const rate = 0.065;

  const underlyingHistory: Record<string, HistoryPoint[]> = {};
  const ivHistory: Record<string, IvPoint[]> = {};
  const straddleHistory: Record<string, StraddlePoint[]> = {};
  const underlyings: UnderlyingEod[] = [];
  const contracts: FoContract[] = [];

  for (const e of MOCK_UNIVERSE) {
    const rng = Prng.fromKey(seed, e.symbol);
    const hist = genUnderlyingHistory(e, dates, rng);
    const ivs = genIvHistory(e, hist, rng);
    underlyingHistory[e.symbol] = hist;
    ivHistory[e.symbol] = ivs;

    const today = hist[hist.length - 1];
    const prev = hist[hist.length - 2];
    const spot = today.close;
    const prevSpot = prev.close;
    const atmIv = ivs[ivs.length - 1].atmIv;
    const prevAtmIv = ivs[ivs.length - 2].atmIv;
    const last20 = hist.slice(-21, -1);
    underlyings.push({
      tradeDate,
      symbol: e.symbol,
      close: spot,
      prevClose: prevSpot,
      futVolume: today.volume,
      futVolumeAvg20: Math.round(last20.reduce((a, p) => a + p.volume, 0) / last20.length),
      isIndex: e.isIndex,
      sector: e.sector,
    });

    const expiries = mockExpiriesFor(e.symbol, tradeDate);
    // Symbol-level OI sentiment bias for the day (so OI screeners have structure)
    const bias = rng.normal() * 0.08;
    const futType = e.isIndex ? 'IDF' : 'STF';
    const optType = e.isIndex ? 'IDO' : 'STO';

    expiries.forEach((expiry, ei) => {
      const t = yearFraction(tradeDate, expiry);
      const tPrev = yearFraction(prevTradeDate, expiry);
      const fwd = spot * Math.exp(rate * t);
      const nearness = Math.exp(-ei * 0.9); // liquidity concentrates in near expiries

      // Futures (NIFTY weeklies have no futures; monthlies do)
      const hasFutures = e.symbol !== 'NIFTY' || expiry === lastWeekdayOfMonth(expiry, TUESDAY);
      if (hasFutures) {
        // Units (shares), as NSE reports: contracts × lot
        const futOi = Math.round((e.isIndex ? 1_900_000 : 3_000_000_000 / (spot * e.lotSize)) * nearness * rng.range(0.7, 1.3)) * e.lotSize;
        const futChg = Math.round(futOi * (bias + rng.normal() * 0.04));
        const futClose = round2(fwd * (1 + rng.normal() * 0.0008));
        const futPrev = round2(prevSpot * Math.exp(rate * tPrev) * (1 + rng.normal() * 0.0008));
        const vol = Math.max(Math.round(today.volume * nearness * rng.range(0.6, 1.1)), 10);
        contracts.push({
          tradeDate, symbol: e.symbol, instrumentType: futType, expiry, strike: null, optionType: null,
          open: round2(futPrev * (1 + rng.normal() * 0.003)), high: round2(Math.max(futClose, futPrev) * 1.006), low: round2(Math.min(futClose, futPrev) * 0.994),
          close: futClose, last: futClose, prevClose: futPrev, underlyingPrice: spot, settle: futClose,
          oi: futOi, chgOi: futChg, volume: vol, turnover: round2(vol * futClose), trades: Math.max(Math.round(vol / e.lotSize / rng.range(1.5, 4)), 1), lotSize: e.lotSize,
        });
      }

      // Options
      const atm = Math.round(spot / e.strikeStep) * e.strikeStep;
      const baseOi = (e.isIndex ? 60_000 * (e.symbol === 'NIFTY' ? 2 : 1) : 3_000_000_000 / (spot * e.lotSize)) * nearness;
      for (let k = -strikesEachSide; k <= strikesEachSide; k++) {
        const strike = round2(atm + k * e.strikeStep);
        const roundBonus = strike % (e.strikeStep * 10) === 0 ? 1.8 : strike % (e.strikeStep * 5) === 0 ? 1.3 : 1;
        for (const ot of ['CE', 'PE'] as const) {
          const iv = skewIv(atmIv, strike, fwd, t, e.isIndex);
          const ivPrev = skewIv(prevAtmIv, strike, prevSpot * Math.exp(rate * tPrev), tPrev, e.isIndex);
          const theo = bsPrice({ spot, strike, t, sigma: iv, rate, type: ot });
          const theoPrev = bsPrice({ spot: prevSpot, strike, t: tPrev, sigma: ivPrev, rate, type: ot });
          const close = roundTick(theo * (1 + rng.normal() * 0.015));
          const prevClose = roundTick(theoPrev * (1 + rng.normal() * 0.015));
          // OI peaks near ATM, skewed OTM for the side (calls above, puts below)
          const sideBias = (ot === 'CE' ? k : -k) > 0 ? 1.25 : 0.8;
          const shape = Math.exp(-0.5 * (k / 6) ** 2);
          const oi = Math.max(Math.round(baseOi * shape * roundBonus * sideBias * Math.exp(rng.normal() * 0.45)), 0) * e.lotSize;
          const chgOi = Math.round(oi * (bias * (ot === 'PE' ? -1 : 1) + rng.normal() * 0.12));
          const volume = Math.max(Math.round(oi * rng.range(0.2, 1.0) * Math.exp(-0.5 * (k / 4) ** 2 + 0.15) * Math.exp(rng.normal() * 0.6)), 0);
          const trades = volume > 0 ? Math.max(Math.round(volume / rng.range(60, 400)), 1) : 0;
          contracts.push({
            tradeDate, symbol: e.symbol, instrumentType: optType, expiry, strike, optionType: ot,
            open: roundTick(prevClose * (1 + rng.normal() * 0.03)), high: roundTick(Math.max(close, prevClose) * 1.08), low: roundTick(Math.min(close, prevClose) * 0.9),
            close, last: close, prevClose, underlyingPrice: spot, settle: close,
            oi, chgOi, volume, turnover: round2(volume * (strike + close)), trades, lotSize: e.lotSize,
          });
        }
      }
    });

    // Straddle history for the near expiry (synthetic path over the trailing window)
    const nearExp = expiries[0];
    const window = Math.min(daysBetween(dates[Math.max(dates.length - 25, 0)], tradeDate) + 1, 25);
    const pts: StraddlePoint[] = [];
    for (let i = hist.length - window; i < hist.length; i++) {
      const d = hist[i].date;
      const tt = yearFraction(d, nearExp);
      const s = hist[i].close;
      const strikes = Array.from({ length: 2 * strikesEachSide + 1 }, (_, j) => Math.round(spot / e.strikeStep) * e.strikeStep + (j - strikesEachSide) * e.strikeStep);
      const k = atmStrikeFor(s, strikes);
      const ivd = ivs[i].atmIv;
      const px = bsPrice({ spot: s, strike: k, t: tt, sigma: ivd, rate, type: 'CE' }) + bsPrice({ spot: s, strike: k, t: tt, sigma: ivd, rate, type: 'PE' });
      pts.push({ date: d, expiry: nearExp, atmStrike: k, spot: s, straddlePrice: round2(px * (1 + rng.normal() * 0.01)), daysToExpiry: daysBetween(d, nearExp) });
    }
    straddleHistory[e.symbol] = pts;
  }

  // Indices: broad (from index underlyings) + sectoral (equal-weighted constituents) + VIX
  const indices: IndexEod[] = [];
  const pushIdx = (name: string, close: number, prevClose: number) => indices.push({ tradeDate, name, close: round2(close), prevClose: round2(prevClose) });
  const u = (s: string) => underlyings.find((x) => x.symbol === s)!;
  pushIdx('Nifty 50', u('NIFTY').close, u('NIFTY').prevClose);
  pushIdx('Nifty Bank', u('BANKNIFTY').close, u('BANKNIFTY').prevClose);
  pushIdx('Nifty Financial Services', u('FINNIFTY').close, u('FINNIFTY').prevClose);
  pushIdx('Nifty Midcap Select', u('MIDCPNIFTY').close, u('MIDCPNIFTY').prevClose);
  const sectorRng = Prng.fromKey(seed, 'sectors');
  for (const [sector, idxName] of Object.entries(SECTOR_INDEX)) {
    if (!idxName || indices.some((i) => i.name === idxName)) continue;
    const members = underlyings.filter((x) => x.sector === sector);
    if (members.length === 0) continue;
    const chg = members.reduce((a, m) => a + (m.close - m.prevClose) / m.prevClose, 0) / members.length;
    const level = sectorRng.range(8000, 60000);
    pushIdx(idxName, level * (1 + chg), level);
  }
  const niftyIv = ivHistory['NIFTY'];
  pushIdx('India VIX', niftyIv[niftyIv.length - 1].atmIv * 100 * 1.04, niftyIv[niftyIv.length - 2].atmIv * 100 * 1.04);

  // FII/DII (INR crore)
  const fRng = Prng.fromKey(seed, 'fiidii');
  const fiiDii: FiiDiiPoint[] = dates.slice(-15).map((date) => ({
    date,
    fiiNet: round2(fRng.normal() * 2200 - 400),
    diiNet: round2(fRng.normal() * 1800 + 900),
  }));

  return {
    tradeDate,
    prevTradeDate,
    source: 'mock',
    generatedAt: new Date(Date.UTC(2026, 9, 16, 13, 0, 0)).toISOString(),
    universe: MOCK_UNIVERSE.map(({ symbol, name, sector, isIndex, lotSize }) => ({ symbol, name, sector, isIndex, lotSize })),
    contracts,
    underlyings,
    indices,
    underlyingHistory,
    ivHistory,
    straddleHistory,
    fiiDii,
  };
}
