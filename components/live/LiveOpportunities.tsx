import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card, ChevronRightIcon } from '@/components/ui';
import { useLiveScreener, useLiveStatus } from '@/hooks/useLive';
import { LIVE_COLUMNS, type LiveScreenerId } from '@/backend/src/shared';
import { Cell } from '@/components/screener/ResultsTable';

const PANELS: Array<{ id: LiveScreenerId; title: string; params: Record<string, number> }> = [
  { id: 'premium-spike', title: 'Premium spikes · 5 min', params: { minPct5m: 8, minLots: 20 } },
  { id: 'volume-spike', title: 'Volume spikes · rel. volume', params: { minRelVol: 1.3 } },
  { id: 'unusual-options', title: 'Unusual options · vol/OI', params: { minRatio: 0.6, minLots: 100 } },
];

const Panel: React.FC<(typeof PANELS)[number]> = ({ id, title, params }) => {
  const live = useLiveScreener(id, params);
  const cols = LIVE_COLUMNS[id].filter((c) => c.primary).slice(0, 3);
  const rows = live?.rows.slice(0, 3) ?? [];
  return (
    <Card onPress={() => router.push(`/screener/${id}?mode=live` as never)} style={styles.card} padding="sm" variant="elevated">
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.count}>{live ? `${live.total} now` : '…'}</Text>
        <ChevronRightIcon size={16} color={colors.textTertiary} />
      </View>
      {rows.length === 0 ? (
        <Text style={styles.empty}>{live ? 'Nothing firing right now' : 'Waiting for ticks…'}</Text>
      ) : rows.map((r) => (
        <View key={r.key} style={styles.row}>
          <View style={{ flex: 1.3 }}>
            <Text style={styles.sym} numberOfLines={1}>{r.symbol}</Text>
            {typeof r.values.contract === 'string' && <Text style={styles.contract} numberOfLines={1}>{String(r.values.contract).replace(`${r.symbol} `, '')}</Text>}
          </View>
          {cols.filter((c) => c.key !== 'contract').map((c) => (
            <View key={c.key} style={styles.val}><Cell col={c} value={r.values[c.key]} /></View>
          ))}
        </View>
      ))}
    </Card>
  );
};

/** Streaming top-3 of each live screener — the "grab it first" strip. */
export const LiveOpportunities: React.FC = () => {
  const status = useLiveStatus();
  return (
    <View>
      {!status?.connected && (
        <Text style={styles.note}>{status?.note ?? 'Live feed off — showing nothing until ticks arrive.'}</Text>
      )}
      {PANELS.map((p) => <Panel key={p.id} {...p} />)}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md, marginBottom: spacing.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 6 },
  title: { ...typography.h4, color: colors.textPrimary, flex: 1 },
  count: { ...typography.small, color: colors.gain, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderTopWidth: 1, borderTopColor: 'rgba(15,13,12,0.05)' },
  sym: { ...typography.smallMd, color: colors.textPrimary },
  contract: { fontSize: 11, color: colors.textTertiary },
  val: { flex: 1, alignItems: 'flex-end' },
  empty: { ...typography.small, color: colors.textTertiary, paddingVertical: 6 },
  note: { ...typography.small, color: colors.warning, paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
  pill: { borderRadius: borderRadius.full },
});
