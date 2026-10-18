import { Router } from 'express';
import { getDataStore } from '../data/store';
import { marketPulse, heatmapData, sectorPerformance, underlyingDetail, watchlistRows, ZONES } from '../shared';
import { notFound } from '../middleware/errorHandler';

const router = Router();

router.get('/status', async (_req, res, next) => {
  try {
    res.json({ success: true, data: await getDataStore().getStatus() });
  } catch (e) { next(e); }
});

router.get('/zones', (_req, res) => {
  res.json({ success: true, data: ZONES });
});

router.get('/pulse', async (_req, res, next) => {
  try {
    res.json({ success: true, data: marketPulse(await getDataStore().getDataset()) });
  } catch (e) { next(e); }
});

router.get('/sectors', async (_req, res, next) => {
  try {
    res.json({ success: true, data: sectorPerformance(await getDataStore().getDataset()) });
  } catch (e) { next(e); }
});

router.get('/heatmap', async (_req, res, next) => {
  try {
    res.json({ success: true, data: heatmapData(await getDataStore().getDataset()) });
  } catch (e) { next(e); }
});

router.get('/universe', async (_req, res, next) => {
  try {
    const ds = await getDataStore().getDataset();
    res.json({ success: true, data: ds.universe });
  } catch (e) { next(e); }
});

router.get('/watchlist', async (req, res, next) => {
  try {
    const ds = await getDataStore().getDataset();
    const symbols = typeof req.query.symbols === 'string' ? req.query.symbols.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean) : [];
    res.json({ success: true, data: watchlistRows(ds, symbols) });
  } catch (e) { next(e); }
});

router.get('/underlying/:symbol', async (req, res, next) => {
  try {
    const ds = await getDataStore().getDataset();
    const detail = underlyingDetail(ds, req.params.symbol);
    if (!detail) throw notFound(`Unknown underlying ${req.params.symbol.toUpperCase()}`);
    res.json({ success: true, data: detail });
  } catch (e) { next(e); }
});

export default router;
