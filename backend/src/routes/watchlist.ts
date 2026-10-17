import { Router, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import { badRequest, notFound } from '../middleware/errorHandler';

const router = Router();

// GET /watchlist - Get user's watchlists
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const watchlists = await prisma.watchlist.findMany({
      where: { userId: req.userId },
      include: {
        items: {
          orderBy: { addedAt: 'desc' },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: watchlists.map(w => ({
        ...w,
        itemsCount: w._count.items,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// POST /watchlist - Create a new watchlist
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, isPublic = false } = req.body;

    if (!name || typeof name !== 'string') {
      throw badRequest('Watchlist name is required');
    }

    const watchlist = await prisma.watchlist.create({
      data: {
        userId: req.userId!,
        name: name.trim(),
        isPublic,
      },
    });

    res.json({ success: true, data: watchlist });
  } catch (error) {
    next(error);
  }
});

// GET /watchlist/:id - Get a specific watchlist
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id,
        OR: [
          { userId: req.userId },
          { isPublic: true },
        ],
      },
      include: {
        items: {
          orderBy: { addedAt: 'desc' },
        },
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!watchlist) {
      throw notFound('Watchlist not found');
    }

    res.json({ success: true, data: watchlist });
  } catch (error) {
    next(error);
  }
});

// PUT /watchlist/:id - Update watchlist
router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, isPublic } = req.body;

    const watchlist = await prisma.watchlist.findFirst({
      where: { id, userId: req.userId },
    });

    if (!watchlist) {
      throw notFound('Watchlist not found');
    }

    const updated = await prisma.watchlist.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(typeof isPublic === 'boolean' && { isPublic }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// DELETE /watchlist/:id - Delete watchlist
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const watchlist = await prisma.watchlist.findFirst({
      where: { id, userId: req.userId },
    });

    if (!watchlist) {
      throw notFound('Watchlist not found');
    }

    await prisma.watchlist.delete({ where: { id } });

    res.json({ success: true, message: 'Watchlist deleted' });
  } catch (error) {
    next(error);
  }
});

// POST /watchlist/:id/items - Add stock to watchlist
router.post('/:id/items', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { ticker, exchange = 'NSE' } = req.body;

    if (!ticker) {
      throw badRequest('Ticker is required');
    }

    const watchlist = await prisma.watchlist.findFirst({
      where: { id, userId: req.userId },
    });

    if (!watchlist) {
      throw notFound('Watchlist not found');
    }

    // Check if already in watchlist
    const existing = await prisma.watchlistItem.findUnique({
      where: {
        watchlistId_ticker: {
          watchlistId: id,
          ticker: ticker.toUpperCase(),
        },
      },
    });

    if (existing) {
      return res.json({ success: true, data: existing, message: 'Already in watchlist' });
    }

    const item = await prisma.watchlistItem.create({
      data: {
        watchlistId: id,
        ticker: ticker.toUpperCase(),
        exchange: exchange.toUpperCase(),
      },
    });

    // Create activity for public watchlists
    if (watchlist.isPublic) {
      await prisma.userActivity.create({
        data: {
          userId: req.userId!,
          type: 'WATCHLIST_ADD',
          ticker: ticker.toUpperCase(),
          isPublic: true,
        },
      });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

// DELETE /watchlist/:id/items/:ticker - Remove stock from watchlist
router.delete('/:id/items/:ticker', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, ticker } = req.params;

    const watchlist = await prisma.watchlist.findFirst({
      where: { id, userId: req.userId },
    });

    if (!watchlist) {
      throw notFound('Watchlist not found');
    }

    await prisma.watchlistItem.deleteMany({
      where: {
        watchlistId: id,
        ticker: ticker.toUpperCase(),
      },
    });

    res.json({ success: true, message: 'Removed from watchlist' });
  } catch (error) {
    next(error);
  }
});

// GET /watchlist/public - Get public watchlists from other users
router.get('/public/browse', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const watchlists = await prisma.watchlist.findMany({
      where: { isPublic: true },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
        items: {
          take: 5,
          orderBy: { addedAt: 'desc' },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    res.json({
      success: true,
      data: watchlists.map(w => ({
        ...w,
        itemsCount: w._count.items,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// POST /watchlist/default - Get or create default watchlist
router.post('/default', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let watchlist = await prisma.watchlist.findFirst({
      where: {
        userId: req.userId,
        name: 'My Watchlist',
      },
      include: {
        items: {
          orderBy: { addedAt: 'desc' },
        },
      },
    });

    if (!watchlist) {
      watchlist = await prisma.watchlist.create({
        data: {
          userId: req.userId!,
          name: 'My Watchlist',
          isPublic: false,
        },
        include: {
          items: true,
        },
      });
    }

    res.json({ success: true, data: watchlist });
  } catch (error) {
    next(error);
  }
});

export default router;
