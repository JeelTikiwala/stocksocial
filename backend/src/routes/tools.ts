import { Router } from 'express';
import { z } from 'zod';
import { getDataStore } from '../data/store';
import { marginForRequest, payoffForRequest } from '../shared';
import { badRequest, notFound } from '../middleware/errorHandler';

const router = Router();

const legSchema = z.object({
  id: z.string().optional(),
  instrument: z.enum(['CE', 'PE', 'FUT']),
  side: z.enum(['BUY', 'SELL']),
  strike: z.number().nonnegative(),
  premium: z.number().nonnegative(),
  lots: z.number().int().positive().max(1000),
  iv: z.number().positive().max(10).optional(),
  expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const bodySchema = z.object({
  symbol: z.string().min(1),
  legs: z.array(legSchema).min(1).max(12),
  daysToExpiry: z.number().nonnegative().optional(),
  isExpiryDay: z.boolean().optional(),
  rangePct: z.number().min(0.02).max(1).optional(),
});

router.post('/margin', async (req, res, next) => {
  try {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) throw badRequest(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    const ds = await getDataStore().getDataset();
    const result = marginForRequest(ds, { ...parsed.data, legs: parsed.data.legs.map((l, i) => ({ ...l, id: l.id ?? `leg-${i + 1}` })) });
    if (!result) throw notFound(`Unknown underlying ${parsed.data.symbol.toUpperCase()}`);
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

router.post('/payoff', async (req, res, next) => {
  try {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) throw badRequest(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    const ds = await getDataStore().getDataset();
    const result = payoffForRequest(ds, { ...parsed.data, legs: parsed.data.legs.map((l, i) => ({ ...l, id: l.id ?? `leg-${i + 1}` })) });
    if (!result) throw notFound(`Unknown underlying ${parsed.data.symbol.toUpperCase()}`);
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

export default router;
