import React from 'react';
import { StyleSheet, View, Text, Pressable, ViewStyle } from 'react-native';
import { format, parseISO } from 'date-fns';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Avatar } from '@/components/ui';
import { EarningsDay } from '@/types';

interface EarningsCalendarRowProps {
  day: EarningsDay;
  onPress?: () => void;
  style?: ViewStyle;
}

export const EarningsCalendarRow: React.FC<EarningsCalendarRowProps> = ({
  day,
  onPress,
  style,
}) => {
  const date = parseISO(day.date);
  const dayNumber = format(date, 'd');
  const monthName = format(date, 'MMM');

  return (
    <Pressable style={[styles.container, style]} onPress={onPress}>
      <Text style={styles.dayNumber}>{dayNumber}</Text>
      <Text style={styles.monthName}>{monthName}</Text>

      <View style={styles.companies}>
        {day.companies.slice(0, 3).map((company, index) => (
          <View
            key={company.ticker}
            style={[
              styles.companyLogo,
              index > 0 && { marginLeft: -8 },
              { zIndex: 3 - index },
            ]}
          >
            <Avatar name={company.companyName} size="sm" />
          </View>
        ))}
        {day.companies.length > 3 && (
          <View style={[styles.moreCount, { marginLeft: -8, zIndex: 0 }]}>
            <Text style={styles.moreCountText}>+{day.companies.length - 3}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 80,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  dayNumber: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  monthName: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: 2,
  },
  companies: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  companyLogo: {
    borderWidth: 2,
    borderColor: colors.offWhite,
    borderRadius: 16,
  },
  moreCount: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.offWhite,
  },
  moreCountText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 10,
  },
});

export default EarningsCalendarRow;
