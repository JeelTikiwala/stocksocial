import { Router, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { notFound } from '../middleware/errorHandler';

const router = Router();

// GET /users/:username
router.get('/:username', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
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
          },
        },
        ...(req.userId && {
          followers: {
            where: { followerId: req.userId },
            select: { followerId: true },
          },
        }),
      },
    });

    if (!user) {
      throw notFound('User not found');
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        isPro: user.isPro,
        isPublic: user.isPublic,
        createdAt: user.createdAt,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        isFollowing: req.userId ? user.followers?.length > 0 : false,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /users/:username/holdings
router.get('/:username/holdings', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, isPublic: true },
    });

    if (!user) {
      throw notFound('User not found');
    }

    if (!user.isPublic && req.userId !== user.id) {
      return res.json({
        success: true,
        data: [],
        message: 'Holdings are private',
      });
    }

    const holdings = await prisma.holding.findMany({
      where: { userId: user.id },
      orderBy: { allocationPct: 'desc' },
    });

    const chartData = holdings.map((h) => ({
      ticker: h.ticker,
      allocationPct: h.allocationPct,
      todayChangePct: h.todayChangePct,
      color: h.colorHex,
      companyName: h.companyName,
    }));

    res.json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    next(error);
  }
});

// GET /users/:username/posts
router.get('/:username/posts', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      throw notFound('User not found');
    }

    const posts = await prisma.post.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
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
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    const formattedPosts = posts.map((post) => ({
      ...post,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
    }));

    res.json({
      success: true,
      data: formattedPosts,
    });
  } catch (error) {
    next(error);
  }
});

// POST /users/:username/follow
router.post('/:username/follow', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { username } = req.params;

    const userToFollow = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!userToFollow) {
      throw notFound('User not found');
    }

    if (userToFollow.id === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself',
      });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.userId!,
          followingId: userToFollow.id,
        },
      },
    });

    if (existingFollow) {
      return res.json({
        success: true,
        data: { following: true },
        message: 'Already following',
      });
    }

    await prisma.follow.create({
      data: {
        followerId: req.userId!,
        followingId: userToFollow.id,
      },
    });

    res.json({
      success: true,
      data: { following: true },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /users/:username/follow
router.delete('/:username/follow', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { username } = req.params;

    const userToUnfollow = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!userToUnfollow) {
      throw notFound('User not found');
    }

    await prisma.follow.deleteMany({
      where: {
        followerId: req.userId!,
        followingId: userToUnfollow.id,
      },
    });

    res.json({
      success: true,
      data: { following: false },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
