import { Router } from 'express';
import { getDataStore } from '../data/store';
import { fetchNews } from '../services/news';

const router = Router();

/** GET /v1/news?symbols=NIFTY,RELIANCE */
router.get('/', async (req, res, next) => {
  try {
    const ds = await getDataStore().getDataset();
    const symbols = typeof req.query.symbols === 'string' ? req.query.symbols.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean) : [];
    res.json({ success: true, data: await fetchNews(ds, symbols) });
  } catch (e) { next(e); }
});

export default router;
