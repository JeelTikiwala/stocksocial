import React from 'react';
import {
  StyleSheet,
  Pressable,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  PressableProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, borderRadius, spacing, typography, shadows } from '@/constants';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  haptic = true,
  onPress,
  ...pressableProps
}) => {
  const isDisabled = disabled || loading;

  const handlePress = (event: any) => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(event);
  };

  const variantBase: Record<ButtonVariant, ViewStyle> = {
    primary: styles.primaryBase,
    secondary: styles.secondaryBase,
    outline: styles.outlineBase,
    ghost: styles.ghostBase,
    danger: styles.dangerBase,
  };
  const sizeBase: Record<ButtonSize, ViewStyle> = {
    sm: styles.smSize,
    md: styles.mdSize,
    lg: styles.lgSize,
  };
  const variantLabel: Record<ButtonVariant, TextStyle> = {
    primary: styles.primaryLabel,
    secondary: styles.secondaryLabel,
    outline: styles.outlineLabel,
    ghost: styles.ghostLabel,
    danger: styles.dangerLabel,
  };
  const sizeLabel: Record<ButtonSize, TextStyle> = {
    sm: styles.smLabel,
    md: styles.mdLabel,
    lg: styles.lgLabel,
  };

  const buttonStyle: ViewStyle[] = [
    styles.base,
    variantBase[variant],
    sizeBase[size],
    ...(fullWidth ? [styles.fullWidth] : []),
    ...(isDisabled ? [styles.disabled] : []),
    ...(style ? [style] : []),
  ];

  const labelStyle = [
    styles.label,
    variantLabel[variant],
    sizeLabel[size],
    isDisabled && styles.disabledLabel,
    textStyle,
  ];

  const getLoaderColor = () => {
    if (variant === 'primary' || variant === 'danger') {
      return colors.white;
    }
    return colors.teal;
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        ...buttonStyle,
        pressed && !isDisabled && styles.pressed,
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getLoaderColor()} />
      ) : (
        <>
          {leftIcon}
          <Text style={labelStyle}>{title}</Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },

  // Variants
  primaryBase: {
    backgroundColor: colors.teal,
    ...shadows.sm,
  },
  secondaryBase: {
    backgroundColor: colors.tealLight,
  },
  outlineBase: {
    backgroundColor: colors.transparent,
    borderWidth: 1.5,
    borderColor: colors.teal,
  },
  ghostBase: {
    backgroundColor: colors.transparent,
  },
  dangerBase: {
    backgroundColor: colors.loss,
  },

  // Sizes
  smSize: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minHeight: 32,
  },
  mdSize: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  lgSize: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 52,
  },

  // Labels
  label: {
    ...typography.bodyMd,
    textAlign: 'center',
  },
  primaryLabel: {
    color: colors.white,
  },
  secondaryLabel: {
    color: colors.teal,
  },
  outlineLabel: {
    color: colors.teal,
  },
  ghostLabel: {
    color: colors.teal,
  },
  dangerLabel: {
    color: colors.white,
  },
  disabledLabel: {
    color: colors.textTertiary,
  },

  smLabel: {
    ...typography.small,
    fontWeight: '600',
  },
  mdLabel: {
    ...typography.bodyMd,
  },
  lgLabel: {
    ...typography.h4,
  },
});
