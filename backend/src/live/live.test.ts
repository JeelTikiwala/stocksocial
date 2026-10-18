import { afterAll, describe, expect, it } from 'vitest';
import http from 'node:http';
import WebSocket from 'ws';
import { generateMockMarket, TickSimulator, LiveSnapshot, runLiveScreener, selectLiveUniverse, contractKey, liveQuotes, sessionProgressAt } from '../shared';
import { LiveEngine } from './engine';
import { attachLiveWebSocket } from './wsServer';
import { mapContractsToTokens, type KiteInstrument } from './kiteInstruments';

const ds = generateMockMarket();

describe('live universe & simulator', () => {
  it('selects futures for every underlying and near-ATM options, under the cap', () => {
    const u = selectLiveUniverse(ds, { maxKeys: 800 });
    expect(u.length).toBeLessThanOrEqual(800);
    expect(u.filter((c) => c.optionType == null).length).toBe(ds.underlyings.length);
    expect(u.some((c) => c.symbol === 'NIFTY' && c.optionType === 'CE')).toBe(true);
  });

  it('generates deterministic ticks that pace volume and move prices', () => {
    const a = new TickSimulator(ds, { seed: 3, intervalMs: 1000, speed: 300, maxKeys: 300 });
    const b = new TickSimulator(ds, { seed: 3, intervalMs: 1000, speed: 300, maxKeys: 300 });
    const t1 = a.step();
    expect(t1.length).toBe(a.contracts.length);
    expect(b.step()[0].ltp).toBe(t1[0].ltp);
    const snap = new LiveSnapshot();
    for (let i = 0; i < 20; i++) for (const t of a.step()) snap.apply({ ...t, ts: Date.now() + i * 1000 });
    const fut = a.contracts.find((c) => c.optionType == null)!;
    const tick = snap.get(contractKey(fut))!;
    expect(tick.volume).toBeGreaterThan(0);
    expect(a.progress()).toBeGreaterThan(0.15);
    expect(snap.changeOver(tick.key, 60_000, Date.now() + 20_000)).not.toBeNull();
  });

  it('live screeners run over the snapshot and quotes fall back to EOD', () => {
    const sim = new TickSimulator(ds, { seed: 9, intervalMs: 1000, speed: 600, maxKeys: 600, burstProbability: 0.2 });
    const snap = new LiveSnapshot();
    const t0 = Date.now();
    for (let i = 0; i < 30; i++) for (const t of sim.step()) snap.apply({ ...t, ts: t0 + i * 1000 });
    const ctx = { ds, snap, sessionProgress: sim.progress(), now: t0 + 30_000 };
    const vol = runLiveScreener('volume-spike', ctx, { minRelVol: 0.5 });
    expect(vol.total).toBeGreaterThan(0);
    for (const c of ['ltp', 'changePct', 'relVol', 'burst5m', 'liveVol', 'expected']) expect(c in vol.rows[0].values).toBe(true);
    const unusual = runLiveScreener('unusual-options', ctx, { minRatio: 0.01, minLots: 0 });
    expect(unusual.total).toBeGreaterThan(0);
    const prem = runLiveScreener('premium-spike', ctx, { minPct5m: -100, minLots: 0 });
    expect(prem.total).toBeGreaterThan(0);
    expect(runLiveScreener('premium-spike', ctx, { minPct5m: 200, minLots: 100000 }).total).toBe(0);
    const q = liveQuotes(ds, snap, ['NIFTY', 'RELIANCE', 'NOPE']);
    expect(q.length).toBe(2);
    expect(q[0].source).toBe('fut');
  });

  it('session progress follows IST hours', () => {
    expect(sessionProgressAt(Date.UTC(2026, 9, 16, 3, 44)).open).toBe(false); // 09:14 IST
    expect(sessionProgressAt(Date.UTC(2026, 9, 16, 6, 0)).progress).toBeCloseTo((11 * 60 + 30 - 555) / 375, 2); // 11:30 IST
    expect(sessionProgressAt(Date.UTC(2026, 9, 18, 6, 0)).open).toBe(false); // Sunday
  });
});

