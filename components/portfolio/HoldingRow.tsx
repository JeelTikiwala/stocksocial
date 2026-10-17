import React from 'react';
import { StyleSheet, View, Text, Pressable, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '@/constants';
import { Avatar, PnlPill } from '@/components/ui';
import { Holding } from '@/types';

interface HoldingRowProps {
  holding: Holding;
  onPress?: () => void;
  showDivider?: boolean;
  style?: ViewStyle;
}

export const HoldingRow: React.FC<HoldingRowProps> = ({
  holding,
  onPress,
  showDivider = true,
  style,
}) => {
  return (
    <Pressable style={[styles.container, style]} onPress={onPress}>
      <View style={[styles.colorIndicator, { backgroundColor: holding.colorHex }]} />
      <Avatar name={holding.companyName} size="md" />
      <View style={styles.info}>
        <Text style={styles.ticker}>{holding.ticker}</Text>
        <Text style={styles.companyName} numberOfLines={1}>
          {holding.companyName}
        </Text>
      </View>
      <View style={styles.allocation}>
        <Text style={styles.allocationPct}>{holding.allocationPct.toFixed(0)}%</Text>
      </View>
      <PnlPill value={holding.todayChangePct} size="sm" />
      {showDivider && <View style={styles.divider} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  colorIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  info: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  ticker: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  companyName: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  allocation: {
    marginRight: spacing.sm,
  },
  allocationPct: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: spacing.md + 4 + spacing.sm + 40 + spacing.sm,
    right: spacing.md,
    height: 0.5,
    backgroundColor: colors.border,
  },
});

export default HoldingRow;
