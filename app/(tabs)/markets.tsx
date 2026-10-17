import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card, SectionHeader, SearchBar } from '@/components/ui';
import { EventCard } from '@/components/markets/EventCard';
import { EarningsCalendar } from '@/components/markets/EarningsCalendar';
import { FearGreedIndex } from '@/components/markets/FearGreedIndex';
import { BSETop50 } from '@/components/markets/BSETop50';
import { api } from '@/services/api';
import { EarningsDay } from '@/types';
import { useWatchlistStore } from '@/stores';

type MarketListKey = 'mostBought' | 'mostMentioned';

interface RankedStock {
  rank: number;
  ticker: string;
  companyName: string;
  value: number;
  changePct: number;
}

interface SectorItem {
  name: string;
  changePct: number;
  buyCount30d: number;
}

const mockEvents = [
  {
    id: '1',
    title: 'Q4 Earnings Season Preview',
    subtitle: 'Weekly Market Insights',
    dateTime: '2026-03-25T10:00:00Z',
    type: 'webinar' as const,
  },
  {
    id: '2',
    title: 'IPO Spotlight: TechCorp India',
    subtitle: 'New Listings',
    dateTime: '2026-03-28T09:00:00Z',
    type: 'ipo' as const,
  },
];

const defaultUpcomingEarnings: EarningsDay[] = [
  {
    date: '2026-03-24',
    companies: [{ ticker: 'RELIANCE', companyName: 'Reliance Industries' }],
  },
  {
    date: '2026-03-25',
    companies: [
      { ticker: 'TCS', companyName: 'Tata Consultancy Services' },
      { ticker: 'INFY', companyName: 'Infosys' },
    ],
  },
  {
    date: '2026-03-26',
    companies: [{ ticker: 'HDFCBANK', companyName: 'HDFC Bank' }],
  },
  {
    date: '2026-03-27',
    companies: [{ ticker: 'ITC', companyName: 'ITC Ltd' }],
  },
  {
    date: '2026-03-31',
    companies: [{ ticker: 'ICICIBANK', companyName: 'ICICI Bank Ltd' }],
  },
];

const defaultPastEarnings: EarningsDay[] = [
  {
    date: '2026-03-20',
    companies: [{ ticker: 'WIPRO', companyName: 'Wipro Ltd' }],
  },
  {
    date: '2026-03-19',
    companies: [{ ticker: 'BHARTIARTL', companyName: 'Bharti Airtel Ltd' }],
  },
  {
    date: '2026-03-18',
    companies: [{ ticker: 'SBIN', companyName: 'State Bank of India' }],
  },
];

const mockUserTickers = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'BHARTIARTL'];

const sectorLeaders: SectorItem[] = [
  { name: 'Technology', changePct: 2.8, buyCount30d: 12450 },
  { name: 'Financials', changePct: 1.9, buyCount30d: 10310 },
  { name: 'Energy', changePct: 1.2, buyCount30d: 8421 },
  { name: 'Healthcare', changePct: 0.9, buyCount30d: 7124 },
  { name: 'Industrials', changePct: 0.7, buyCount30d: 6942 },
  { name: 'Consumer', changePct: -0.4, buyCount30d: 5530 },
];

const baseTickers = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'ITC', 'LT', 'HCLTECH', 'AXISBANK',
  'KOTAKBANK', 'BAJFINANCE', 'MARUTI', 'SUNPHARMA', 'TITAN', 'ULTRACEMCO', 'NESTLEIND', 'WIPRO', 'POWERGRID', 'NTPC',
];

const createTopStocks = (mode: MarketListKey): RankedStock[] => {
  const label = mode === 'mostBought' ? 'Most Bought' : 'Most Mentioned';

  return Array.from({ length: 100 }, (_, i) => {
    const ticker = baseTickers[i % baseTickers.length];
    const rank = i + 1;
    const value = mode === 'mostBought' ? 20000 - i * 137 : 9000 - i * 61;
    const changePct = Number((3.2 - i * 0.04).toFixed(2));

    return {
      rank,
      ticker,
      companyName: `${ticker} ${label}`,
      value,
      changePct,
    };
  });
};

const mostBought = createTopStocks('mostBought');
const mostMentioned = createTopStocks('mostMentioned');
const bseTop50 = Array.from({ length: 50 }, (_, i) => {
  const ticker = baseTickers[i % baseTickers.length];
  const rank = i + 1;
  return {
    rank,
    ticker,
    companyName: `${ticker} Industries`,
    priceAppreciation: Number((72 - i * 0.9).toFixed(1)),
    marketCapGrowth: Number((58 - i * 0.6).toFixed(1)),
    marketCap: Math.max(120000000000, 1300000000000 - i * 21000000000),
  };
});

