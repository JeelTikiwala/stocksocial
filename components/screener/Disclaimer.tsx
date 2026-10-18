import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '@/constants';

/** Tool-only posture: display and filtering of published exchange data, no recommendations (SEBI RA regs). */
export const Disclaimer: React.FC<{ extra?: string }> = ({ extra }) => (
  <Text style={styles.text}>
    Delta displays and filters publicly available NSE data for analysis. It does not provide investment advice or recommendations. F&O trading involves substantial risk.
    {extra ? ` ${extra}` : ''}
  </Text>
);

const styles = StyleSheet.create({
  text: { ...typography.small, color: colors.textTertiary, paddingHorizontal: spacing.md, paddingTop: spacing.lg, lineHeight: 18 },
});
