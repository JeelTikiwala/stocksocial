import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { borderRadius, colors, spacing, typography } from '@/constants';

const holdings = [
  { ticker: 'RELIANCE', name: 'Reliance Industries', value: '₹2,46,820', allocation: 32, change: 1.42, color: colors.chart[0] },
  { ticker: 'HDFCBANK', name: 'HDFC Bank', value: '₹1,89,420', allocation: 25, change: 0.68, color: colors.chart[1] },
  { ticker: 'TCS', name: 'Tata Consultancy Services', value: '₹1,53,610', allocation: 20, change: -0.31, color: colors.chart[2] },
  { ticker: 'INFY', name: 'Infosys', value: '₹1,01,480', allocation: 13, change: 1.08, color: colors.chart[3] },
];

export default function PortfolioScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>YOUR MONEY</Text>
        <Text style={styles.title}>Portfolio</Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>TOTAL VALUE</Text>
          <Text style={styles.balance}>₹7,68,430</Text>
          <View style={styles.dailyRow}>
            <Text style={styles.dailyGain}>+₹5,842 · 0.77%</Text>
            <Text style={styles.today}>today</Text>
          </View>
          <View style={styles.allocationBar}>
            {holdings.map((holding) => <View key={holding.ticker} style={{ flex: holding.allocation, backgroundColor: holding.color }} />)}
            <View style={{ flex: 10, backgroundColor: colors.chartOther }} />
          </View>
          <View style={styles.summaryRow}>
            <View><Text style={styles.summaryLabel}>INVESTED</Text><Text style={styles.summaryValue}>₹6,42,000</Text></View>
            <View><Text style={styles.summaryLabel}>ALL-TIME RETURN</Text><Text style={[styles.summaryValue, { color: colors.gain }]}>+19.69%</Text></View>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Holdings</Text>
          <Text style={styles.sectionMeta}>{holdings.length} assets</Text>
        </View>
        <View style={styles.list}>
          {holdings.map((holding, index) => (
            <Pressable key={holding.ticker} style={[styles.row, index < holdings.length - 1 && styles.rowBorder]} onPress={() => router.push(`/stock/${holding.ticker}`)}>
              <View style={[styles.dot, { backgroundColor: holding.color }]} />
              <View style={styles.stockCopy}>
                <Text style={styles.ticker}>{holding.ticker}</Text>
                <Text style={styles.company} numberOfLines={1}>{holding.name}</Text>
              </View>
              <View style={styles.valueCopy}>
                <Text style={styles.value}>{holding.value}</Text>
                <Text style={[styles.change, { color: holding.change >= 0 ? colors.gain : colors.loss }]}>{holding.change > 0 ? '+' : ''}{holding.change.toFixed(2)}%</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.connect} onPress={() => router.push('/(auth)/link-broker')}>
          <Text style={styles.connectTitle}>Keep your portfolio current</Text>
          <Text style={styles.connectCopy}>Connect a broker to sync holdings automatically.</Text>
          <Text style={styles.connectAction}>Connect broker →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.offWhite },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxxl },
  eyebrow: { ...typography.label, color: colors.teal, marginTop: spacing.md },
  title: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.xxs },
  balanceCard: { backgroundColor: colors.indigo, borderRadius: borderRadius.xl, padding: spacing.xl, marginTop: spacing.lg },
  balanceLabel: { ...typography.label, color: '#AFC5C2' },
  balance: { fontSize: 34, lineHeight: 42, fontWeight: '700', color: colors.white, letterSpacing: -0.7, marginTop: spacing.xs },
  dailyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  dailyGain: { ...typography.smallMd, color: '#8BE0BA', fontWeight: '700' },
  today: { ...typography.small, color: '#AFC5C2' },
  allocationBar: { height: 8, borderRadius: 4, overflow: 'hidden', flexDirection: 'row', marginTop: spacing.xl },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  summaryLabel: { ...typography.label, color: '#AFC5C2' },
  summaryValue: { ...typography.bodyMd, color: colors.white, fontWeight: '700', marginTop: spacing.xxs },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  sectionMeta: { ...typography.small, color: colors.textTertiary },
  list: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  dot: { width: 10, height: 10, borderRadius: 5 },
  stockCopy: { flex: 1, marginLeft: spacing.sm },
  ticker: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '700' },
  company: { ...typography.small, color: colors.textTertiary, marginTop: 2 },
  valueCopy: { alignItems: 'flex-end' },
  value: { ...typography.smallMd, color: colors.textPrimary, fontWeight: '600' },
  change: { ...typography.smallMd, fontWeight: '700', marginTop: 3 },
  connect: { marginTop: spacing.lg, padding: spacing.lg, backgroundColor: colors.tealLight, borderRadius: borderRadius.lg },
  connectTitle: { ...typography.h4, color: colors.textPrimary },
  connectCopy: { ...typography.small, color: colors.textSecondary, marginTop: spacing.xxs },
  connectAction: { ...typography.smallMd, color: colors.teal, fontWeight: '700', marginTop: spacing.md },
});
