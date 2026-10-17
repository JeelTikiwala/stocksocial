import React from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  Pressable,
  PressableProps,
} from 'react-native';
import { colors, borderRadius, spacing, cardShadow } from '@/constants';

interface CardProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: keyof typeof spacing | number;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'elevated',
  padding = 'md',
  onPress,
  ...pressableProps
}) => {
  const paddingValue = typeof padding === 'number' ? padding : spacing[padding];

  const cardStyle: ViewStyle[] = [
    styles.base,
    { padding: paddingValue },
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    variant === 'flat' && styles.flat,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && styles.pressed,
          style,
        ]}
        {...pressableProps}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[...cardStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  elevated: {
    ...cardShadow,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  flat: {
    backgroundColor: colors.offWhite,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
