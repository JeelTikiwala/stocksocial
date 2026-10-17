import { create } from 'zustand';
import { Post, User } from '@/types';
import { api } from '@/services/api';

interface FeedState {
  posts: Post[];
  nextCursor: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  fetchFeed: (refresh?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  likePost: (postId: string) => void;
  savePost: (postId: string) => void;
}

function seedUser(id: string, username: string, displayName: string, isVerified = false, isPro = false): User {
  return {
    id, username, email: `${username}@example.com`, displayName, bio: null,
    avatarUrl: null, isVerified, isPro, isPublic: true, createdAt: new Date().toISOString(),
  };
}

const SEED_POSTS: Post[] = [
  {
    id: 'seed-1',
    userId: 'u1',
    content: 'Just increased my position in HDFC Bank after the recent dip. Fundamentals remain strong and the valuation is attractive at these levels.',
    title: null,
    attachedTicker: 'HDFCBANK',
    imageUrl: null,
    likeCount: 24,
    commentCount: 8,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user: seedUser('u1', 'rahul_inv', 'Rahul Sharma', true),
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'seed-2',
    userId: 'u2',
    content: 'Market momentum looks healthy. Watching IT names for next breakout setup. TCS and Infosys both showing strength on the weekly charts.',
    title: null,
    attachedTicker: 'TCS',
    imageUrl: null,
    likeCount: 15,
    commentCount: 3,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    user: seedUser('u2', 'priya_trades', 'Priya Patel', true, true),
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'seed-3',
    userId: 'u3',
    content: 'Reliance earnings preview: expecting strong refining margins and Jio subscriber growth. Retail execution has improved significantly.',
    title: null,
    attachedTicker: 'RELIANCE',
    imageUrl: null,
    likeCount: 32,
    commentCount: 12,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    user: seedUser('u3', 'nisha_k', 'Nisha Kumar'),
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'seed-4',
    userId: 'u4',
    content: 'Banking sector rally has more legs. PSU banks like SBI still trading at reasonable valuations despite the run-up. NIMs should hold.',
    title: null,
    attachedTicker: 'SBIN',
    imageUrl: null,
    likeCount: 18,
    commentCount: 5,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    user: seedUser('u4', 'kabir_m', 'Kabir Mehta', true, true),
    isLiked: false,
    isSaved: false,
  },
];

export const useFeedStore = create<FeedState>()((set, get) => ({
  posts: [],
  nextCursor: null,
  isLoading: false,
  isRefreshing: false,
  error: null,

  fetchFeed: async (refresh = false) => {
    if (refresh) {
      set({ isRefreshing: true });
    } else {
      set({ isLoading: true });
    }
    set({ error: null });

    try {
      const response = await api.feed.get();
      const fromApi = response.data?.data?.posts || response.data?.data || [];

      const posts: Post[] = fromApi.length > 0
        ? fromApi.map((p: any) => ({
            id: p.id,
            userId: p.userId,
            content: p.content,
            title: p.title || null,
            attachedTicker: p.attachedTicker || null,
            imageUrl: p.imageUrl || null,
            likeCount: p.likeCount || p._count?.likes || 0,
            commentCount: p.commentCount || p._count?.comments || 0,
            createdAt: p.createdAt,
            user: p.user || { id: p.userId, username: 'user', displayName: 'User' },
            isLiked: !!p.isLiked,
            isSaved: !!p.isSaved,
          }))
        : SEED_POSTS;

      set({
        posts,
        nextCursor: response.data?.nextCursor || null,
        isLoading: false,
        isRefreshing: false,
      });
    } catch {
      // Use seed posts as fallback
      if (get().posts.length === 0) {
        set({ posts: SEED_POSTS });
      }
      set({
        isLoading: false,
        isRefreshing: false,
      });
    }
  },

  loadMore: async () => {
    const { nextCursor, isLoading, posts } = get();
    if (!nextCursor || isLoading) return;

    set({ isLoading: true });

    try {
      const response = await api.feed.get(nextCursor);
      const fromApi = response.data?.data?.posts || response.data?.data || [];

      const morePosts: Post[] = fromApi.map((p: any) => ({
        id: p.id,
        userId: p.userId,
        content: p.content,
        title: p.title || null,
        attachedTicker: p.attachedTicker || null,
        imageUrl: p.imageUrl || null,
        likeCount: p.likeCount || p._count?.likes || 0,
        commentCount: p.commentCount || p._count?.comments || 0,
        createdAt: p.createdAt,
        user: p.user || { id: p.userId, username: 'user', displayName: 'User' },
        isLiked: !!p.isLiked,
        isSaved: !!p.isSaved,
      }));

      set({
        posts: [...posts, ...morePosts],
        nextCursor: response.data?.nextCursor || null,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  likePost: (postId: string) => {
    const { posts } = get();
    set({
      posts: posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
            }
          : post
      ),
    });

    // Fire-and-forget API call
    const post = posts.find(p => p.id === postId);
    if (post?.isLiked) {
      api.feed.unlikePost(postId).catch(() => {});
    } else {
      api.feed.likePost(postId).catch(() => {});
    }
  },

  savePost: (postId: string) => {
    const { posts } = get();
    set({
      posts: posts.map((post) =>
        post.id === postId
          ? { ...post, isSaved: !post.isSaved }
          : post
      ),
    });

    const post = posts.find(p => p.id === postId);
    if (post?.isSaved) {
      api.feed.unsavePost(postId).catch(() => {});
    } else {
      api.feed.savePost(postId).catch(() => {});
    }
  },
}));
