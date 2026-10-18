import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card, SectionHeader } from '@/components/ui';
import { ToolScreen, StatGrid, StatTile, LoadingBlock, ErrorBlock } from '@/components/screener';
import { useMarketPulse } from '@/hooks/useMarketData';
import { signedPct, price, shortDate, inr } from '@/utils';

export default function MarketPulseScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useMarketPulse();
  return (
    <ToolScreen title="Market Pulse" subtitle="Breadth, volatility, positioning and flows" refreshing={isRefetching} onRefresh={refetch}>
      {isLoading ? <LoadingBlock rows={5} /> : isError || !data ? <ErrorBlock error={error} onRetry={refetch} /> : (
        <>
          <StatGrid>
            {data.indices.map((i) => <StatTile key={i.name} label={i.name} value={price(i.close)} sub={signedPct(i.changePct)} tone={i.changePct >= 0 ? 'gain' : 'loss'} />)}
            {data.vix && <StatTile label="India VIX" value={data.vix.value.toFixed(2)} sub={signedPct(data.vix.changePct)} tone={data.vix.changePct <= 0 ? 'gain' : 'loss'} />}
          </StatGrid>

          <SectionHeader title="Breadth (F&O stocks)" />
          <Card style={styles.card} padding="md" variant="outlined">
            <View style={styles.breadthBar}>
              <View style={[styles.breadthSeg, { flex: Math.max(data.breadth.advancers, 0.01), backgroundColor: colors.gain }]} />
              <View style={[styles.breadthSeg, { flex: Math.max(data.breadth.unchanged, 0.01), backgroundColor: colors.border }]} />
              <View style={[styles.breadthSeg, { flex: Math.max(data.breadth.decliners, 0.01), backgroundColor: colors.loss }]} />
            </View>
            <View style={styles.breadthRow}>
              <Text style={[styles.breadthText, { color: colors.gain }]}>{data.breadth.advancers} advancing</Text>
              <Text style={styles.breadthText}>{data.breadth.advancePct.toFixed(0)}% up</Text>
              <Text style={[styles.breadthText, { color: colors.loss }]}>{data.breadth.decliners} declining</Text>
            </View>
          </Card>

          <SectionHeader title="Put / Call ratio (OI)" />
          <StatGrid>
            <StatTile label="Nifty near expiry" value={data.pcr.niftyOi?.toFixed(2) ?? '—'} sub={data.pcr.niftyOi == null ? '' : data.pcr.niftyOi > 1.2 ? 'Put-heavy' : data.pcr.niftyOi < 0.8 ? 'Call-heavy' : 'Balanced'} />
            <StatTile label="Nifty ΔOI ratio" value={data.pcr.niftyChgOi == null ? '—' : data.pcr.niftyChgOi.toFixed(2)} sub="Put ΔOI ÷ Call ΔOI" />
            <StatTile label="Universe" value={data.pcr.universeOi.toFixed(2)} sub="All F&O options" />
          </StatGrid>

          <SectionHeader title="Futures OI read" actionLabel="Gainers & losers" onActionPress={() => router.push('/screener/gainers-losers' as never)} />
          <StatGrid>
            <StatTile label="Long buildup" value={String(data.oiSentiment['Long Buildup'])} tone="gain" />
            <StatTile label="Short buildup" value={String(data.oiSentiment['Short Buildup'])} tone="loss" />
            <StatTile label="Short covering" value={String(data.oiSentiment['Short Covering'])} />
            <StatTile label="Long unwinding" value={String(data.oiSentiment['Long Unwinding'])} />
          </StatGrid>

          {data.niftyStraddle && (
            <>
              <SectionHeader title="Nifty ATM straddle" actionLabel="Chart" onActionPress={() => router.push('/tools/straddle?symbol=NIFTY' as never)} />
              <StatGrid>
                <StatTile label="Straddle" value={`₹${data.niftyStraddle.straddlePrice.toFixed(1)}`} tone="gold" />
                <StatTile label="ATM strike" value={String(data.niftyStraddle.atmStrike)} />
                <StatTile label="Expiry" value={shortDate(data.niftyStraddle.expiry)} sub={`${data.niftyStraddle.daysToExpiry}d left`} />
              </StatGrid>
            </>
          )}

          <SectionHeader title="Top movers" />
          <View style={styles.moversRow}>
            <Card style={styles.col} padding="sm" variant="outlined">
              {data.topGainers.map((g) => (
                <Pressable key={g.symbol} onPress={() => router.push(`/stock/${g.symbol}` as never)} style={styles.mover}>
                  <Text style={styles.moverSym}>{g.symbol}</Text><Text style={[styles.moverPct, { color: colors.gain }]}>{signedPct(g.changePct)}</Text>
                </Pressable>
              ))}
            </Card>
            <Card style={styles.col} padding="sm" variant="outlined">
              {data.topLosers.map((g) => (
                <Pressable key={g.symbol} onPress={() => router.push(`/stock/${g.symbol}` as never)} style={styles.mover}>
                  <Text style={styles.moverSym}>{g.symbol}</Text><Text style={[styles.moverPct, { color: colors.loss }]}>{signedPct(g.changePct)}</Text>
                </Pressable>
              ))}
            </Card>
          </View>

          <SectionHeader title="Sectors" actionLabel="Sector Scope" onActionPress={() => router.push('/tools/sector-scope' as never)} />
          <Card style={styles.card} padding="sm" variant="outlined">
            {data.sectors.map((s) => (
              <View key={s.sector} style={styles.sectorRow}>
                <Text style={styles.sectorName}>{s.sector}</Text>
                <View style={styles.sectorTrack}>
                  <View style={[styles.sectorBar, { width: `${Math.min(Math.abs(s.changePct) / 3, 1) * 50}%`, backgroundColor: s.changePct >= 0 ? colors.gain : colors.loss, alignSelf: s.changePct >= 0 ? 'flex-end' : 'flex-start' }, s.changePct >= 0 ? { marginLeft: '50%' } : { marginRight: '50%' }]} />
                </View>
                <Text style={[styles.sectorPct, { color: s.changePct >= 0 ? colors.gain : colors.loss }]}>{signedPct(s.changePct)}</Text>
              </View>
            ))}
          </Card>

          <SectionHeader title="FII / DII net (₹ Cr)" />
          <Card style={styles.card} padding="sm" variant="outlined">
            <View style={styles.flowHead}><Text style={styles.flowCell}>Date</Text><Text style={styles.flowCell}>FII</Text><Text style={styles.flowCell}>DII</Text></View>
            {[...data.fiiDii].reverse().map((f) => (
              <View key={f.date} style={styles.flowRow}>
                <Text style={styles.flowCell}>{shortDate(f.date)}</Text>
                <Text style={[styles.flowCell, { color: f.fiiNet >= 0 ? colors.gain : colors.loss }]}>{inr(f.fiiNet * 1e7, 0).replace('₹', '')}</Text>
                <Text style={[styles.flowCell, { color: f.diiNet >= 0 ? colors.gain : colors.loss }]}>{inr(f.diiNet * 1e7, 0).replace('₹', '')}</Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </ToolScreen>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md },
  breadthBar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2 },
  breadthSeg: { height: 10 },
  breadthRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  breadthText: { ...typography.small, color: colors.textSecondary },
  moversRow: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md },
  col: { flex: 1 },
  mover: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  moverSym: { ...typography.smallMd, color: colors.textPrimary },
  moverPct: { ...typography.smallMd, fontVariant: ['tabular-nums'] },
  sectorRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: spacing.xs },
  sectorName: { ...typography.small, color: colors.textPrimary, width: 120 },
  sectorTrack: { flex: 1, height: 8, backgroundColor: colors.offWhite, borderRadius: 4, overflow: 'hidden' },
  sectorBar: { height: 8, borderRadius: 4 },
  sectorPct: { ...typography.small, width: 56, textAlign: 'right', fontVariant: ['tabular-nums'] },
  flowHead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingBottom: 4, marginBottom: 4 },
  flowRow: { flexDirection: 'row', paddingVertical: 3 },
  flowCell: { flex: 1, ...typography.small, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  pill: { borderRadius: borderRadius.full },
});
