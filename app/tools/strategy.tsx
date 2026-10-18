import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { colors, spacing, typography } from '@/constants';
import { Card, Button } from '@/components/ui';
import { ToolScreen, SymbolPicker, ExpiryPicker, StatGrid, StatTile, LoadingBlock, ErrorBlock } from '@/components/screener';
import { PayoffChart } from '@/components/charts';
import { LegEditor, buildTemplate, priceLeg } from '@/components/strategy/LegEditor';
import { useChain, useExpiries, usePayoffQuery, useMarginQuery } from '@/hooks/useMarketData';
import type { StrategyLeg, ToolRequest } from '@/types';
import { inr, price } from '@/utils';

export default function StrategyBuilderScreen() {
  const params = useLocalSearchParams<{ symbol?: string; expiry?: string; strike?: string }>();
  const [symbol, setSymbol] = useState((params.symbol ?? 'NIFTY').toUpperCase());
  const [expiry, setExpiry] = useState<string | undefined>(params.expiry);
  const [legs, setLegs] = useState<StrategyLeg[]>([]);
  const expiries = useExpiries(symbol);
  const chain = useChain(symbol, expiry);

  // Seed legs once the chain is available: from a tapped strike, or a default bull call spread.
  useEffect(() => {
    if (!chain.data || legs.length > 0) return;
    if (params.strike) {
      const k = Number(params.strike);
      setLegs([priceLeg({ id: 'seed', instrument: 'CE', side: 'BUY', strike: k, premium: 0, lots: 1 }, chain.data)]);
    } else {
      setLegs(buildTemplate('Bull Call Spread', chain.data));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain.data]);

  const req: ToolRequest | null = useMemo(() => (legs.length && chain.data ? { symbol, legs, daysToExpiry: chain.data.daysToExpiry } : null), [legs, symbol, chain.data]);
  const payoff = usePayoffQuery(req);
  const margin = useMarginQuery(req);
  const onSymbol = (s: string) => { setSymbol(s); setExpiry(undefined); setLegs([]); };
  const onExpiry = (e: string) => { setExpiry(e); setLegs([]); };

  return (
    <ToolScreen title="Strategy Builder" subtitle="Payoff, breakevens, greeks and margin" disclaimerExtra="Margin is an estimate (see Margin Calculator). Premiums are EOD closes.">
      <SymbolPicker value={symbol} onChange={onSymbol} />
      {expiries.data && <ExpiryPicker expiries={expiries.data} value={expiry} onChange={onExpiry} />}
      {chain.isLoading && !chain.data ? <LoadingBlock rows={3} /> : chain.isError ? <ErrorBlock error={chain.error} onRetry={chain.refetch} /> : (
        <>
          <LegEditor chain={chain.data} legs={legs} onChange={setLegs} />
          <Card style={styles.card} padding="sm" variant="outlined">
            <Text style={styles.chartTitle}>{symbol} · spot {chain.data ? price(chain.data.spot) : ''} · {chain.data?.daysToExpiry}d · lot {chain.data?.lotSize}</Text>
            {payoff.data ? <PayoffChart points={payoff.data.points} spot={payoff.data.context.spot} breakevens={payoff.data.breakevens} /> : <LoadingBlock rows={1} height={220} />}
            <View style={styles.legendRow}>
              <View style={[styles.swatch, { backgroundColor: colors.indigo }]} /><Text style={styles.legend}>At expiry</Text>
              <View style={[styles.swatch, { backgroundColor: colors.gold }]} /><Text style={styles.legend}>Today (T+0)</Text>
            </View>
          </Card>
          {payoff.data && (
            <StatGrid>
              <StatTile label="Max profit" value={payoff.data.maxProfit == null ? 'Unlimited' : inr(payoff.data.maxProfit, 0)} tone="gain" />
              <StatTile label="Max loss" value={payoff.data.maxLoss == null ? 'Unlimited' : inr(payoff.data.maxLoss, 0)} tone="loss" />
              <StatTile label={payoff.data.netPremium >= 0 ? 'Net credit' : 'Net debit'} value={inr(Math.abs(payoff.data.netPremium), 0)} tone="gold" />
              <StatTile label="Breakeven" value={payoff.data.breakevens.length ? payoff.data.breakevens.map((b) => b.toFixed(0)).join(' · ') : '—'} flex={2} />
              {payoff.data.greeks && (
                <>
                  <StatTile label="Delta" value={payoff.data.greeks.delta.toFixed(1)} sub="per position" />
                  <StatTile label="Theta / day" value={inr(payoff.data.greeks.theta, 0)} tone={payoff.data.greeks.theta >= 0 ? 'gain' : 'loss'} />
                  <StatTile label="Vega / 1%" value={inr(payoff.data.greeks.vega, 0)} />
                  <StatTile label="Gamma" value={payoff.data.greeks.gamma.toFixed(3)} />
                </>
              )}
              <StatTile label="Margin (est.)" value={margin.data ? inr(margin.data.total, 0) : '…'} sub={margin.data ? `SPAN ${inr(margin.data.spanMargin, 0)} + exp ${inr(margin.data.exposureMargin, 0)}` : undefined} flex={2} />
            </StatGrid>
          )}
          <View style={styles.actions}>
            <Button title="Open in Margin Calculator" variant="outline" size="sm" onPress={() => router.push(`/tools/margin?symbol=${symbol}${expiry ? `&expiry=${expiry}` : ''}` as never)} />
          </View>
        </>
      )}
    </ToolScreen>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  chartTitle: { ...typography.small, color: colors.textSecondary, marginBottom: spacing.xs },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs },
  swatch: { width: 14, height: 3, borderRadius: 2 },
  legend: { ...typography.small, color: colors.textTertiary, marginRight: spacing.sm },
  actions: { paddingHorizontal: spacing.md, marginTop: spacing.xs },
});
