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
import { formatPercentage, formatIndianNumber, formatCompactIndian } from '@/utils';
import { api } from '@/services/api';

type TimeFilter = '1w' | '1m' | '3m' | '1y';

interface LeaderboardUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl?: string | null;
  isVerified: boolean;
  isPro: boolean;
  followersCount: number;
}

interface LeaderboardEntry {
  user: LeaderboardUser;
  performance: {
    totalValue: number;
    totalReturn: number;
    todayChangePct: number;
    holdingsCount: number;
  };
}

interface TopPortfoliosProps {
  style?: ViewStyle;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    user: { id: 'u1', username: 'rahul_inv', displayName: 'Rahul Sharma', avatarUrl: null, isVerified: true, isPro: true, followersCount: 1240 },
    performance: { totalValue: 1250000, totalReturn: 34.2, todayChangePct: 1.8, holdingsCount: 12 },
  },
  {
    user: { id: 'u2', username: 'priya_trades', displayName: 'Priya Patel', avatarUrl: null, isVerified: true, isPro: false, followersCount: 890 },
    performance: { totalValue: 980000, totalReturn: 28.7, todayChangePct: -0.5, holdingsCount: 8 },
  },
  {
    user: { id: 'u3', username: 'kabir_m', displayName: 'Kabir Mehta', avatarUrl: null, isVerified: false, isPro: true, followersCount: 670 },
    performance: { totalValue: 750000, totalReturn: 22.1, todayChangePct: 2.3, holdingsCount: 15 },
  },
  {
    user: { id: 'u4', username: 'nisha_k', displayName: 'Nisha Kumar', avatarUrl: null, isVerified: true, isPro: false, followersCount: 520 },
    performance: { totalValue: 620000, totalReturn: 18.9, todayChangePct: 0.7, holdingsCount: 6 },
  },
  {
    user: { id: 'u5', username: 'aarav_g', displayName: 'Aarav Gupta', avatarUrl: null, isVerified: false, isPro: false, followersCount: 340 },
    performance: { totalValue: 480000, totalReturn: 15.4, todayChangePct: -1.2, holdingsCount: 10 },
  },
  {
    user: { id: 'u6', username: 'deepa_r', displayName: 'Deepa Rao', avatarUrl: null, isVerified: true, isPro: true, followersCount: 1560 },
    performance: { totalValue: 2100000, totalReturn: 12.8, todayChangePct: 0.3, holdingsCount: 20 },
  },
];

const getRankBadge = (rank: number): { bg: string; text: string } => {
  switch (rank) {
    case 1: return { bg: '#FFD700', text: '#000' }; // Gold
    case 2: return { bg: '#C0C0C0', text: '#000' }; // Silver
    case 3: return { bg: '#CD7F32', text: '#FFF' }; // Bronze
    default: return { bg: colors.offWhite, text: colors.textSecondary };
  }
};

