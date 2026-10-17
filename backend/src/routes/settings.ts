import { Router, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import { badRequest } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();

const UpdateSettingsSchema = z.object({
  portfolioGoal: z.number().min(0).optional(),
  dividendGoalMonthly: z.number().min(0).optional(),
  pushNotifications: z.boolean().optional(),
  earningsNotifications: z.boolean().optional(),
  socialNotifications: z.boolean().optional(),
  priceAlertNotifications: z.boolean().optional(),
  weeklyDigestEnabled: z.boolean().optional(),
  privacyShowHoldings: z.boolean().optional(),
  privacyShowTrades: z.boolean().optional(),
  privacyShowActivity: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  currency: z.string().optional(),
});

const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  isPublic: z.boolean().optional(),
});

// GET /settings - Get user settings
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let settings = await prisma.userSettings.findUnique({
      where: { userId: req.userId },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: req.userId!,
        },
      });
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

// PUT /settings - Update user settings
router.put('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = UpdateSettingsSchema.parse(req.body);

    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId },
      create: {
        userId: req.userId!,
        ...validated,
      },
      update: validated,
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    next(error);
  }
});

// GET /settings/profile - Get user profile
router.get('/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        isVerified: true,
        isPro: true,
        isPublic: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
            holdings: true,
          },
        },
      },
    });

    if (!user) {
      throw badRequest('User not found');
    }

    res.json({
      success: true,
      data: {
        ...user,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        postsCount: user._count.posts,
        holdingsCount: user._count.holdings,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /settings/profile - Update user profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = UpdateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: validated,
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        isVerified: true,
        isPro: true,
        isPublic: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    next(error);
  }
});

// GET /settings/notifications - Get notification preferences
router.get('/notifications', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let settings = await prisma.userSettings.findUnique({
      where: { userId: req.userId },
      select: {
        pushNotifications: true,
        earningsNotifications: true,
        socialNotifications: true,
        priceAlertNotifications: true,
        weeklyDigestEnabled: true,
      },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId: req.userId! },
        select: {
          pushNotifications: true,
          earningsNotifications: true,
          socialNotifications: true,
          priceAlertNotifications: true,
          weeklyDigestEnabled: true,
        },
      });
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

// GET /settings/privacy - Get privacy settings
router.get('/privacy', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isPublic: true },
    });

    let settings = await prisma.userSettings.findUnique({
      where: { userId: req.userId },
      select: {
        privacyShowHoldings: true,
        privacyShowTrades: true,
        privacyShowActivity: true,
      },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId: req.userId! },
        select: {
          privacyShowHoldings: true,
          privacyShowTrades: true,
          privacyShowActivity: true,
        },
      });
    }

    res.json({
      success: true,
      data: {
        profilePublic: user?.isPublic ?? true,
        ...settings,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /settings/privacy - Update privacy settings
router.put('/privacy', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { profilePublic, privacyShowHoldings, privacyShowTrades, privacyShowActivity } = req.body;

    // Update user public status
    if (typeof profilePublic === 'boolean') {
      await prisma.user.update({
        where: { id: req.userId },
        data: { isPublic: profilePublic },
      });
    }

    // Update settings
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId },
      create: {
        userId: req.userId!,
        privacyShowHoldings: privacyShowHoldings ?? true,
        privacyShowTrades: privacyShowTrades ?? false,
        privacyShowActivity: privacyShowActivity ?? true,
      },
      update: {
        ...(typeof privacyShowHoldings === 'boolean' && { privacyShowHoldings }),
        ...(typeof privacyShowTrades === 'boolean' && { privacyShowTrades }),
        ...(typeof privacyShowActivity === 'boolean' && { privacyShowActivity }),
      },
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

export default router;
