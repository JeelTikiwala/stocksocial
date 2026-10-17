import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { badRequest, forbidden, notFound } from '../middleware/errorHandler';

const router = Router();

// Validation schemas
const createPostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2000),
  title: z.string().max(200).optional(),
  attachedTicker: z.string().max(20).optional(),
  imageUrl: z.string().url().optional(),
});

const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(500),
});

// GET /feed
router.get('/', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cursor = req.query.cursor as string | undefined;
    const limit = 20;

    const posts = await prisma.post.findMany({
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
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
        ...(req.userId && {
          likes: {
            where: { userId: req.userId },
            select: { id: true },
          },
          savedBy: {
            where: { userId: req.userId },
            select: { id: true },
          },
        }),
      },
    });

    const hasMore = posts.length > limit;
    const feedPosts = hasMore ? posts.slice(0, -1) : posts;
    const nextCursor = hasMore ? feedPosts[feedPosts.length - 1].id : null;

    const formattedPosts = feedPosts.map((post) => ({
      id: post.id,
      userId: post.userId,
      user: post.user,
      content: post.content,
      title: post.title,
      attachedTicker: post.attachedTicker,
      imageUrl: post.imageUrl,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      createdAt: post.createdAt,
      isLiked: req.userId ? post.likes?.length > 0 : false,
      isSaved: req.userId ? post.savedBy?.length > 0 : false,
    }));

    res.json({
      success: true,
      data: {
        posts: formattedPosts,
        nextCursor,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /posts
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createPostSchema.parse(req.body);

    const post = await prisma.post.create({
      data: {
        userId: req.userId!,
        ...data,
      },
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
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...post,
        likeCount: 0,
        commentCount: 0,
        isLiked: false,
        isSaved: false,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(badRequest(error.errors[0].message));
    }
    next(error);
  }
});

// GET /posts/:id
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
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
        comments: {
          orderBy: { createdAt: 'desc' },
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
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
        ...(req.userId && {
          likes: {
            where: { userId: req.userId },
            select: { id: true },
          },
          savedBy: {
            where: { userId: req.userId },
            select: { id: true },
          },
        }),
      },
    });

    if (!post) {
      throw notFound('Post not found');
    }

    res.json({
      success: true,
      data: {
        ...post,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        isLiked: req.userId ? post.likes?.length > 0 : false,
        isSaved: req.userId ? post.savedBy?.length > 0 : false,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /posts/:id/like
router.post('/:id/like', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw notFound('Post not found');
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: req.userId!,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({ where: { id: existingLike.id } });
      await prisma.post.update({
        where: { id },
        data: { likeCount: { decrement: 1 } },
      });

      return res.json({
        success: true,
        data: { liked: false },
      });
    }

    // Like
    await prisma.like.create({
      data: {
        postId: id,
        userId: req.userId!,
      },
    });
    await prisma.post.update({
      where: { id },
      data: { likeCount: { increment: 1 } },
    });

    res.json({
      success: true,
      data: { liked: true },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /posts/:id/like
router.delete('/:id/like', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: req.userId!,
        },
      },
    });

    if (!existingLike) {
      return res.json({
        success: true,
        data: { liked: false },
      });
    }

    await prisma.like.delete({ where: { id: existingLike.id } });
    await prisma.post.update({
      where: { id },
      data: { likeCount: { decrement: 1 } },
    });

    res.json({
      success: true,
      data: { liked: false },
    });
  } catch (error) {
    next(error);
  }
});

// POST /posts/:id/comments
router.post('/:id/comments', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = createCommentSchema.parse(req.body);

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw notFound('Post not found');
    }

    const comment = await prisma.comment.create({
      data: {
        postId: id,
        userId: req.userId!,
        content: data.content,
      },
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

    await prisma.post.update({
      where: { id },
      data: { commentCount: { increment: 1 } },
    });

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(badRequest(error.errors[0].message));
    }
    next(error);
  }
});

// POST /posts/:id/save
router.post('/:id/save', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw notFound('Post not found');
    }

    const existing = await prisma.savedPost.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: req.userId!,
        },
      },
    });

    if (!existing) {
      await prisma.savedPost.create({
        data: {
          postId: id,
          userId: req.userId!,
        },
      });
    }

    res.json({
      success: true,
      data: { saved: true },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /posts/:id/save
router.delete('/:id/save', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = await prisma.savedPost.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: req.userId!,
        },
      },
    });

    if (existing) {
      await prisma.savedPost.delete({
        where: { id: existing.id },
      });
    }

    res.json({
      success: true,
      data: { saved: false },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /posts/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw notFound('Post not found');
    }
    if (post.userId !== req.userId) {
      throw forbidden('You can only delete your own post');
    }

    await prisma.post.delete({ where: { id } });
    res.json({
      success: true,
      message: 'Post deleted',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
