import React from 'react';
import { StyleSheet, View, Text, ViewStyle, TextStyle } from 'react-native';
import { colors, borderRadius, spacing, typography } from '@/constants';
import { formatPercentage } from '@/utils';

interface PnlPillProps {
  value: number;
  format?: 'percentage' | 'currency' | 'raw';
  size?: 'sm' | 'md';
  showArrow?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PnlPill: React.FC<PnlPillProps> = ({
  value,
  format = 'percentage',
  size = 'md',
  showArrow = false,
  style,
  textStyle,
}) => {
  const isPositive = value >= 0;
  const isNeutral = value === 0;

  const getBackgroundColor = () => {
    if (isNeutral) return colors.offWhite;
    return isPositive ? colors.gainBg : colors.lossBg;
  };

  const getTextColor = () => {
    if (isNeutral) return colors.textSecondary;
    return isPositive ? colors.gain : colors.loss;
  };

  const formatValue = () => {
    const arrow = showArrow ? (isPositive ? '↑' : '↓') : '';

    switch (format) {
      case 'percentage':
        return `${arrow}${formatPercentage(value, { showSign: true })}`;
      case 'currency':
        const sign = value > 0 ? '+' : '';
        return `${arrow}${sign}₹${Math.abs(value).toFixed(2)}`;
      case 'raw':
        return `${arrow}${value > 0 ? '+' : ''}${value.toFixed(2)}`;
      default:
        return `${arrow}${formatPercentage(value)}`;
    }
  };

  return (
    <View
      style={[
        styles.container,
        size === 'sm' && styles.containerSm,
        { backgroundColor: getBackgroundColor() },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          size === 'sm' && styles.textSm,
          { color: getTextColor() },
          textStyle,
        ]}
      >
        {formatValue()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.xl,
    alignSelf: 'flex-start',
  },
  containerSm: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  text: {
    ...typography.smallMd,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 11,
  },
});
