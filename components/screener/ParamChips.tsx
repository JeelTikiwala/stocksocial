import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/constants';
import type { ParamDef, ParamValue } from '@/types';

interface Props {
  params: ParamDef[];
  values: Record<string, ParamValue>;
  onChange: (key: string, value: ParamValue) => void;
}

export const ParamChips: React.FC<Props> = ({ params, values, onChange }) => {
  if (params.length === 0) return null;
  return (
    <View style={styles.wrap}>
      {params.map((p) => (
        <View key={p.key} style={styles.group}>
          <Text style={styles.label}>{p.label}</Text>
          {p.type === 'select' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {p.options!.map((o) => {
                const active = String(values[p.key]) === String(o.value);
                return (
                  <Pressable key={String(o.value)} onPress={() => onChange(p.key, o.value)} style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.stepper}>
              <Pressable onPress={() => onChange(p.key, clamp(Number(values[p.key]) - (p.step ?? 1), p))} style={styles.stepBtn} hitSlop={6}>
                <Text style={styles.stepText}>−</Text>
              </Pressable>
              <Text style={styles.stepValue}>
                {p.unit === '₹' ? '₹' : ''}{formatNum(Number(values[p.key]))}{p.unit && p.unit !== '₹' ? p.unit : ''}
              </Text>
              <Pressable onPress={() => onChange(p.key, clamp(Number(values[p.key]) + (p.step ?? 1), p))} style={styles.stepBtn} hitSlop={6}>
                <Text style={styles.stepText}>+</Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

function clamp(v: number, p: ParamDef): number {
  const n = Math.min(Math.max(v, p.min ?? -Infinity), p.max ?? Infinity);
  return Math.round(n * 100) / 100;
}
function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, '');
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm },
  group: { gap: 6 },
  label: { ...typography.label, color: colors.textTertiary },
  chips: { gap: spacing.xs },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  chipText: { ...typography.smallMd, color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  stepper: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.full, overflow: 'hidden' },
  stepBtn: { paddingHorizontal: spacing.sm, paddingVertical: 4 },
  stepText: { ...typography.h4, color: colors.indigo },
  stepValue: { ...typography.smallMd, color: colors.textPrimary, minWidth: 56, textAlign: 'center' },
});
