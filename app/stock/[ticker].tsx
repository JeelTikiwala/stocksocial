import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card, Skeleton } from '@/components/ui';
import { MiniSparkline } from '@/components/charts/MiniSparkline';
import { api } from '@/services/api';
import { formatIndianNumber } from '@/utils';

interface StockQuote {
  ticker: string;
  companyName: string;
  exchange: string;
  currentPrice: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  peRatio: number | null;
  pbRatio: number | null;
  dividendYield: number | null;
  eps: number | null;
  dayChange: number;
  dayChangePercent: number;
  currency: string;
}

interface CompanyInfo {
  sector: string;
  industry: string;
  description: string;
  website: string;
  employees: number | null;
  headquarters: string;
}

interface StockNews {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
}

interface ActivityData {
  trades: {
    buyCount: number;
    sellCount: number;
    totalTrades: number;
    buyPercent: number;
    sellPercent: number;
  };
  users: {
    uniqueBuyers: number;
    uniqueSellers: number;
  };
  watchlistAdds: number;
  netFlow: number;
}

interface HistoricalData {
  date: string;
  close: number;
}

export default function StockDetailScreen() {
  const params = useLocalSearchParams<{ ticker?: string; exchange?: string }>();
  const ticker = (params.ticker || 'UNKNOWN').toUpperCase();
  const exchange = (params.exchange || 'NSE').toUpperCase();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [info, setInfo] = useState<CompanyInfo | null>(null);
  const [news, setNews] = useState<StockNews[]>([]);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [history, setHistory] = useState<HistoricalData[]>([]);
  const [selectedRange, setSelectedRange] = useState<'1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y'>('1mo');
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Fetch all data in parallel
      const [detailsRes, newsRes, activityRes, historyRes] = await Promise.all([
        api.stocks.getDetails(ticker, exchange),
        api.stocks.getNews(ticker),
        api.stocks.getActivity(ticker, 30).catch(() => ({ data: { data: null } })),
        api.stocks.getHistory(ticker, exchange, selectedRange, '1d'),
      ]);

      if (detailsRes.data?.data?.quote) {
        setQuote(detailsRes.data.data.quote);
        setInfo(detailsRes.data.data.info);
      }

      if (newsRes.data?.data) {
        setNews(newsRes.data.data.slice(0, 5));
      }

      if (activityRes.data?.data) {
        setActivity(activityRes.data.data);
      }

      if (historyRes.data?.data) {
        setHistory(historyRes.data.data);
      }

      // Track view
      api.stocks.trackView(ticker).catch(() => {});
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError('Unable to load stock data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [ticker, exchange, selectedRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const changeRange = async (range: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y') => {
    setSelectedRange(range);
    try {
      const historyRes = await api.stocks.getHistory(ticker, exchange, range, '1d');
      if (historyRes.data?.data) {
        setHistory(historyRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const sparklineData = history.map(h => h.close);
  const isPositive = quote ? quote.dayChangePercent >= 0 : true;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{ticker}</Text>
        </View>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Card style={styles.heroCard}>
            <Skeleton width={150} height={20} />
            <Skeleton width={120} height={32} style={{ marginTop: spacing.sm }} />
            <Skeleton width={80} height={16} style={{ marginTop: spacing.xs }} />
          </Card>
          <Card style={styles.sectionCard}>
            <Skeleton width={100} height={18} />
            <Skeleton width="100%" height={74} style={{ marginTop: spacing.sm }} />
          </Card>
          <Card style={styles.sectionCard}>
            <Skeleton width={100} height={18} />
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} width="100%" height={40} style={{ marginTop: spacing.xs }} />
            ))}
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error || !quote) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{ticker}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Stock not found'}</Text>
          <Pressable style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{ticker}</Text>
        <View style={styles.exchangeBadge}>
          <Text style={styles.exchangeText}>{exchange}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />
        }
      >
        {/* Price Card */}
        <Card style={styles.heroCard}>
          <Text style={styles.companyName}>{quote.companyName}</Text>
          <Text style={styles.price}>₹{formatIndianNumber(quote.currentPrice)}</Text>
          <View style={styles.changeRow}>
            <Text style={[styles.dayChange, { color: isPositive ? colors.gain : colors.loss }]}>
              {isPositive ? '+' : ''}{quote.dayChange.toFixed(2)} ({isPositive ? '+' : ''}{quote.dayChangePercent.toFixed(2)}%)
            </Text>
            <Text style={styles.timeLabel}>Today</Text>
          </View>
        </Card>

        {/* Price Chart */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Price Chart</Text>
          <View style={styles.rangeSelector}>
            {(['1d', '5d', '1mo', '3mo', '6mo', '1y'] as const).map(range => (
              <Pressable
                key={range}
                style={[styles.rangeButton, selectedRange === range && styles.rangeButtonActive]}
                onPress={() => changeRange(range)}
              >
                <Text style={[styles.rangeText, selectedRange === range && styles.rangeTextActive]}>
                  {range.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.chartWrap}>
            {sparklineData.length > 0 ? (
              <MiniSparkline
                data={sparklineData}
                width={320}
                height={100}
                color={isPositive ? colors.gain : colors.loss}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No chart data available</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Key Stats */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Key Statistics</Text>
          <View style={styles.statsGrid}>
            <StatItem label="Open" value={`₹${formatIndianNumber(quote.open)}`} />
            <StatItem label="Previous Close" value={`₹${formatIndianNumber(quote.previousClose)}`} />
            <StatItem label="Day High" value={`₹${formatIndianNumber(quote.dayHigh)}`} />
            <StatItem label="Day Low" value={`₹${formatIndianNumber(quote.dayLow)}`} />
            <StatItem label="52W High" value={`₹${formatIndianNumber(quote.fiftyTwoWeekHigh)}`} />
            <StatItem label="52W Low" value={`₹${formatIndianNumber(quote.fiftyTwoWeekLow)}`} />
            <StatItem label="Volume" value={formatIndianNumber(quote.volume)} />
            <StatItem label="Avg Volume" value={formatIndianNumber(quote.avgVolume)} />
          </View>
        </Card>

        {/* Fundamentals */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Fundamentals</Text>
          <View style={styles.statsGrid}>
            <StatItem
              label="Market Cap"
              value={quote.marketCap > 0 ? `₹${formatMarketCap(quote.marketCap)}` : 'N/A'}
            />
            <StatItem label="P/E Ratio" value={quote.peRatio?.toFixed(2) || 'N/A'} />
            <StatItem label="P/B Ratio" value={quote.pbRatio?.toFixed(2) || 'N/A'} />
            <StatItem label="EPS" value={quote.eps ? `₹${quote.eps.toFixed(2)}` : 'N/A'} />
            <StatItem
              label="Dividend Yield"
              value={quote.dividendYield ? `${quote.dividendYield.toFixed(2)}%` : 'N/A'}
            />
          </View>
        </Card>

        {/* In-App Activity */}
        {activity && (activity.trades.totalTrades > 0 || activity.watchlistAdds > 0) && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>StockCircle Activity (30D)</Text>
            <View style={styles.activityContainer}>
              {activity.trades.totalTrades > 0 && (
                <>
                  <View style={styles.activityBar}>
                    <View
                      style={[
                        styles.buyBar,
                        { flex: activity.trades.buyPercent },
                      ]}
                    />
                    <View
                      style={[
                        styles.sellBar,
                        { flex: activity.trades.sellPercent },
                      ]}
                    />
                  </View>
                  <View style={styles.activityLabels}>
                    <Text style={styles.buyLabel}>
                      {activity.trades.buyPercent}% Bought ({activity.users.uniqueBuyers} users)
                    </Text>
                    <Text style={styles.sellLabel}>
                      {activity.trades.sellPercent}% Sold ({activity.users.uniqueSellers} users)
                    </Text>
                  </View>
                </>
              )}
              {activity.watchlistAdds > 0 && (
                <View style={styles.watchlistRow}>
                  <Text style={styles.watchlistText}>
                    👀 Added to {activity.watchlistAdds} watchlists this month
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Company Info */}
        {info && (info.sector || info.industry || info.description) && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>About {quote.companyName}</Text>
            {(info.sector || info.industry) && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sector / Industry</Text>
                <Text style={styles.infoValue}>
                  {info.sector}{info.industry ? ` / ${info.industry}` : ''}
                </Text>
              </View>
            )}
            {info.headquarters && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Headquarters</Text>
                <Text style={styles.infoValue}>{info.headquarters}</Text>
              </View>
            )}
            {info.employees && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Employees</Text>
                <Text style={styles.infoValue}>{formatIndianNumber(info.employees)}</Text>
              </View>
            )}
            {info.description && (
              <Text style={styles.description} numberOfLines={4}>
                {info.description}
              </Text>
            )}
            {info.website && (
              <Pressable onPress={() => Linking.openURL(info.website)}>
                <Text style={styles.websiteLink}>{info.website}</Text>
              </Pressable>
            )}
          </Card>
        )}

        {/* News */}
        {news.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Latest News</Text>
            {news.map((item, index) => (
              <Pressable
                key={index}
                style={[styles.newsItem, index < news.length - 1 && styles.newsItemBorder]}
                onPress={() => Linking.openURL(item.link)}
              >
                <Text style={styles.newsTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.newsMeta}>
                  {item.source} • {formatTimeAgo(item.publishedAt)}
                </Text>
              </Pressable>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e7) return `${(value / 1e7).toFixed(2)}Cr`;
  if (value >= 1e5) return `${(value / 1e5).toFixed(2)}L`;
  return formatIndianNumber(value);
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  backButton: {
    position: 'absolute',
    left: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  backText: {
    ...typography.smallMd,
    color: colors.teal,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  exchangeBadge: {
    position: 'absolute',
    right: spacing.md,
    backgroundColor: colors.purpleLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  exchangeText: {
    ...typography.small,
    color: colors.purple,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  heroCard: {
    padding: spacing.md,
  },
  companyName: {
    ...typography.body,
    color: colors.textSecondary,
  },
  price: {
    ...typography.h1,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  dayChange: {
    ...typography.bodyMd,
  },
  timeLabel: {
    ...typography.small,
    color: colors.textTertiary,
  },
  sectionCard: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  rangeSelector: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  rangeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.offWhite,
  },
  rangeButtonActive: {
    backgroundColor: colors.tealLight,
  },
  rangeText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  rangeTextActive: {
    color: colors.teal,
    fontWeight: '600',
  },
  chartWrap: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  noDataContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    ...typography.small,
    color: colors.textTertiary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    paddingVertical: spacing.xs,
  },
  statLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    marginTop: 2,
  },
  activityContainer: {
    gap: spacing.sm,
  },
  activityBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  buyBar: {
    backgroundColor: colors.gain,
  },
  sellBar: {
    backgroundColor: colors.loss,
  },
  activityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buyLabel: {
    ...typography.small,
    color: colors.gain,
  },
  sellLabel: {
    ...typography.small,
    color: colors.loss,
  },
  watchlistRow: {
    marginTop: spacing.xs,
  },
  watchlistText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.smallMd,
    color: colors.textPrimary,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.md,
  },
  description: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  websiteLink: {
    ...typography.smallMd,
    color: colors.teal,
    marginTop: spacing.sm,
  },
  newsItem: {
    paddingVertical: spacing.sm,
  },
  newsItemBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  newsTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  newsMeta: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: spacing.xxs,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.teal,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryText: {
    ...typography.bodyMd,
    color: colors.white,
  },
});
