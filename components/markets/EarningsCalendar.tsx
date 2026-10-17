import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ViewStyle,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { EarningsCalendarRow } from './EarningsCalendarRow';
import { EarningsDay } from '@/types';

type FilterMode = 'all' | 'myStocks';

interface EarningsCalendarProps {
  earningsDays: EarningsDay[];
  userTickers?: string[]; // User's portfolio tickers
  onViewMore?: () => void;
  showHeader?: boolean;
  style?: ViewStyle;
}

const STORAGE_KEY = 'earnings_calendar_filter';

export const EarningsCalendar: React.FC<EarningsCalendarProps> = ({
  earningsDays,
  userTickers = [],
  onViewMore,
  showHeader = true,
  style,
}) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted preference
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const saved = await SecureStore.getItemAsync(STORAGE_KEY);
        if (saved === 'myStocks' || saved === 'all') {
          setFilterMode(saved);
        }
      } catch (e) {
        // Ignore storage errors
      }
      setIsLoaded(true);
    };
    loadPreference();
  }, []);

  // Persist preference
  const handleFilterChange = async (mode: FilterMode) => {
    setFilterMode(mode);
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, mode);
    } catch (e) {
      // Ignore storage errors
    }
  };

  // Filter earnings based on mode
  const filteredDays = React.useMemo(() => {
    if (filterMode === 'all') {
      return earningsDays;
    }

    // Filter to only show days with companies in user's portfolio
    const userTickerSet = new Set(userTickers.map(t => t.toUpperCase()));

    return earningsDays
      .map(day => ({
        ...day,
        companies: day.companies.filter(c =>
          userTickerSet.has(c.ticker.toUpperCase())
        ),
      }))
      .filter(day => day.companies.length > 0);
  }, [earningsDays, filterMode, userTickers]);

  const hasMyStocksEarnings = filteredDays.length > 0;

  if (!isLoaded) return null;

  return (
    <View style={[styles.container, style]}>
      {/* Header with Toggle */}
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.title}>Earnings Calendar</Text>
          {onViewMore && (
            <Pressable onPress={onViewMore}>
              <Text style={styles.viewMore}>View more</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Filter Toggle */}
      <View style={styles.toggleContainer}>
        <Pressable
          onPress={() => handleFilterChange('all')}
          style={[
            styles.toggleButton,
            filterMode === 'all' && styles.toggleButtonActive,
          ]}
        >
          <Text
            style={[
              styles.toggleText,
              filterMode === 'all' && styles.toggleTextActive,
            ]}
          >
            All Earnings
          </Text>
        </Pressable>
        <Pressable
          onPress={() => handleFilterChange('myStocks')}
          style={[
            styles.toggleButton,
            filterMode === 'myStocks' && styles.toggleButtonActive,
          ]}
        >
          <Text
            style={[
              styles.toggleText,
              filterMode === 'myStocks' && styles.toggleTextActive,
            ]}
          >
            My Stocks
          </Text>
        </Pressable>
      </View>

      {/* Calendar Content */}
      {filterMode === 'myStocks' && !hasMyStocksEarnings ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>
            No earnings coming up for your holdings.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarContent}
        >
          {filteredDays.map((day) => (
            <EarningsCalendarRow key={day.date} day={day} />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  viewMore: {
    ...typography.smallMd,
    color: colors.teal,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.md,
    padding: spacing.xxs,
  },
  toggleButton: {
    flex: 1,
    minHeight: 44,
    minWidth: 44,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  toggleButtonActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    ...typography.smallMd,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  calendarContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default EarningsCalendar;
