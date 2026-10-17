import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Linking,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card, Avatar } from '@/components/ui';
import { formatCompactIndian, formatPercentage } from '@/utils';

interface BSEStock {
  rank: number;
  ticker: string;
  companyName: string;
  logoUrl?: string;
  priceAppreciation: number; // % change in 1 year
  marketCapGrowth: number; // % change in market cap
  marketCap: number; // Current market cap in INR
}

interface BSETop50Props {
  stocks?: BSEStock[];
  asOfDate?: string;
  avgPriceAppreciation?: number;
  avgMarketCapGrowth?: number;
  totalMarketCapCreation?: number;
  onViewAll?: () => void;
  onAddToWatchlist?: (ticker: string) => void;
  watchlistTickers?: string[];
  style?: ViewStyle;
}

// Mock data
const mockBSEStocks: BSEStock[] = [
  { rank: 1, ticker: 'TATAMOTORS', companyName: 'Tata Motors Ltd', priceAppreciation: 89.5, marketCapGrowth: 75.2, marketCap: 315000000000 },
  { rank: 2, ticker: 'ADANIPORTS', companyName: 'Adani Ports and SEZ', priceAppreciation: 72.3, marketCapGrowth: 68.1, marketCap: 285000000000 },
  { rank: 3, ticker: 'BHARTIARTL', companyName: 'Bharti Airtel Ltd', priceAppreciation: 65.8, marketCapGrowth: 58.4, marketCap: 720000000000 },
  { rank: 4, ticker: 'BAJFINANCE', companyName: 'Bajaj Finance Ltd', priceAppreciation: 58.2, marketCapGrowth: 52.3, marketCap: 485000000000 },
  { rank: 5, ticker: 'HDFCBANK', companyName: 'HDFC Bank Ltd', priceAppreciation: 45.6, marketCapGrowth: 41.2, marketCap: 1250000000000 },
];

export const BSETop50: React.FC<BSETop50Props> = ({
  stocks = mockBSEStocks,
  asOfDate = '2026-03-15',
  avgPriceAppreciation = 66.3,
  avgMarketCapGrowth = 59.0,
  totalMarketCapCreation = 1850000000000,
  onViewAll,
  onAddToWatchlist,
  watchlistTickers = [],
  style,
}) => {
  const displayedStocks = stocks.slice(0, 5);

  const handleBSELink = () => {
    Linking.openURL('https://www.bseindia.com');
  };

  return (
    <Card style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>BSE Top 50™</Text>
          <Text style={styles.subtitle}>
            Top-performing BSE companies over the last year
          </Text>
          <Text style={styles.methodology}>
            Ranked using equal weights of 1Y price appreciation, market cap increase, and consolidated trading value
          </Text>
        </View>
        <View style={styles.headerDecoration}>
          <View style={[styles.decorCircle, { backgroundColor: colors.teal, left: 0, top: 0 }]} />
          <View style={[styles.decorCircle, { backgroundColor: colors.purple, left: 15, top: 8 }]} />
          <View style={[styles.decorCircle, { backgroundColor: colors.warning, left: 8, top: 20 }]} />
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatPercentage(avgPriceAppreciation)}</Text>
          <Text style={styles.statLabel}>Avg. Share Price Appreciation %</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatPercentage(avgMarketCapGrowth)}</Text>
          <Text style={styles.statLabel}>Avg. Market Cap Growth %</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹{formatCompactIndian(totalMarketCapCreation)}</Text>
          <Text style={styles.statLabel}>Total Market Cap Creation (₹ INR)</Text>
        </View>
      </View>

      {/* Stock List */}
      <View style={styles.stockList}>
        {displayedStocks.map((stock, index) => {
          const isAdded = watchlistTickers.includes(stock.ticker.toUpperCase());
          return (
            <View
              key={stock.ticker}
              style={[
                styles.stockRow,
                index < displayedStocks.length - 1 && styles.stockRowBorder,
              ]}
            >
              <View style={styles.stockLeft}>
                <Text style={styles.stockRank}>#{stock.rank}</Text>
                <Avatar name={stock.companyName} size="md" />
                <View style={styles.stockInfo}>
                  <Text style={styles.stockTicker}>{stock.ticker}</Text>
                  <Text style={styles.stockName} numberOfLines={1}>
                    {stock.companyName}
                  </Text>
                </View>
              </View>
              <View style={styles.stockRight}>
                <Text style={styles.stockChange}>
                  +{stock.priceAppreciation.toFixed(1)}%
                </Text>
                <Pressable
                  onPress={() => onAddToWatchlist?.(stock.ticker)}
                  style={[styles.addButton, isAdded && styles.addedButton]}
                  hitSlop={10}
                >
                  <Text style={[styles.addButtonText, isAdded && styles.addedButtonText]}>
                    {isAdded ? '✓' : '+'}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable onPress={onViewAll} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View all →</Text>
        </Pressable>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          As of {new Date(asOfDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          {' · '}
          <Text style={styles.disclaimerLink} onPress={handleBSELink}>
            BSE India
          </Text>
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  methodology: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: spacing.xxs,
  },
  headerDecoration: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  decorCircle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.offWhite,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.bodyMd,
    color: colors.gain,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: 2,
    fontSize: 9,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xxs,
  },
  stockList: {
    paddingHorizontal: spacing.md,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  stockRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  stockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  stockRank: {
    ...typography.small,
    color: colors.textTertiary,
    width: 24,
  },
  stockInfo: {
    flex: 1,
  },
  stockTicker: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  stockName: {
    ...typography.small,
    color: colors.textSecondary,
  },
  stockRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stockChange: {
    ...typography.bodyMd,
    color: colors.gain,
    fontWeight: '600',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: colors.teal,
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 22,
  },
  addedButton: {
    backgroundColor: colors.teal,
  },
  addedButtonText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 16,
  },
  footer: {
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  viewAllButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  viewAllText: {
    ...typography.smallMd,
    color: colors.teal,
  },
  disclaimer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  disclaimerText: {
    ...typography.small,
    color: colors.textTertiary,
    fontSize: 10,
  },
  disclaimerLink: {
    color: colors.teal,
    textDecorationLine: 'underline',
  },
});

export default BSETop50;
