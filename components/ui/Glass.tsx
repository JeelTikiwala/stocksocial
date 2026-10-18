import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { glass, borderRadius } from '@/constants';

interface GlassViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Padding inside the glass surface */
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
  radius?: number;
  strong?: boolean;
  soft?: boolean;
  shadow?: boolean;
}

/**
 * Frosted surface: blur + translucent fill + hairline highlight. The outer view carries the
 * shadow; the inner view clips the blur to the radius (iOS drops shadows on clipped views).
 */
export const GlassView: React.FC<GlassViewProps> = ({ children, style, contentStyle, intensity = glass.blurIntensity, radius = borderRadius.lg, strong, soft, shadow = true }) => (
  <View style={[shadow && glass.shadow, { borderRadius: radius }, style]}>
    <View style={[styles.clip, { borderRadius: radius, backgroundColor: strong ? glass.surfaceStrong : soft ? glass.surfaceSoft : glass.surface }]}>
      <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} experimentalBlurMethod="dimezisBlurView" />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.highlight, { borderRadius: radius }]} />
      <View style={contentStyle}>{children}</View>
    </View>
  </View>
);

/** Soft gradient + diffused colour blobs behind every screen so the glass has depth. */
export const ScreenBackground: React.FC<{ children?: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({ children, style }) => (
  <View style={[styles.bg, style]}>
    <LinearGradient colors={[...glass.gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
    {glass.blobs.map((b, i) => (
      <View
        key={i}
        pointerEvents="none"
        style={{ position: 'absolute', width: b.size, height: b.size, borderRadius: b.size / 2, backgroundColor: b.color, opacity: b.opacity, top: 'top' in b ? b.top : undefined, left: 'left' in b ? b.left : undefined, right: 'right' in b ? b.right : undefined, bottom: 'bottom' in b ? b.bottom : undefined }}
      />
    ))}
    {/* Diffuse the blobs into a glow. On web backdrop-filter does the same. */}
    <BlurView intensity={Platform.OS === 'web' ? 60 : 80} tint="light" style={StyleSheet.absoluteFill} pointerEvents="none" experimentalBlurMethod="dimezisBlurView" />
    {children}
  </View>
);

const styles = StyleSheet.create({
  clip: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: glass.border },
  highlight: { borderWidth: 1, borderColor: glass.border, opacity: 0.6 },
  bg: { flex: 1, backgroundColor: '#F7F4F0', overflow: 'hidden' },
});
