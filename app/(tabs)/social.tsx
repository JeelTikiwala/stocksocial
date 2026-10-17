import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/constants';
import { SearchBar } from '@/components/ui';
import { ActivityFeed } from '@/components/social/ActivityFeed';
import { TopPortfolios } from '@/components/social/TopPortfolios';
import { CommunityChallenges } from '@/components/social/CommunityChallenges';
import { DiscoverUsers } from '@/components/social/DiscoverUsers';
import { SharedWatchlists } from '@/components/social/SharedWatchlists';
import { StockDiscussions } from '@/components/social/StockDiscussions';

type SocialTab = 'activity' | 'leaderboard' | 'discussions' | 'discover' | 'challenges' | 'watchlists';

export default function SocialScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<SocialTab>('activity');
  const [searchQuery, setSearchQuery] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const tabs: { key: SocialTab; label: string }[] = [
    { key: 'activity', label: 'Activity' },
    { key: 'leaderboard', label: 'Leaderboard' },
    { key: 'discussions', label: 'Discussions' },
    { key: 'discover', label: 'Discover' },
    { key: 'challenges', label: 'Challenges' },
    { key: 'watchlists', label: 'Watchlists' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'activity':
        return <ActivityFeed />;
      case 'leaderboard':
        return <TopPortfolios />;
      case 'discussions':
        return <StockDiscussions />;
      case 'watchlists':
        return <SharedWatchlists />;
      case 'challenges':
        return <CommunityChallenges />;
      case 'discover':
        return <DiscoverUsers searchQuery={searchQuery} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Social</Text>
      </View>

      {/* Search (only for discover tab) */}
      {activeTab === 'discover' && (
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search users..."
          />
        </View>
      )}

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.teal}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
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
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  searchContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  tabBar: {
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  tabBarContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
  },
  tab: {
    paddingVertical: spacing.sm,
    position: 'relative',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.teal,
    marginBottom: -0.5,
  },
  tabText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing.xxl,
  },
});
