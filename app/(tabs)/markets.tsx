import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { SearchBar } from '@/components/ui';
import { borderRadius, colors, spacing, typography } from '@/constants';
import { useWatchlistStore } from '@/stores';

const stocks = [
  { ticker: 'RELIANCE', name: 'Reliance Industries', price: '₹2,948.20', change: 1.42 },
  { ticker: 'HDFCBANK', name: 'HDFC Bank', price: '₹1,782.45', change: 0.68 },
  { ticker: 'TCS', name: 'Tata Consultancy Services', price: '₹4,126.10', change: -0.31 },
  { ticker: 'INFY', name: 'Infosys', price: '₹1,864.70', change: 1.08 },
  { ticker: 'ICICIBANK', name: 'ICICI Bank', price: '₹1,326.30', change: -0.16 },
];

export default function MarketsScreen() {
  const [query, setQuery] = useState('');
  const watchlist = useWatchlistStore((state) => state.tickers);
  const toggle = useWatchlistStore((state) => state.toggleTicker);
  const visible = useMemo(() => stocks.filter((stock) => `${stock.ticker} ${stock.name}`.toLowerCase().includes(query.trim().toLowerCase())), [query]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>DISCOVER</Text>
        <Text style={styles.title}>Markets</Text>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search companies" style={styles.search} />

        {!query && (
          <View style={styles.indices}>
            <Index label="NIFTY 50" value="24,834.70" change="+0.84%" positive />
            <View style={styles.divider} />
            <Index label="SENSEX" value="81,741.34" change="+0.79%" positive />
          </View>
        )}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{query ? 'Results' : 'Market movers'}</Text>
          <Text style={styles.asOf}>NSE · Live</Text>
        </View>

        <View style={styles.list}>
          {visible.map((stock, index) => {
            const saved = watchlist.includes(stock.ticker);
            return (
              <Pressable key={stock.ticker} style={[styles.row, index < visible.length - 1 && styles.rowBorder]} onPress={() => router.push(`/stock/${stock.ticker}`)}>
                <View style={styles.logo}><Text style={styles.logoText}>{stock.ticker[0]}</Text></View>
                <View style={styles.stockCopy}>
                  <Text style={styles.ticker}>{stock.ticker}</Text>
                  <Text style={styles.company} numberOfLines={1}>{stock.name}</Text>
                </View>
                <View style={styles.priceCopy}>
                  <Text style={styles.price}>{stock.price}</Text>
                  <Text style={[styles.change, { color: stock.change >= 0 ? colors.gain : colors.loss }]}>{stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}%</Text>
                </View>
                <Pressable
                  accessibilityLabel={`${saved ? 'Remove' : 'Add'} ${stock.ticker} ${saved ? 'from' : 'to'} watchlist`}
                  style={[styles.watch, saved && styles.watchSaved]}
                  onPress={(event) => { event.stopPropagation(); toggle(stock.ticker); }}
                >
                  <Text style={[styles.watchText, saved && styles.watchTextSaved]}>{saved ? '✓' : '+'}</Text>
                </Pressable>
              </Pressable>
            );
          })}
          {visible.length === 0 && <Text style={styles.empty}>No companies match “{query}”.</Text>}
        </View>

        {!query && (
          <View style={styles.note}>
            <Text style={styles.noteLabel}>THIS WEEK</Text>
            <Text style={styles.noteTitle}>Earnings to watch</Text>
            <Text style={styles.noteBody}>TCS on Tuesday · Infosys on Thursday · HDFC Bank on Friday</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Index({ label, value, change, positive }: { label: string; value: string; change: string; positive?: boolean }) {
  return <View style={styles.index}><Text style={styles.indexLabel}>{label}</Text><Text style={styles.indexValue}>{value}</Text><Text style={[styles.change, { color: positive ? colors.gain : colors.loss }]}>{change}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.offWhite },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxxl },
  eyebrow: { ...typography.label, color: colors.teal, marginTop: spacing.md },
  title: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.xxs },
  search: { marginTop: spacing.lg },
  indices: { flexDirection: 'row', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.lg, paddingVertical: spacing.md, marginTop: spacing.md },
  index: { flex: 1, paddingHorizontal: spacing.md },
  divider: { width: 1, backgroundColor: colors.borderLight },
  indexLabel: { ...typography.label, color: colors.textTertiary },
  indexValue: { ...typography.h4, color: colors.textPrimary, marginTop: spacing.xs },
  change: { ...typography.smallMd, fontWeight: '700', marginTop: 3 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  asOf: { ...typography.small, color: colors.textTertiary },
  list: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  logo: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.tealLight, alignItems: 'center', justifyContent: 'center' },
  logoText: { ...typography.bodyMd, color: colors.teal, fontWeight: '700' },
  stockCopy: { flex: 1, marginLeft: spacing.sm },
  ticker: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '700' },
  company: { ...typography.small, color: colors.textTertiary, marginTop: 2 },
  priceCopy: { alignItems: 'flex-end', marginLeft: spacing.xs },
  price: { ...typography.smallMd, color: colors.textPrimary, fontWeight: '600' },
  watch: { width: 30, height: 30, marginLeft: spacing.sm, borderRadius: 15, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  watchSaved: { backgroundColor: colors.teal, borderColor: colors.teal },
  watchText: { fontSize: 18, color: colors.textSecondary, lineHeight: 20 },
  watchTextSaved: { color: colors.white, fontSize: 14 },
  empty: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
  note: { marginTop: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.lg, backgroundColor: colors.indigo },
  noteLabel: { ...typography.label, color: '#AFC5C2' },
  noteTitle: { ...typography.h3, color: colors.white, marginTop: spacing.xs },
  noteBody: { ...typography.body, color: '#D5E1DF', marginTop: spacing.xs },
});