export const TopPortfolios: React.FC<TopPortfoliosProps> = ({ style }) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('1m');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);

  const timeFilters: { key: TimeFilter; label: string }[] = [
    { key: '1w', label: 'This Week' },
    { key: '1m', label: 'This Month' },
    { key: '3m', label: '3 Months' },
    { key: '1y', label: 'This Year' },
  ];

  const fetchLeaderboard = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.social.getLeaderboard(timeFilter, 20);
      const data = response.data?.data || [];
      setLeaderboard(data.length > 0 ? data : MOCK_LEADERBOARD);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setLeaderboard(MOCK_LEADERBOARD);
    } finally {
      setLoading(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

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
          icon={<Text style={{ fontSize: 48 }}>📊</Text>}
          title="Couldn't Load Leaderboard"
          description={error || 'Something went wrong'}
          action={
            <Pressable onPress={fetchLeaderboard}>
              <Text style={{ color: '#00C2A8', fontWeight: '600', fontSize: 15 }}>Retry</Text>
            </Pressable>
          }
        />
      </View>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <Text style={styles.title}>Top Portfolios</Text>
          <Text style={styles.subtitle}>By % returns (public portfolios only)</Text>
        </View>
        <View style={styles.filterContainer}>
          {timeFilters.map((filter) => (
            <Pressable
              key={filter.key}
              onPress={() => setTimeFilter(filter.key)}
              style={[
                styles.filterButton,
                timeFilter === filter.key && styles.filterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  timeFilter === filter.key && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <EmptyState
          icon={<Text style={{ fontSize: 48 }}>🏆</Text>}
          title="No Rankings Yet"
          description="Be the first to make your portfolio public and appear on the leaderboard!"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Top Portfolios</Text>
        <Text style={styles.subtitle}>By % returns (public portfolios only)</Text>
      </View>

      {/* Time Filter */}
      <View style={styles.filterContainer}>
        {timeFilters.map((filter) => (
          <Pressable
            key={filter.key}
            onPress={() => setTimeFilter(filter.key)}
            style={[
              styles.filterButton,
              timeFilter === filter.key && styles.filterButtonActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                timeFilter === filter.key && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Leaderboard */}
      <Card style={styles.leaderboard}>
        {leaderboard.map((entry, index) => {
          const rank = index + 1;
          const rankStyle = getRankBadge(rank);
          const isPositive = entry.performance.totalReturn >= 0;

          return (
            <Pressable
              key={entry.user.id}
              onPress={() => {
                setSelectedEntry(entry);
                router.push(`/profile/${entry.user.username}`);
              }}
              style={[
                styles.portfolioRow,
                index < leaderboard.length - 1 && styles.portfolioRowBorder,
              ]}
            >
              <View style={[styles.rankBadge, { backgroundColor: rankStyle.bg }]}>
                <Text style={[styles.rankText, { color: rankStyle.text }]}>
                  {rank}
                </Text>
              </View>

              <Avatar
                name={entry.user.displayName || entry.user.username}
                source={entry.user.avatarUrl || undefined}
                size="md"
              />

              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.displayName} numberOfLines={1}>
                    {entry.user.displayName || entry.user.username}
                  </Text>
                  {entry.user.isVerified && (
                    <Text style={styles.verifiedBadge}>✓</Text>
                  )}
                  {entry.user.isPro && (
                    <View style={styles.proBadge}>
                      <Text style={styles.proText}>PRO</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.username}>@{entry.user.username}</Text>
                <Text style={styles.stats}>
                  {entry.performance.holdingsCount} stocks · {formatCompactIndian(entry.user.followersCount)} followers
                </Text>
              </View>

              <View style={[
                styles.returnContainer,
                { backgroundColor: isPositive ? colors.gainBg : colors.lossBg }
              ]}>
                <Text style={[
                  styles.returnValue,
                  { color: isPositive ? colors.gain : colors.loss }
                ]}>
                  {formatPercentage(entry.performance.totalReturn)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </Card>

      {/* Portfolio Value Summary */}
      {leaderboard.length > 0 && (
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Top 3 Combined Value</Text>
          <Text style={styles.summaryValue}>
            ₹{formatIndianNumber(
              leaderboard.slice(0, 3).reduce((sum, e) => sum + e.performance.totalValue, 0)
            )}
          </Text>
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  loadingContainer: {
    minHeight: 300,
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.md,
    padding: spacing.xxs,
    marginBottom: spacing.md,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  filterButtonActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterText: {
    ...typography.smallMd,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  leaderboard: {
    padding: 0,
    overflow: 'hidden',
  },
  portfolioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  portfolioRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
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
    maxWidth: 120,
  },
  verifiedBadge: {
    color: colors.teal,
    fontSize: 12,
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
  stats: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: 2,
    fontSize: 11,
  },
  returnContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.md,
  },
  returnValue: {
    ...typography.bodyMd,
    fontWeight: '700',
  },
  summaryCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  summaryTitle: {
    ...typography.small,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.xxs,
  },
});

export default TopPortfolios;
