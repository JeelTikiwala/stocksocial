import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Avatar, ArrowLeftIcon, HeartIcon, ShareIcon, BookmarkIcon } from '@/components/ui';
import { formatRelativeTime } from '@/utils';
import { Post, Comment } from '@/types';

// Mock data
const mockPost: Post = {
  id: '1',
  userId: 'u1',
  user: {
    id: 'u1',
    username: 'rahul_inv',
    email: 'rahul@example.com',
    displayName: 'Rahul Sharma',
    bio: 'Long-term investor',
    avatarUrl: null,
    isVerified: true,
    isPro: true,
    isPublic: true,
    createdAt: '2024-01-01',
  },
  content: 'Just increased my position in HDFC Bank after the recent dip. The fundamentals remain strong and the valuation looks attractive at current levels. The banking sector is poised for growth with the economic recovery. What do you think about banking stocks?',
  title: 'Banking Sector Outlook for 2026',
  attachedTicker: 'HDFCBANK',
  imageUrl: null,
  likeCount: 42,
  commentCount: 8,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  isLiked: false,
  isSaved: false,
};

const mockComments: Comment[] = [
  {
    id: 'c1',
    postId: '1',
    userId: 'u2',
    user: {
      id: 'u2',
      username: 'priya_trades',
      email: 'priya@example.com',
      displayName: 'Priya Patel',
      bio: null,
      avatarUrl: null,
      isVerified: false,
      isPro: false,
      isPublic: true,
      createdAt: '2024-02-15',
    },
    content: 'Great analysis! I agree that HDFC Bank looks undervalued at current levels.',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'c2',
    postId: '1',
    userId: 'u3',
    user: {
      id: 'u3',
      username: 'amit_stocks',
      email: 'amit@example.com',
      displayName: 'Amit Kumar',
      bio: null,
      avatarUrl: null,
      isVerified: true,
      isPro: false,
      isPublic: true,
      createdAt: '2024-03-01',
    },
    content: 'What about ICICI Bank? They seem to be executing well too.',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

export default function PostDetailScreen() {
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(mockPost.isLiked);
  const [isSaved, setIsSaved] = useState(mockPost.isSaved);
  const [likeCount, setLikeCount] = useState(mockPost.likeCount);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    // Submit comment API call
    setCommentText('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeftIcon size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Post Author */}
          <View style={styles.authorSection}>
            <Avatar
              source={mockPost.user.avatarUrl}
              name={mockPost.user.displayName || mockPost.user.username}
              size="lg"
            />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>
                {mockPost.user.displayName || mockPost.user.username}
              </Text>
              <Text style={styles.authorMeta}>
                @{mockPost.user.username} · {formatRelativeTime(mockPost.createdAt)}
              </Text>
            </View>
          </View>

          {/* Post Content */}
          {mockPost.title && (
            <Text style={styles.postTitle}>{mockPost.title}</Text>
          )}
          <Text style={styles.postContent}>{mockPost.content}</Text>

          {/* Attached Ticker */}
          {mockPost.attachedTicker && (
            <View style={styles.tickerBadge}>
              <Text style={styles.tickerText}>${mockPost.attachedTicker}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable onPress={handleLike} style={styles.actionButton}>
              <HeartIcon
                size={22}
                color={isLiked ? colors.loss : colors.textSecondary}
                filled={isLiked}
              />
              <Text style={[styles.actionText, isLiked && styles.actionTextLiked]}>
                {likeCount}
              </Text>
            </Pressable>

            <Pressable style={styles.actionButton}>
              <ShareIcon size={22} color={colors.textSecondary} />
              <Text style={styles.actionText}>Share</Text>
            </Pressable>

            <Pressable onPress={handleSave} style={styles.actionButton}>
              <BookmarkIcon
                size={22}
                color={isSaved ? colors.teal : colors.textSecondary}
                filled={isSaved}
              />
              <Text style={[styles.actionText, isSaved && styles.actionTextSaved]}>
                Save
              </Text>
            </Pressable>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Comments ({mockComments.length})
            </Text>

            {mockComments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <Avatar
                  source={comment.user.avatarUrl}
                  name={comment.user.displayName || comment.user.username}
                  size="md"
                />
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>
                      {comment.user.displayName || comment.user.username}
                    </Text>
                    <Text style={styles.commentTime}>
                      {formatRelativeTime(comment.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.commentText}>{comment.content}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <Avatar name="Me" size="sm" />
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textTertiary}
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <Pressable
            onPress={handleSubmitComment}
            disabled={!commentText.trim()}
            style={styles.sendButton}
          >
            <Text
              style={[
                styles.sendText,
                !commentText.trim() && styles.sendTextDisabled,
              ]}
            >
              Post
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
    width: 40,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing.md,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  authorInfo: {
    marginLeft: spacing.sm,
  },
  authorName: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  authorMeta: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  postTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  postContent: {
    ...typography.body,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    lineHeight: 24,
  },
  tickerBadge: {
    alignSelf: 'flex-start',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: colors.tealLight,
    borderRadius: borderRadius.sm,
  },
  tickerText: {
    ...typography.smallMd,
    color: colors.teal,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginRight: spacing.md,
    gap: spacing.xs,
  },
  actionText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  actionTextLiked: {
    color: colors.loss,
  },
  actionTextSaved: {
    color: colors.teal,
  },
  commentsSection: {
    padding: spacing.md,
  },
  commentsTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  commentContent: {
    flex: 1,
    marginLeft: spacing.sm,
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    ...typography.smallMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  commentTime: {
    ...typography.small,
    color: colors.textTertiary,
    marginLeft: spacing.xs,
  },
  commentText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  commentInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: spacing.sm,
  },
  sendText: {
    ...typography.bodyMd,
    color: colors.teal,
    fontWeight: '600',
  },
  sendTextDisabled: {
    color: colors.textTertiary,
  },
});
