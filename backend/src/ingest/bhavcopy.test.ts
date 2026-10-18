import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseBhavcopyCsv, bhavcopyUrl } from './bhavcopy';
import { parseIndicesCsv, indicesUrl } from './indices';
import { deriveDataset, deriveUniverse } from './derive';
import { buildChain, runScreener, marketPulse, ivStats } from '../shared';

const fixture = readFileSync(join(__dirname, '../../test/fixtures/bhavcopy_sample.csv'), 'utf8');
const indicesFixture = readFileSync(join(__dirname, '../../test/fixtures/ind_close_sample.csv'), 'utf8');

describe('bhavcopy parser (real NSE UDiFF sample, 2026-10-16)', () => {
  const rows = parseBhavcopyCsv(fixture);

  it('builds the verified URL', () => {
    expect(bhavcopyUrl('2026-10-16')).toBe('https://nsearchives.nseindia.com/content/fo/BhavCopy_NSE_FO_0_0_0_20261016_F_0000.csv.zip');
    expect(indicesUrl('2026-10-16')).toBe('https://nsearchives.nseindia.com/content/indices/ind_close_all_16102026.csv');
  });

  it('parses every row with the right instrument mix', () => {
    expect(rows.length).toBe(1491);
    const count = (t: string, s?: string) => rows.filter((r) => r.instrumentType === t && (!s || r.symbol === s)).length;
    expect(count('IDO', 'NIFTY')).toBe(496);
    expect(count('IDO', 'BANKNIFTY')).toBe(612);
    expect(count('STO', 'RELIANCE')).toBe(175);
    expect(count('IDF')).toBe(3);
    expect(count('STF')).toBe(6);
  });

  it('maps fields faithfully', () => {
    const r = rows.find((x) => x.symbol === 'BANKNIFTY' && x.strike === 52900 && x.optionType === 'PE' && x.expiry === '2026-10-27')!;
    expect(r).toBeDefined();
    expect(r.tradeDate).toBe('2026-10-16');
    expect(r.close).toBe(35.75);
    expect(r.underlyingPrice).toBe(55844);
    expect(r.oi).toBe(64410);
    expect(r.chgOi).toBe(36900);
    expect(r.volume).toBe(6260);
    expect(r.turnover).toBe(9942186786);
    expect(r.trades).toBe(1992);
    expect(r.lotSize).toBe(30);
    const fut = rows.find((x) => x.symbol === 'BANKNIFTY' && x.instrumentType === 'IDF')!;
    expect(fut.strike).toBeNull();
    expect(fut.optionType).toBeNull();
    expect(fut.close).toBe(55918);
  });

  it('derives a universe with lot sizes and index flags', () => {
    const u = deriveUniverse(rows);
    expect(u.map((x) => x.symbol).sort()).toEqual(['ABCAPITAL', 'BANKNIFTY', 'HDFCBANK', 'NIFTY', 'RELIANCE']);
    expect(u.find((x) => x.symbol === 'NIFTY')!.isIndex).toBe(true);
    expect(u.find((x) => x.symbol === 'ABCAPITAL')!).toMatchObject({ isIndex: false, lotSize: 3100, sector: 'Financial Services' });
  });
});

describe('indices parser (real sample)', () => {
  it('parses closes and derives prevClose from points change', () => {
    const idx = parseIndicesCsv(indicesFixture);
    const nifty = idx.find((i) => i.name === 'Nifty 50')!;
    expect(nifty.tradeDate).toBe('2026-10-16');
    expect(nifty.close).toBe(23146.15);
    expect(nifty.prevClose).toBeCloseTo(22997.35, 2);
    const vix = idx.find((i) => i.name === 'India VIX')!;
    expect(vix.close).toBe(14.06);
    expect(idx.filter((i) => i.name === 'Nifty 50').length).toBe(1); // de-duplicated
  });
});

describe('derive → dataset → analytics on real data', () => {
  const rows = parseBhavcopyCsv(fixture);
  const ds = deriveDataset({ tradeDate: '2026-10-16', contracts: rows, indices: parseIndicesCsv(indicesFixture) });

  it('produces underlyings and histories', () => {
    expect(ds.underlyings.length).toBe(5);
    const bn = ds.underlyings.find((u) => u.symbol === 'BANKNIFTY')!;
    expect(bn.close).toBe(55844);
    expect(bn.prevClose).toBeGreaterThan(55000);
    expect(ds.ivHistory['NIFTY']?.length).toBe(1);
    expect(ds.straddleHistory['NIFTY']?.[0].expiry).toBe('2026-10-19'); // holiday-shifted Monday expiry
  });

  it('solves IV on the real NIFTY chain and computes totals', () => {
    const chain = buildChain(ds, 'NIFTY')!;
    expect(chain.expiry).toBe('2026-10-19');
    const i = chain.rows.findIndex((r) => r.strike === chain.atmStrike);
    const near = chain.rows.slice(Math.max(i - 6, 0), i + 7);
    const solved = near.flatMap((r) => [r.call?.iv, r.put?.iv]).filter((v) => v != null).length;
    expect(solved).toBeGreaterThanOrEqual(near.length * 2 * 0.8);
    const atmIv = ds.ivHistory['NIFTY'][0].atmIv;
    expect(atmIv).toBeGreaterThan(0.08);
    expect(atmIv).toBeLessThan(0.4);
    expect(chain.totals.callOi).toBeGreaterThan(0);
    expect(chain.totals.maxPainStrike).not.toBeNull();
  });

  it('runs screeners and pulse without error', () => {
    expect(runScreener('oi-finder', ds).total).toBeGreaterThan(0);
    expect(runScreener('unusual-options', ds, { minRatio: 0.5, minVolume: 0 }).total).toBeGreaterThan(0);
    expect(runScreener('iv-rank', ds).total).toBe(5);
    const pulse = marketPulse(ds);
    expect(pulse.vix?.value).toBe(14.06);
    expect(pulse.indices.find((i) => i.name === 'Nifty 50')?.close).toBe(23146.15);
    expect(ivStats(ds.ivHistory['NIFTY']).current).not.toBeNull();
  });
});
