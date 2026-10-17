import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card, PnlPill, Button } from '@/components/ui';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { useAppSettingsStore } from '@/stores';

const mockMetrics = [
  { label: 'Total Value', value: '₹5,42,890', change: 2.4 },
  { label: 'Today\'s P&L', value: '₹2,156', change: 0.4 },
  { label: 'All-time Returns', value: '₹1,23,450', change: 29.5 },
];

const mockPerformanceData = {
  '1D': [100, 100.4, 99.9, 100.7, 100.2, 100.9, 101.1, 100.8].map((v, i) => ({
    date: new Date(Date.now() - (7 - i) * 60 * 60 * 1000).toISOString(),
    value: 542890 * (v / 100),
  })),
  '1W': [96, 97, 96.2, 98, 99.1, 98.6, 100].map((v, i) => ({
    date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
    value: 542890 * (v / 100),
  })),
  '1M': [89, 90.5, 91, 92.1, 93.4, 92.2, 94.8, 95.1, 97.4, 98.8, 99.2, 100].map((v, i) => ({
    date: new Date(Date.now() - (11 - i) * 3 * 24 * 60 * 60 * 1000).toISOString(),
    value: 542890 * (v / 100),
  })),
  '3M': [80, 82, 83.2, 85.1, 84.9, 88, 89.5, 92.1, 93.6, 95.2, 97.8, 100].map((v, i) => ({
    date: new Date(Date.now() - (11 - i) * 8 * 24 * 60 * 60 * 1000).toISOString(),
    value: 542890 * (v / 100),
  })),
  '1Y': [62, 65, 68, 70, 73, 76, 80, 84, 88, 92, 96, 100].map((v, i) => ({
    date: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toISOString(),
    value: 542890 * (v / 100),
  })),
  ALL: [41, 46, 51, 56, 61, 66, 70, 77, 83, 90, 95, 100].map((v, i) => ({
    date: new Date(Date.now() - (11 - i) * 90 * 24 * 60 * 60 * 1000).toISOString(),
    value: 542890 * (v / 100),
  })),
};

const sectionRows = {
  returns: [
    { label: 'Capital Gains', value: '₹95,420 (77%)' },
    { label: 'Dividends', value: '₹18,850 (15%)' },
    { label: 'FX/Other', value: '₹9,180 (8%)' },
  ],
  sectors: [
    { label: 'Financials', value: '31%' },
    { label: 'Technology', value: '25%' },
    { label: 'Consumer', value: '18%' },
    { label: 'Energy', value: '14%' },
    { label: 'Healthcare', value: '12%' },
  ],
  allocation: [
    { label: 'Equity', value: '78%' },
    { label: 'Cash', value: '8%' },
    { label: 'ETF', value: '9%' },
    { label: 'REIT', value: '5%' },
  ],
};

export default function InsightsScreen() {
  const { brokerConnected, portfolioGoal, dividendGoalMonthly } = useAppSettingsStore();
  const portfolioProgress = Math.min(100, (542890 / Math.max(portfolioGoal, 1)) * 100);
  const dividendProgress = Math.min(100, (1480 / Math.max(dividendGoalMonthly, 1)) * 100);

  if (!brokerConnected) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Insights</Text>
          <Pressable style={styles.settingsPill} onPress={() => router.push('/(tabs)/settings')}>
            <Text style={styles.settingsPillText}>Settings</Text>
          </Pressable>
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📉</Text>
          <Text style={styles.emptyTitle}>Insights locked</Text>
          <Text style={styles.emptyDescription}>
            Connect a brokerage account to generate performance and portfolio insights.
          </Text>
          <Button title="Connect Broker" onPress={() => router.push('/(auth)/link-broker')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Insights</Text>
        <Pressable style={styles.settingsPill} onPress={() => router.push('/(tabs)/settings')}>
          <Text style={styles.settingsPillText}>Settings</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.metricsContainer}>
          {mockMetrics.map((metric) => (
            <Card key={metric.label} style={styles.metricCard}>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <PnlPill value={metric.change} size="sm" />
            </Card>
          ))}
        </View>

        <Card style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.cardTitle}>Portfolio Goal</Text>
            <Text style={styles.goalPct}>{portfolioProgress.toFixed(1)}%</Text>
          </View>
          <Text style={styles.goalText}>Target: ₹{portfolioGoal.toLocaleString('en-IN')}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${portfolioProgress}%` }]} />
          </View>
        </Card>

        <Card style={styles.chartCard}>
          <Text style={styles.cardTitle}>Performance</Text>
          <PerformanceChart data={mockPerformanceData} currentValue={542890} />
        </Card>

        <SectionCard title="Returns Breakdown" rows={sectionRows.returns} />
        <SectionCard title="Sectors" rows={sectionRows.sectors} />
        <SectionCard title="Portfolio Allocation" rows={sectionRows.allocation} />

        <Card style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Dividend Overview</Text>
          <Row label="Yield" value="3.12%" />
          <Row label="Annual Dividends" value="₹18,850" divider />
          <Row label="Payout Growth (1Y)" value="+8.6%" divider />
        </Card>

        <Card style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.cardTitle}>Dividend Goal</Text>
            <Text style={styles.goalPct}>{dividendProgress.toFixed(1)}%</Text>
          </View>
          <Text style={styles.goalText}>Target: ₹{dividendGoalMonthly.toLocaleString('en-IN')}/month</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${dividendProgress}%` }]} />
          </View>
        </Card>

        <SectionCard
          title="Monthly Dividends"
          rows={[
            { label: 'Average', value: '₹1,480' },
            { label: 'Best Month', value: '₹2,140' },
            { label: 'Last Month', value: '₹1,620' },
          ]}
        />

        <SectionCard
          title="Dividend Forecast"
          rows={[
            { label: 'Next 30 Days', value: '₹1,760' },
            { label: 'Next 90 Days', value: '₹5,040' },
            { label: 'Next 12 Months', value: '₹21,300' },
          ]}
        />

        <SectionCard
          title="Dividend Allocation"
          rows={[
            { label: 'Monthly Payers', value: '42%' },
            { label: 'Quarterly Payers', value: '38%' },
            { label: 'Semi-Annual', value: '20%' },
          ]}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionCard({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  return (
    <Card style={styles.sectionCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      {rows.map((item, index) => (
        <Row key={item.label} label={item.label} value={item.value} divider={index > 0} />
      ))}
    </Card>
  );
}

function Row({ label, value, divider = false }: { label: string; value: string; divider?: boolean }) {
  return (
    <View style={[styles.row, divider && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
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
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  settingsPill: {
    position: 'absolute',
    right: spacing.md,
    backgroundColor: colors.offWhite,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.md,
  },
  settingsPillText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    padding: spacing.sm,
    alignItems: 'center',
  },
  metricLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  metricValue: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  cardTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  chartCard: {
    paddingHorizontal: 0,
    paddingVertical: spacing.md,
    overflow: 'hidden',
  },
  goalCard: {
    padding: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalPct: {
    ...typography.bodyMd,
    color: colors.teal,
    fontWeight: '700',
  },
  goalText: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  progressTrack: {
    height: 10,
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.teal,
  },
  sectionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowDivider: {
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  rowValue: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
