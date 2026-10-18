import { Router } from 'express';
import { getDataStore } from '../data/store';
import { buildChain, listExpiries, ivStats } from '../shared';
import { notFound } from '../middleware/errorHandler';

const router = Router();

router.get('/:symbol/expiries', async (req, res, next) => {
  try {
    const ds = await getDataStore().getDataset();
    const symbol = req.params.symbol.toUpperCase();
    const expiries = listExpiries(ds, symbol);
    if (expiries.length === 0) throw notFound(`No option contracts for ${symbol}`);
    res.json({ success: true, data: expiries });
  } catch (e) { next(e); }
});

router.get('/:symbol/chain', async (req, res, next) => {
  try {
    const ds = await getDataStore().getDataset();
    const symbol = req.params.symbol.toUpperCase();
    const chain = buildChain(ds, symbol, typeof req.query.expiry === 'string' ? req.query.expiry : undefined);
    if (!chain) throw notFound(`No option chain for ${symbol}`);
    res.json({ success: true, data: chain });
  } catch (e) { next(e); }
});

router.get('/:symbol/iv-history', async (req, res, next) => {
  try {
    const ds = await getDataStore().getDataset();
    const symbol = req.params.symbol.toUpperCase();
    const points = ds.ivHistory[symbol];
    if (!points) throw notFound(`No IV history for ${symbol}`);
    res.json({ success: true, data: { symbol, points, stats: ivStats(points) } });
  } catch (e) { next(e); }
});

router.get('/:symbol/straddle-history', async (req, res, next) => {
  try {
    const ds = await getDataStore().getDataset();
    const symbol = req.params.symbol.toUpperCase();
    const points = ds.straddleHistory[symbol];
    if (!points) throw notFound(`No straddle history for ${symbol}`);
    res.json({ success: true, data: { symbol, points } });
  } catch (e) { next(e); }
});

export default router;
