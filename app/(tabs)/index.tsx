import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card, PlusIcon, XIcon, ChevronRightIcon } from '@/components/ui';
import { MiniSparkline } from '@/components/charts';
import { AsOfBanner, LoadingBlock, ErrorBlock, Disclaimer } from '@/components/screener';
import { Cell } from '@/components/screener/ResultsTable';
import { AddSymbolModal } from '@/components/watchlist/AddSymbolModal';
import { useMarketPulse, useWatchlistRows } from '@/hooks/useMarketData';
import { useLiveQuotes } from '@/hooks/useLive';
import { useWatchlistStore } from '@/stores';
import { price, signedPct, ivPct } from '@/utils';

const INDICES = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];

export default function WatchlistScreen() {
  const tickers = useWatchlistStore((s) => s.tickers);
  const toggle = useWatchlistStore((s) => s.toggleTicker);
  const remove = useWatchlistStore((s) => s.removeTicker);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const rows = useWatchlistRows(tickers);
  const pulse = useMarketPulse();
  const quotes = useLiveQuotes(useMemo(() => Array.from(new Set([...INDICES, ...tickers])), [tickers]));
  const stripRows = useWatchlistRows(INDICES);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={rows.isRefetching} onRefresh={() => { rows.refetch(); pulse.refetch(); }} />}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Delta</Text>
            <Text style={styles.sub}>Watchlist</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={() => setEditing((e) => !e)} style={styles.actionBtn}><Text style={styles.actionText}>{editing ? 'Done' : 'Edit'}</Text></Pressable>
            <Pressable onPress={() => setAdding(true)} style={[styles.actionBtn, styles.actionPrimary]} accessibilityLabel="Add symbol"><PlusIcon size={18} color={colors.white} /></Pressable>
          </View>
        </View>
        <AsOfBanner />

        {/* Index strip (live when available) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
          {(stripRows.data ?? []).map((r) => {
            const q = quotes[r.symbol];
            const ltp = q?.ltp ?? r.close;
            const chg = q?.changePct ?? r.changePct;
            return (
              <Card key={r.symbol} onPress={() => router.push(`/stock/${r.symbol}` as never)} style={styles.indexCard} padding="sm" variant="outlined">
                <Text style={styles.indexName}>{r.symbol}</Text>
                <Text style={styles.indexValue}>{price(ltp)}</Text>
                <Text style={[styles.indexChange, { color: chg >= 0 ? colors.gain : colors.loss }]}>{signedPct(chg)}{q ? ' ·' : ''}{q ? <Text style={{ color: colors.gain }}> live</Text> : ''}</Text>
              </Card>
            );
          })}
        </ScrollView>

        {pulse.data && (
          <Pressable onPress={() => router.push('/tools/market-pulse' as never)} style={styles.pulseRow}>
            <Text style={styles.pulseItem}>Breadth <Text style={{ color: colors.gain }}>{pulse.data.breadth.advancers}</Text>/<Text style={{ color: colors.loss }}>{pulse.data.breadth.decliners}</Text></Text>
            <Text style={styles.pulseItem}>VIX {pulse.data.vix?.value.toFixed(1) ?? '—'}</Text>
            <Text style={styles.pulseItem}>PCR {pulse.data.pcr.niftyOi?.toFixed(2) ?? '—'}</Text>
            <Text style={styles.pulseItem}>Straddle ₹{pulse.data.niftyStraddle?.straddlePrice.toFixed(0) ?? '—'}</Text>
            <ChevronRightIcon size={16} color={colors.textTertiary} />
          </Pressable>
        )}

        {rows.isLoading ? <LoadingBlock rows={5} /> : rows.isError ? <ErrorBlock error={rows.error} onRetry={rows.refetch} /> : (
          <Card style={styles.listCard} padding="xs" variant="elevated">
            {(rows.data ?? []).length === 0 && <Text style={styles.empty}>Your watchlist is empty. Tap + to add symbols.</Text>}
            {(rows.data ?? []).map((r, i, arr) => {
              const q = quotes[r.symbol];
              const ltp = q?.ltp ?? r.close;
              const chg = q?.changePct ?? r.changePct;
              return (
                <Pressable key={r.symbol} onPress={() => (editing ? remove(r.symbol) : router.push(`/stock/${r.symbol}` as never))} style={[styles.row, i < arr.length - 1 && styles.rowBorder]}>
                  {editing && <View style={styles.removeBtn}><XIcon size={14} color={colors.loss} /></View>}
                  <View style={{ flex: 1.6, minWidth: 0 }}>
                    <Text style={styles.sym} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{r.symbol}</Text>
                    <Text style={styles.name} numberOfLines={1}>{r.isIndex ? 'Index' : r.sector} · IV {ivPct(r.atmIv)}{r.ivRank != null ? ` · rank ${r.ivRank.toFixed(0)}` : ''}</Text>
                  </View>
                  <MiniSparkline data={r.sparkline} width={54} height={26} />
                  <View style={styles.priceCol}>
                    <Text style={styles.price}>{price(ltp)}</Text>
                    <Text style={[styles.chg, { color: chg >= 0 ? colors.gain : colors.loss }]}>{signedPct(chg)}</Text>
                  </View>
                  <View style={styles.readCol}><Cell col={{ key: 'oi', label: '', type: 'badge' }} value={r.oiRead} /></View>
                </Pressable>
              );
            })}
          </Card>
        )}
        <Disclaimer />
      </ScrollView>
      <AddSymbolModal visible={adding} onClose={() => setAdding(false)} selected={tickers} onToggle={toggle} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: spacing.tabBar },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  brand: { ...typography.h1, color: colors.indigo, letterSpacing: -1 },
  sub: { ...typography.small, color: colors.textSecondary },
  headerActions: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  actionBtn: { height: 36, minWidth: 36, paddingHorizontal: spacing.sm, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  actionPrimary: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  actionText: { ...typography.smallMd, color: colors.indigo },
  strip: { paddingHorizontal: spacing.md, gap: spacing.xs, paddingBottom: spacing.xs },
  indexCard: { width: 128 },
  indexName: { ...typography.label, color: colors.textTertiary },
  indexValue: { ...typography.h4, color: colors.textPrimary, marginTop: 2, fontVariant: ['tabular-nums'] },
  indexChange: { ...typography.small, marginTop: 1 },
  pulseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.md, marginBottom: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: 8, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1, borderColor: colors.borderLight },
  pulseItem: { ...typography.small, color: colors.textSecondary, flex: 1 },
  listCard: { marginHorizontal: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 10, gap: spacing.xs },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(15,13,12,0.06)' },
  removeBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.lossBg, alignItems: 'center', justifyContent: 'center' },
  sym: { ...typography.bodyMd, color: colors.textPrimary },
  name: { fontSize: 11, color: colors.textTertiary, marginTop: 1 },
  priceCol: { alignItems: 'flex-end', minWidth: 76 },
  price: { ...typography.bodyMd, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  chg: { ...typography.small, fontVariant: ['tabular-nums'] },
  readCol: { width: 82, alignItems: 'flex-end' },
  empty: { ...typography.small, color: colors.textTertiary, padding: spacing.md, textAlign: 'center' },
});
