import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors, spacing, typography } from '@/constants';
import { compactIndian } from '@/utils';

export interface MirrorRow {
  strike: number;
  left: number;   // put side
  right: number;  // call side
  highlight?: boolean;  // ATM
  marker?: string;      // e.g. "Max pain"
}

/**
 * Open interest by strike in the Indian convention: puts (support) grow left in green,
 * calls (resistance) grow right in red. Negative values (ΔOI unwinding) render hollow.
 */
export const MirrorBars: React.FC<{ rows: MirrorRow[]; leftLabel?: string; rightLabel?: string }> = ({ rows, leftLabel = 'Put', rightLabel = 'Call' }) => {
  const max = Math.max(1, ...rows.flatMap((r) => [Math.abs(r.left), Math.abs(r.right)]));
  return (
    <View>
      <View style={styles.head}>
        <Text style={[styles.headText, { color: colors.gain }]}>{leftLabel}</Text>
        <Text style={styles.headText}>Strike</Text>
        <Text style={[styles.headText, { color: colors.loss, textAlign: 'right' }]}>{rightLabel}</Text>
      </View>
      {rows.map((r) => {
        const l = Math.abs(r.left) / max;
        const rr = Math.abs(r.right) / max;
        return (
          <View key={r.strike} style={[styles.row, r.highlight && styles.rowAtm]}>
            <View style={styles.side}>
              <Text style={[styles.val, { color: r.left < 0 ? colors.textTertiary : colors.gain }]}>{compactIndian(r.left)}</Text>
              <View style={styles.trackLeft}>
                <View style={[styles.bar, { width: `${l * 100}%`, backgroundColor: colors.gain, opacity: r.left < 0 ? 0.3 : 0.85 }]} />
              </View>
            </View>
            <View style={styles.center}>
              <Text style={[styles.strike, r.highlight && styles.strikeAtm]}>{r.strike}</Text>
              {r.marker ? <Text style={styles.marker}>{r.marker}</Text> : null}
            </View>
            <View style={styles.side}>
              <View style={styles.trackRight}>
                <View style={[styles.bar, { width: `${rr * 100}%`, backgroundColor: colors.loss, opacity: r.right < 0 ? 0.3 : 0.85 }]} />
              </View>
              <Text style={[styles.val, { color: r.right < 0 ? colors.textTertiary : colors.loss, textAlign: 'right' }]}>{compactIndian(r.right)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingBottom: 4 },
  headText: { ...typography.label, color: colors.textTertiary, width: 70, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 3 },
  rowAtm: { backgroundColor: colors.goldLight },
  side: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  trackLeft: { flex: 1, height: 14, alignItems: 'flex-end' },
  trackRight: { flex: 1, height: 14, alignItems: 'flex-start' },
  bar: { height: 14, borderRadius: 3 },
  val: { fontSize: 10, width: 40, fontVariant: ['tabular-nums'], color: colors.textSecondary },
  center: { width: 70, alignItems: 'center' },
  strike: { ...typography.smallMd, color: colors.textPrimary, fontVariant: ['tabular-nums'] },
  strikeAtm: { fontWeight: '700' },
  marker: { fontSize: 9, color: colors.gold, fontWeight: '600' },
});
