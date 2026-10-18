import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography } from '@/constants';
import { Card } from '@/components/ui';
import { ToolScreen, SymbolPicker, StatGrid, StatTile, LoadingBlock, ErrorBlock } from '@/components/screener';
import { LineChart } from '@/components/charts';
import { useStraddleHistory } from '@/hooks/useMarketData';
import { shortDate, price } from '@/utils';

export default function StraddleScreen() {
  const params = useLocalSearchParams<{ symbol?: string }>();
  const [symbol, setSymbol] = useState((params.symbol ?? 'NIFTY').toUpperCase());
  const { data, isLoading, isError, error, refetch, isRefetching } = useStraddleHistory(symbol);
  const pts = data?.points ?? [];
  const last = pts[pts.length - 1];
  return (
    <ToolScreen title="Straddle Chart" subtitle="ATM call + put premium into expiry" refreshing={isRefetching} onRefresh={refetch} disclaimerExtra="Weekly contracts exist only on NIFTY (Tuesday); other underlyings are monthly.">
      <SymbolPicker value={symbol} onChange={setSymbol} />
      {isLoading ? <LoadingBlock rows={1} height={220} /> : isError || !data || !last ? <ErrorBlock error={error} onRetry={refetch} /> : (
        <>
          <Card style={styles.card} padding="sm" variant="outlined">
            <Text style={styles.chartTitle}>{symbol} · expiry {shortDate(last.expiry)} · ATM straddle (₹)</Text>
            <LineChart series={[{ id: 's', color: colors.gold, data: pts.map((p) => p.straddlePrice), area: true }]} labels={pts.map((p) => shortDate(p.date))} yFormat={(v) => v.toFixed(0)} height={220} />
          </Card>
          <StatGrid>
            <StatTile label="Straddle" value={`₹${last.straddlePrice.toFixed(1)}`} tone="gold" />
            <StatTile label="ATM strike" value={String(last.atmStrike)} sub={`spot ${price(last.spot)}`} />
            <StatTile label="Implied move" value={`±${((last.straddlePrice / last.spot) * 100).toFixed(2)}%`} sub="straddle ÷ spot" />
            <StatTile label="Days to expiry" value={String(last.daysToExpiry)} />
            <StatTile label="Change" value={pts.length > 1 ? `${((last.straddlePrice / pts[pts.length - 2].straddlePrice - 1) * 100).toFixed(1)}%` : '—'} tone={pts.length > 1 && last.straddlePrice < pts[pts.length - 2].straddlePrice ? 'gain' : 'loss'} sub="vs prior day" />
          </StatGrid>
          <Card style={styles.card} padding="sm" variant="outlined">
            <View style={styles.row}><Text style={[styles.cell, styles.head]}>Date</Text><Text style={[styles.cell, styles.head]}>Spot</Text><Text style={[styles.cell, styles.head]}>ATM</Text><Text style={[styles.cell, styles.head]}>Straddle</Text><Text style={[styles.cell, styles.head]}>DTE</Text></View>
            {[...pts].reverse().slice(0, 12).map((p) => (
              <View key={p.date} style={styles.row}>
                <Text style={styles.cell}>{shortDate(p.date)}</Text><Text style={styles.cell}>{price(p.spot)}</Text><Text style={styles.cell}>{p.atmStrike}</Text><Text style={[styles.cell, { color: colors.textPrimary }]}>{p.straddlePrice.toFixed(1)}</Text><Text style={styles.cell}>{p.daysToExpiry}</Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </ToolScreen>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  chartTitle: { ...typography.small, color: colors.textSecondary, marginBottom: spacing.xs },
  row: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  cell: { flex: 1, ...typography.small, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  head: { ...typography.label, color: colors.textTertiary },
});
