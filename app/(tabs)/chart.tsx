import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, typography } from '@/constants';
import { Card } from '@/components/ui';
import { AsOfBanner, SymbolPicker, Segmented, StatGrid, StatTile, LoadingBlock, ErrorBlock, Disclaimer } from '@/components/screener';
import { LineChart } from '@/components/charts';
import { useUnderlying, useIvHistory, useStraddleHistory } from '@/hooks/useMarketData';
import { useLiveQuote } from '@/hooks/useLive';
import { price, signedPct, shortDate, ivPct, compactIndian } from '@/utils';

type Series = 'price' | 'iv' | 'straddle';
type Range = '1M' | '3M' | '6M';
const RANGE_N: Record<Range, number> = { '1M': 22, '3M': 60, '6M': 130 };

export default function ChartScreen() {
  const [symbol, setSymbol] = useState('NIFTY');
  const [series, setSeries] = useState<Series>('price');
  const [range, setRange] = useState<Range>('3M');
  const u = useUnderlying(symbol);
  const iv = useIvHistory(symbol);
  const st = useStraddleHistory(symbol);
  const live = useLiveQuote(symbol);
  const n = RANGE_N[range];
  const hist = u.data?.history.slice(-n) ?? [];
  const ltp = live?.ltp ?? u.data?.underlying.close ?? 0;
  const chg = live?.changePct ?? (u.data ? ((u.data.underlying.close - u.data.underlying.prevClose) / u.data.underlying.prevClose) * 100 : 0);
  const maxVol = Math.max(1, ...hist.map((h) => h.volume));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}><Text style={styles.title}>Chart</Text></View>
        <AsOfBanner compact />
        <SymbolPicker value={symbol} onChange={setSymbol} />
        <View style={styles.controls}>
          <Segmented options={[{ label: 'Price', value: 'price' as Series }, { label: 'IV', value: 'iv' as Series }, { label: 'Straddle', value: 'straddle' as Series }]} value={series} onChange={setSeries} />
          {series !== 'straddle' && <Segmented options={(['1M', '3M', '6M'] as Range[]).map((r) => ({ label: r, value: r }))} value={range} onChange={setRange} />}
        </View>

        {u.isLoading ? <LoadingBlock rows={1} height={260} /> : u.isError || !u.data ? <ErrorBlock error={u.error} onRetry={u.refetch} /> : (
          <>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{price(ltp)}</Text>
              <Text style={[styles.change, { color: chg >= 0 ? colors.gain : colors.loss }]}>{signedPct(chg)}</Text>
              {live && <Text style={styles.liveTag}>● live</Text>}
              <Text style={styles.meta}>{u.data.meta?.name} · lot {u.data.meta?.lotSize}</Text>
            </View>
            <Card style={styles.card} padding="sm" variant="elevated">
              {series === 'price' && (
                <>
                  <Text style={styles.chartTitle}>Close · last {hist.length} sessions</Text>
                  <LineChart series={[{ id: 'px', color: chg >= 0 ? colors.gain : colors.loss, data: hist.map((h) => h.close), area: true }]} labels={hist.map((h) => shortDate(h.date))} yFormat={(v) => price(v)} height={230} />
                  <Text style={[styles.chartTitle, { marginTop: spacing.sm }]}>Futures volume</Text>
                  <View style={styles.volRow}>
                    {hist.map((h) => <View key={h.date} style={[styles.volBar, { height: Math.max(2, (h.volume / maxVol) * 40), backgroundColor: colors.indigo, opacity: 0.55 }]} />)}
                  </View>
                </>
              )}
              {series === 'iv' && (iv.data ? (
                <>
                  <Text style={styles.chartTitle}>ATM implied volatility · last {Math.min(n, iv.data.points.length)} sessions</Text>
                  <LineChart series={[{ id: 'iv', color: colors.indigo, data: iv.data.points.slice(-n).map((p) => p.atmIv * 100), area: true }]} labels={iv.data.points.slice(-n).map((p) => shortDate(p.date))} yFormat={(v) => `${v.toFixed(0)}%`} height={230} />
                </>
              ) : <LoadingBlock rows={1} height={230} />)}
              {series === 'straddle' && (st.data ? (
                <>
                  <Text style={styles.chartTitle}>ATM straddle (₹) · expiry {st.data.points.at(-1) ? shortDate(st.data.points.at(-1)!.expiry) : ''}</Text>
                  <LineChart series={[{ id: 's', color: colors.gold, data: st.data.points.map((p) => p.straddlePrice), area: true }]} labels={st.data.points.map((p) => shortDate(p.date))} yFormat={(v) => v.toFixed(0)} height={230} />
                </>
              ) : <LoadingBlock rows={1} height={230} />)}
            </Card>
            <StatGrid>
              <StatTile label="Fut volume" value={compactIndian(u.data.underlying.futVolume)} sub={u.data.underlying.futVolumeAvg20 ? `${(u.data.underlying.futVolume / u.data.underlying.futVolumeAvg20).toFixed(1)}x avg` : undefined} />
              <StatTile label="ATM IV" value={ivPct(u.data.ivStats.current)} sub={u.data.ivStats.rank == null ? undefined : `rank ${u.data.ivStats.rank.toFixed(0)}`} tone="gold" />
              {u.data.nearChain && <StatTile label="PCR · max pain" value={`${u.data.nearChain.totals.pcrOi.toFixed(2)} · ${u.data.nearChain.totals.maxPainStrike ?? '—'}`} sub={`ATM ${u.data.nearChain.atmStrike}`} />}
            </StatGrid>
            <View style={styles.links}>
              {[['Options chain', `/tools/options-chain?symbol=${symbol}`], ['Strike Open', `/tools/strike-open?symbol=${symbol}`], ['Strategy', `/tools/strategy?symbol=${symbol}`], ['Detail', `/stock/${symbol}`]].map(([l, r]) => (
                <Pressable key={l} onPress={() => router.push(r as never)} style={styles.link}><Text style={styles.linkText}>{l}</Text></Pressable>
              ))}
            </View>
          </>
        )}
        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: spacing.tabBar },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs },
  title: { ...typography.h1, color: colors.textPrimary },
  controls: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, marginBottom: spacing.sm, flexWrap: 'wrap' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, paddingHorizontal: spacing.md, marginBottom: spacing.xs, flexWrap: 'wrap' },
  price: { ...typography.h1, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  change: { ...typography.h4 },
  liveTag: { ...typography.small, color: colors.gain, fontWeight: '700' },
  meta: { ...typography.small, color: colors.textTertiary, marginLeft: 'auto' },
  card: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  chartTitle: { ...typography.small, color: colors.textSecondary, marginBottom: spacing.xs },
  volRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 1, height: 42 },
  volBar: { flex: 1, borderRadius: 1 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.md },
  link: { paddingHorizontal: spacing.sm, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.indigoLight },
  linkText: { ...typography.smallMd, color: colors.indigo },
});
