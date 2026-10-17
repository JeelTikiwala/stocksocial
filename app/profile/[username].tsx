import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { colors, spacing, typography } from '@/constants';
import { Avatar, Button, VerifiedBadge, ProBadge, Card, ArrowLeftIcon } from '@/components/ui';
import { DonutChart } from '@/components/charts';
import { HoldingRow } from '@/components/portfolio/HoldingRow';
import { PostCard } from '@/components/feed/PostCard';
import { ChartSegment, PublicProfile, Post, Holding } from '@/types';

// Mock data
const mockProfile: PublicProfile = {
  id: 'u1',
  username: 'rahul_inv',
  email: 'rahul@example.com',
  displayName: 'Rahul Sharma',
  bio: 'Long-term value investor | Building wealth one stock at a time | Passionate about financial literacy',
  avatarUrl: null,
  isVerified: true,
  isPro: true,
  isPublic: true,
  createdAt: '2024-01-01',
  followersCount: 1250,
  followingCount: 89,
  isFollowing: false,
};

const mockChartData: ChartSegment[] = [
  { ticker: 'RELIANCE', allocationPct: 28, todayChangePct: 1.2, color: '#6C63FF' },
  { ticker: 'TCS', allocationPct: 22, todayChangePct: -0.8, color: '#00C2A8' },
  { ticker: 'HDFCBANK', allocationPct: 18, todayChangePct: 0.5, color: '#F59E0B' },
  { ticker: 'INFY', allocationPct: 15, todayChangePct: -1.2, color: '#F04444' },
  { ticker: 'ICICIBANK', allocationPct: 10, todayChangePct: 0.9, color: '#3B82F6' },
  { ticker: 'Others', allocationPct: 7, todayChangePct: 0.3, color: '#D1D5DB' },
];

const mockHoldings: Holding[] = mockChartData.map((s, i) => ({
  id: `h${i}`,
  ticker: s.ticker,
  companyName: s.ticker,
  exchange: 'NSE',
  quantity: 10,
  avgBuyPrice: 1000,
  currentPrice: 1100,
  todayChangePct: s.todayChangePct,
  allocationPct: s.allocationPct,
  colorHex: s.color,
}));

const mockPosts: Post[] = [
  {
    id: 'p1',
    userId: 'u1',
    user: mockProfile,
    content: 'Added more RELIANCE to my portfolio today. Long-term bullish on the company.',
    title: null,
    attachedTicker: 'RELIANCE',
    imageUrl: null,
    likeCount: 24,
    commentCount: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isLiked: false,
    isSaved: false,
  },
];

type ProfileTab = 'holdings' | 'posts' | 'trades' | 'comments';

export default function ProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const [activeTab, setActiveTab] = useState<ProfileTab>('holdings');
  const [isFollowing, setIsFollowing] = useState(mockProfile.isFollowing);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeftIcon size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>@{mockProfile.username}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Avatar
            source={mockProfile.avatarUrl}
            name={mockProfile.displayName || mockProfile.username}
            size="xl"
          />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName}>{mockProfile.displayName}</Text>
              {mockProfile.isVerified && <VerifiedBadge size={18} />}
              {mockProfile.isPro && <ProBadge />}
            </View>
            <Text style={styles.username}>@{mockProfile.username}</Text>
          </View>
        </View>

        {mockProfile.bio && (
          <Text style={styles.bio}>{mockProfile.bio}</Text>
        )}

        {/* Stats */}
        <View style={styles.stats}>
          <Pressable style={styles.statItem}>
            <Text style={styles.statValue}>{mockProfile.followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </Pressable>
          <Pressable style={styles.statItem}>
            <Text style={styles.statValue}>{mockProfile.followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </Pressable>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title={isFollowing ? 'Following' : 'Follow'}
            variant={isFollowing ? 'outline' : 'primary'}
            onPress={handleFollow}
            style={styles.actionButton}
          />
          <Button
            title="Message"
            variant="outline"
            onPress={() => {}}
            style={styles.actionButton}
          />
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {(['holdings', 'posts', 'trades', 'comments'] as ProfileTab[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={styles.tab}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {activeTab === tab && <View style={styles.tabIndicator} />}
            </Pressable>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'holdings' && (
          <View style={styles.tabContent}>
            <View style={styles.chartContainer}>
              <DonutChart
                data={mockChartData}
                size={240}
                todayChangePct={1.5}
              />
            </View>
            <Card style={styles.holdingsCard}>
              {mockHoldings.map((holding, index) => (
                <HoldingRow
                  key={holding.id}
                  holding={holding}
                  showDivider={index < mockHoldings.length - 1}
                />
              ))}
            </Card>
          </View>
        )}

        {activeTab === 'posts' && (
          <View style={styles.tabContent}>
            {mockPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                style={styles.postCard}
              />
            ))}
          </View>
        )}

        {activeTab === 'trades' && (
          <View style={styles.emptyTab}>
            <Text style={styles.emptyText}>No trades yet</Text>
          </View>
        )}

        {activeTab === 'comments' && (
          <View style={styles.emptyTab}>
            <Text style={styles.emptyText}>No comments yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
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
  content: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  profileInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  displayName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  username: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bio: {
    ...typography.body,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    lineHeight: 22,
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    gap: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
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
    ...typography.smallMd,
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
  tabContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  holdingsCard: {
    marginHorizontal: spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  postCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  emptyTab: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
  },
});
