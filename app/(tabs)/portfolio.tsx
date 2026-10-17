import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card, Button } from '@/components/ui';
import { DonutChart } from '@/components/charts';
import { HoldingRow } from '@/components/portfolio/HoldingRow';
import { ChartSegment, Holding } from '@/types';
import { useAppSettingsStore } from '@/stores';

const mockChartData: ChartSegment[] = [
  { ticker: 'RELIANCE', allocationPct: 25, todayChangePct: 1.2, color: '#6C63FF', companyName: 'Reliance Industries' },
  { ticker: 'TCS', allocationPct: 20, todayChangePct: -0.8, color: '#00C2A8', companyName: 'Tata Consultancy Services' },
  { ticker: 'HDFCBANK', allocationPct: 18, todayChangePct: 0.5, color: '#F59E0B', companyName: 'HDFC Bank' },
  { ticker: 'INFY', allocationPct: 15, todayChangePct: -1.2, color: '#F04444', companyName: 'Infosys' },
  { ticker: 'ICICIBANK', allocationPct: 12, todayChangePct: 0.9, color: '#3B82F6', companyName: 'ICICI Bank' },
  { ticker: 'BHARTIARTL', allocationPct: 5, todayChangePct: 2.1, color: '#10B981', companyName: 'Bharti Airtel' },
  { ticker: 'WIPRO', allocationPct: 3, todayChangePct: -0.3, color: '#EC4899', companyName: 'Wipro' },
  { ticker: 'TATAMOTORS', allocationPct: 2, todayChangePct: 1.8, color: '#8B5CF6', companyName: 'Tata Motors' },
];

const mockHoldings: Holding[] = mockChartData.map((segment, index) => ({
  id: `h${index}`,
  ticker: segment.ticker,
  companyName: segment.companyName || segment.ticker,
  exchange: 'NSE',
  quantity: 20 + index * 7,
  avgBuyPrice: 800 + index * 120,
  currentPrice: 860 + index * 130,
  todayChangePct: segment.todayChangePct,
  allocationPct: segment.allocationPct,
  colorHex: segment.color,
}));

export default function PortfolioScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<ChartSegment | null>(null);
  const { brokerConnected, brokerName } = useAppSettingsStore();

  const totalTodayChange = useMemo(
    () =>
      mockChartData.reduce(
        (acc, segment) => acc + segment.todayChangePct * (segment.allocationPct / 100),
        0
      ),
    []
  );
  const chartSize = Math.max(170, Math.min(280, windowWidth - spacing.md * 2 - 80));

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setRefreshing(false);
  };

  const handleSegmentPress = (segment: ChartSegment) => {
    setSelectedSegment(segment);
  };

  if (!brokerConnected) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Portfolio</Text>
          <Pressable style={styles.settingsButton} onPress={() => router.push('/(tabs)/settings')}>
            <Text style={styles.settingsText}>Settings</Text>
          </Pressable>
        </View>

        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyEmoji}>🏦</Text>
          </View>
          <Text style={styles.emptyTitle}>Connect your brokerage first</Text>
          <Text style={styles.emptyDescription}>
            Pie chart and insights are generated only after broker sync.
          </Text>
          <Button
            title="Connect Broker"
            onPress={() => router.push('/(auth)/link-broker')}
            style={styles.connectButton}
          />
          <Button
            title="Open Settings"
            variant="ghost"
            onPress={() => router.push('/(tabs)/settings')}
            style={styles.secondaryButton}
           />
         </View>
       </SafeAreaView>
     );
   }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Portfolio</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.syncButton}>
            <Text style={styles.syncText}>Sync</Text>
          </Pressable>
          <Pressable style={styles.settingsButtonInline} onPress={() => router.push('/(tabs)/settings')}>
            <Text style={styles.settingsText}>Settings</Text>
          </Pressable>
        </View>
      </View>

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
        <Card style={styles.statusCard}>
          <Text style={styles.statusTitle}>Broker connected: {brokerName || 'Broker'}</Text>
          <Text style={styles.statusText}>Portfolio synced. Charts and insights are active.</Text>
        </Card>

        <View style={styles.chartContainer}>
          <DonutChart
            data={mockChartData}
            todayChangePct={totalTodayChange}
            onSegmentPress={handleSegmentPress}
            size={chartSize}
          />
        </View>

        {!!selectedSegment && (
          <Card style={styles.segmentCard}>
            <Text style={styles.segmentTitle}>{selectedSegment.ticker}</Text>
            <Text style={styles.segmentText}>{selectedSegment.allocationPct}% allocation</Text>
          </Card>
        )}

        <Card style={styles.holdingsCard}>
          <View style={styles.holdingsHeader}>
            <Text style={styles.holdingsTitle}>Holdings</Text>
            <Text style={styles.holdingsCount}>{mockHoldings.length} stocks</Text>
          </View>
          {mockHoldings.map((holding, index) => (
            <HoldingRow
              key={holding.id}
              holding={holding}
              showDivider={index < mockHoldings.length - 1}
              onPress={() => {}}
            />
          ))}
        </Card>
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
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  headerActions: {
    position: 'absolute',
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  syncButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  syncText: {
    ...typography.smallMd,
    color: colors.teal,
  },
  settingsButton: {
    position: 'absolute',
    right: spacing.md,
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  settingsText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  settingsButtonInline: {
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing.xxl,
  },
  statusCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  statusTitle: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  statusText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
    width: '100%',
    backgroundColor: colors.white,
    marginTop: spacing.md,
  },
  segmentCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  segmentTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  segmentText: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  holdingsCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  holdingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  holdingsTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  holdingsCount: {
    ...typography.small,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.purpleLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyEmoji: {
    fontSize: 38,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptyDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  connectButton: {
    minWidth: 220,
  },
  secondaryButton: {
    marginTop: spacing.sm,
  },
});
