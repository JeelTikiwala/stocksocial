import React from 'react';
import { StyleSheet, View, Text, Pressable, Image, ViewStyle } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card, Avatar, VerifiedBadge, ProBadge, HeartIcon, MessageIcon, ShareIcon, BookmarkIcon } from '@/components/ui';
import { formatRelativeTime, truncateText } from '@/utils';
import { Post } from '@/types';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onFollow?: () => void;
  style?: ViewStyle;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPress,
  onLike,
  onComment,
  onShare,
  onSave,
  onFollow,
  style,
}) => {
  const { user, content, title, imageUrl, likeCount, commentCount, createdAt, isLiked, isSaved } = post;

  return (
    <Card style={[styles.container, style]} onPress={onPress}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar
          source={user.avatarUrl}
          name={user.displayName || user.username}
          size="lg"
        />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName} numberOfLines={1}>
              {user.displayName || user.username}
            </Text>
            {user.isVerified && <VerifiedBadge size={14} />}
            {user.isPro && <ProBadge />}
          </View>
          <Text style={styles.username}>@{user.username}</Text>
        </View>
        <Pressable onPress={onFollow} style={styles.followButton}>
          <Text style={styles.followText}>+Follow</Text>
        </Pressable>
      </View>

      {/* Meta */}
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          Beginner Investors · {formatRelativeTime(createdAt)}
        </Text>
      </View>

      {/* Content */}
      {title && <Text style={styles.title}>{title}</Text>}
      <Text style={styles.content}>
        {truncateText(content, 200)}
        {content.length > 200 && (
          <Text style={styles.readMore}> read more</Text>
        )}
      </Text>

      {/* Image */}
      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable onPress={onLike} style={styles.actionButton}>
          <HeartIcon size={20} color={isLiked ? colors.loss : colors.textSecondary} filled={isLiked} />
          <Text style={[styles.actionText, isLiked && styles.actionTextLiked]}>
            {likeCount > 0 ? likeCount : 'Like'}
          </Text>
        </Pressable>

        <Pressable onPress={onComment} style={styles.actionButton}>
          <MessageIcon size={20} color={colors.textSecondary} />
          <Text style={styles.actionText}>
            {commentCount > 0 ? commentCount : 'Comment'}
          </Text>
        </Pressable>

        <Pressable onPress={onShare} style={styles.actionButton}>
          <ShareIcon size={20} color={colors.textSecondary} />
          <Text style={styles.actionText}>Share</Text>
        </Pressable>

        <Pressable onPress={onSave} style={styles.actionButton}>
          <BookmarkIcon size={20} color={isSaved ? colors.teal : colors.textSecondary} filled={isSaved} />
        </Pressable>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  displayName: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    fontWeight: '600',
    maxWidth: 120,
  },
  username: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  followText: {
    ...typography.smallMd,
    color: colors.teal,
    fontWeight: '600',
  },
  meta: {
    marginTop: spacing.xs,
    marginLeft: 56 + spacing.sm, // Avatar size + margin
  },
  metaText: {
    ...typography.small,
    color: colors.textTertiary,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  content: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  readMore: {
    color: colors.teal,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: colors.borderLight,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.sm,
    gap: spacing.xxs,
  },
  actionText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  actionTextLiked: {
    color: colors.loss,
  },
});

export default PostCard;
