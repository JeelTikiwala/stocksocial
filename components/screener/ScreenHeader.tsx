import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography } from '@/constants';
import { ArrowLeftIcon } from '@/components/ui';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  showBack?: boolean;
}

export const ScreenHeader: React.FC<Props> = ({ title, subtitle, right, showBack = true }) => (
  <View style={styles.container}>
    {showBack && (
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        hitSlop={12}
        style={styles.back}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowLeftIcon size={22} color={colors.textPrimary} />
      </Pressable>
    )}
    <View style={styles.titles}>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
    </View>
    {right ? <View style={styles.right}>{right}</View> : null}
  </View>
);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs, gap: spacing.sm },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderLight },
  titles: { flex: 1 },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.small, color: colors.textSecondary, marginTop: 2 },
  right: { marginLeft: 'auto' },
});
