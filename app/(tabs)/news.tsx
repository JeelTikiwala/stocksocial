import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card, ExternalLinkIcon } from '@/components/ui';
import { AsOfBanner, Segmented, LoadingBlock, ErrorBlock, Disclaimer } from '@/components/screener';
import { useNews } from '@/hooks/useMarketData';
import { useWatchlistStore } from '@/stores';
import { formatRelativeTime } from '@/utils';
import type { NewsItem } from '@/types';

type Filter = 'all' | NewsItem['topic'];

export default function NewsScreen() {
  const tickers = useWatchlistStore((s) => s.tickers);
  const { data, isLoading, isError, error, refetch, isRefetching } = useNews(tickers);
  const [filter, setFilter] = useState<Filter>('all');
  const items = useMemo(() => (data?.items ?? []).filter((n) => filter === 'all' || n.topic === filter), [data, filter]);
  const open = (url: string) => (Platform.OS === 'web' ? Linking.openURL(url) : WebBrowser.openBrowserAsync(url));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.title}>News</Text>
              <Text style={styles.source}>{data?.source === 'google-news' ? 'Google News · India' : 'Mock headlines'}</Text>
            </View>
            <AsOfBanner compact />
            <View style={styles.filters}>
              <Segmented options={[{ label: 'All', value: 'all' as Filter }, { label: 'Market', value: 'market' as Filter }, { label: 'Stocks', value: 'stock' as Filter }, { label: 'Policy', value: 'policy' as Filter }, { label: 'Global', value: 'global' as Filter }]} value={filter} onChange={setFilter} />
            </View>
            {isLoading && <LoadingBlock rows={5} height={84} />}
            {isError && <ErrorBlock error={error} onRetry={refetch} />}
          </View>
        }
        renderItem={({ item }) => (
          <Card onPress={() => open(item.url)} style={styles.card} padding="md" variant="elevated">
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{item.source} · {formatRelativeTime(item.publishedAt)} ago</Text>
              <ExternalLinkIcon size={14} color={colors.textTertiary} />
            </View>
            <Text style={styles.headline}>{item.title}</Text>
            {item.symbols.length > 0 && (
              <View style={styles.chips}>
                {item.symbols.map((s) => (
                  <Pressable key={s} onPress={() => router.push(`/stock/${s}` as never)} style={styles.chip}><Text style={styles.chipText}>{s}</Text></Pressable>
                ))}
              </View>
            )}
          </Card>
        )}
        ListEmptyComponent={!isLoading && !isError ? <Text style={styles.empty}>No headlines for this filter.</Text> : null}
        ListFooterComponent={<Disclaimer extra="Headlines link to their publishers; Delta does not editorialise them." />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: spacing.tabBar },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs },
  title: { ...typography.h1, color: colors.textPrimary },
  source: { ...typography.small, color: colors.textTertiary },
  filters: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  card: { marginHorizontal: spacing.md, marginBottom: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  meta: { ...typography.small, color: colors.textTertiary },
  headline: { ...typography.bodyMd, color: colors.textPrimary, lineHeight: 21 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.xs },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full, backgroundColor: colors.indigoLight },
  chipText: { fontSize: 11, fontWeight: '600', color: colors.indigo },
  empty: { ...typography.small, color: colors.textTertiary, textAlign: 'center', padding: spacing.xl },
});
