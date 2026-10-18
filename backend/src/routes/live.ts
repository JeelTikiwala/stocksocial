import { Router } from 'express';
import { z } from 'zod';
import { getDataStore } from '../data/store';
import { getLiveEngine } from '../live/engine';
import { isLiveScreener } from '../shared';
import { badRequest, notFound } from '../middleware/errorHandler';
import { clearKiteSession, describeSession, exchangeRequestToken, getKiteConfig, kiteLoginUrl, loadKiteSession } from '../live/kiteSession';

const router = Router();
const engine = () => getLiveEngine(() => getDataStore().getDataset());

router.get('/status', async (_req, res, next) => {
  try {
    const cfg = getKiteConfig();
    const session = await loadKiteSession();
    res.json({ success: true, data: { ...engine().getStatus(), clients: engine().clientCount, kite: { configured: !!cfg, redirectUrl: cfg?.redirectUrl ?? null, ...describeSession(session) } } });
  } catch (e) { next(e); }
});

router.get('/screeners/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!isLiveScreener(id)) throw notFound(`Not a live screener: ${id}`);
    const { limit: l, ...params } = req.query as Record<string, unknown>;
    const limit = Number(l) > 0 ? Math.min(Number(l), 200) : 50;
    res.json({ success: true, data: { id, ...(await engine().screener(id, params, limit)), asOf: Date.now() } });
  } catch (e) { next(e); }
});

router.get('/quotes', async (req, res, next) => {
  try {
    const symbols = typeof req.query.symbols === 'string' ? req.query.symbols.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean) : [];
    res.json({ success: true, data: await engine().quotes(symbols) });
  } catch (e) { next(e); }
});

const providerSchema = z.object({ kind: z.enum(['simulated', 'kite', 'none']) });
router.post('/provider', async (req, res, next) => {
  try {
    const parsed = providerSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('kind must be simulated | kite | none');
    if (parsed.data.kind === 'kite') {
      const cfg = getKiteConfig();
      const s = await loadKiteSession();
      if (!cfg) throw badRequest('Kite is not configured (KITE_API_KEY / KITE_API_SECRET)');
      if (!describeSession(s).loggedIn) throw badRequest('Log in to Kite first');
    }
    await engine().start(parsed.data.kind);
    res.json({ success: true, data: engine().getStatus() });
  } catch (e) { next(e); }
});

// ---- Kite login (single personal account) ----

router.get('/kite/login-url', (_req, res) => {
  const cfg = getKiteConfig();
  res.json({ success: true, data: { configured: !!cfg, url: cfg ? kiteLoginUrl(cfg) : null, redirectUrl: cfg?.redirectUrl ?? null } });
});

async function completeLogin(requestToken: string) {
  const cfg = getKiteConfig();
  if (!cfg) throw badRequest('Kite is not configured');
  const session = await exchangeRequestToken(cfg, requestToken);
  await engine().start('kite');
  return session;
}

/** Kite redirects here after login: ?request_token=...&action=login&status=success */
router.get('/kite/callback', async (req, res, next) => {
  try {
    const rt = req.query.request_token;
    if (typeof rt !== 'string' || !rt) throw badRequest('request_token missing');
    const s = await completeLogin(rt);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!doctype html><meta name="viewport" content="width=device-width"><body style="font-family:-apple-system,system-ui;padding:32px;background:#FAF8F5;color:#0F0D0C"><h2>Kite connected</h2><p>Signed in as <b>${s.userName}</b> (${s.userId}). Live ticks will stream while the market is open. You can close this tab and return to Delta.</p></body>`);
  } catch (e) { next(e); }
});

const rtSchema = z.object({ requestToken: z.string().min(8) });
router.post('/kite/session', async (req, res, next) => {
  try {
    const parsed = rtSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('requestToken required');
    const s = await completeLogin(parsed.data.requestToken);
    res.json({ success: true, data: describeSession(s) });
  } catch (e) { next(e); }
});

router.delete('/kite/session', async (_req, res, next) => {
  try {
    await clearKiteSession();
    await engine().start('simulated');
    res.json({ success: true, data: engine().getStatus() });
  } catch (e) { next(e); }
});

export default router;
