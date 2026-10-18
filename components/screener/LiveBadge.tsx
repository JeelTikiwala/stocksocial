import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { useLiveStatus } from '@/hooks/useLive';

function sessionClock(progress: number): string {
  const mins = Math.round(9 * 60 + 15 + progress * 375);
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

/** Pulsing LIVE pill (provider + virtual/real session clock) or a quiet EOD label. */
export const LiveBadge: React.FC<{ compact?: boolean; onPress?: () => void }> = ({ compact, onPress }) => {
  const status = useLiveStatus();
  const pulse = useRef(new Animated.Value(1)).current;
  const live = !!status?.connected;
  useEffect(() => {
    if (!live) return;
    const loop = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 0.25, duration: 700, useNativeDriver: true }), Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [live, pulse]);
  const label = live
    ? `LIVE · ${status!.provider === 'kite' ? 'Kite' : 'simulated'}${compact ? '' : ` · ${sessionClock(status!.sessionProgress)}`}`
    : status?.note && !status.connected && status.provider !== 'none'
      ? 'LIVE · connecting'
      : 'EOD';
  return (
    <Pressable onPress={onPress ?? (() => router.push('/(tabs)/profile' as never))} style={[styles.pill, live ? styles.pillLive : styles.pillEod]}>
      <Animated.View style={[styles.dot, { backgroundColor: live ? colors.gain : colors.textTertiary, opacity: live ? pulse : 1 }]} />
      <Text style={[styles.text, live && { color: colors.gain }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: borderRadius.full, borderWidth: 1 },
  pillLive: { backgroundColor: 'rgba(227,245,236,0.8)', borderColor: 'rgba(26,122,74,0.25)' },
  pillEod: { backgroundColor: 'rgba(255,255,255,0.6)', borderColor: colors.borderLight },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { ...typography.smallMd, color: colors.textSecondary, fontSize: 12 },
});