describe('kite instrument mapping', () => {
  it('maps contracts to tokens by name/expiry/strike/type and reports misses', () => {
    const inst: KiteInstrument[] = [
      { instrument_token: 1001, tradingsymbol: 'NIFTY26OCT23150CE', name: 'NIFTY', expiry: new Date(2026, 9, 20), strike: 23150, lot_size: 65, instrument_type: 'CE', segment: 'NFO-OPT', exchange: 'NFO' },
      { instrument_token: 1002, tradingsymbol: 'NIFTY26OCT23150PE', name: 'NIFTY', expiry: '2026-10-20', strike: 23150, lot_size: 65, instrument_type: 'PE', segment: 'NFO-OPT', exchange: 'NFO' },
      { instrument_token: 2001, tradingsymbol: 'RELIANCE26OCTFUT', name: 'RELIANCE', expiry: new Date(2026, 9, 27), strike: 0, lot_size: 500, instrument_type: 'FUT', segment: 'NFO-FUT', exchange: 'NFO' },
      { instrument_token: 3001, tradingsymbol: 'RELIANCE', name: 'RELIANCE', expiry: null, strike: 0, lot_size: 1, instrument_type: 'EQ', segment: 'NSE', exchange: 'NSE' },
    ];
    const contracts = ds.contracts.filter((c) => (c.symbol === 'NIFTY' && c.expiry === '2026-10-20' && c.strike === 23150) || (c.symbol === 'RELIANCE' && c.optionType == null && c.expiry === '2026-10-27') || (c.symbol === 'TCS' && c.optionType == null));
    const m = mapContractsToTokens(inst, contracts);
    expect(m.keyToToken.size).toBe(3);
    expect(m.tokenToKey.get(1001)).toContain('NIFTY|IDO|2026-10-20|23150|CE');
    expect(m.tokenToKey.get(2001)).toContain('RELIANCE|STF|2026-10-27');
    expect(m.missing.some((k) => k.startsWith('TCS|'))).toBe(true);
  });
});

describe('live engine over WebSocket', () => {
  const engine = new LiveEngine(async () => ds, { screenerIntervalMs: 200, quoteIntervalMs: 150, simulator: { intervalMs: 100, speed: 600, seed: 5, startProgress: 0.3 } });
  const server = http.createServer();
  attachLiveWebSocket(server, engine);
  afterAll(async () => { await engine.stop(); server.close(); });

  it('streams status, quotes and live screener rows to a subscribed client', async () => {
    process.env.LIVE_PROVIDER = 'simulated';
    await new Promise<void>((r) => server.listen(0, r));
    const port = (server.address() as any).port;
    await engine.start();
    expect(engine.getStatus().provider).toBe('simulated');
    expect(engine.getStatus().connected).toBe(true);

    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    const got: Record<string, any> = {};
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`timeout; got ${Object.keys(got)}`)), 8000);
      ws.on('open', () => ws.send(JSON.stringify({ type: 'subscribe', screeners: [{ id: 'volume-spike', params: { minRelVol: 0.1 } }, { id: 'unusual-options', params: { minRatio: 0.01, minLots: 0 } }], watch: ['NIFTY', 'BANKNIFTY'] })));
      ws.on('message', (d) => {
        const m = JSON.parse(d.toString());
        if (m.type === 'status') got.status = m.status;
        if (m.type === 'quotes') got.quotes = m.quotes;
        if (m.type === 'screener' && m.total > 0) got[`screener:${m.id}`] = m;
        if (got.status && got.quotes && got['screener:volume-spike'] && got['screener:unusual-options']) { clearTimeout(timer); resolve(); }
      });
      ws.on('error', reject);
    });
    expect(got.status.provider).toBe('simulated');
    expect(got.quotes.map((q: any) => q.symbol).sort()).toEqual(['BANKNIFTY', 'NIFTY']);
    expect(got['screener:volume-spike'].rows[0].values.relVol).toBeGreaterThan(0);
    expect(engine.clientCount).toBe(1);
    ws.close();
    await new Promise((r) => setTimeout(r, 50));
  });
});
