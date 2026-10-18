import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography } from '@/constants';
import { ScreenHeader, AsOfBanner, SymbolPicker, ExpiryPicker, Segmented, StatGrid, StatTile, LoadingBlock, ErrorBlock, Disclaimer } from '@/components/screener';
import { useChain, useExpiries } from '@/hooks/useMarketData';
import type { ChainRow, ChainSide } from '@/types';
import { compactIndian, price, ivPct } from '@/utils';

type View_ = 'oi' | 'greeks';

export default function OptionsChainScreen() {
  const params = useLocalSearchParams<{ symbol?: string; expiry?: string }>();
  const [symbol, setSymbol] = useState((params.symbol ?? 'NIFTY').toUpperCase());
  const [expiry, setExpiry] = useState<string | undefined>(params.expiry);
  const [view, setView] = useState<View_>('oi');
  const expiries = useExpiries(symbol);
  const chain = useChain(symbol, expiry);
  const c = chain.data;

  const header = (
    <View>
      <AsOfBanner compact />
      <SymbolPicker value={symbol} onChange={(s) => { setSymbol(s); setExpiry(undefined); }} />
      {expiries.data && <ExpiryPicker expiries={expiries.data} value={expiry} onChange={setExpiry} />}
      <View style={styles.controls}>
        <Segmented options={[{ label: 'OI & price', value: 'oi' as const }, { label: 'Greeks', value: 'greeks' as const }]} value={view} onChange={setView} />
      </View>
      {c && (
        <StatGrid>
          <StatTile label="Spot" value={price(c.spot)} sub={c.futurePrice ? `Fut ${price(c.futurePrice)}` : undefined} />
          <StatTile label="PCR" value={c.totals.pcrOi.toFixed(2)} tone={c.totals.pcrOi > 1 ? 'gain' : 'loss'} />
          <StatTile label="Max pain" value={String(c.totals.maxPainStrike ?? '—')} tone="gold" />
          <StatTile label="FutEq OI (Δ-adj)" value={`${compactIndian(c.totals.putFutEqOi)} P / ${compactIndian(c.totals.callFutEqOi)} C`} sub="SEBI delta-based OI" />
        </StatGrid>
      )}
      {c && (
        <View style={styles.colHead}>
          {view === 'oi' ? (
            <><Text style={styles.h}>OI</Text><Text style={styles.h}>ΔOI</Text><Text style={styles.h}>IV</Text><Text style={styles.h}>LTP</Text></>
          ) : (
            <><Text style={styles.h}>Δ</Text><Text style={styles.h}>Θ</Text><Text style={styles.h}>Vega</Text><Text style={styles.h}>LTP</Text></>
          )}
          <Text style={[styles.h, styles.strikeHead]}>Strike</Text>
          {view === 'oi' ? (
            <><Text style={styles.h}>LTP</Text><Text style={styles.h}>IV</Text><Text style={styles.h}>ΔOI</Text><Text style={styles.h}>OI</Text></>
          ) : (
            <><Text style={styles.h}>LTP</Text><Text style={styles.h}>Vega</Text><Text style={styles.h}>Θ</Text><Text style={styles.h}>Δ</Text></>
          )}
        </View>
      )}
    </View>
  );

  const Side: React.FC<{ s: ChainSide | null; reverse?: boolean; itm: boolean }> = ({ s, reverse, itm }) => {
    if (!s) return <View style={styles.side}>{[0, 1, 2, 3].map((i) => <Text key={i} style={styles.cell}>—</Text>)}</View>;
    const cells = view === 'oi'
      ? [compactIndian(s.oi), <Text key="d" numberOfLines={1} style={[styles.cell, { color: s.chgOi > 0 ? colors.gain : s.chgOi < 0 ? colors.loss : colors.textTertiary }]}>{(s.chgOi > 0 ? '+' : '') + compactIndian(s.chgOi)}</Text>, ivPct(s.iv), <Text key="p" numberOfLines={1} style={[styles.cell, styles.ltp, { color: s.changePct >= 0 ? colors.gain : colors.loss }]}>{price(s.close)}</Text>]
      : [s.greeks ? s.greeks.delta.toFixed(2) : '—', s.greeks ? s.greeks.theta.toFixed(1) : '—', s.greeks ? s.greeks.vega.toFixed(1) : '—', <Text key="p" numberOfLines={1} style={[styles.cell, styles.ltp]}>{price(s.close)}</Text>];
    const ordered = reverse ? [...cells].reverse() : cells;
    return (
      <View style={[styles.side, itm && styles.itm]}>
        {ordered.map((v, i) => (typeof v === 'string' ? <Text key={i} style={styles.cell} numberOfLines={1}>{v}</Text> : v))}
      </View>
    );
  };

  const renderRow = ({ item }: { item: ChainRow }) => {
    const atm = c && item.strike === c.atmStrike;
    return (
      <Pressable onPress={() => router.push(`/tools/strategy?symbol=${symbol}&expiry=${c?.expiry}&strike=${item.strike}` as never)} style={[styles.row, atm && styles.atm]}>
        <Side s={item.call} itm={!!c && item.strike < c.spot} />
        <Text style={[styles.strike, atm && styles.strikeAtm]}>{item.strike}</Text>
        <Side s={item.put} reverse itm={!!c && item.strike > c.spot} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Options Chain" subtitle={c ? `${c.symbol} · ${c.daysToExpiry}d to expiry · lot ${c.lotSize}` : 'IV, greeks and FutEq open interest'} />
      {chain.isLoading && !c ? <View>{header}<LoadingBlock rows={10} height={30} /></View> : chain.isError ? <View>{header}<ErrorBlock error={chain.error} onRetry={chain.refetch} /></View> : (
        <FlatList
          data={c?.rows ?? []}
          keyExtractor={(r) => String(r.strike)}
          renderItem={renderRow}
          ListHeaderComponent={header}
          ListFooterComponent={<Disclaimer extra="Tap a strike to open it in the Strategy Builder. Calls shaded in-the-money below spot; puts above." />}
          initialNumToRender={30}
          contentContainerStyle={{ paddingBottom: spacing.tabBar }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  controls: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  colHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xs, paddingVertical: 4, backgroundColor: colors.white, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.borderLight },
  h: { flex: 1, fontSize: 9, fontWeight: '700', color: colors.textTertiary, textAlign: 'center', textTransform: 'uppercase' },
  strikeHead: { flex: 1.1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xs, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.borderLight, backgroundColor: colors.white },
  atm: { backgroundColor: colors.goldLight },
  side: { flex: 4, flexDirection: 'row' },
  itm: { backgroundColor: 'rgba(27,33,89,0.05)' },
  cell: { flex: 1, fontSize: 10, color: colors.textSecondary, textAlign: 'center', fontVariant: ['tabular-nums'] },
  ltp: { color: colors.textPrimary, fontWeight: '600' },
  strike: { flex: 1.1, ...typography.smallMd, color: colors.textPrimary, textAlign: 'center', fontVariant: ['tabular-nums'] },
  strikeAtm: { fontWeight: '800', color: colors.indigo },
});
