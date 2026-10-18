import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { badRequest } from '../middleware/errorHandler';

const router = Router();

const settingsSchema = z.object({
  portfolioGoal: z.number().nonnegative().optional(),
  dividendGoalMonthly: z.number().nonnegative().optional(),
  pushNotifications: z.boolean().optional(),
  earningsNotifications: z.boolean().optional(),
  priceAlertNotifications: z.boolean().optional(),
  weeklyDigestEnabled: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  currency: z.string().length(3).optional(),
});

const profileSchema = z.object({
  displayName: z.string().min(1).max(60).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

const defaults = { portfolioGoal: null, dividendGoalMonthly: null, pushNotifications: true, earningsNotifications: true, priceAlertNotifications: true, weeklyDigestEnabled: true, theme: 'light', currency: 'INR' };

// GET /settings
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const settings = await prisma.userSettings.findUnique({ where: { userId: req.userId! } });
    res.json({ success: true, data: settings ?? { userId: req.userId, ...defaults } });
  } catch (error) {
    next(error);
  }
});

// PUT /settings
router.put('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest(parsed.error.issues.map((i) => i.message).join(', '));
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId! },
      update: parsed.data,
      create: { userId: req.userId!, ...parsed.data },
    });
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

// GET /settings/profile
router.get('/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, username: true, email: true, displayName: true, avatarUrl: true, isVerified: true, isPro: true, createdAt: true },
    });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// PUT /settings/profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest(parsed.error.issues.map((i) => i.message).join(', '));
    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: parsed.data,
      select: { id: true, username: true, email: true, displayName: true, avatarUrl: true, isVerified: true, isPro: true, createdAt: true },
    });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
