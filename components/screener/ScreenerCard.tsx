import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography } from '@/constants';
import { Card, ChevronRightIcon, Badge } from '@/components/ui';
import type { ScreenerSummary } from '@/types';
import { AvailabilityBadge } from './AvailabilityBadge';

export function routeForScreener(s: ScreenerSummary): string {
  return s.detailRoute ?? `/screener/${s.id}`;
}

export const ScreenerCard: React.FC<{ spec: ScreenerSummary; live?: boolean }> = ({ spec, live }) => (
  <Card onPress={() => router.push((live ? `${routeForScreener(spec)}?mode=live` : routeForScreener(spec)) as never)} style={styles.card} padding="md" variant="outlined">
    <View style={styles.row}>
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{spec.name}</Text>
          {live ? <Badge label="LIVE" variant="success" /> : <AvailabilityBadge availability={spec.availability} mode={spec.mode} />}
        </View>
        <Text style={styles.tagline} numberOfLines={2}>{spec.tagline}</Text>
      </View>
      <ChevronRightIcon size={20} color={colors.textTertiary} />
    </View>
  </Card>
);

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  text: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  name: { ...typography.h4, color: colors.textPrimary },
  tagline: { ...typography.small, color: colors.textSecondary },
});
