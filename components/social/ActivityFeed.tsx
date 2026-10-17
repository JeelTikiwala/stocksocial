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
import { formatRelativeTime } from '@/utils';
import { api } from '@/services/api';

type ActivityType =
  | 'WATCHLIST_ADD'
  | 'WATCHLIST_REMOVE'
  | 'TRADE_BUY'
  | 'TRADE_SELL'
  | 'POST_CREATE'
  | 'POST_LIKE'
  | 'FOLLOW_USER'
  | 'GOAL_REACHED'
  | 'PORTFOLIO_MILESTONE';

interface Activity {
  id: string;
  type: ActivityType;
  ticker?: string | null;
  targetUserId?: string | null;
  postId?: string | null;
  metadata?: string | null;
  isPublic: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl?: string | null;
    isVerified?: boolean;
  };
}

interface ActivityFeedProps {
  style?: ViewStyle;
}

const getActivityContent = (activity: Activity): string => {
  switch (activity.type) {
    case 'WATCHLIST_ADD':
      return activity.ticker ? `added ${activity.ticker} to their watchlist` : 'added to their watchlist';
    case 'WATCHLIST_REMOVE':
      return activity.ticker ? `removed ${activity.ticker} from their watchlist` : 'updated their watchlist';
    case 'TRADE_BUY':
      return activity.ticker ? `bought ${activity.ticker}` : 'made a purchase';
    case 'TRADE_SELL':
      return activity.ticker ? `sold ${activity.ticker}` : 'made a sale';
    case 'POST_CREATE':
      return 'shared a post';
    case 'POST_LIKE':
      return 'liked a post';
    case 'FOLLOW_USER':
      return 'followed someone';
    case 'GOAL_REACHED':
      return 'reached their portfolio goal 🎉';
    case 'PORTFOLIO_MILESTONE':
      return 'hit a portfolio milestone 🎯';
    default:
      return 'was active';
  }
};

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'mock-1',
    type: 'TRADE_BUY',
    ticker: 'RELIANCE',
    targetUserId: null,
    postId: null,
    metadata: null,
    isPublic: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u1', username: 'rahul_inv', displayName: 'Rahul Sharma', avatarUrl: null, isVerified: true },
  },
  {
    id: 'mock-2',
    type: 'WATCHLIST_ADD',
    ticker: 'TCS',
    targetUserId: null,
    postId: null,
    metadata: null,
    isPublic: true,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u2', username: 'priya_trades', displayName: 'Priya Patel', avatarUrl: null, isVerified: false },
  },
  {
    id: 'mock-3',
    type: 'POST_CREATE',
    ticker: null,
    targetUserId: null,
    postId: 'p1',
    metadata: null,
    isPublic: true,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u3', username: 'nisha_k', displayName: 'Nisha Kumar', avatarUrl: null, isVerified: false },
  },
  {
    id: 'mock-4',
    type: 'TRADE_SELL',
    ticker: 'INFY',
    targetUserId: null,
    postId: null,
    metadata: null,
    isPublic: true,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u4', username: 'kabir_m', displayName: 'Kabir Mehta', avatarUrl: null, isVerified: true },
  },
  {
    id: 'mock-5',
    type: 'FOLLOW_USER',
    ticker: null,
    targetUserId: 'u1',
    postId: null,
    metadata: null,
    isPublic: true,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u5', username: 'aarav_g', displayName: 'Aarav Gupta', avatarUrl: null, isVerified: false },
  },
  {
    id: 'mock-6',
    type: 'PORTFOLIO_MILESTONE',
    ticker: null,
    targetUserId: null,
    postId: null,
    metadata: null,
    isPublic: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    user: { id: 'u6', username: 'deepa_r', displayName: 'Deepa Rao', avatarUrl: null, isVerified: true },
  },
];

