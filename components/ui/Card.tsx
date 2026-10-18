import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, Pressable, PressableProps } from 'react-native';
import { borderRadius, spacing } from '@/constants';
import { GlassView } from './Glass';

interface CardProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** elevated = glass with shadow · outlined = glass, no shadow · flat = soft glass */
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: keyof typeof spacing | number;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'elevated', padding = 'md', onPress, ...pressableProps }) => {
  const paddingValue = typeof padding === 'number' ? padding : spacing[padding];
  const surface = (
    <GlassView
      style={style}
      contentStyle={{ padding: paddingValue }}
      radius={borderRadius.lg}
      shadow={variant === 'elevated'}
      soft={variant === 'flat'}
      strong={variant === 'outlined'}
    >
      {children}
    </GlassView>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]} {...pressableProps}>
        {surface}
      </Pressable>
    );
  }
  return <View>{surface}</View>;
};

const styles = StyleSheet.create({
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
});
