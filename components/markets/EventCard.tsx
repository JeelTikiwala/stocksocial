import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { format } from 'date-fns';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card } from '@/components/ui';
import { MarketEvent } from '@/types';

interface EventCardProps {
  event: MarketEvent;
  onPress?: () => void;
  style?: ViewStyle;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress, style }) => {
  const eventDate = new Date(event.dateTime);

  const getTypeColor = () => {
    switch (event.type) {
      case 'webinar':
        return colors.purple;
      case 'ipo':
        return colors.teal;
      case 'earnings':
        return colors.warning;
      case 'dividend':
        return colors.gain;
      default:
        return colors.textSecondary;
    }
  };

  const getTypeLabel = () => {
    switch (event.type) {
      case 'webinar':
        return 'Webinar';
      case 'ipo':
        return 'IPO';
      case 'earnings':
        return 'Earnings';
      case 'dividend':
        return 'Dividend';
      default:
        return 'Event';
    }
  };

  return (
    <Card style={[styles.container, style]} onPress={onPress}>
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: `${getTypeColor()}20` }]}>
          <Text style={[styles.typeText, { color: getTypeColor() }]}>
            {getTypeLabel()}
          </Text>
        </View>
        <Text style={styles.dateText}>
          {format(eventDate, 'MMM d, yyyy · h:mm a')}
        </Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {event.title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {event.subtitle}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  typeText: {
    ...typography.label,
    fontSize: 9,
  },
  dateText: {
    ...typography.small,
    color: colors.textTertiary,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
});

export default EventCard;
