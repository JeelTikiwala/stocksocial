import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Switch, Pressable, Alert, Platform, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card, Button, ChevronRightIcon } from '@/components/ui';
import { Segmented, Disclaimer, LiveBadge } from '@/components/screener';
import { useAuthStore, useAppSettingsStore } from '@/stores';
import { useMarketStatus } from '@/hooks/useMarketData';
import { useLiveEnabled, useLiveStatus } from '@/hooks/useLive';
import { kiteApi } from '@/services/kite';
import { shortDate, compactIndian } from '@/utils';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/v1';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const settings = useAppSettingsStore();
  const status = useMarketStatus();
  const live = useLiveStatus();
  const [liveEnabled, setLiveEnabled] = useLiveEnabled();
  const isApi = settings.dataSource === 'api';
  const qc = useQueryClient();
  const server = useQuery({ queryKey: ['live-server'], queryFn: kiteApi.status, enabled: isApi, refetchInterval: 10_000, retry: 0 });
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const submit = useMutation({ mutationFn: (rt: string) => kiteApi.submitRequestToken(rt), onSuccess: () => { setToken(''); setShowToken(false); qc.invalidateQueries({ queryKey: ['live-server'] }); } });
  const provider = useMutation({ mutationFn: kiteApi.setProvider, onSuccess: () => qc.invalidateQueries({ queryKey: ['live-server'] }) });
  const disconnect = useMutation({ mutationFn: kiteApi.logout, onSuccess: () => qc.invalidateQueries({ queryKey: ['live-server'] }) });

  const confirm = (title: string, msg: string, onYes: () => void) => {
    if (Platform.OS === 'web') { if (window.confirm(msg)) onYes(); return; }
    Alert.alert(title, msg, [{ text: 'Cancel', style: 'cancel' }, { text: 'Continue', style: 'destructive', onPress: onYes }]);
  };
  const openKiteLogin = async () => {
    const { url } = await kiteApi.loginUrl();
    if (!url) return;
    if (Platform.OS === 'web') Linking.openURL(url);
    else await WebBrowser.openBrowserAsync(url);
    setShowToken(true);
  };
  const kite = server.data?.kite;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}><Text style={styles.title}>Profile</Text><LiveBadge /></View>

        <Text style={styles.section}>Account</Text>
        <Card style={styles.card} padding="md" variant="elevated">
          {isAuthenticated && user ? (
            <>
              <Text style={styles.name}>{user.displayName || user.username}</Text>
              <Text style={styles.sub}>@{user.username} · {user.email}</Text>
              <Button title="Sign out" variant="outline" size="sm" onPress={() => confirm('Sign out', 'Sign out of Delta?', () => logout())} style={styles.btn} />
            </>
          ) : (
            <>
              <Text style={styles.name}>Browsing without an account</Text>
              <Text style={styles.sub}>Analytics work without signing in. Sign in to sync watchlists and link a broker.</Text>
              <Button title="Sign in / Register" size="sm" onPress={() => router.push('/(auth)/welcome')} style={styles.btn} />
            </>
          )}
        </Card>

        <Text style={styles.section}>Live data</Text>
        <Card style={styles.card} padding="md" variant="elevated">
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>Live updates</Text>
              <Text style={styles.sub}>{live?.connected ? `${live.provider === 'kite' ? 'Kite Connect' : 'Simulated feed'} · ${live.subscribed} instruments · ${live.ticksPerSec.toFixed(0)} ticks/s` : live?.note ?? 'Off'}</Text>
            </View>
            <Switch value={liveEnabled} onValueChange={setLiveEnabled} trackColor={{ true: colors.gold }} />
          </View>
          {live?.connected && (
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.round(live.sessionProgress * 100)}%` }]} /></View>
              <Text style={styles.progressText}>Session {Math.round(live.sessionProgress * 100)}% · {live.marketOpen ? 'open' : 'closed'}</Text>
            </View>
          )}
          <Text style={[styles.sub, { marginTop: spacing.sm }]}>
            {isApi
              ? 'Streaming from the API server over WebSocket. Switch provider below.'
              : 'Mock mode streams a simulated feed on-device. For real ticks, switch to API server and connect Kite.'}
          </Text>
        </Card>

        <Text style={styles.section}>Zerodha Kite (your account)</Text>
        <Card style={styles.card} padding="md" variant="elevated">
          {!isApi ? (
            <>
              <Text style={styles.sub}>Kite streams through the API server. Switch Market data to “API server” below, run the backend with KITE_API_KEY/SECRET, then connect here.</Text>
            </>
          ) : server.isError ? (
            <Text style={[styles.sub, { color: colors.loss }]}>API server unreachable at {API_URL}.</Text>
          ) : !kite ? (
            <Text style={styles.sub}>Checking server…</Text>
          ) : !kite.configured ? (
            <Text style={styles.sub}>Server has no Kite API key. Add KITE_API_KEY, KITE_API_SECRET and KITE_REDIRECT_URL to backend/.env (redirect must match your Kite app).</Text>
          ) : (
            <>
              <Text style={styles.name}>{kite.loggedIn ? `Connected · ${kite.userName ?? kite.userId}` : 'Not connected'}</Text>
              <Text style={styles.sub}>
                {kite.loggedIn ? `Token valid until ${kite.validUntil ? new Date(kite.validUntil).toLocaleString('en-IN') : '—'}. ` : 'Log in once per trading day (tokens expire ~06:00 IST). '}
                Provider now: {server.data?.provider}.
              </Text>
              <View style={styles.btnRow}>
                <Button title={kite.loggedIn ? 'Re-login' : 'Connect Kite'} size="sm" onPress={openKiteLogin} />
                {kite.loggedIn && server.data?.provider !== 'kite' && <Button title="Use Kite ticks" size="sm" variant="outline" onPress={() => provider.mutate('kite')} loading={provider.isPending} />}
                {server.data?.provider !== 'simulated' && <Button title="Use simulated" size="sm" variant="ghost" onPress={() => provider.mutate('simulated')} />}
                {kite.loggedIn && <Button title="Disconnect" size="sm" variant="ghost" onPress={() => confirm('Disconnect Kite', 'Clear the stored Kite session?', () => disconnect.mutate())} />}
                <Button title={showToken ? 'Hide' : 'Paste request_token'} size="sm" variant="ghost" onPress={() => setShowToken((v) => !v)} />
              </View>
              {showToken && (
                <View style={styles.tokenRow}>
                  <TextInput value={token} onChangeText={setToken} placeholder="request_token from the redirect URL" autoCapitalize="none" autoCorrect={false} style={styles.input} />
                  <Button title="Submit" size="sm" onPress={() => submit.mutate(token.trim())} disabled={token.trim().length < 8} loading={submit.isPending} />
                </View>
              )}
              {submit.isError && <Text style={[styles.sub, { color: colors.loss }]}>{submit.error instanceof Error ? submit.error.message : 'Login failed'}</Text>}
              <Text style={styles.fine}>Kite’s terms allow its market data for your own use only — not for display to other users. Other users will connect Upstox/Fyers in a later phase.</Text>
            </>
          )}
        </Card>

        <Text style={styles.section}>Market data</Text>
        <Card style={styles.card} padding="md" variant="elevated">
          <Segmented options={[{ label: 'Mock (offline)', value: 'mock' as const }, { label: 'API server', value: 'api' as const }]} value={settings.dataSource} onChange={settings.setDataSource} />
          <Text style={[styles.sub, { marginTop: spacing.sm }]}>
            {settings.dataSource === 'mock' ? 'Deterministic mock market generated on-device — same engine, no network.' : `Express API at ${API_URL}.`}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: status.isError ? colors.loss : status.data ? colors.gain : colors.border }]} />
            <Text style={styles.statusText}>{status.isError ? 'Unreachable' : status.data ? `${status.data.source} · as of ${shortDate(status.data.tradeDate)} · ${compactIndian(status.data.contractCount)} contracts` : 'Checking…'}</Text>
          </View>
        </Card>

        <Text style={styles.section}>More</Text>
        <Card style={styles.card} padding="xs" variant="elevated">
          <Pressable onPress={() => router.push('/(tabs)/portfolio')} style={[styles.rowBtn, styles.rowBorder]}>
            <Text style={[styles.rowTitle, { flex: 1 }]}>Portfolio</Text><ChevronRightIcon size={18} color={colors.textTertiary} />
          </Pressable>
          <Pressable onPress={() => router.push('/(auth)/link-broker')} style={[styles.rowBtn, styles.rowBorder]}>
            <View style={{ flex: 1 }}><Text style={styles.rowTitle}>{settings.brokerConnected ? `Broker: ${settings.brokerName}` : 'Link a broker (portfolio sync)'}</Text></View><ChevronRightIcon size={18} color={colors.textTertiary} />
          </Pressable>
          <View style={[styles.rowBtn, styles.rowBorder]}><Text style={[styles.rowTitle, { flex: 1 }]}>Push notifications</Text><Switch value={settings.pushNotifications} onValueChange={settings.setPushNotifications} trackColor={{ true: colors.gold }} /></View>
          <View style={styles.rowBtn}><Text style={[styles.rowTitle, { flex: 1 }]}>Expiry reminders</Text><Switch value={settings.earningsNotifications} onValueChange={settings.setEarningsNotifications} trackColor={{ true: colors.gold }} /></View>
        </Card>

        <Card style={[styles.card, { marginTop: spacing.md }]} padding="md" variant="flat">
          <Text style={styles.rowTitle}>Delta {Constants.expoConfig?.version ?? ''}</Text>
          <Text style={styles.sub}>NSE F&O analytics. Phase B: live feed (simulated / Kite), new IA, glass UI. Plan and progress in docs/.</Text>
        </Card>
        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: spacing.tabBar },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs },
  title: { ...typography.h1, color: colors.textPrimary },
  section: { ...typography.label, color: colors.textTertiary, paddingHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.xs },
  card: { marginHorizontal: spacing.md },
  name: { ...typography.h4, color: colors.textPrimary },
  sub: { ...typography.small, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  fine: { ...typography.small, color: colors.textTertiary, marginTop: spacing.sm, lineHeight: 17, fontSize: 12 },
  btn: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  tokenRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, alignItems: 'center' },
  input: { flex: 1, ...typography.small, color: colors.textPrimary, backgroundColor: colors.inputBg, borderRadius: borderRadius.sm, paddingHorizontal: 10, paddingVertical: 9 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressWrap: { marginTop: spacing.sm },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(15,13,12,0.08)', overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.gain },
  progressText: { ...typography.small, color: colors.textTertiary, marginTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...typography.small, color: colors.textSecondary, flex: 1 },
  rowBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 12, gap: spacing.sm },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(15,13,12,0.06)' },
  rowTitle: { ...typography.bodyMd, color: colors.textPrimary },
});
