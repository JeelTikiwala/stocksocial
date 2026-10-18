import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card, ChevronDownIcon, ChevronRightIcon } from '@/components/ui';
import { ToolScreen, LoadingBlock, ErrorBlock } from '@/components/screener';
import { Cell } from '@/components/screener/ResultsTable';
import { useSectors } from '@/hooks/useMarketData';
import { signedPct, price } from '@/utils';

export default function SectorScopeScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useSectors();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ToolScreen title="Sector Scope" subtitle="NSE sectoral indices and every constituent's OI read" refreshing={isRefetching} onRefresh={refetch}>
      {isLoading ? <LoadingBlock rows={6} /> : isError || !data ? <ErrorBlock error={error} onRetry={refetch} /> : data.map((s) => {
        const isOpen = open === s.sector;
        return (
          <Card key={s.sector} style={styles.card} padding="sm" variant="outlined">
            <Pressable onPress={() => setOpen(isOpen ? null : s.sector)} style={styles.head}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sector}>{s.sector}</Text>
                <Text style={styles.sub}>{s.indexName ?? 'Equal-weighted constituents'} · {s.advancers}↑ {s.decliners}↓</Text>
              </View>
              <Text style={[styles.pct, { color: s.changePct >= 0 ? colors.gain : colors.loss }]}>{signedPct(s.changePct)}</Text>
              {isOpen ? <ChevronDownIcon size={18} color={colors.textTertiary} /> : <ChevronRightIcon size={18} color={colors.textTertiary} />}
            </Pressable>
            {isOpen && (
              <View style={styles.list}>
                {s.constituents.map((c) => (
                  <Pressable key={c.symbol} onPress={() => router.push(`/stock/${c.symbol}` as never)} style={styles.row}>
                    <View style={{ flex: 1.3 }}>
                      <Text style={styles.sym}>{c.symbol}</Text>
                      <Text style={styles.name} numberOfLines={1}>{c.name}</Text>
                    </View>
                    <Text style={styles.close}>{price(c.close)}</Text>
                    <Text style={[styles.chg, { color: c.changePct >= 0 ? colors.gain : colors.loss }]}>{signedPct(c.changePct)}</Text>
                    <View style={{ flex: 1.2, alignItems: 'flex-end' }}><Cell col={{ key: 'oi', label: 'OI', type: 'badge' }} value={c.oiInterpretation} /></View>
                  </Pressable>
                ))}
              </View>
            )}
          </Card>
        );
      })}
    </ToolScreen>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md, marginBottom: spacing.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sector: { ...typography.h4, color: colors.textPrimary },
  sub: { ...typography.small, color: colors.textTertiary, marginTop: 1 },
  pct: { ...typography.bodyMd, fontVariant: ['tabular-nums'] },
  list: { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  sym: { ...typography.smallMd, color: colors.textPrimary },
  name: { fontSize: 11, color: colors.textTertiary },
  close: { ...typography.small, color: colors.textPrimary, flex: 0.8, textAlign: 'right', fontVariant: ['tabular-nums'] },
  chg: { ...typography.smallMd, flex: 0.8, textAlign: 'right', fontVariant: ['tabular-nums'] },
  pill: { borderRadius: borderRadius.full },
});