export default function MarketsScreen() {
  const watchlistTickers = useWatchlistStore((state) => state.tickers);
  const toggleWatchlistTicker = useWatchlistStore((state) => state.toggleTicker);
  const [refreshing, setRefreshing] = useState(false);
  const [showFearGreedInfo, setShowFearGreedInfo] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [showBseModal, setShowBseModal] = useState(false);
  const [earningsMode, setEarningsMode] = useState<'upcoming' | 'past'>('upcoming');
  const [activeListModal, setActiveListModal] = useState<MarketListKey | null>(null);
  const [upcomingEarnings, setUpcomingEarnings] = useState<EarningsDay[]>(defaultUpcomingEarnings);
  const [pastEarnings] = useState<EarningsDay[]>(defaultPastEarnings);
  const [fearGreedData, setFearGreedData] = useState<any>(undefined);
  const [liveMostBought, setLiveMostBought] = useState<RankedStock[]>(mostBought);
  const [liveMostMentioned, setLiveMostMentioned] = useState<RankedStock[]>(mostMentioned);
  const [searchQuery, setSearchQuery] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const from = new Date().toISOString().split('T')[0];
      const to = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const earningsRes = await api.markets.getEarningsCalendar(from, to);
      const apiEarnings = earningsRes.data?.data || [];
      if (apiEarnings.length > 0) {
        const merged = [...apiEarnings.slice(0, 40)];
        if (merged.length < 8) {
          merged.push(...defaultUpcomingEarnings.slice(0, 8 - merged.length));
        }
        setUpcomingEarnings(merged);
      }

      const fearGreedRes = await api.markets.getFearGreed();
      const fg = fearGreedRes.data?.data;
      if (fg) {
        setFearGreedData({
          score: Number(fg.score),
          label: fg.label,
          historical: fg.historical || [],
        });
      }

      const featuredRes = await api.markets.getFeaturedLists();
      const featured = featuredRes.data?.data || [];
      if (featured.length > 0) {
        const activeList = featured.find((x: any) =>
          String(x.name || '').toLowerCase().includes('active')
        ) || featured[0];
        const mentionedList = featured.find((x: any) =>
          String(x.name || '').toLowerCase().includes('gainer')
        ) || featured[Math.min(1, featured.length - 1)];

        const mapStocks = (stocks: any[]): RankedStock[] =>
          (stocks || []).slice(0, 100).map((s: any, i: number) => ({
            rank: i + 1,
            ticker: String(s.ticker || '').toUpperCase(),
            companyName: s.companyName || s.ticker || 'Ticker',
            value: 10000 - i * 41,
            changePct: Number((2.5 - i * 0.03).toFixed(2)),
          }));

        if (activeList?.stocks?.length) {
          setLiveMostBought(mapStocks(activeList.stocks));
        }
        if (mentionedList?.stocks?.length) {
          setLiveMostMentioned(mapStocks(mentionedList.stocks));
        }
      }
    } catch (e) {
      // Keep fallback local data if API fails.
    }
    setRefreshing(false);
  };

  useEffect(() => {
    onRefresh();
  }, []);

  const modalStocks = useMemo(() => {
    if (!activeListModal) return [];
    return activeListModal === 'mostBought' ? liveMostBought : liveMostMentioned;
  }, [activeListModal, liveMostBought, liveMostMentioned]);
  const marketSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const merged = [
      ...bseTop50.map((s) => ({ ticker: s.ticker, companyName: s.companyName })),
      ...liveMostBought.map((s) => ({ ticker: s.ticker, companyName: s.companyName })),
      ...liveMostMentioned.map((s) => ({ ticker: s.ticker, companyName: s.companyName })),
    ];

    const deduped = new Map<string, { ticker: string; companyName: string }>();
    for (const item of merged) {
      deduped.set(item.ticker.toUpperCase(), {
        ticker: item.ticker.toUpperCase(),
        companyName: item.companyName || item.ticker.toUpperCase(),
      });
    }

    return Array.from(deduped.values())
      .filter((item) => {
        const ticker = item.ticker.toLowerCase();
        const name = item.companyName.toLowerCase();
        return ticker.includes(q) || name.includes(q);
      })
      .slice(0, 10);
  }, [searchQuery, liveMostBought, liveMostMentioned]);

  const earningsRows = earningsMode === 'upcoming' ? upcomingEarnings : pastEarnings;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Markets</Text>
      </View>
      <View style={styles.searchWrap}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search stock by ticker or company"
        />
        {marketSearchResults.length > 0 && (
          <Card style={styles.searchResultsCard}>
            {marketSearchResults.map((item, index) => (
              <Pressable
                key={item.ticker}
                style={[styles.searchResultRow, index < marketSearchResults.length - 1 && styles.rowDivider]}
                onPress={() => {
                  setSearchQuery('');
                  router.push(`/stock/${item.ticker}`);
                }}
              >
                <View>
                  <Text style={styles.searchTicker}>{item.ticker}</Text>
                  <Text style={styles.searchCompany} numberOfLines={1}>{item.companyName}</Text>
                </View>
                <Text style={styles.searchCta}>Open</Text>
              </Pressable>
            ))}
          </Card>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Upcoming Events" actionLabel="View all" onActionPress={() => setShowEarningsModal(true)} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsCarousel}>
          {mockEvents.map((event) => (
            <EventCard key={event.id} event={event} style={styles.eventCard} />
          ))}
        </ScrollView>

        <EarningsCalendar
          earningsDays={upcomingEarnings}
          userTickers={mockUserTickers}
          style={styles.earningsCalendarSection}
          onViewMore={() => setShowEarningsModal(true)}
        />

        <BSETop50
          style={styles.bseSection}
          stocks={bseTop50}
          onViewAll={() => setShowBseModal(true)}
          watchlistTickers={watchlistTickers}
          onAddToWatchlist={toggleWatchlistTicker}
        />

        <Card style={styles.marketListCard}>
          <SectionHeader
            title="Most Bought (Top 100)"
            actionLabel="View top 100"
            onActionPress={() => setActiveListModal('mostBought')}
            style={styles.innerSectionHeader}
          />
          {liveMostBought.slice(0, 8).map((stock, index) => (
            <StockRow
              key={`buy-${stock.ticker}-${stock.rank}`}
              stock={stock}
              showDivider={index < 7}
              onPress={() => router.push(`/stock/${stock.ticker}`)}
            />
          ))}
        </Card>

        <Card style={styles.marketListCard}>
          <SectionHeader title="Sector List" style={styles.innerSectionHeader} />
          {sectorLeaders.map((sector, index) => (
            <View
              key={sector.name}
              style={[styles.sectorRow, index < sectorLeaders.length - 1 && styles.rowDivider]}
            >
              <View>
                <Text style={styles.sectorName}>{sector.name}</Text>
                <Text style={styles.sectorMeta}>{sector.buyCount30d.toLocaleString()} buys in app (30d)</Text>
              </View>
              <Text style={[styles.sectorChange, { color: sector.changePct >= 0 ? colors.gain : colors.loss }]}>
                {sector.changePct >= 0 ? '+' : ''}{sector.changePct.toFixed(2)}%
              </Text>
            </View>
          ))}
        </Card>

        <Card style={styles.marketListCard}>
          <SectionHeader
            title="Most Mentioned In App (Top 100)"
            actionLabel="View top 100"
            onActionPress={() => setActiveListModal('mostMentioned')}
            style={styles.innerSectionHeader}
          />
          {liveMostMentioned.slice(0, 8).map((stock, index) => (
            <StockRow
              key={`mention-${stock.ticker}-${stock.rank}`}
              stock={stock}
              showDivider={index < 7}
              onPress={() => router.push(`/stock/${stock.ticker}`)}
            />
          ))}
        </Card>

        <FearGreedIndex
          data={fearGreedData}
          style={styles.fearGreedCard}
          onInfoPress={() => setShowFearGreedInfo(true)}
        />
      </ScrollView>

      <Modal visible={showEarningsModal} animationType="slide" transparent onRequestClose={() => setShowEarningsModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowEarningsModal(false)}>
          <Pressable style={styles.bottomSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Earnings Calendar</Text>

            <View style={styles.modeToggle}>
              <Pressable
                onPress={() => setEarningsMode('upcoming')}
                style={[styles.modeButton, earningsMode === 'upcoming' && styles.modeButtonActive]}
              >
                <Text style={[styles.modeText, earningsMode === 'upcoming' && styles.modeTextActive]}>Upcoming</Text>
              </Pressable>
              <Pressable
                onPress={() => setEarningsMode('past')}
                style={[styles.modeButton, earningsMode === 'past' && styles.modeButtonActivePast]}
              >
                <Text style={[styles.modeText, earningsMode === 'past' && styles.modeTextActive]}>Past</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {earningsRows.map((day) => (
                <View key={`${earningsMode}-${day.date}`} style={styles.earningsRowWrap}>
                  <Text style={styles.earningsDate}>{day.date}</Text>
                  {day.companies.map((company) => (
                    <Pressable
                      key={company.ticker}
                      style={styles.earningsCompany}
                      onPress={() => router.push(`/stock/${company.ticker}`)}
                    >
                      <Text style={styles.earningsTicker}>{company.ticker}</Text>
                      <Text style={styles.earningsCompanyName}>{company.companyName}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!activeListModal} animationType="slide" transparent onRequestClose={() => setActiveListModal(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setActiveListModal(null)}>
          <Pressable style={styles.bottomSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{activeListModal === 'mostBought' ? 'Most Bought Top 100' : 'Most Mentioned Top 100'}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {modalStocks.map((stock, index) => (
                <StockRow
                  key={`${activeListModal}-${stock.ticker}-${stock.rank}`}
                  stock={stock}
                  showDivider={index < modalStocks.length - 1}
                  onPress={() => {
                    setActiveListModal(null);
                    router.push(`/stock/${stock.ticker}`);
                  }}
                />
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showBseModal} animationType="slide" transparent onRequestClose={() => setShowBseModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowBseModal(false)}>
          <Pressable style={styles.bottomSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>BSE Top 50</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {bseTop50.map((stock, index) => (
                <StockRow
                  key={`bse-${stock.ticker}-${stock.rank}`}
                  stock={{
                    rank: stock.rank,
                    ticker: stock.ticker,
                    companyName: stock.companyName,
                    value: stock.marketCap,
                    changePct: stock.priceAppreciation,
                  }}
                  showDivider={index < bseTop50.length - 1}
                  onPress={() => {
                    setShowBseModal(false);
                    router.push(`/stock/${stock.ticker}`);
                  }}
                />
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showFearGreedInfo} animationType="slide" transparent onRequestClose={() => setShowFearGreedInfo(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowFearGreedInfo(false)}>
          <Pressable style={styles.bottomSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>How Fear & Greed Works</Text>
            <Text style={styles.sheetBody}>
              The Fear & Greed Index summarizes market sentiment on a 0-100 scale. Lower values indicate risk-off behavior (fear), while higher values indicate risk-on behavior (greed).
            </Text>
            <Text style={styles.sheetBody}>
              It is calculated from breadth, momentum, volatility, and demand indicators. Use it as sentiment context, not as a standalone buy/sell signal.
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function StockRow({
  stock,
  onPress,
  showDivider,
}: {
  stock: RankedStock;
  onPress: () => void;
  showDivider: boolean;
}) {
  return (
    <Pressable style={[styles.stockRow, showDivider && styles.rowDivider]} onPress={onPress}>
      <View style={styles.stockLeft}>
        <Text style={styles.stockRank}>#{stock.rank}</Text>
        <View>
          <Text style={styles.stockTicker}>{stock.ticker}</Text>
          <Text style={styles.stockCompany} numberOfLines={1}>{stock.companyName}</Text>
        </View>
      </View>

      <View style={styles.stockRight}>
        <Text style={styles.stockValue}>{stock.value.toLocaleString()}</Text>
        <Text style={[styles.stockChange, { color: stock.changePct >= 0 ? colors.gain : colors.loss }]}>
          {stock.changePct >= 0 ? '+' : ''}{stock.changePct.toFixed(2)}%
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  searchWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  searchResultsCard: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    padding: 0,
    overflow: 'hidden',
  },
  searchResultRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  searchTicker: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  searchCompany: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
    maxWidth: 220,
  },
  searchCta: {
    ...typography.smallMd,
    color: colors.teal,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing.xxl,
  },
  eventsCarousel: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  eventCard: {
    width: 300,
  },
  earningsCalendarSection: {
    marginTop: spacing.sm,
  },
  bseSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  marketListCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  innerSectionHeader: {
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  stockRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  stockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  stockRank: {
    ...typography.smallMd,
    color: colors.textTertiary,
    width: 32,
  },
  stockTicker: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  stockCompany: {
    ...typography.small,
    color: colors.textSecondary,
    maxWidth: 170,
  },
  stockRight: {
    alignItems: 'flex-end',
    minWidth: 84,
  },
  stockValue: {
    ...typography.smallMd,
    color: colors.textPrimary,
  },
  stockChange: {
    ...typography.small,
    marginTop: 2,
  },
  sectorRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectorName: {
    ...typography.bodyMd,
    color: colors.textPrimary,
  },
  sectorMeta: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectorChange: {
    ...typography.bodyMd,
    fontWeight: '600',
  },
  fearGreedCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
    maxHeight: '82%',
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sheetBody: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.md,
    padding: spacing.xxs,
    marginBottom: spacing.md,
  },
  modeButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  modeButtonActive: {
    backgroundColor: colors.tealLight,
  },
  modeButtonActivePast: {
    backgroundColor: '#FFF3E8',
  },
  modeText: {
    ...typography.smallMd,
    color: colors.textSecondary,
  },
  modeTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  earningsRowWrap: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  earningsDate: {
    ...typography.smallMd,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  earningsCompany: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  earningsTicker: {
    ...typography.bodyMd,
    color: colors.teal,
    fontWeight: '600',
  },
  earningsCompanyName: {
    ...typography.small,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.sm,
  },
});
