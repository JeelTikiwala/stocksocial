import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, typography } from '@/constants';
import { Badge, Skeleton, ZapIcon, ClockIcon, ShieldIcon, LayersIcon, ActivityIcon, GridIcon } from '@/components/ui';
import { AsOfBanner, ScreenerCard, Segmented, Disclaimer, SectionHeader_ } from '@/components/screener/_exports';
import { LiveOpportunities } from '@/components/live/LiveOpportunities';
import { useScreeners } from '@/hooks/useMarketData';
import { ZONES, isLiveScreener, type Zone } from '@/backend/src/shared';

const ZONE_ICONS = { scalper: ZapIcon, intraday: ClockIcon, seller: ShieldIcon, index: LayersIcon } as const;

export default function ScreenersScreen() {
  const { data, isLoading, refetch, isRefetching } = useScreeners();
  const [zone, setZone] = useState<Zone>('scalper');
  const specs = (data ?? []).filter((s) => s.zone === zone);
  const meta = ZONES.find((z) => z.id === zone)!;
  const Icon = ZONE_ICONS[zone];
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}>
        <View style={styles.header}><Text style={styles.title}>Screeners</Text></View>
        <AsOfBanner compact />

        <SectionHeader_ title="Live now" />
        <LiveOpportunities />

        <SectionHeader_ title="Market" />
        <View style={styles.quick}>
          {[{ l: 'Market Pulse', r: '/tools/market-pulse', I: ActivityIcon }, { l: 'Heatmap', r: '/tools/heatmap', I: GridIcon }, { l: 'Sector Scope', r: '/tools/sector-scope', I: LayersIcon }].map(({ l, r, I }) => (
            <Pressable key={l} onPress={() => router.push(r as never)} style={styles.quickItem}>
              <I size={18} color={colors.indigo} />
              <Text style={styles.quickText}>{l}</Text>
            </Pressable>
          ))}
        </View>

        <SectionHeader_ title="Zones" />
        <View style={styles.zoneRow}>
          <Segmented options={ZONES.map((z) => ({ label: z.name.replace(' Zone', ''), value: z.id }))} value={zone} onChange={setZone} />
        </View>
        <View style={styles.zoneMeta}>
          <Icon size={18} color={colors.indigo} />
          <Text style={styles.zoneTag}>{meta.tagline}</Text>
          {specs.some((s) => isLiveScreener(s.id)) && <Badge label="has live" variant="success" size="sm" />}
        </View>
        {isLoading ? [0, 1, 2].map((i) => <Skeleton key={i} height={76} style={styles.skeleton} />) : specs.map((s) => <ScreenerCard key={s.id} spec={s} live={isLiveScreener(s.id)} />)}
        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: spacing.tabBar },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs },
  title: { ...typography.h1, color: colors.textPrimary },
  quick: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md },
  quickItem: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: spacing.sm, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: colors.borderLight },
  quickText: { ...typography.smallMd, color: colors.textPrimary, fontSize: 12 },
  zoneRow: { paddingHorizontal: spacing.md, marginBottom: spacing.xs },
  zoneMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  zoneTag: { ...typography.small, color: colors.textSecondary, flex: 1 },
  skeleton: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
});
