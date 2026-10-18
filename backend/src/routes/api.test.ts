import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

process.env.DATA_STORE = 'memory';
process.env.JWT_SECRET = 'test';

let app: import('express').Express;

beforeAll(async () => {
  const { createApp } = await import('../app');
  app = createApp({ quiet: true });
});

describe('public analytics API (memory store)', () => {
  it('GET /health', async () => {
    const r = await request(app).get('/health');
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('ok');
  });

  it('GET /v1/market/status reports EOD mock', async () => {
    const r = await request(app).get('/v1/market/status');
    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({ dataMode: 'EOD', source: 'mock', tradeDate: '2026-10-16' });
    expect(r.body.data.contractCount).toBeGreaterThan(3000);
  });

  it('GET /v1/market/pulse, /sectors, /heatmap, /universe, /zones', async () => {
    for (const path of ['/v1/market/pulse', '/v1/market/sectors', '/v1/market/heatmap', '/v1/market/universe', '/v1/market/zones']) {
      const r = await request(app).get(path);
      expect(r.status, path).toBe(200);
      expect(r.body.success).toBe(true);
    }
    const pulse = await request(app).get('/v1/market/pulse');
    expect(pulse.body.data.vix.value).toBeGreaterThan(5);
    expect(pulse.body.data.breadth.advancers + pulse.body.data.breadth.decliners + pulse.body.data.breadth.unchanged).toBe(34);
  });

  it('GET /v1/market/underlying/:symbol', async () => {
    const ok = await request(app).get('/v1/market/underlying/reliance');
    expect(ok.status).toBe(200);
    expect(ok.body.data.underlying.symbol).toBe('RELIANCE');
    expect(ok.body.data.history.length).toBe(60);
    const bad = await request(app).get('/v1/market/underlying/NOPE');
    expect(bad.status).toBe(404);
  });

  it('GET /v1/screeners lists 18 and runs one with params', async () => {
    const list = await request(app).get('/v1/screeners');
    expect(list.body.data.length).toBe(18);
    const run = await request(app).get('/v1/screeners/oi-finder?optionType=PE&limit=5');
    expect(run.status).toBe(200);
    expect(run.body.data.rows.length).toBe(5);
    expect(run.body.data.params.optionType).toBe('PE');
    expect(run.body.data.total).toBeGreaterThan(5);
    const nope = await request(app).get('/v1/screeners/nope');
    expect(nope.status).toBe(404);
  });

  it('GET /v1/options/:symbol/*', async () => {
    const exp = await request(app).get('/v1/options/NIFTY/expiries');
    expect(exp.body.data.length).toBeGreaterThanOrEqual(4);
    const chain = await request(app).get(`/v1/options/NIFTY/chain?expiry=${exp.body.data[1]}`);
    expect(chain.status).toBe(200);
    expect(chain.body.data.expiry).toBe(exp.body.data[1]);
    expect(chain.body.data.rows.length).toBe(25);
    const iv = await request(app).get('/v1/options/BANKNIFTY/iv-history');
    expect(iv.body.data.points.length).toBe(260);
    expect(iv.body.data.stats.rank).toBeGreaterThanOrEqual(0);
    const st = await request(app).get('/v1/options/RELIANCE/straddle-history');
    expect(st.body.data.points.length).toBeGreaterThan(5);
    expect((await request(app).get('/v1/options/NOPE/chain')).status).toBe(404);
  });

  it('GET /v1/live/status, /v1/live/screeners/:id, /v1/live/quotes (engine idle → EOD fallbacks)', async () => {
    const st = await request(app).get('/v1/live/status');
    expect(st.status).toBe(200);
    expect(['none', 'simulated', 'kite']).toContain(st.body.data.provider);
    expect(st.body.data.kite.configured).toBe(false);
    const sc = await request(app).get('/v1/live/screeners/volume-spike');
    expect(sc.status).toBe(200);
    expect(sc.body.data.id).toBe('volume-spike');
    expect((await request(app).get('/v1/live/screeners/oi-finder')).status).toBe(404);
    const q = await request(app).get('/v1/live/quotes?symbols=NIFTY,RELIANCE');
    expect(q.body.data.length).toBe(2);
    expect(q.body.data[0].source).toBe('spot');
    const bad = await request(app).post('/v1/live/provider').send({ kind: 'kite' });
    expect(bad.status).toBe(400);
  });

  it('GET /v1/news falls back to mock headlines offline', async () => {
    const r = await request(app).get('/v1/news?symbols=NIFTY');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data.items)).toBe(true);
    expect(r.body.data.items.length).toBeGreaterThan(0);
  }, 30_000);

  it('POST /v1/tools/margin and /payoff validate and compute', async () => {
    const legs = [
      { instrument: 'CE', side: 'SELL', strike: 23400, premium: 60, lots: 1, iv: 0.14 },
      { instrument: 'CE', side: 'BUY', strike: 23600, premium: 25, lots: 1, iv: 0.145 },
    ];
    const m = await request(app).post('/v1/tools/margin').send({ symbol: 'NIFTY', legs });
    expect(m.status).toBe(200);
    expect(m.body.data.total).toBeGreaterThan(0);
    expect(m.body.data.context).toMatchObject({ symbol: 'NIFTY', lotSize: 65, isIndex: true });
    const p = await request(app).post('/v1/tools/payoff').send({ symbol: 'NIFTY', legs });
    expect(p.status).toBe(200);
    expect(p.body.data.maxProfit).toBeCloseTo(35 * 65, 2);
    expect(p.body.data.breakevens).toHaveLength(1);
    const bad = await request(app).post('/v1/tools/margin').send({ symbol: 'NIFTY', legs: [{ instrument: 'XX' }] });
    expect(bad.status).toBe(400);
  });
});
