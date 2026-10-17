import { Router, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /social/activity - Get activity feed (following and popular)
router.get('/activity', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;

    // Get users that current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: req.userId },
      select: { followingId: true },
    });
    const followingIds = following.map(f => f.followingId);

    // Include own activities and followed users
    const userIds = [req.userId!, ...followingIds];

    const activities = await prisma.userActivity.findMany({
      where: {
        userId: { in: userIds },
        isPublic: true,
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
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
      },
    });

    const hasMore = activities.length > limit;
    const data = hasMore ? activities.slice(0, -1) : activities;

    res.json({
      success: true,
      data,
      nextCursor: hasMore ? data[data.length - 1]?.id : null,
    });
  } catch (error) {
    next(error);
  }
});

// GET /social/leaderboard - Get top performing portfolios
router.get('/leaderboard', async (req, res, next) => {
  try {
    const period = (req.query.period as string) || '1m'; // 1d, 1w, 1m, 3m, 1y, all
    const limit = parseInt(req.query.limit as string) || 20;

    // Get users with public portfolios and their holdings
    const users = await prisma.user.findMany({
      where: {
        isPublic: true,
        holdings: { some: {} },
      },
      take: limit,
      include: {
        holdings: true,
        _count: {
          select: { followers: true },
        },
      },
    });

    // Calculate portfolio performance for each user
    const leaderboard = users.map(user => {
      const totalValue = user.holdings.reduce(
        (sum, h) => sum + h.currentPrice * h.quantity,
        0
      );
      const totalCost = user.holdings.reduce(
        (sum, h) => sum + h.avgBuyPrice * h.quantity,
        0
      );
      const totalReturn = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
      const todayChange = user.holdings.reduce(
        (sum, h) => sum + (h.todayChangePct * h.currentPrice * h.quantity) / 100,
        0
      );
      const todayChangePct = totalValue > 0 ? (todayChange / totalValue) * 100 : 0;

      return {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          isVerified: user.isVerified,
          isPro: user.isPro,
          followersCount: user._count.followers,
        },
        performance: {
          totalValue,
          totalReturn,
          todayChangePct,
          holdingsCount: user.holdings.length,
        },
      };
    });

    // Sort by performance
    leaderboard.sort((a, b) => b.performance.totalReturn - a.performance.totalReturn);

    res.json({
      success: true,
      data: leaderboard.slice(0, limit),
    });
  } catch (error) {
    next(error);
  }
});

// GET /social/discussions - Get stock discussions (posts with attached tickers)
router.get('/discussions', async (req, res, next) => {
  try {
    const ticker = req.query.ticker as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;

    const posts = await prisma.post.findMany({
      where: {
        attachedTicker: ticker ? ticker.toUpperCase() : { not: null },
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
            isPro: true,
          },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    const hasMore = posts.length > limit;
    const data = hasMore ? posts.slice(0, -1) : posts;

    res.json({
      success: true,
      data,
      nextCursor: hasMore ? data[data.length - 1]?.id : null,
    });
  } catch (error) {
    next(error);
  }
});

// GET /social/discover - Discover users to follow
router.get('/discover', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = req.query.q as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;

    // Get current user's following list to exclude
    const following = await prisma.follow.findMany({
      where: { followerId: req.userId },
      select: { followingId: true },
    });
    const followingIds = following.map(f => f.followingId);

    const users = await prisma.user.findMany({
      where: {
        id: { notIn: [req.userId!, ...followingIds] },
        isPublic: true,
        ...(query
          ? {
              OR: [
                { username: { contains: query, mode: 'insensitive' } },
                { displayName: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      take: limit,
      orderBy: [
        { isVerified: 'desc' },
        { isPro: 'desc' },
      ],
      include: {
        _count: {
          select: { followers: true, posts: true },
        },
      },
    });

    res.json({
      success: true,
      data: users.map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        isVerified: u.isVerified,
        isPro: u.isPro,
        followersCount: u._count.followers,
        postsCount: u._count.posts,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// GET /social/trending-tickers - Get trending tickers based on activity
router.get('/trending-tickers', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get most mentioned tickers in posts
    const posts = await prisma.post.groupBy({
      by: ['attachedTicker'],
      where: {
        attachedTicker: { not: null },
        createdAt: { gte: since },
      },
      _count: true,
      orderBy: { _count: { attachedTicker: 'desc' } },
      take: 10,
    });

    // Get most traded tickers
    const trades = await prisma.trade.groupBy({
      by: ['ticker'],
      where: { executedAt: { gte: since } },
      _count: true,
      orderBy: { _count: { ticker: 'desc' } },
      take: 10,
    });

    // Get most viewed tickers
    const views = await prisma.stockInteraction.groupBy({
      by: ['ticker'],
      where: {
        action: 'view',
        createdAt: { gte: since },
      },
      _count: true,
      orderBy: { _count: { ticker: 'desc' } },
      take: 10,
    });

    res.json({
      success: true,
      data: {
        mostMentioned: posts
          .filter(p => p.attachedTicker)
          .map(p => ({ ticker: p.attachedTicker, count: p._count })),
        mostTraded: trades.map(t => ({ ticker: t.ticker, count: t._count })),
        mostViewed: views.map(v => ({ ticker: v.ticker, count: v._count })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /social/activity - Create a new activity
router.post('/activity', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, ticker, targetUserId, postId, metadata, isPublic = true } = req.body;

    const activity = await prisma.userActivity.create({
      data: {
        userId: req.userId!,
        type,
        ticker: ticker?.toUpperCase(),
        targetUserId,
        postId,
        metadata: metadata ? JSON.stringify(metadata) : null,
        isPublic,
      },
      include: {
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

    res.json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
});

export default router;
