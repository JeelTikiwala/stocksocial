import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card } from '@/components/ui';
import { ScreenHeader, AsOfBanner, AvailabilityBadge, ParamChips, ResultsTable, LoadingBlock, ErrorBlock, Disclaimer, Segmented, LiveBadge } from '@/components/screener';
import { useScreenerRun, useScreeners } from '@/hooks/useMarketData';
import { useLiveScreener, useLiveStatus } from '@/hooks/useLive';
import { isLiveScreener, LIVE_PARAMS, LIVE_COLUMNS } from '@/backend/src/shared';
import type { ParamValue } from '@/types';

type Mode = 'live' | 'eod';

export default function ScreenerScreen() {
  const { id, mode: modeParam } = useLocalSearchParams<{ id: string; mode?: string }>();
  const { data: specs } = useScreeners();
  const spec = specs?.find((s) => s.id === id);
  const liveCapable = !!id && isLiveScreener(id);
  const status = useLiveStatus();
  const [mode, setMode] = useState<Mode>(modeParam === 'live' ? 'live' : 'eod');
  // Default to live once the feed is up, unless the user explicitly chose EOD.
  const [touched, setTouched] = useState(modeParam === 'live');
  useEffect(() => { if (liveCapable && !touched && status?.connected) setMode('live'); }, [liveCapable, touched, status?.connected]);

  const [overrides, setOverrides] = useState<Record<string, ParamValue>>({});
  const paramDefs = mode === 'live' && liveCapable ? LIVE_PARAMS[id as keyof typeof LIVE_PARAMS] : spec?.params ?? [];
  const params = useMemo(() => {
    const out: Record<string, ParamValue> = {};
    for (const p of paramDefs) out[p.key] = overrides[`${mode}:${p.key}`] ?? p.default;
    return out;
  }, [paramDefs, overrides, mode]);

  const eodRun = useScreenerRun(spec && spec.availability !== 'placeholder' && mode === 'eod' ? spec.id : undefined, params, 200);
  const liveRun = useLiveScreener(mode === 'live' && liveCapable ? (id as 'premium-spike') : undefined, params);
  const [, tick] = useState(0);
  useEffect(() => { if (mode !== 'live') return; const t = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(t); }, [mode]);

  if (!spec) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Screener" />
        {specs ? <Text style={styles.missing}>Unknown screener “{id}”.</Text> : <LoadingBlock />}
      </SafeAreaView>
    );
  }

  const columns = mode === 'live' && liveCapable ? LIVE_COLUMNS[id as keyof typeof LIVE_COLUMNS] : spec.columns;
  const ago = liveRun ? Math.max(0, Math.round((Date.now() - liveRun.asOf) / 1000)) : null;

  const header = (
    <View>
      <AsOfBanner compact />
      {liveCapable && (
        <View style={styles.modeRow}>
          <Segmented options={[{ label: 'Live', value: 'live' as Mode }, { label: 'EOD', value: 'eod' as Mode }]} value={mode} onChange={(m) => { setTouched(true); setMode(m); }} />
          {mode === 'live' && <Text style={styles.updated}>{status?.connected ? (ago == null ? 'waiting for ticks…' : `updated ${ago}s ago`) : status?.note ?? 'feed off'}</Text>}
        </View>
      )}
      <Card style={styles.about} padding="sm" variant="flat">
        <View style={styles.aboutRow}>
          {mode === 'live' ? <LiveBadge compact /> : <AvailabilityBadge availability={spec.availability} mode={spec.mode} size="md" />}
          <Text style={styles.mode}>{mode === 'live' ? 'Streaming — rolling 5-minute windows' : `Needs ${spec.mode} data`}</Text>
        </View>
        <Text style={styles.description}>{spec.description}</Text>
        {mode === 'eod' && spec.eodNote ? <Text style={styles.note}>{spec.eodNote}</Text> : null}
      </Card>
      {spec.availability === 'placeholder' && mode === 'eod' ? (
        <Card style={styles.placeholder} padding="md" variant="outlined">
          <Text style={styles.placeholderTitle}>{spec.id === 'hx3' ? 'Awaiting your HX3 rule set' : 'Arrives with live data'}</Text>
          <Text style={styles.placeholderText}>
            {spec.id === 'hx3'
              ? 'This slot is reserved for your proprietary strategy. Once you share the inputs, timeframe and trigger, it plugs into the same engine as every other screener.'
              : 'This screener needs intraday bars. The parameter UI and results table are already wired.'}
          </Text>
        </Card>
      ) : (
        <ParamChips params={paramDefs} values={params} onChange={(k, v) => setOverrides((o) => ({ ...o, [`${mode}:${k}`]: v }))} />
      )}
      {mode === 'eod' && eodRun.data && <Text style={styles.count}>{eodRun.data.total} matches{eodRun.data.total > eodRun.data.rows.length ? ` · showing ${eodRun.data.rows.length}` : ''}</Text>}
      {mode === 'live' && liveRun && <Text style={styles.count}>{liveRun.total} firing now</Text>}
    </View>
  );

  const rows = mode === 'live' ? liveRun?.rows ?? [] : eodRun.data?.rows ?? [];
  const loading = mode === 'live' ? !liveRun && !!status?.connected : eodRun.isLoading;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={spec.name} subtitle={spec.tagline} />
      {loading ? (
        <View>{header}<LoadingBlock rows={6} /></View>
      ) : mode === 'eod' && eodRun.isError ? (
        <View>{header}<ErrorBlock error={eodRun.error} onRetry={() => eodRun.refetch()} /></View>
      ) : (
        <ResultsTable columns={columns} rows={rows} header={header} footer={<Disclaimer />} emptyText={mode === 'live' ? (status?.connected ? 'Nothing firing right now — thresholds are user-set.' : 'Live feed is off. Enable it in Profile or switch to EOD.') : spec.availability === 'placeholder' ? '' : 'No matches for these filters.'} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  missing: { ...typography.body, color: colors.textSecondary, padding: spacing.md },
  modeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  updated: { ...typography.small, color: colors.textTertiary },
  about: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  mode: { ...typography.small, color: colors.textTertiary },
  description: { ...typography.small, color: colors.textSecondary, lineHeight: 18 },
  note: { ...typography.small, color: colors.warning, marginTop: spacing.xs, lineHeight: 18 },
  placeholder: { marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: borderRadius.lg },
  placeholderTitle: { ...typography.h4, color: colors.textPrimary },
  placeholderText: { ...typography.small, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  count: { ...typography.small, color: colors.textTertiary, paddingHorizontal: spacing.md, paddingBottom: 4 },
});
