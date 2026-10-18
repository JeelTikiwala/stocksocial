import React from 'react';
import { StyleSheet, View, Text, useWindowDimensions, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography } from '@/constants';
import { Card } from '@/components/ui';
import { ToolScreen, LoadingBlock, ErrorBlock } from '@/components/screener';
import { Treemap, TreemapLegend } from '@/components/charts';
import { useHeatmap } from '@/hooks/useMarketData';
import { signedPct } from '@/utils';

export default function HeatmapScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useHeatmap();
  const { height } = useWindowDimensions();
  const mapHeight = Math.max(300, Math.min(height - 360, 560));
  return (
    <ToolScreen title="Sector Heatmap" subtitle="Sized by futures turnover, coloured by day change" refreshing={isRefetching} onRefresh={refetch} disclaimerExtra="Tile size uses futures notional turnover as a liquidity proxy; NSE bhavcopy carries no market-cap field.">
      {isLoading ? <LoadingBlock rows={1} height={320} /> : isError || !data ? <ErrorBlock error={error} onRetry={refetch} /> : (
        <>
          <Card style={styles.card} padding="xs" variant="outlined">
            <Treemap
              height={mapHeight}
              groups={data.sectors.map((s) => ({ key: s.sector, label: s.sector, weight: s.weight, value: s.changePct, items: s.items.map((i) => ({ key: i.symbol, label: i.symbol, weight: i.weight, value: i.changePct, sub: i.name })) }))}
              onPressLeaf={(l) => router.push(`/stock/${l.key}` as never)}
            />
          </Card>
          <View style={styles.legendRow}>
            <Text style={styles.legendText}>−3%</Text>
            <TreemapLegend />
            <Text style={styles.legendText}>+3%</Text>
          </View>
          <View style={styles.list}>
            {data.sectors.map((s) => (
              <Pressable key={s.sector} onPress={() => router.push('/tools/sector-scope' as never)} style={styles.row}>
                <Text style={styles.sector}>{s.sector}</Text>
                <Text style={styles.count}>{s.items.length} stocks</Text>
                <Text style={[styles.pct, { color: s.changePct >= 0 ? colors.gain : colors.loss }]}>{signedPct(s.changePct)}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </ToolScreen>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md },
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginVertical: spacing.sm },
  legendText: { ...typography.small, color: colors.textTertiary },
  list: { marginHorizontal: spacing.md, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: spacing.xs },
  sector: { ...typography.bodyMd, color: colors.textPrimary, flex: 1 },
  count: { ...typography.small, color: colors.textTertiary },
  pct: { ...typography.smallMd, width: 64, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
