import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Alert,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card, Avatar } from '@/components/ui';
import { api } from '@/services/api';

type SortMode = 'top' | 'new' | 'controversial';

interface DiscussionPost {
  id: string;
  ticker: string;
  user: {
    username: string;
    displayName: string;
  };
  content: string;
  score: number;
  createdAt: string;
  controversy: number;
}

interface StockDiscussionsProps {
  style?: ViewStyle;
}

const TICKERS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN'];

const mockPosts: DiscussionPost[] = [
  {
    id: 'd1',
    ticker: 'RELIANCE',
    user: { username: 'longterm', displayName: 'Nisha K.' },
    content: 'Retail execution improved significantly. Jio subscriber growth remains strong. Energy cycle still matters for near-term earnings.',
    score: 92,
    createdAt: '2026-03-28T10:10:00Z',
    controversy: 21,
  },
  {
    id: 'd2',
    ticker: 'RELIANCE',
    user: { username: 'valuebull', displayName: 'Priya N.' },
    content: 'New energy segment is the long-term catalyst. Current valuations discount most of the upside though.',
    score: 74,
    createdAt: '2026-03-27T15:25:00Z',
    controversy: 66,
  },
  {
    id: 'd3',
    ticker: 'TCS',
    user: { username: 'itfund', displayName: 'Kabir M.' },
    content: 'Attrition stability should help margins over 2H. Deal pipeline looks robust across BFSI vertical.',
    score: 121,
    createdAt: '2026-03-28T08:50:00Z',
    controversy: 34,
  },
  {
    id: 'd4',
    ticker: 'HDFCBANK',
    user: { username: 'techalpha', displayName: 'Aarav G.' },
    content: 'Post-merger integration going well. Credit growth outpacing industry. NIMs holding up better than expected.',
    score: 58,
    createdAt: '2026-03-26T13:10:00Z',
    controversy: 41,
  },
  {
    id: 'd5',
    ticker: 'INFY',
    user: { username: 'semiscope', displayName: 'Rohan V.' },
    content: 'Guidance seems conservative. Large deal wins in cloud migration should drive outperformance vs peers.',
    score: 49,
    createdAt: '2026-03-28T09:15:00Z',
    controversy: 19,
  },
  {
    id: 'd6',
    ticker: 'SBIN',
    user: { username: 'banksector', displayName: 'Deepa R.' },
    content: 'Asset quality improvement is structural. PSU bank re-rating has more room to run. Dividend yield is attractive.',
    score: 67,
    createdAt: '2026-03-27T11:30:00Z',
    controversy: 28,
  },
  {
    id: 'd7',
    ticker: 'TCS',
    user: { username: 'longterm', displayName: 'Nisha K.' },
    content: 'Worried about AI impact on traditional IT services revenue. But TCS is better positioned than peers to adapt.',
    score: 45,
    createdAt: '2026-03-26T14:20:00Z',
    controversy: 72,
  },
  {
    id: 'd8',
    ticker: 'HDFCBANK',
    user: { username: 'valuebull', displayName: 'Priya N.' },
    content: 'CASA ratio improving quarter on quarter. This bank remains the gold standard for Indian private banking.',
    score: 83,
    createdAt: '2026-03-28T07:45:00Z',
    controversy: 15,
  },
];

