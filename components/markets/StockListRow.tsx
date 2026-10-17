import React from 'react';
import { StyleSheet, View, Text, Pressable, ViewStyle } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Avatar, PlusIcon } from '@/components/ui';

interface Stock {
  ticker: string;
  companyName: string;
  logoUrl?: string;
}

interface StockListRowProps {
  stock: Stock;
  onPress?: () => void;
  onAdd?: () => void;
  showDivider?: boolean;
  style?: ViewStyle;
}

export const StockListRow: React.FC<StockListRowProps> = ({
  stock,
  onPress,
  onAdd,
  showDivider = true,
  style,
}) => {
  return (
    <Pressable style={[styles.container, style]} onPress={onPress}>
      <Avatar
        source={stock.logoUrl}
        name={stock.companyName}
        size="md"
      />
      <View style={styles.info}>
        <Text style={styles.ticker}>{stock.ticker}</Text>
        <Text style={styles.companyName} numberOfLines={1}>
          {stock.companyName}
        </Text>
      </View>
      <Pressable style={styles.addButton} onPress={onAdd}>
        <PlusIcon size={18} color={colors.teal} />
      </Pressable>
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
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: spacing.md + 40 + spacing.sm,
    right: spacing.md,
    height: 0.5,
    backgroundColor: colors.border,
  },
});

export default StockListRow;
