import { Router } from 'express';
import { getDataStore } from '../data/store';
import { listScreeners, getScreener, runScreener } from '../shared';
import { notFound } from '../middleware/errorHandler';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ success: true, data: listScreeners() });
});

router.get('/:id', async (req, res, next) => {
  try {
    const spec = getScreener(req.params.id);
    if (!spec) throw notFound(`Unknown screener ${req.params.id}`);
    const ds = await getDataStore().getDataset();
    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 100;
    const { limit: _l, ...params } = req.query as Record<string, unknown>;
    res.json({ success: true, data: runScreener(spec.id, ds, params, limit) });
  } catch (e) { next(e); }
});

export default router;
