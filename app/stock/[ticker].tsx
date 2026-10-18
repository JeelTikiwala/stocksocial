import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card, SectionHeader, ChevronRightIcon } from '@/components/ui';
import { ToolScreen, StatGrid, StatTile, LoadingBlock, ErrorBlock } from '@/components/screener';
import { LineChart } from '@/components/charts';
import { useUnderlying } from '@/hooks/useMarketData';
import { useLiveQuote } from '@/hooks/useLive';
import { interpretOi } from '@/backend/src/shared';
import { price, signedPct, compactIndian, ivPct, shortDate, expiryLabel } from '@/utils';

export default function UnderlyingScreen() {
  const { ticker } = useLocalSearchParams<{ ticker: string }>();
  const symbol = (ticker ?? '').toUpperCase();
  const { data, isLoading, isError, error, refetch, isRefetching } = useUnderlying(symbol);
  const u = data?.underlying;
  const live = useLiveQuote(symbol);
  const shownPrice = live?.ltp ?? u?.close ?? 0;
  const chg = live?.changePct ?? (u ? ((u.close - u.prevClose) / u.prevClose) * 100 : 0);
  const futChg = data?.futures.reduce((a, f) => a + f.chgOi, 0) ?? 0;
  const tools = [
    { label: 'Options chain', route: `/tools/options-chain?symbol=${symbol}` },
    { label: 'Strike Open (OI by strike)', route: `/tools/strike-open?symbol=${symbol}` },
    { label: 'IV chart', route: `/tools/iv-chart?symbol=${symbol}` },
    { label: 'Straddle chart', route: `/tools/straddle?symbol=${symbol}` },
    { label: 'Strategy builder', route: `/tools/strategy?symbol=${symbol}` },
    { label: 'Margin calculator', route: `/tools/margin?symbol=${symbol}` },
  ];

  return (
    <ToolScreen title={symbol} subtitle={data?.meta ? `${data.meta.name} · ${data.meta.sector} · lot ${data.meta.lotSize}` : undefined} refreshing={isRefetching} onRefresh={refetch}>
      {isLoading ? <LoadingBlock rows={4} /> : isError || !data || !u ? <ErrorBlock error={error} onRetry={refetch} /> : (
        <>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{price(shownPrice)}</Text>
            <Text style={[styles.change, { color: chg >= 0 ? colors.gain : colors.loss }]}>{signedPct(chg)}</Text>
            {live && <Text style={{ ...typography.small, color: colors.gain, fontWeight: '700' }}>● live</Text>}
            <View style={[styles.pill, { backgroundColor: chg >= 0 && futChg > 0 ? colors.gainBg : chg < 0 && futChg > 0 ? colors.lossBg : colors.offWhite }]}>
              <Text style={styles.pillText}>{interpretOi(u.close - u.prevClose, futChg)}</Text>
            </View>
          </View>
          <Card style={styles.card} padding="sm" variant="outlined">
            <Text style={styles.chartTitle}>Last {data.history.length} sessions · close</Text>
            <LineChart series={[{ id: 'px', color: chg >= 0 ? colors.gain : colors.loss, data: data.history.map((h) => h.close), area: true }]} labels={data.history.map((h) => shortDate(h.date))} yFormat={(v) => price(v)} height={180} />
          </Card>
          <StatGrid>
            <StatTile label="Fut volume" value={compactIndian(u.futVolume)} sub={u.futVolumeAvg20 ? `avg ${compactIndian(u.futVolumeAvg20)} · ${(u.futVolume / u.futVolumeAvg20).toFixed(1)}x` : undefined} />
            <StatTile label="Fut ΔOI" value={(futChg > 0 ? '+' : '') + compactIndian(futChg)} tone={futChg > 0 ? 'gain' : futChg < 0 ? 'loss' : 'neutral'} />
            <StatTile label="ATM IV" value={ivPct(data.ivStats.current)} sub={data.ivStats.rank == null ? undefined : `rank ${data.ivStats.rank.toFixed(0)} · %ile ${data.ivStats.percentile?.toFixed(0)}`} tone="gold" />
            {data.nearChain && (
              <>
                <StatTile label="PCR (near)" value={data.nearChain.totals.pcrOi.toFixed(2)} sub={expiryLabel(data.nearChain.expiry)} />
                <StatTile label="Max pain" value={String(data.nearChain.totals.maxPainStrike ?? '—')} sub={`ATM ${data.nearChain.atmStrike}`} />
                <StatTile label="Call / Put OI" value={`${compactIndian(data.nearChain.totals.callOi)} / ${compactIndian(data.nearChain.totals.putOi)}`} />
              </>
            )}
          </StatGrid>

          {data.futures.length > 0 && (
            <>
              <SectionHeader title="Futures" />
              <Card style={styles.card} padding="sm" variant="outlined">
                <View style={styles.row}><Text style={[styles.cell, styles.head]}>Expiry</Text><Text style={[styles.cell, styles.head]}>Close</Text><Text style={[styles.cell, styles.head]}>Basis</Text><Text style={[styles.cell, styles.head]}>OI</Text><Text style={[styles.cell, styles.head]}>ΔOI</Text></View>
                {data.futures.map((f) => (
                  <View key={f.expiry} style={styles.row}>
                    <Text style={styles.cell}>{expiryLabel(f.expiry)}</Text>
                    <Text style={[styles.cell, { color: colors.textPrimary }]}>{price(f.close)}</Text>
                    <Text style={styles.cell}>{(f.close - u.close).toFixed(1)}</Text>
                    <Text style={styles.cell}>{compactIndian(f.oi)}</Text>
                    <Text style={[styles.cell, { color: f.chgOi > 0 ? colors.gain : f.chgOi < 0 ? colors.loss : colors.textSecondary }]}>{(f.chgOi > 0 ? '+' : '') + compactIndian(f.chgOi)}</Text>
                  </View>
                ))}
              </Card>
            </>
          )}

          <SectionHeader title="Tools" />
          <Card style={styles.card} padding="xs" variant="outlined">
            {tools.map((t, i) => (
              <Pressable key={t.route} onPress={() => router.push(t.route as never)} style={[styles.tool, i < tools.length - 1 && styles.toolBorder]}>
                <Text style={styles.toolText}>{t.label}</Text>
                <ChevronRightIcon size={18} color={colors.textTertiary} />
              </Pressable>
            ))}
          </Card>
        </>
      )}
    </ToolScreen>
  );
}

const styles = StyleSheet.create({
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  price: { ...typography.h1, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  change: { ...typography.h4 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full, marginLeft: 'auto' },
  pillText: { fontSize: 11, fontWeight: '600', color: colors.textPrimary },
  card: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  chartTitle: { ...typography.small, color: colors.textSecondary, marginBottom: spacing.xs },
  row: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  cell: { flex: 1, ...typography.small, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  head: { ...typography.label, color: colors.textTertiary },
  tool: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm, paddingVertical: 12 },
  toolBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  toolText: { ...typography.bodyMd, color: colors.textPrimary },
});
