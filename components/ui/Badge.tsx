import React from 'react';
import { StyleSheet, View, Text, ViewStyle, TextStyle } from 'react-native';
import { colors, borderRadius, spacing, typography } from '@/constants';

type BadgeVariant = 'default' | 'verified' | 'pro' | 'success' | 'warning' | 'error';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  icon,
  style,
  textStyle,
}) => {
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'verified':
        return {
          container: { backgroundColor: colors.tealLight },
          text: { color: colors.teal },
        };
      case 'pro':
        return {
          container: { backgroundColor: colors.purpleLight },
          text: { color: colors.purple },
        };
      case 'success':
        return {
          container: { backgroundColor: colors.gainBg },
          text: { color: colors.gain },
        };
      case 'warning':
        return {
          container: { backgroundColor: '#FEF3C7' },
          text: { color: colors.warning },
        };
      case 'error':
        return {
          container: { backgroundColor: colors.lossBg },
          text: { color: colors.loss },
        };
      default:
        return {
          container: { backgroundColor: colors.offWhite },
          text: { color: colors.textSecondary },
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View
      style={[
        styles.container,
        size === 'sm' && styles.containerSm,
        variantStyles.container,
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.label,
          size === 'sm' && styles.labelSm,
          variantStyles.text,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

// Verified checkmark badge
interface VerifiedBadgeProps {
  size?: number;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ size = 16 }) => (
  <View style={[styles.verifiedBadge, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={[styles.verifiedCheck, { fontSize: size * 0.65 }]}>✓</Text>
  </View>
);

// PRO tag badge
export const ProBadge: React.FC = () => (
  <Badge label="PRO" variant="pro" size="sm" />
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.xl,
    gap: spacing.xxs,
  },
  containerSm: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  label: {
    ...typography.smallMd,
    fontWeight: '600',
  },
  labelSm: {
    fontSize: 10,
    fontWeight: '700',
  },
  verifiedBadge: {
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheck: {
    color: colors.white,
    fontWeight: '700',
  },
});
