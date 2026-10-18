import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography } from '@/constants';
import { Card } from '@/components/ui';
import { ToolScreen, SymbolPicker, Segmented, StatGrid, StatTile, LoadingBlock, ErrorBlock } from '@/components/screener';
import { LineChart } from '@/components/charts';
import { useIvHistory } from '@/hooks/useMarketData';
import { ivPct, shortDate } from '@/utils';

type Range = '1M' | '3M' | '6M' | '1Y';
const RANGE_DAYS: Record<Range, number> = { '1M': 22, '3M': 66, '6M': 130, '1Y': 260 };

export default function IvChartScreen() {
  const params = useLocalSearchParams<{ symbol?: string }>();
  const [symbol, setSymbol] = useState((params.symbol ?? 'NIFTY').toUpperCase());
  const [range, setRange] = useState<Range>('3M');
  const { data, isLoading, isError, error, refetch, isRefetching } = useIvHistory(symbol);
  const points = data?.points.slice(-RANGE_DAYS[range]) ?? [];
  const st = data?.stats;
  return (
    <ToolScreen title="IV Chart" subtitle="At-the-money implied volatility, near expiry" refreshing={isRefetching} onRefresh={refetch} disclaimerExtra="IV is computed with Black–Scholes from EOD settlement prices (all NSE options are European-style).">
      <SymbolPicker value={symbol} onChange={setSymbol} />
      <View style={styles.rangeRow}><Segmented options={(['1M', '3M', '6M', '1Y'] as Range[]).map((r) => ({ label: r, value: r }))} value={range} onChange={setRange} /></View>
      {isLoading ? <LoadingBlock rows={1} height={220} /> : isError || !data || !st ? <ErrorBlock error={error} onRetry={refetch} /> : (
        <>
          <Card style={styles.card} padding="sm" variant="outlined">
            <Text style={styles.chartTitle}>{symbol} ATM IV · {shortDate(points[0]?.date ?? '')} → {shortDate(points[points.length - 1]?.date ?? '')}</Text>
            <LineChart series={[{ id: 'iv', color: colors.indigo, data: points.map((p) => p.atmIv * 100), area: true }]} labels={points.map((p) => shortDate(p.date))} yFormat={(v) => `${v.toFixed(0)}%`} height={220} />
          </Card>
          <StatGrid>
            <StatTile label="ATM IV" value={ivPct(st.current)} tone="gold" />
            <StatTile label="IV Rank" value={st.rank == null ? '—' : st.rank.toFixed(0)} sub="of 52w range" tone={st.rank != null && st.rank > 60 ? 'loss' : st.rank != null && st.rank < 30 ? 'gain' : 'neutral'} />
            <StatTile label="IV %ile" value={st.percentile == null ? '—' : st.percentile.toFixed(0)} sub="days below" />
            <StatTile label="52w low" value={ivPct(st.min)} />
            <StatTile label="52w high" value={ivPct(st.max)} />
            <StatTile label="Δ 1D / 30D" value={`${fmt(st.change1d)} / ${fmt(st.change30d)}`} sub="vol points" />
          </StatGrid>
          <Text style={styles.help}>High IV rank favours premium selling; low rank favours buying. Rank uses the 52-week high/low; percentile counts the days below today&apos;s level.</Text>
        </>
      )}
    </ToolScreen>
  );
}

const fmt = (v: number | null) => (v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}`);

const styles = StyleSheet.create({
  rangeRow: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  card: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  chartTitle: { ...typography.small, color: colors.textSecondary, marginBottom: spacing.xs },
  help: { ...typography.small, color: colors.textTertiary, paddingHorizontal: spacing.md, lineHeight: 18 },
});
