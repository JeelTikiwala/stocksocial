import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, FlatList } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/constants';
import type { ColumnDef, ScreenerRow } from '@/types';
import { cellTone, formatCell } from '@/utils';

interface Props {
  columns: ColumnDef[];
  rows: ScreenerRow[];
  emptyText?: string;
  header?: React.ReactElement;
  footer?: React.ReactElement;
}

const toneColor = { gain: colors.gain, loss: colors.loss, neutral: colors.textPrimary, teal: colors.teal, warning: colors.warning } as const;
const toneBg = { gain: colors.gainBg, loss: colors.lossBg, neutral: colors.offWhite, teal: colors.tealLight, warning: '#FEF3C7' } as const;

export const Cell: React.FC<{ col: ColumnDef; value: string | number | null | undefined; style?: object }> = ({ col, value, style }) => {
  const tone = cellTone(col.type, value);
  if (col.type === 'badge' && value != null) {
    return (
      <View style={[styles.badge, { backgroundColor: toneBg[tone] }, style]}>
        <Text style={[styles.badgeText, { color: toneColor[tone] }]} numberOfLines={1}>{String(value)}</Text>
      </View>
    );
  }
  return <Text style={[styles.cell, { color: toneColor[tone] }, style]} numberOfLines={1}>{formatCell(col.type, value)}</Text>;
};

const Row: React.FC<{ row: ScreenerRow; primary: ColumnDef[]; rest: ColumnDef[] }> = ({ row, primary, rest }) => {
  const [open, setOpen] = useState(false);
  const contract = typeof row.values.contract === 'string' ? row.values.contract : null;
  return (
    <Pressable onPress={() => setOpen((o) => !o)} style={[styles.row, open && styles.rowOpen]}>
      <View style={styles.rowMain}>
        <Pressable onPress={() => router.push(`/stock/${row.symbol}` as never)} hitSlop={6} style={styles.symbolCol}>
          <Text style={styles.symbol} numberOfLines={1}>{row.symbol}</Text>
          {contract ? <Text style={styles.contract} numberOfLines={1}>{contract.replace(`${row.symbol} `, '')}</Text> : null}
        </Pressable>
        {primary.map((c) => (
          <View key={c.key} style={styles.valueCol}>
            <Cell col={c} value={row.values[c.key]} />
          </View>
        ))}
      </View>
      {open && rest.length > 0 && (
        <View style={styles.detail}>
          {rest.map((c) => (
            <View key={c.key} style={styles.detailItem}>
              <Text style={styles.detailLabel}>{c.label}</Text>
              <Cell col={c} value={row.values[c.key]} style={styles.detailValue} />
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
};

export const ResultsTable: React.FC<Props> = ({ columns, rows, emptyText = 'No matches for these filters.', header, footer }) => {
  const primary = columns.filter((c) => c.primary).slice(0, 3);
  const rest = columns.filter((c) => !primary.includes(c) && c.key !== 'contract');
  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.key}
      ListHeaderComponent={
        <View>
          {header}
          {rows.length > 0 && (
            <View style={styles.headerRow}>
              <Text style={[styles.headerText, styles.symbolCol]}>Symbol</Text>
              {primary.map((c) => (
                <Text key={c.key} style={[styles.headerText, styles.valueCol]}>{c.label}</Text>
              ))}
            </View>
          )}
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
      ListFooterComponent={footer}
      renderItem={({ item }) => <Row row={item} primary={primary} rest={rest} />}
      initialNumToRender={20}
      contentContainerStyle={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.tabBar },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  headerText: { ...typography.label, color: colors.textTertiary, textAlign: 'right' },
  row: { marginHorizontal: spacing.md, marginBottom: 6, backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  rowOpen: { borderColor: colors.gold },
  rowMain: { flexDirection: 'row', alignItems: 'center' },
  symbolCol: { flex: 1.4, textAlign: 'left' },
  valueCol: { flex: 1, alignItems: 'flex-end' },
  symbol: { ...typography.bodyMd, color: colors.textPrimary },
  contract: { ...typography.small, color: colors.textTertiary, marginTop: 1 },
  cell: { ...typography.smallMd, textAlign: 'right', fontVariant: ['tabular-nums'] },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full, alignSelf: 'flex-end' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  detail: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
  detailItem: { minWidth: '30%', flexGrow: 1 },
  detailLabel: { ...typography.label, color: colors.textTertiary, marginBottom: 2 },
  detailValue: { textAlign: 'left', alignSelf: 'flex-start' },
  empty: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
});
