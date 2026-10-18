import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { useMarketStatus } from '@/hooks/useMarketData';
import { shortDate } from '@/utils';
import { LiveBadge } from './LiveBadge';

/** Data provenance strip: live pill + "EOD · as of 16 Oct '26 · mock/bhavcopy". */
export const AsOfBanner: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { data, isLoading, isError } = useMarketStatus();
  const label = isError
    ? 'Data unavailable — check source in Profile'
    : isLoading || !data
      ? 'Loading market data…'
      : `EOD base · ${shortDate(data.tradeDate)} · ${data.source === 'mock' ? 'mock' : 'NSE bhavcopy'}`;
  return (
    <View style={[styles.row, compact && styles.compact]}>
      <LiveBadge compact={compact} />
      <Pressable onPress={() => router.push('/(tabs)/profile' as never)} style={[styles.container, isError && styles.error]}>
        <Text style={[styles.text, isError && styles.textError]} numberOfLines={1}>{label}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginHorizontal: spacing.md, marginBottom: spacing.sm, flexWrap: 'wrap' },
  compact: { marginBottom: spacing.xs },
  container: { paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: colors.borderLight, flexShrink: 1 },
  error: { borderColor: colors.loss, backgroundColor: colors.lossBg },
  text: { ...typography.small, color: colors.textSecondary, fontSize: 12 },
  textError: { color: colors.loss },
});
