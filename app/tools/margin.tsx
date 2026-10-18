import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, Switch } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography } from '@/constants';
import { Card } from '@/components/ui';
import { ToolScreen, SymbolPicker, ExpiryPicker, StatGrid, StatTile, LoadingBlock, ErrorBlock } from '@/components/screener';
import { LegEditor, buildTemplate } from '@/components/strategy/LegEditor';
import { useChain, useExpiries, useMarginQuery } from '@/hooks/useMarketData';
import type { StrategyLeg, ToolRequest } from '@/types';
import { inr, price } from '@/utils';

export default function MarginCalculatorScreen() {
  const params = useLocalSearchParams<{ symbol?: string; expiry?: string }>();
  const [symbol, setSymbol] = useState((params.symbol ?? 'NIFTY').toUpperCase());
  const [expiry, setExpiry] = useState<string | undefined>(params.expiry);
  const [legs, setLegs] = useState<StrategyLeg[]>([]);
  const [expiryDay, setExpiryDay] = useState(false);
  const expiries = useExpiries(symbol);
  const chain = useChain(symbol, expiry);

  useEffect(() => {
    if (chain.data && legs.length === 0) setLegs(buildTemplate('Short Strangle', chain.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain.data]);

  const req: ToolRequest | null = useMemo(() => (legs.length && chain.data ? { symbol, legs, daysToExpiry: chain.data.daysToExpiry, isExpiryDay: expiryDay } : null), [legs, symbol, chain.data, expiryDay]);
  const margin = useMarginQuery(req);
  const m = margin.data;

  return (
    <ToolScreen title="Margin Calculator" subtitle="SPAN + exposure estimate for NSE F&O" disclaimerExtra="Estimates only. NSE's SPAN risk-parameter files are not yet ingested; brokers apply house margins above exchange minimums.">
      <SymbolPicker value={symbol} onChange={(s) => { setSymbol(s); setExpiry(undefined); setLegs([]); }} />
      {expiries.data && <ExpiryPicker expiries={expiries.data} value={expiry} onChange={(e) => { setExpiry(e); setLegs([]); }} />}
      {chain.isLoading && !chain.data ? <LoadingBlock rows={3} /> : chain.isError ? <ErrorBlock error={chain.error} onRetry={chain.refetch} /> : (
        <>
          <LegEditor chain={chain.data} legs={legs} onChange={setLegs} />
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Expiry-day margin</Text>
              <Text style={styles.toggleSub}>Adds SEBI&apos;s 2% ELM on short index options</Text>
            </View>
            <Switch value={expiryDay} onValueChange={setExpiryDay} trackColor={{ true: colors.gold }} />
          </View>
          {m ? (
            <>
              <Card style={styles.totalCard} padding="md" variant="elevated">
                <Text style={styles.totalLabel}>Estimated margin required</Text>
                <Text style={styles.total}>{inr(m.total, 0)}</Text>
                <Text style={styles.totalSub}>{m.context.symbol} · spot {price(m.context.spot)} · lot {m.context.lotSize} · {m.context.daysToExpiry}d · {m.context.isIndex ? 'index' : 'stock'}</Text>
              </Card>
              <StatGrid>
                <StatTile label="SPAN" value={inr(m.spanMargin, 0)} />
                <StatTile label="Exposure" value={inr(m.exposureMargin, 0)} />
                {m.expiryDayElm > 0 && <StatTile label="Expiry ELM" value={inr(m.expiryDayElm, 0)} tone="loss" />}
                <StatTile label="Premium payable" value={inr(m.premiumPayable, 0)} sub="long options" />
                <StatTile label="Premium received" value={inr(m.premiumReceivable, 0)} sub="short options" tone="gain" />
                <StatTile label="Spread benefit" value={inr(m.benefitVsNaked, 0)} sub="vs naked legs" tone="gain" />
              </StatGrid>
              <Card style={styles.card} padding="sm" variant="flat">
                {m.assumptions.map((a, i) => <Text key={i} style={styles.assumption}>• {a}</Text>)}
              </Card>
            </>
          ) : legs.length > 0 ? <LoadingBlock rows={2} /> : null}
        </>
      )}
    </ToolScreen>
  );
}

const styles = StyleSheet.create({
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: spacing.sm, padding: spacing.sm, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight },
  toggleLabel: { ...typography.bodyMd, color: colors.textPrimary },
  toggleSub: { ...typography.small, color: colors.textTertiary },
  totalCard: { marginHorizontal: spacing.md, marginBottom: spacing.sm, alignItems: 'center' },
  totalLabel: { ...typography.label, color: colors.textTertiary },
  total: { ...typography.h1, color: colors.indigo, marginTop: 4, fontVariant: ['tabular-nums'] },
  totalSub: { ...typography.small, color: colors.textSecondary, marginTop: 4 },
  card: { marginHorizontal: spacing.md },
  assumption: { ...typography.small, color: colors.textSecondary, lineHeight: 18 },
});
