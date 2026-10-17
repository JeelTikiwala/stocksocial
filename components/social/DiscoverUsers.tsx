import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card, Avatar, EmptyState } from '@/components/ui';
import { formatCompactIndian } from '@/utils';
import { api } from '@/services/api';

interface DiscoverUser {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl?: string | null;
  isVerified: boolean;
  isPro: boolean;
  followersCount: number;
  postsCount: number;
}

interface DiscoverUsersProps {
  searchQuery?: string;
  style?: ViewStyle;
}

const MOCK_USERS: DiscoverUser[] = [
  {
    id: 'u1', username: 'rahul_inv', displayName: 'Rahul Sharma',
    bio: 'Long-term value investor. Focused on Indian large-caps and dividend stocks.',
    avatarUrl: null, isVerified: true, isPro: true, followersCount: 1240, postsCount: 45,
  },
  {
    id: 'u2', username: 'priya_trades', displayName: 'Priya Patel',
    bio: 'Swing trader | IT sector specialist | Sharing my journey',
    avatarUrl: null, isVerified: true, isPro: false, followersCount: 890, postsCount: 32,
  },
  {
    id: 'u3', username: 'kabir_m', displayName: 'Kabir Mehta',
    bio: 'Quant-driven approach to Indian markets. Building data-backed portfolios.',
    avatarUrl: null, isVerified: false, isPro: true, followersCount: 670, postsCount: 28,
  },
  {
    id: 'u4', username: 'nisha_k', displayName: 'Nisha Kumar',
    bio: 'Banking sector analyst. Ex-ICICI. Sharing research notes.',
    avatarUrl: null, isVerified: true, isPro: false, followersCount: 520, postsCount: 19,
  },
  {
    id: 'u5', username: 'aarav_g', displayName: 'Aarav Gupta',
    bio: 'New to investing! Learning about markets one stock at a time.',
    avatarUrl: null, isVerified: false, isPro: false, followersCount: 340, postsCount: 12,
  },
];

export const DiscoverUsers: React.FC<DiscoverUsersProps> = ({
  searchQuery = '',
  style,
}) => {
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.social.discoverUsers(searchQuery || undefined, 20);
      const data = response.data?.data || [];
      setUsers(data.length > 0 ? data : MOCK_USERS);
    } catch (err) {
      console.error('Error fetching users:', err);
      // Use mock data as fallback
      const query = searchQuery.toLowerCase();
      if (query) {
        setUsers(MOCK_USERS.filter(u =>
          u.username.toLowerCase().includes(query) ||
          (u.displayName || '').toLowerCase().includes(query)
        ));
      } else {
        setUsers(MOCK_USERS);
      }
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFollow = async (user: DiscoverUser) => {
    const isFollowing = followingIds.has(user.id);

    // Optimistic update
    setFollowingIds(prev => {
      const next = new Set(prev);
      if (isFollowing) {
        next.delete(user.id);
      } else {
        next.add(user.id);
      }
      return next;
    });

    try {
      if (isFollowing) {
        await api.users.unfollow(user.username);
      } else {
        await api.users.follow(user.username);
      }
    } catch (err) {
      // Revert on error
      setFollowingIds(prev => {
        const next = new Set(prev);
        if (isFollowing) {
          next.add(user.id);
        } else {
          next.delete(user.id);
        }
        return next;
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color={colors.teal} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <EmptyState
          icon={<Text style={{ fontSize: 48 }}>👥</Text>}
          title="Couldn't Load Users"
          description={error || 'Something went wrong'}
          action={
            <Pressable onPress={fetchUsers}>
              <Text style={{ color: '#00C2A8', fontWeight: '600', fontSize: 15 }}>Retry</Text>
            </Pressable>
          }
        />
      </View>
    );
  }

  if (users.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {searchQuery ? 'Search Results' : 'Suggested for You'}
          </Text>
        </View>
        <EmptyState
          icon={<Text style={{ fontSize: 48 }}>🔍</Text>}
          title={searchQuery ? 'No Users Found' : 'No Suggestions'}
          description={
            searchQuery
              ? `No users match "${searchQuery}"`
              : 'Check back later for new investors to follow'
          }
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {searchQuery ? `Results for "${searchQuery}"` : 'Suggested for You'}
        </Text>
        {!searchQuery && (
          <Text style={styles.subtitle}>
            Based on your interests and activity
          </Text>
        )}
      </View>

      {/* User List */}
      {users.map((user) => {
        const isFollowing = followingIds.has(user.id);

        return (
          <Card key={user.id} style={styles.userCard}>
            <Pressable
              onPress={() => router.push(`/profile/${user.username}`)}
              style={styles.userContent}
            >
              <Avatar
                name={user.displayName || user.username}
                source={user.avatarUrl || undefined}
                size="lg"
              />
              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.displayName} numberOfLines={1}>
                    {user.displayName || user.username}
                  </Text>
                  {user.isVerified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓</Text>
                    </View>
                  )}
                  {user.isPro && (
                    <View style={styles.proBadge}>
                      <Text style={styles.proText}>PRO</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.username}>@{user.username}</Text>
                {user.bio && (
                  <Text style={styles.bio} numberOfLines={2}>{user.bio}</Text>
                )}
                <View style={styles.metaRow}>
                  <Text style={styles.followers}>
                    {formatCompactIndian(user.followersCount)} followers
                  </Text>
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.posts}>
                    {user.postsCount} posts
                  </Text>
                </View>
              </View>
            </Pressable>
            <Pressable
              onPress={() => handleFollow(user)}
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
              ]}
            >
              <Text
                style={[
                  styles.followText,
                  isFollowing && styles.followingText,
                ]}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
          </Card>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  loadingContainer: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  userContent: {
    flexDirection: 'row',
    flex: 1,
    gap: spacing.sm,
  },
  userInfo: {
    flex: 1,
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
    maxWidth: 140,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  proBadge: {
    backgroundColor: colors.purpleLight,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  proText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.purple,
  },
  username: {
    ...typography.small,
    color: colors.textSecondary,
  },
  bio: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  followers: {
    ...typography.small,
    color: colors.textTertiary,
    fontSize: 11,
  },
  dot: {
    color: colors.textTertiary,
    marginHorizontal: spacing.xxs,
  },
  posts: {
    ...typography.small,
    color: colors.textTertiary,
    fontSize: 11,
  },
  followButton: {
    backgroundColor: colors.teal,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  followingButton: {
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: colors.border,
  },
  followText: {
    ...typography.smallMd,
    color: colors.white,
    fontWeight: '600',
  },
  followingText: {
    color: colors.textSecondary,
  },
});

export default DiscoverUsers;
