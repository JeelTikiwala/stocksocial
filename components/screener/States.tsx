import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors, spacing, typography } from '@/constants';
import { Skeleton, Button } from '@/components/ui';

export const LoadingBlock: React.FC<{ rows?: number; height?: number }> = ({ rows = 4, height = 56 }) => (
  <View style={styles.block}>
    {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} height={height} style={{ marginBottom: spacing.xs }} />)}
  </View>
);

export const ErrorBlock: React.FC<{ error: unknown; onRetry?: () => void }> = ({ error, onRetry }) => (
  <View style={styles.error}>
    <Text style={styles.errorTitle}>Couldn&apos;t load data</Text>
    <Text style={styles.errorText}>{error instanceof Error ? error.message : 'Unknown error'}</Text>
    {onRetry ? <Button title="Retry" variant="outline" size="sm" onPress={onRetry} style={{ marginTop: spacing.sm }} /> : null}
  </View>
);

const styles = StyleSheet.create({
  block: { paddingHorizontal: spacing.md },
  error: { margin: spacing.md, padding: spacing.md, backgroundColor: colors.lossBg, borderRadius: 12 },
  errorTitle: { ...typography.h4, color: colors.loss },
  errorText: { ...typography.small, color: colors.textSecondary, marginTop: 4 },
});