export const StockDiscussions: React.FC<StockDiscussionsProps> = ({ style }) => {
  const [activeTicker, setActiveTicker] = useState('RELIANCE');
  const [sortMode, setSortMode] = useState<SortMode>('top');
  const [posts, setPosts] = useState(mockPosts);
  const [votes, setVotes] = useState<Record<string, -1 | 0 | 1>>({});

  // Try to fetch real discussions from API
  const fetchDiscussions = useCallback(async (ticker: string) => {
    try {
      const response = await api.social.getDiscussions(ticker, undefined, 20);
      const apiPosts = response.data?.data || [];
      if (apiPosts.length > 0) {
        const mapped: DiscussionPost[] = apiPosts.map((p: any) => ({
          id: p.id,
          ticker: p.attachedTicker || ticker,
          user: {
            username: p.user?.username || 'user',
            displayName: p.user?.displayName || p.user?.username || 'User',
          },
          content: p.content,
          score: (p._count?.likes || p.likeCount || 0),
          createdAt: p.createdAt,
          controversy: Math.floor(Math.random() * 50),
        }));
        setPosts(prev => {
          // Merge API posts with mock, dedupe by id
          const ids = new Set(mapped.map(p => p.id));
          const kept = prev.filter(p => !ids.has(p.id) && p.ticker !== ticker);
          return [...mapped, ...kept];
        });
      }
    } catch {
      // Keep mock data
    }
  }, []);

  useEffect(() => {
    fetchDiscussions(activeTicker);
  }, [activeTicker, fetchDiscussions]);

  const filteredPosts = useMemo(() => {
    const tickerPosts = posts.filter((post) => post.ticker === activeTicker);

    if (sortMode === 'new') {
      return [...tickerPosts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    if (sortMode === 'controversial') {
      return [...tickerPosts].sort((a, b) => b.controversy - a.controversy);
    }
    return [...tickerPosts].sort((a, b) => b.score - a.score);
  }, [activeTicker, posts, sortMode]);

  const handleVote = (postId: string, direction: -1 | 1) => {
    setVotes((prev) => {
      const previous = prev[postId] ?? 0;
      const next = previous === direction ? 0 : direction;

      setPosts((currentPosts) =>
        currentPosts.map((post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            score: post.score - previous + next,
          };
        })
      );

      return { ...prev, [postId]: next };
    });
  };

  const handleFlag = (postId: string) => {
    Alert.alert('Flagged', 'Thanks. Our moderators will review this post.');
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Stock Discussions</Text>
        <Text style={styles.subtitle}>Per-ticker community threads</Text>
      </View>

      <View style={styles.tickerRow}>
        {TICKERS.map((ticker) => (
          <Pressable
            key={ticker}
            onPress={() => setActiveTicker(ticker)}
            style={[
              styles.tickerPill,
              activeTicker === ticker && styles.tickerPillActive,
            ]}
          >
            <Text
              style={[
                styles.tickerText,
                activeTicker === ticker && styles.tickerTextActive,
              ]}
            >
              {ticker}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sortRow}>
        {(['top', 'new', 'controversial'] as SortMode[]).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setSortMode(mode)}
            style={[styles.sortButton, sortMode === mode && styles.sortButtonActive]}
          >
            <Text style={[styles.sortText, sortMode === mode && styles.sortTextActive]}>
              {mode[0].toUpperCase() + mode.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {filteredPosts.map((post) => (
        <Card key={post.id} style={styles.postCard}>
          <View style={styles.postHeader}>
            <Avatar name={post.user.displayName} size="sm" />
            <View style={styles.postMeta}>
              <Text style={styles.displayName}>{post.user.displayName}</Text>
              <Text style={styles.username}>@{post.user.username}</Text>
            </View>
            <Pressable onPress={() => handleFlag(post.id)} style={styles.flagButton}>
              <Text style={styles.flagText}>Flag</Text>
            </Pressable>
          </View>

          <Text style={styles.postContent}>{post.content}</Text>

          <View style={styles.actions}>
            <Pressable onPress={() => handleVote(post.id, 1)} style={styles.voteButton}>
              <Text style={[styles.voteLabel, votes[post.id] === 1 && styles.voteLabelActive]}>▲</Text>
            </Pressable>
            <Text style={styles.score}>{post.score}</Text>
            <Pressable onPress={() => handleVote(post.id, -1)} style={styles.voteButton}>
              <Text style={[styles.voteLabel, votes[post.id] === -1 && styles.voteLabelNegative]}>▼</Text>
            </Pressable>
          </View>
        </Card>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
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
  tickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tickerPill: {
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  tickerPillActive: {
    backgroundColor: colors.tealLight,
    borderColor: colors.teal,
  },
  tickerText: {
    ...typography.smallMd,
    color: colors.textSecondary,
  },
  tickerTextActive: {
    color: colors.teal,
    fontWeight: '600',
  },
  sortRow: {
    flexDirection: 'row',
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.md,
    padding: spacing.xxs,
    marginBottom: spacing.md,
  },
  sortButton: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  sortButtonActive: {
    backgroundColor: colors.white,
  },
  sortText: {
    ...typography.smallMd,
    color: colors.textSecondary,
  },
  sortTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  postCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  postMeta: {
    flex: 1,
  },
  displayName: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  username: {
    ...typography.small,
    color: colors.textSecondary,
  },
  flagButton: {
    padding: spacing.xs,
  },
  flagText: {
    ...typography.small,
    color: colors.loss,
  },
  postContent: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 21,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  voteButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
    backgroundColor: colors.offWhite,
  },
  voteLabel: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  voteLabelActive: {
    color: colors.gain,
  },
  voteLabelNegative: {
    color: colors.loss,
  },
  score: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default StockDiscussions;
