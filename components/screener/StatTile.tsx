import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/constants';

type Tone = 'gain' | 'loss' | 'neutral' | 'gold';
const toneColor: Record<Tone, string> = { gain: colors.gain, loss: colors.loss, neutral: colors.textPrimary, gold: colors.gold };

export const StatTile: React.FC<{ label: string; value: string; sub?: string; tone?: Tone; flex?: number }> = ({ label, value, sub, tone = 'neutral', flex = 1 }) => (
  <View style={[styles.tile, { flex }]}>
    <Text style={styles.label} numberOfLines={1}>{label}</Text>
    <Text style={[styles.value, { color: toneColor[tone] }]} numberOfLines={1}>{value}</Text>
    {sub ? <Text style={styles.sub} numberOfLines={1}>{sub}</Text> : null}
  </View>
);

export const StatGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => <View style={styles.grid}>{children}</View>;

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  tile: { minWidth: '30%', backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight, padding: spacing.sm },
  label: { ...typography.label, color: colors.textTertiary },
  value: { ...typography.h4, marginTop: 2, fontVariant: ['tabular-nums'] },
  sub: { ...typography.small, color: colors.textSecondary, marginTop: 1 },
});
