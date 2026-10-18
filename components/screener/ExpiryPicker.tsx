import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { expiryLabel } from '@/utils';

export const ExpiryPicker: React.FC<{ expiries: string[]; value?: string; onChange: (e: string) => void }> = ({ expiries, value, onChange }) => (
  <View style={styles.wrap}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {expiries.map((e, i) => {
        const active = (value ?? expiries[0]) === e;
        return (
          <Pressable key={e} onPress={() => onChange(e)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{expiryLabel(e)}{i === 0 ? ' · near' : ''}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  chips: { paddingHorizontal: spacing.md, gap: spacing.xs },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.goldLight, borderColor: colors.gold },
  chipText: { ...typography.smallMd, color: colors.textSecondary },
  chipTextActive: { color: colors.textPrimary, fontWeight: '600' },
});