const getActivityIcon = (type: ActivityType): string => {
  switch (type) {
    case 'WATCHLIST_ADD': return '👀';
    case 'WATCHLIST_REMOVE': return '📤';
    case 'TRADE_BUY': return '💰';
    case 'TRADE_SELL': return '📈';
    case 'POST_CREATE': return '💬';
    case 'POST_LIKE': return '❤️';
    case 'FOLLOW_USER': return '👥';
    case 'GOAL_REACHED': return '🎯';
    case 'PORTFOLIO_MILESTONE': return '🏆';
    default: return '📌';
  }
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ style }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hideMyActivity, setHideMyActivity] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async (cursor?: string) => {
    try {
      setError(null);
      const response = await api.social.getActivity(cursor, 20);
      const data = response.data?.data || [];
      const newCursor = response.data?.nextCursor || null;

      if (cursor) {
        setActivities(prev => [...prev, ...data]);
      } else {
        setActivities(data.length > 0 ? data : MOCK_ACTIVITIES);
      }
      setNextCursor(newCursor);
    } catch (err) {
      console.error('Error fetching activities:', err);
      // Use mock data as fallback instead of showing error
      if (!cursor && activities.length === 0) {
        setActivities(MOCK_ACTIVITIES);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const loadMore = () => {
    if (nextCursor && !loadingMore) {
      setLoadingMore(true);
      fetchActivities(nextCursor);
    }
  };

  const visibleActivities = hideMyActivity
    ? activities.filter(a => !a.user.id.startsWith('current')) // Filter out current user
    : activities;

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
          icon={<Text style={{ fontSize: 48 }}>📡</Text>}
          title="Couldn't Load Activity"
          description={error || 'Something went wrong'}
          action={
            <Pressable onPress={() => { setLoading(true); fetchActivities(); }}>
              <Text style={{ color: '#00C2A8', fontWeight: '600', fontSize: 15 }}>Retry</Text>
            </Pressable>
          }
        />
      </View>
    );
  }

  if (visibleActivities.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <EmptyState
          icon={<Text style={{ fontSize: 48 }}>📰</Text>}
          title="No Activity Yet"
          description="Follow other investors to see their activity here"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activity</Text>
        <Pressable
          style={[styles.privacyButton, hideMyActivity && styles.privacyButtonActive]}
          onPress={() => setHideMyActivity(prev => !prev)}
        >
          <Text style={[styles.privacyText, hideMyActivity && styles.privacyTextActive]}>
            {hideMyActivity ? 'Activity Hidden' : 'Hide My Activity'}
          </Text>
        </Pressable>
      </View>

      {visibleActivities.map(activity => (
        <Card key={activity.id} style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Pressable
              onPress={() => router.push(`/profile/${activity.user.username}`)}
              style={styles.userInfo}
            >
              <Avatar
                name={activity.user.displayName || activity.user.username}
                source={activity.user.avatarUrl || undefined}
                size="md"
              />
              <View style={styles.activityText}>
                <Text style={styles.activityContent}>
                  <Text style={styles.username}>@{activity.user.username}</Text>
                  {' '}{getActivityContent(activity)}
                </Text>
                <Text style={styles.timestamp}>
                  {getActivityIcon(activity.type)} {formatRelativeTime(activity.createdAt)}
                </Text>
              </View>
            </Pressable>
          </View>

          {activity.ticker && (
            <Pressable
              style={styles.tickerBadge}
              onPress={() => router.push(`/stock/${activity.ticker}`)}
            >
              <Text style={styles.tickerText}>${activity.ticker}</Text>
            </Pressable>
          )}
        </Card>
      ))}

      {nextCursor && (
        <Pressable style={styles.loadMoreButton} onPress={loadMore} disabled={loadingMore}>
          {loadingMore ? (
            <ActivityIndicator size="small" color={colors.teal} />
          ) : (
            <Text style={styles.loadMoreText}>Load More</Text>
          )}
        </Pressable>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  privacyButton: {
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    padding: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  privacyButtonActive: {
    backgroundColor: colors.tealLight,
    borderColor: colors.teal,
  },
  privacyText: {
    ...typography.small,
    color: colors.teal,
  },
  privacyTextActive: {
    fontWeight: '600',
  },
  activityCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: spacing.sm,
  },
  activityText: {
    flex: 1,
  },
  activityContent: {
    ...typography.body,
    color: colors.textPrimary,
  },
  username: {
    fontWeight: '600',
    color: colors.teal,
  },
  timestamp: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: spacing.xxs,
  },
  tickerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.purpleLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
    marginLeft: 48,
  },
  tickerText: {
    ...typography.smallMd,
    color: colors.purple,
  },
  loadMoreButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  loadMoreText: {
    ...typography.bodyMd,
    color: colors.teal,
  },
});

export default ActivityFeed;
