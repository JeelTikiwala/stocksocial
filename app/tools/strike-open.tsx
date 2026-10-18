import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, spacing } from '@/constants';
import { Card } from '@/components/ui';
import { ToolScreen, SymbolPicker, ExpiryPicker, Segmented, StatGrid, StatTile, LoadingBlock, ErrorBlock } from '@/components/screener';
import { MirrorBars } from '@/components/charts';
import { useChain, useExpiries } from '@/hooks/useMarketData';
import { compactIndian, price } from '@/utils';

export default function StrikeOpenScreen() {
  const params = useLocalSearchParams<{ symbol?: string; expiry?: string }>();
  const [symbol, setSymbol] = useState((params.symbol ?? 'NIFTY').toUpperCase());
  const [expiry, setExpiry] = useState<string | undefined>(params.expiry);
  const [mode, setMode] = useState<'oi' | 'chgOi'>('oi');
  const [span, setSpan] = useState<'near' | 'all'>('near');
  const expiries = useExpiries(symbol);
  const chain = useChain(symbol, expiry);
  const onSymbol = (s: string) => { setSymbol(s); setExpiry(undefined); };

  const rows = useMemo(() => {
    if (!chain.data) return [];
    const c = chain.data;
    const i = c.rows.findIndex((r) => r.strike === c.atmStrike);
    const slice = span === 'near' ? c.rows.slice(Math.max(i - 10, 0), i + 11) : c.rows;
    return [...slice].reverse().map((r) => ({
      strike: r.strike,
      left: mode === 'oi' ? r.put?.oi ?? 0 : r.put?.chgOi ?? 0,
      right: mode === 'oi' ? r.call?.oi ?? 0 : r.call?.chgOi ?? 0,
      highlight: r.strike === c.atmStrike,
      marker: r.strike === c.totals.maxPainStrike ? 'Max pain' : undefined,
    }));
  }, [chain.data, mode, span]);

  return (
    <ToolScreen title="Strike Open" subtitle="Open interest by strike — writers' support and resistance" refreshing={chain.isRefetching} onRefresh={chain.refetch}>
      <SymbolPicker value={symbol} onChange={onSymbol} />
      {expiries.data && <ExpiryPicker expiries={expiries.data} value={expiry} onChange={setExpiry} />}
      <View style={styles.controls}>
        <Segmented options={[{ label: 'OI', value: 'oi' as const }, { label: 'ΔOI', value: 'chgOi' as const }]} value={mode} onChange={setMode} />
        <Segmented options={[{ label: '±10 strikes', value: 'near' as const }, { label: 'All', value: 'all' as const }]} value={span} onChange={setSpan} />
      </View>
      {chain.isLoading ? <LoadingBlock rows={8} height={24} /> : chain.isError || !chain.data ? <ErrorBlock error={chain.error} onRetry={chain.refetch} /> : (
        <>
          <StatGrid>
            <StatTile label="Spot" value={price(chain.data.spot)} sub={`ATM ${chain.data.atmStrike}`} />
            <StatTile label="PCR (OI)" value={chain.data.totals.pcrOi.toFixed(2)} tone={chain.data.totals.pcrOi > 1 ? 'gain' : 'loss'} />
            <StatTile label="Max pain" value={chain.data.totals.maxPainStrike == null ? '—' : String(chain.data.totals.maxPainStrike)} tone="gold" />
            <StatTile label="Put OI" value={compactIndian(chain.data.totals.putOi)} sub={`Δ ${compactIndian(chain.data.totals.putChgOi)}`} tone="gain" />
            <StatTile label="Call OI" value={compactIndian(chain.data.totals.callOi)} sub={`Δ ${compactIndian(chain.data.totals.callChgOi)}`} tone="loss" />
            <StatTile label="Days to expiry" value={String(chain.data.daysToExpiry)} />
          </StatGrid>
          <Card style={styles.card} padding="xs" variant="outlined">
            <MirrorBars rows={rows} leftLabel={mode === 'oi' ? 'Put OI' : 'Put ΔOI'} rightLabel={mode === 'oi' ? 'Call OI' : 'Call ΔOI'} />
          </Card>
        </>
      )}
    </ToolScreen>
  );
}

const styles = StyleSheet.create({
  controls: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, marginBottom: spacing.sm, flexWrap: 'wrap' },
  card: { marginHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.white },
});
