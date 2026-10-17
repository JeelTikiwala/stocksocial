import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card, Button, Input, HeartIcon, MessageIcon, BookmarkIcon } from '@/components/ui';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores';

type FeedTab = 'forYou' | 'following' | 'news';

interface FeedPost {
  id: string;
  userId?: string;
  author: string;
  content: string;
  createdAt: string;
  attachedTicker?: string | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isSaved: boolean;
}

const seedPosts: FeedPost[] = [
  {
    id: 'p1',
    author: 'Rahul Sharma',
    content: 'Just increased my position in HDFC Bank after the recent dip. Fundamentals remain strong.',
    createdAt: '2h ago',
    attachedTicker: 'HDFCBANK',
    likeCount: 12,
    commentCount: 4,
    isLiked: false,
    isSaved: false,
  },
  {
    id: 'p2',
    author: 'Priya Patel',
    content: 'Market momentum looks healthy. Watching IT names for next breakout setup.',
    createdAt: '4h ago',
    attachedTicker: 'TCS',
    likeCount: 8,
    commentCount: 1,
    isLiked: false,
    isSaved: false,
  },
];

function parseTickerTag(content: string): string | undefined {
  const match = content.match(/@([A-Za-z][A-Za-z0-9]{0,14})/);
  return match?.[1]?.toUpperCase();
}

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedTab>('forYou');
  const [showComposer, setShowComposer] = useState(false);
  const [showCommentSheet, setShowCommentSheet] = useState(false);
  const [postText, setPostText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentTargetPostId, setCommentTargetPostId] = useState<string | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>(seedPosts);
  const [indexSnapshot, setIndexSnapshot] = useState('NIFTY 50 +0.84% · SENSEX +0.79% · VIX -2.1%');

  const commentTargetPost = useMemo(
    () => posts.find((post) => post.id === commentTargetPostId) || null,
    [posts, commentTargetPostId]
  );

  const onRefresh = async () => {
    setRefreshing(true);

    // Fetch live index data for snapshot card
    try {
      const indicesRes = await api.stocks.getIndices();
      const indices = indicesRes.data?.data || [];
      if (indices.length > 0) {
        const parts = indices.map((idx: { name: string; changePercent: number }) => {
          const sign = idx.changePercent >= 0 ? '+' : '';
          return `${idx.name} ${sign}${idx.changePercent.toFixed(2)}%`;
        });
        setIndexSnapshot(parts.join(' · '));
      }
    } catch {
      // Keep default snapshot
    }

    // Fetch feed posts
    try {
      const response = await api.feed.get();
      const fromApi = response.data?.data?.posts || [];
      if (fromApi.length > 0) {
        setPosts(
          fromApi.map((p: any) => ({
            id: p.id,
            userId: p.userId,
            author: p.user?.displayName || p.user?.username || 'User',
            content: p.content,
            createdAt: 'live',
            attachedTicker: p.attachedTicker,
            likeCount: p.likeCount || 0,
            commentCount: p.commentCount || 0,
            isLiked: !!p.isLiked,
            isSaved: !!p.isSaved,
          }))
        );
      }
    } catch {
      // Keep local feed if API unavailable.
    }
    setRefreshing(false);
  };

  const handlePublishPost = () => {
    const trimmed = postText.trim();
    if (!trimmed) return;

    const attachedTicker = parseTickerTag(trimmed) || null;
    const optimisticPost: FeedPost = {
      id: `p-${Date.now()}`,
      userId: user?.id,
      author: user?.displayName || user?.username || 'You',
      content: trimmed,
      createdAt: 'now',
      attachedTicker,
      likeCount: 0,
      commentCount: 0,
      isLiked: false,
      isSaved: false,
    };

    setPosts((prev) => [optimisticPost, ...prev]);
    setPostText('');
    setShowComposer(false);

    api.feed
      .createPost({ content: trimmed, attachedTicker: attachedTicker || undefined })
      .then((response) => {
        const p = response.data?.data;
        if (!p) return;
        setPosts((prev) =>
          prev.map((item) =>
            item.id === optimisticPost.id
              ? {
                  id: p.id,
                  userId: p.userId,
                  author: p.user?.displayName || p.user?.username || 'You',
                  content: p.content,
                  createdAt: 'live',
                  attachedTicker: p.attachedTicker,
                  likeCount: p.likeCount || 0,
                  commentCount: p.commentCount || 0,
                  isLiked: !!p.isLiked,
                  isSaved: !!p.isSaved,
                }
              : item
          )
        );
      })
      .catch(() => {
        // Keep optimistic post if network fails.
      });
  };

  const toggleLike = async (postId: string) => {
    let wasLiked = false;
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        wasLiked = post.isLiked;
        return {
          ...post,
          isLiked: !post.isLiked,
          likeCount: post.isLiked ? Math.max(0, post.likeCount - 1) : post.likeCount + 1,
        };
      })
    );

    try {
      if (wasLiked) {
        await api.feed.unlikePost(postId);
      } else {
        await api.feed.likePost(postId);
      }
    } catch {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: wasLiked,
                likeCount: wasLiked ? post.likeCount + 1 : Math.max(0, post.likeCount - 1),
              }
            : post
        )
      );
    }
  };

  const toggleSave = async (postId: string) => {
    let wasSaved = false;
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        wasSaved = post.isSaved;
        return { ...post, isSaved: !post.isSaved };
      })
    );

    try {
      if (wasSaved) {
        await api.feed.unsavePost(postId);
      } else {
        await api.feed.savePost(postId);
      }
    } catch {
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, isSaved: wasSaved } : post))
      );
    }
  };

  const openCommentComposer = (postId: string) => {
    setCommentTargetPostId(postId);
    setCommentText('');
    setShowCommentSheet(true);
  };

  const submitComment = async () => {
    const content = commentText.trim();
    if (!content || !commentTargetPostId) return;

    setPosts((prev) =>
      prev.map((post) =>
        post.id === commentTargetPostId ? { ...post, commentCount: post.commentCount + 1 } : post
      )
    );
    setCommentText('');
    setShowCommentSheet(false);

    try {
      await api.feed.createComment(commentTargetPostId, content);
    } catch {
      // Keep optimistic comment count for responsiveness.
    }
  };

  const deletePost = (postId: string) => {
    Alert.alert('Delete post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const previous = posts;
          setPosts((prev) => prev.filter((post) => post.id !== postId));
          try {
            await api.feed.deletePost(postId);
          } catch {
            setPosts(previous);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    onRefresh();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>StockCircle</Text>
      </View>

      <View style={styles.tabBar}>
        {(['forYou', 'following', 'news'] as FeedTab[]).map((tab) => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tab}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'forYou' ? 'For You' : tab === 'following' ? 'Following' : 'News'}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />}
      >
        <Card style={styles.snapshotCard}>
          <Text style={styles.cardTitle}>Quick Snapshot</Text>
          <Text style={styles.cardText}>{indexSnapshot}</Text>
        </Card>

        <Card style={styles.composerCard}>
          <Text style={styles.cardTitle}>Share a post</Text>
          <Pressable style={styles.inlineComposer} onPress={() => setShowComposer(true)}>
            <Text style={styles.inlineComposerText}>What are you investing in today? (Use @TCS to tag ticker)</Text>
          </Pressable>
        </Card>

        {posts.map((post) => {
          const canDelete = !!user?.id && post.userId === user.id;
          return (
            <Card key={post.id} style={styles.card}>
              <View style={styles.postHeader}>
                <Text style={styles.cardTitle}>{post.author}</Text>
                <View style={styles.postHeaderRight}>
                  <Text style={styles.timeText}>{post.createdAt}</Text>
                  {canDelete && (
                    <Pressable onPress={() => deletePost(post.id)}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <Text style={styles.cardText}>{post.content}</Text>
              {!!post.attachedTicker && (
                <Pressable style={styles.tickerBadge}>
                  <Text style={styles.tickerText}>@{post.attachedTicker}</Text>
                </Pressable>
              )}

              <View style={styles.actionsRow}>
                <Pressable style={styles.actionButton} onPress={() => toggleLike(post.id)}>
                  <HeartIcon size={18} color={post.isLiked ? colors.loss : colors.textSecondary} filled={post.isLiked} />
                  <Text style={[styles.actionText, post.isLiked && styles.actionTextActive]}>{post.likeCount}</Text>
                </Pressable>

                <Pressable style={styles.actionButton} onPress={() => openCommentComposer(post.id)}>
                  <MessageIcon size={18} color={colors.textSecondary} />
                  <Text style={styles.actionText}>{post.commentCount}</Text>
                </Pressable>

                <Pressable style={styles.actionButton} onPress={() => toggleSave(post.id)}>
                  <BookmarkIcon size={18} color={post.isSaved ? colors.teal : colors.textSecondary} filled={post.isSaved} />
                  <Text style={[styles.actionText, post.isSaved && styles.actionTextSaved]}>
                    {post.isSaved ? 'Saved' : 'Save'}
                  </Text>
                </Pressable>
              </View>
            </Card>
          );
        })}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setShowComposer(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <Modal visible={showComposer} animationType="slide" transparent onRequestClose={() => setShowComposer(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowComposer(false)}>
          <Pressable style={styles.bottomSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Create Post</Text>
            <Input
              value={postText}
              onChangeText={setPostText}
              placeholder="Share your market thought..."
              multiline
              inputStyle={styles.postInput}
            />
            <Button title="Publish" onPress={handlePublishPost} style={styles.publishButton} />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showCommentSheet} animationType="slide" transparent onRequestClose={() => setShowCommentSheet(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCommentSheet(false)}>
          <Pressable style={styles.bottomSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Comment</Text>
            <Text style={styles.sheetSubTitle}>{commentTargetPost?.author || 'Post'}</Text>
            <Input
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write your comment"
              multiline
              inputStyle={styles.postInput}
            />
            <Button title="Post Comment" onPress={submitComment} style={styles.publishButton} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.teal,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tabText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 40,
    height: 2,
    backgroundColor: colors.teal,
    borderRadius: 1,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  snapshotCard: {
    marginBottom: spacing.md,
  },
  composerCard: {
    marginBottom: spacing.md,
  },
  inlineComposer: {
    marginTop: spacing.xs,
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  inlineComposerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  card: {
    marginBottom: spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  postHeaderRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  deleteText: {
    ...typography.small,
    color: colors.loss,
  },
  cardTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  timeText: {
    ...typography.small,
    color: colors.textTertiary,
  },
  cardText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  tickerBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: colors.tealLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  tickerText: {
    ...typography.smallMd,
    color: colors.teal,
  },
  actionsRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: 36,
  },
  actionText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  actionTextActive: {
    color: colors.loss,
  },
  actionTextSaved: {
    color: colors.teal,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '300',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sheetSubTitle: {
    ...typography.small,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  postInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  publishButton: {
    marginTop: spacing.md,
  },
});
