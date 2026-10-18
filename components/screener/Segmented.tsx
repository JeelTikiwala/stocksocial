import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/constants';

export function Segmented<T extends string>({ options, value, onChange }: { options: Array<{ label: string; value: T }>; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => (
        <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.seg, o.value === value && styles.segActive]}>
          <Text style={[styles.text, o.value === value && styles.textActive]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.inputBg, borderRadius: borderRadius.md, padding: 3, alignSelf: 'flex-start' },
  seg: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.sm },
  segActive: { backgroundColor: colors.white },
  text: { ...typography.smallMd, color: colors.textSecondary },
  textActive: { color: colors.textPrimary, fontWeight: '600' },
});
