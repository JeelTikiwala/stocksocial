import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import EventSource, { type MessageEvent } from 'react-native-sse';
import { Card } from '@/components/ui';
import { borderRadius, colors, spacing, typography } from '@/constants';
import { tradingApi, type BrokerStatus, type RiskPersona, type TradingMode } from '@/services/trading';
import { useTradingStore } from '@/stores/tradingStore';

type Action = { label: string; skill: string; payload?: Record<string, unknown>; accent: string; method?: 'GET' | 'POST' };
type StreamEvent = { type: string; [key: string]: unknown };

const actions: Action[] = [
  { label: '7-agent analysis', skill: 'analyze', accent: colors.indigo },
  { label: 'GEX', skill: 'gex', accent: colors.purple },
  { label: 'IV smile', skill: 'iv_smile', accent: colors.teal },
  { label: 'Options chain', skill: 'options_chain', accent: colors.gold },
  { label: 'Personal morning brief', skill: 'morning_brief', accent: colors.indigo },
  { label: 'FII / DII flows', skill: 'flows', payload: {}, accent: colors.gain },
  { label: 'VaR / CVaR', skill: 'risk_report', payload: {}, accent: colors.loss },
  { label: 'Backtest', skill: 'backtest', payload: { strategy: 'rsi', period: '1y' }, accent: colors.indigo },
  { label: 'Walk-forward', skill: 'walkforward', payload: { strategy: 'rsi' }, accent: colors.purple },
  { label: 'What-if −5%', skill: 'whatif', payload: { scenario: 'market', nifty_change: -5 }, accent: colors.loss },
  { label: 'Trade memory', skill: 'memory', payload: {}, accent: colors.gold },
  { label: 'Model drift', skill: 'drift', payload: {}, accent: colors.warning },
  { label: 'Strategy scorecard', skill: 'strategy', payload: { view: 'BULLISH', dte: 30 }, accent: colors.gain },
  { label: 'DCF valuation', skill: 'dcf', accent: colors.gold },
  { label: 'ML prediction', skill: 'ml_prediction', accent: colors.purple },
  { label: 'Ensemble model', skill: 'ensemble', accent: colors.indigo },
  { label: 'Event strategies', skill: 'event_strategies', accent: colors.warning },
  { label: '58-strategy library', skill: 'strategy_library', payload: { kind: 'all' }, accent: colors.teal },
  { label: 'Pair trading', skill: 'pairs', payload: { stock_b: 'ICICIBANK' }, accent: colors.gain },
  { label: 'Holdings', skill: 'holdings', payload: {}, accent: colors.indigo },
  { label: 'Positions', skill: 'positions', payload: {}, accent: colors.purple },
  { label: 'Funds', skill: 'funds', payload: {}, accent: colors.gold },
  { label: 'Orders', skill: 'orders', payload: {}, accent: colors.teal },
  { label: 'Alerts', skill: 'alerts/list', payload: {}, accent: colors.warning },
  { label: 'TradingView webhook', skill: 'tradingview/status', accent: colors.gain, method: 'GET' },
  { label: 'Telegram', skill: 'telegram/status', accent: colors.indigo, method: 'GET' },
  { label: 'AI provider', skill: 'provider', payload: {}, accent: colors.purple },
];

const analysts = ['Technical', 'Fundamental', 'Options', 'News / Macro', 'Sentiment', 'Sector Rotation', 'Risk'];

export default function TradeScreen() {
  const store = useTradingStore();
  const active = store.sessions.find((session) => session.id === store.activeSessionId) ?? store.sessions[0];
  const [symbol, setSymbolInput] = useState(active?.symbol ?? 'NIFTY');
  const [engineOnline, setEngineOnline] = useState<boolean | null>(null);
  const [brokerStatuses, setBrokerStatuses] = useState<Record<string, BrokerStatus>>({});
  const [loading, setLoading] = useState('');
  const [resultTitle, setResultTitle] = useState('');
  const [result, setResult] = useState<unknown>(null);
  const [chat, setChat] = useState('');
  const [orderOpen, setOrderOpen] = useState(false);
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('1');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPrice, setLimitPrice] = useState('');
  const [lastOrderId, setLastOrderId] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertCondition, setAlertCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [alertThreshold, setAlertThreshold] = useState('');
  const [alertWebhook, setAlertWebhook] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [providerName, setProviderName] = useState<'gemini' | 'anthropic' | 'openai' | 'ollama'>('gemini');
  const [providerKey, setProviderKey] = useState('');
  const [providerModel, setProviderModel] = useState('');
  const [providerBaseUrl, setProviderBaseUrl] = useState('');
  const [telegramToken, setTelegramToken] = useState('');
  const [liveAcknowledged, setLiveAcknowledged] = useState(false);
  const [staticIpConfirmed, setStaticIpConfirmed] = useState(false);
  const [streamId, setStreamId] = useState('');
  const [streamPhase, setStreamPhase] = useState('');
  const [streamEvents, setStreamEvents] = useState<StreamEvent[]>([]);
  const streamRef = useRef<EventSource | null>(null);
  const streamEventsRef = useRef<StreamEvent[]>([]);

  const normalizedSymbol = useMemo(() => symbol.trim().toUpperCase() || 'NIFTY', [symbol]);

  const checkEngine = async () => {
    try {
      const [, status] = await Promise.all([tradingApi.health(), tradingApi.status()]);
      setEngineOnline(true);
      setBrokerStatuses(status.data);
    } catch {
      setEngineOnline(false);
    }
  };

  React.useEffect(() => { void checkEngine(); }, []);
  React.useEffect(() => () => streamRef.current?.close(), []);

  const stopStream = () => {
    streamRef.current?.close();
    streamRef.current = null;
    setStreamId('');
    setStreamPhase('');
    setLoading('');
  };

  const startStreamingAnalysis = () => {
    stopStream();
    setLoading('analyze');
    setResultTitle(`7-agent analysis · ${normalizedSymbol}`);
    setResult(null);
    setStreamPhase('connecting');
    setStreamEvents([]);
    streamEventsRef.current = [];
    store.setSymbol(normalizedSymbol);

    const source = new EventSource(tradingApi.analyzeStreamUrl(normalizedSymbol), {
      pollingInterval: 0,
      timeout: 10 * 60 * 1000,
    });
    streamRef.current = source;
    source.addEventListener('message', (message: MessageEvent) => {
      if (!message.data) return;
      try {
        const event = JSON.parse(message.data) as StreamEvent;
        streamEventsRef.current = [...streamEventsRef.current, event];
        setStreamEvents(streamEventsRef.current);
        if (event.type === 'started') {
          setStreamId(String(event.stream_id ?? ''));
          setStreamPhase('analysts');
        } else if (event.type === 'phase') {
          setStreamPhase(String(event.phase ?? 'working'));
        } else if (event.type === 'done') {
          setResult({
            symbol: event.symbol,
            exchange: event.exchange,
            report: event.report,
            trade_plans: event.trade_plans,
            progress: streamEventsRef.current,
          });
          stopStream();
        } else if (event.type === 'error') {
          setResult({ error: event.message ?? 'Streaming analysis failed' });
          stopStream();
        }
      } catch (error: any) {
        setResult({ error: `Invalid stream event: ${error?.message ?? 'parse failed'}` });
        stopStream();
      }
    });
    source.addEventListener('error', (event: any) => {
      setResult({ error: event?.message ?? 'Analysis stream disconnected' });
      stopStream();
    });
  };

  const runAction = async (action: Action) => {
    if (action.skill === 'analyze') {
      startStreamingAnalysis();
      return;
    }
    setLoading(action.skill);
    setResultTitle(action.label);
    store.setSymbol(normalizedSymbol);
    try {
      let payload: Record<string, unknown> = {
        ...(action.payload ?? {}),
        ...(['strategy', 'whatif', 'morning_brief'].includes(action.skill) ? { risk_persona: store.riskPersona } : {}),
      };
      const noSymbol = ['flows', 'risk_report', 'memory', 'drift', 'event_strategies', 'strategy_library', 'holdings', 'positions', 'funds', 'orders', 'alerts/list', 'tradingview/status', 'telegram/status', 'provider'];
      if (action.skill === 'pairs') payload = { stock_a: normalizedSymbol, stock_b: payload.stock_b || 'ICICIBANK' };
      else if (action.skill === 'event_strategies') payload = { ...payload, symbols: [normalizedSymbol] };
      else if (!noSymbol.includes(action.skill)) payload = { symbol: normalizedSymbol, ...payload };
      const response = action.method === 'GET'
          ? await tradingApi.skillGet(action.skill)
          : await tradingApi.skill(action.skill, payload);
      setResult(response.data.data);
    } catch (error: any) {
      setResult({ error: error?.response?.data?.detail ?? error?.message ?? 'Request failed' });
    } finally {
      setLoading('');
    }
  };

  const sendChat = async () => {
    const message = chat.trim();
    if (!message) return;
    setChat('');
    store.addMessage('user', message);
    if (streamId) {
      try {
        const response = await tradingApi.injectHint(streamId, message);
        const status = response.data?.status;
        if (status === 'queued') {
          store.addMessage('assistant', 'Context queued. The fund manager will apply it during synthesis.');
          return;
        }
      } catch {
        // The analysis may have crossed into synthesis; fall through to chat.
      }
    }
    setLoading('chat');
    try {
      const response = await tradingApi.chat(message, active.id);
      const data = response.data.data as any;
      store.addMessage('assistant', typeof data === 'string' ? data : data?.response ?? JSON.stringify(data));
    } catch (error: any) {
      store.addMessage('assistant', `Unable to respond: ${error?.message ?? 'request failed'}`);
    } finally {
      setLoading('');
    }
  };

  const placeOrder = async () => {
    if (store.mode === 'live' && (!liveAcknowledged || !staticIpConfirmed)) {
      Alert.alert('Live order blocked', 'Acknowledge both live-trading risk and registered static-IP compliance before placing this order.');
      return;
    }
    if (orderType === 'LIMIT' && (!Number.isFinite(Number(limitPrice)) || Number(limitPrice) <= 0)) {
      Alert.alert('Invalid limit price', 'Enter a positive limit price before placing the order.');
      return;
    }
    setLoading('order');
    try {
      const response = await tradingApi.placeOrder({
        symbol: normalizedSymbol,
        exchange: 'NSE',
        transaction_type: side,
        quantity: Math.max(1, Number.parseInt(quantity, 10) || 1),
        order_type: orderType,
        product: 'CNC',
        price: orderType === 'LIMIT' ? Number(limitPrice) : undefined,
        mode: store.mode,
        acknowledge_live_risk: store.mode === 'live' && liveAcknowledged,
        sebi_static_ip_confirmed: store.mode === 'live' && staticIpConfirmed,
      });
      setResultTitle(`${store.mode === 'paper' ? 'Paper' : 'Live'} ${side} order`);
      setResult(response.data.data);
      setLastOrderId(String((response.data.data as any)?.order?.order_id ?? ''));
      setOrderOpen(false);
    } catch (error: any) {
      Alert.alert('Order failed', String(error?.response?.data?.detail?.message ?? error?.message ?? 'Unknown error'));
    } finally {
      setLoading('');
    }
  };

  const cancelLastOrder = async () => {
    if (!lastOrderId) return;
    if (store.mode === 'live' && (!liveAcknowledged || !staticIpConfirmed)) {
      Alert.alert('Live cancellation blocked', 'Acknowledge live-trading risk and registered static-IP compliance before cancelling a live broker order.');
      return;
    }
    setLoading('cancel');
    try {
      const response = await tradingApi.cancelOrder(lastOrderId, store.mode, store.mode === 'live' && liveAcknowledged, store.mode === 'live' && staticIpConfirmed);
      setResultTitle(`Cancel ${lastOrderId}`);
      setResult(response.data.data);
      setLastOrderId('');
    } catch (error: any) {
      Alert.alert('Cancellation failed', String(error?.response?.data?.detail?.message ?? error?.message ?? 'Unknown error'));
    } finally {
      setLoading('');
    }
  };

  const createAlert = async () => {
    const threshold = Number(alertThreshold);
    if (!Number.isFinite(threshold) || threshold <= 0) {
      Alert.alert('Invalid threshold', 'Enter a positive price level.');
      return;
    }
    setLoading('alert-create');
    try {
      const response = await tradingApi.skill('alerts/add', {
        symbol: normalizedSymbol,
        exchange: 'NSE',
        condition: alertCondition,
        threshold,
        webhook_url: alertWebhook.trim() || undefined,
      });
      setResultTitle(`${normalizedSymbol} price alert`);
      setResult(response.data.data);
      setAlertOpen(false);
    } catch (error: any) {
      Alert.alert('Alert creation failed', String(error?.response?.data?.detail?.message ?? error?.message ?? 'Unknown error'));
    } finally {
      setLoading('');
    }
  };

  const testProvider = async () => {
    setLoading('provider-test');
    try {
      const response = await tradingApi.testProvider(providerName, providerKey, providerName === 'openai' ? providerBaseUrl : providerModel);
      setResultTitle(`${providerName} connection test`);
      setResult(response.data);
    } catch (error: any) {
      setResultTitle(`${providerName} connection test`);
      setResult({ error: error?.response?.data?.detail ?? error?.message ?? 'Provider test failed' });
    } finally {
      setLoading('');
    }
  };

  const toggleSettings = async () => {
    const opening = !settingsOpen;
    setSettingsOpen(opening);
    if (!opening) return;
    try {
      const response = await tradingApi.skillGet<Record<string, unknown>>('settings');
      const settings = response.data.data;
      const provider = String(settings.ai_provider || 'gemini');
      if (['gemini', 'anthropic', 'openai', 'ollama'].includes(provider)) setProviderName(provider as typeof providerName);
      setProviderModel(String(settings.ai_model || ''));
      setProviderBaseUrl(String(settings.openai_base_url || ''));
    } catch {
      // The settings form remains usable when the engine is still starting.
    }
  };

  const saveSettings = async () => {
    const keyNames = { gemini: 'GEMINI_API_KEY', anthropic: 'ANTHROPIC_API_KEY', openai: 'OPENAI_API_KEY', ollama: '' } as const;
    const settings: Record<string, string> = { AI_PROVIDER: providerName };
    if (providerModel.trim()) settings.AI_MODEL = providerModel.trim();
    if (providerName === 'openai' && providerBaseUrl.trim()) settings.OPENAI_BASE_URL = providerBaseUrl.trim();
    if (providerKey.trim() && keyNames[providerName]) settings[keyNames[providerName]] = providerKey.trim();
    if (telegramToken.trim()) settings.TELEGRAM_BOT_TOKEN = telegramToken.trim();
    setLoading('settings-save');
    try {
      const response = await tradingApi.skill('settings', { settings });
      setProviderKey('');
      setTelegramToken('');
      setResultTitle('Secure settings updated');
      setResult(response.data.data);
    } catch (error: any) {
      Alert.alert('Settings failed', String(error?.response?.data?.detail ?? error?.message ?? 'Unknown error'));
    } finally {
      setLoading('');
    }
  };

  const startTelegram = async () => {
    setLoading('telegram-start');
    try {
      const response = await tradingApi.skill('telegram/start');
      setResultTitle('Telegram bot');
      setResult(response.data.data);
    } catch (error: any) {
      Alert.alert('Telegram start failed', String(error?.response?.data?.detail?.message ?? error?.message ?? 'Unknown error'));
    } finally {
      setLoading('');
    }
  };

  const handleBroker = async (broker: 'fyers' | 'zerodha', role: 'data' | 'execution') => {
    const status = brokerStatuses[broker];
    if (!status?.authenticated) {
      await WebBrowser.openBrowserAsync(tradingApi.brokerLoginUrl(broker));
      await checkEngine();
      return;
    }
    try {
      await tradingApi.setBrokerRole(broker, role);
      await checkEngine();
    } catch (error: any) {
      Alert.alert('Broker routing failed', String(error?.response?.data?.detail ?? error?.message ?? 'Unknown error'));
    }
  };

  const exportResult = async () => {
    if (result === null) return;
    setLoading('pdf');
    try {
      const content = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
      const response = await tradingApi.exportPdf(content, `${normalizedSymbol} · ${resultTitle}`);
      const report = response.data.data;
      if (Platform.OS === 'web') {
        const decoded = globalThis.atob(report.base64);
        const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
        const url = URL.createObjectURL(new Blob([bytes], { type: report.mime_type }));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = report.filename;
        anchor.click();
        URL.revokeObjectURL(url);
      } else {
        const file = new File(Paths.cache, report.filename);
        file.create({ overwrite: true });
        file.write(report.base64, { encoding: 'base64' });
        if (!(await Sharing.isAvailableAsync())) throw new Error('File sharing is unavailable on this device');
        await Sharing.shareAsync(file.uri, {
          mimeType: report.mime_type,
          UTI: 'com.adobe.pdf',
          dialogTitle: 'Export trading report',
        });
      }
    } catch (error: any) {
      Alert.alert('PDF export failed', String(error?.response?.data?.detail?.message ?? error?.message ?? 'Unknown error'));
    } finally {
      setLoading('');
    }
  };

  const runResultAction = async (action: 'explain' | 'memory' | 'hedge') => {
    if (result === null) return;
    const titles = { explain: 'Plain-language risk explanation', memory: 'Compared with trade memory', hedge: 'Portfolio hedge plan' };
    setLoading(`result-${action}`);
    try {
      const response = action === 'explain'
        ? await tradingApi.skill('explain', { content: typeof result === 'string' ? result : JSON.stringify(result), session_id: active.id })
        : action === 'memory'
          ? await tradingApi.skill('memory/query', { symbol: normalizedSymbol, limit: 5 })
          : await tradingApi.skill('delta_hedge');
      setResultTitle(titles[action]);
      setResult(action === 'memory' ? { current_result: result, trade_memory: response.data.data } : response.data.data);
    } catch (error: any) {
      Alert.alert('Context action failed', String(error?.response?.data?.detail?.message ?? error?.message ?? 'Unknown error'));
    } finally {
      setLoading('');
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>AGENTIC TRADING DESK</Text>
            <Text style={styles.title}>Research. Debate. Execute.</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={toggleSettings} style={styles.settingsButton}><Text style={styles.settingsText}>Settings</Text></Pressable>
            <Pressable onPress={checkEngine} style={[styles.status, engineOnline ? styles.online : styles.offline]}>
              <View style={[styles.dot, { backgroundColor: engineOnline ? colors.gain : colors.loss }]} />
              <Text style={styles.statusText}>{engineOnline ? 'Engine online' : 'Start engine'}</Text>
            </Pressable>
          </View>
        </View>

        {engineOnline === false && (
          <Card variant="outlined" style={styles.notice}>
            <Text style={styles.noticeTitle}>Trading engine is offline</Text>
            <Text style={styles.noticeText}>Run “npm run engine:start”, then tap Start engine. Paper mode remains the default.</Text>
          </Card>
        )}

        {settingsOpen && <Card variant="outlined" style={styles.settingsCard}>
          <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>AI & notification settings</Text><Text style={styles.sectionHint}>Secrets are sent only to the local engine and stored in the OS keychain</Text></View></View>
          <Segmented values={['gemini', 'anthropic', 'openai', 'ollama']} active={providerName} onChange={(value) => { setProviderName(value as typeof providerName); setProviderKey(''); }} />
          {providerName !== 'ollama' && <TextInput value={providerKey} onChangeText={setProviderKey} secureTextEntry autoCapitalize="none" placeholder={`${providerName} API key`} placeholderTextColor={colors.textTertiary} style={styles.alertInput} />}
          <TextInput value={providerModel} onChangeText={setProviderModel} autoCapitalize="none" placeholder="Optional model override" placeholderTextColor={colors.textTertiary} style={styles.alertInput} />
          {providerName === 'openai' && <TextInput value={providerBaseUrl} onChangeText={setProviderBaseUrl} autoCapitalize="none" placeholder="Optional OpenAI-compatible base URL" placeholderTextColor={colors.textTertiary} style={styles.alertInput} />}
          <Pressable style={styles.secondaryButton} onPress={testProvider}><Text style={styles.secondaryButtonText}>{loading === 'provider-test' ? 'Testing…' : 'Test provider'}</Text></Pressable>
          <View style={styles.settingsDivider} />
          <Text style={styles.sectionTitle}>Telegram bot</Text>
          <TextInput value={telegramToken} onChangeText={setTelegramToken} secureTextEntry autoCapitalize="none" placeholder="BotFather token (stored in keychain)" placeholderTextColor={colors.textTertiary} style={styles.alertInput} />
          <View style={styles.settingsActions}><Pressable style={styles.alertButton} onPress={saveSettings}><Text style={styles.placeText}>{loading === 'settings-save' ? 'Saving…' : 'Save configuration'}</Text></Pressable><Pressable style={styles.secondaryButton} onPress={startTelegram}><Text style={styles.secondaryButtonText}>{loading === 'telegram-start' ? 'Starting…' : 'Start configured bot'}</Text></Pressable></View>
        </Card>}

        <Card style={styles.hero}>
          <View style={styles.modeRow}>
            <Segmented
              values={['paper', 'live']}
              active={store.mode}
              onChange={(value) => { store.setMode(value as TradingMode); setLiveAcknowledged(false); setStaticIpConfirmed(false); }}
            />
            <Pressable style={styles.orderButton} onPress={() => setOrderOpen((value) => !value)}>
              <Text style={styles.orderButtonText}>Order ticket</Text>
            </Pressable>
          </View>
          <Text style={styles.label}>Instrument</Text>
          <View style={styles.symbolRow}>
            <TextInput
              value={symbol}
              onChangeText={setSymbolInput}
              autoCapitalize="characters"
              placeholder="NIFTY or RELIANCE"
              placeholderTextColor={colors.textTertiary}
              style={styles.symbolInput}
            />
            <Pressable style={styles.analyzeButton} onPress={() => runAction(actions[0])}>
              {loading === 'analyze' ? <ActivityIndicator color={colors.white} /> : <Text style={styles.analyzeText}>Analyze</Text>}
            </Pressable>
          </View>
          <Text style={styles.helper}>Seven independent analysts → bull/bear debate → fund-manager synthesis</Text>
        </Card>

        {!!streamPhase && (
          <Card variant="outlined" style={styles.streamCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Live agent pipeline</Text>
                <Text style={styles.sectionHint}>{streamPhase.toUpperCase()} · {streamEvents.length} events</Text>
              </View>
              <Pressable onPress={stopStream}><Text style={styles.stopStream}>Stop</Text></Pressable>
            </View>
            <StreamProgress events={streamEvents} />
            <Text style={styles.streamHint}>Send a message below now to inject context before synthesis begins.</Text>
          </Card>
        )}

        {orderOpen && (
          <Card variant="outlined" style={styles.orderCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Order placement</Text>
              <Text style={[styles.modeBadge, store.mode === 'live' && styles.liveBadge]}>{store.mode.toUpperCase()}</Text>
            </View>
            <Segmented values={['BUY', 'SELL']} active={side} onChange={(value) => setSide(value as 'BUY' | 'SELL')} />
            <Segmented values={['MARKET', 'LIMIT']} active={orderType} onChange={(value) => setOrderType(value as 'MARKET' | 'LIMIT')} />
            <View style={styles.ticketRow}>
              <View style={styles.ticketField}>
                <Text style={styles.label}>Symbol</Text><Text style={styles.ticketValue}>{normalizedSymbol}</Text>
              </View>
              <View style={styles.ticketField}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput value={quantity} onChangeText={setQuantity} keyboardType="number-pad" style={styles.qtyInput} />
              </View>
              <View style={styles.ticketField}>
                <Text style={styles.label}>{orderType === 'LIMIT' ? 'Limit price' : 'Product'}</Text>
                {orderType === 'LIMIT' ? <TextInput value={limitPrice} onChangeText={setLimitPrice} keyboardType="decimal-pad" placeholder="₹0.00" placeholderTextColor={colors.textTertiary} style={styles.qtyInput} /> : <Text style={styles.ticketValue}>CNC</Text>}
              </View>
            </View>
            {store.mode === 'live' && (
              <>
                <Pressable style={styles.ackRow} onPress={() => setLiveAcknowledged((value) => !value)}>
                  <View style={[styles.checkbox, liveAcknowledged && styles.checkboxOn]}><Text style={styles.check}>✓</Text></View>
                  <Text style={styles.ackText}>I understand this sends a real order through Zerodha and may lose money.</Text>
                </Pressable>
                <Pressable style={styles.ackRow} onPress={() => setStaticIpConfirmed((value) => !value)}>
                  <View style={[styles.checkbox, staticIpConfirmed && styles.checkboxOn]}><Text style={styles.check}>✓</Text></View>
                  <Text style={styles.ackText}>My broker API key is mapped to my registered static IP for compliant API execution.</Text>
                </Pressable>
              </>
            )}
            <Pressable style={[styles.placeButton, side === 'SELL' && styles.sellButton]} onPress={placeOrder}>
              {loading === 'order' ? <ActivityIndicator color={colors.white} /> : <Text style={styles.placeText}>{side} {quantity || '1'} {normalizedSymbol}</Text>}
            </Pressable>
            {!!lastOrderId && <Pressable style={styles.cancelButton} onPress={cancelLastOrder}><Text style={styles.cancelText}>{loading === 'cancel' ? 'Cancelling…' : `Cancel ${lastOrderId}`}</Text></Pressable>}
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <View><Text style={styles.sectionTitle}>Broker routing</Text><Text style={styles.sectionHint}>Recommended dual-broker setup</Text></View>
        </View>
        <View style={styles.brokerRow}>
          <BrokerCard name="Fyers" role="DATA" detail="Quotes · options · WebSocket" status={brokerStatuses.fyers} onPress={() => handleBroker('fyers', 'data')} />
          <BrokerCard name="Zerodha" role="EXECUTION" detail="Orders · holdings · funds" status={brokerStatuses.zerodha} onPress={() => handleBroker('zerodha', 'execution')} />
        </View>

        <View style={styles.sectionHeader}>
          <View><Text style={styles.sectionTitle}>Risk persona</Text><Text style={styles.sectionHint}>Shapes sizing, debate and trade plans</Text></View>
        </View>
        <Segmented values={['conservative', 'balanced', 'aggressive']} active={store.riskPersona} onChange={(value) => store.setRiskPersona(value as RiskPersona)} />

        <View style={styles.sectionHeader}>
          <View><Text style={styles.sectionTitle}>Seven-agent scorecard</Text><Text style={styles.sectionHint}>Independent research, visible disagreement</Text></View>
        </View>
        <Card variant="outlined" padding="sm">
          <View style={styles.analystGrid}>
            {analysts.map((analyst, index) => (
              <View key={analyst} style={styles.analyst}>
                <View style={[styles.agentNumber, { backgroundColor: index === 6 ? colors.lossBg : colors.indigoLight }]}><Text style={styles.agentNumberText}>{index + 1}</Text></View>
                <Text style={styles.analystName}>{analyst}</Text><Text style={styles.ready}>READY</Text>
              </View>
            ))}
          </View>
          <View style={styles.debateFlow}><Text style={styles.bull}>BULL RESEARCHER</Text><Text style={styles.vs}>3 ROUNDS ↔</Text><Text style={styles.bear}>BEAR RESEARCHER</Text></View>
        </Card>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Research workbench</Text><Pressable onPress={() => setAlertOpen((value) => !value)}><Text style={styles.newSession}>+ Price alert</Text></Pressable></View>
        {alertOpen && <Card variant="outlined" style={styles.alertCard}>
          <Text style={styles.sectionTitle}>Alert · {normalizedSymbol}</Text>
          <Segmented values={['ABOVE', 'BELOW']} active={alertCondition} onChange={(value) => setAlertCondition(value as 'ABOVE' | 'BELOW')} />
          <TextInput value={alertThreshold} onChangeText={setAlertThreshold} keyboardType="decimal-pad" placeholder="Trigger price" placeholderTextColor={colors.textTertiary} style={styles.alertInput} />
          <TextInput value={alertWebhook} onChangeText={setAlertWebhook} autoCapitalize="none" placeholder="Optional outbound webhook URL" placeholderTextColor={colors.textTertiary} style={styles.alertInput} />
          <Pressable style={styles.alertButton} onPress={createAlert}><Text style={styles.placeText}>{loading === 'alert-create' ? 'Creating…' : 'Create persistent alert'}</Text></Pressable>
        </Card>}
        <View style={styles.actionGrid}>
          {actions.slice(1).map((action) => (
            <Pressable key={action.skill} style={styles.actionCard} onPress={() => runAction(action)}>
              <View style={[styles.actionAccent, { backgroundColor: action.accent }]} />
              <Text style={styles.actionLabel}>{action.label}</Text>
              {loading === action.skill ? <ActivityIndicator size="small" color={action.accent} /> : <Text style={styles.actionArrow}>›</Text>}
            </Pressable>
          ))}
        </View>

        {result !== null && (
          <Card style={styles.resultCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{resultTitle}</Text>
              <View style={styles.resultControls}>
                <Pressable onPress={exportResult} style={styles.exportButton}>
                  <Text style={styles.exportText}>{loading === 'pdf' ? 'Exporting…' : 'Export PDF'}</Text>
                </Pressable>
                <Pressable onPress={() => setResult(null)}><Text style={styles.close}>Close</Text></Pressable>
              </View>
            </View>
            <ResultContent value={result} />
            <View style={styles.chips}><Chip text={loading === 'result-explain' ? 'Explaining…' : 'Explain the risks'} onPress={() => runResultAction('explain')} /><Chip text={loading === 'result-memory' ? 'Comparing…' : 'Compare with memory'} onPress={() => runResultAction('memory')} /><Chip text={loading === 'result-hedge' ? 'Building…' : 'Build a hedge'} onPress={() => runResultAction('hedge')} /></View>
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <View><Text style={styles.sectionTitle}>Agent sessions</Text><Text style={styles.sectionHint}>Independent context per research thread</Text></View>
          <Pressable onPress={() => { stopStream(); store.createSession(); setSymbolInput('NIFTY'); }}><Text style={styles.newSession}>+ New</Text></Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sessions}>
          {store.sessions.map((session) => (
            <Pressable key={session.id} onPress={() => { stopStream(); store.switchSession(session.id); setSymbolInput(session.symbol); }} style={[styles.session, session.id === store.activeSessionId && styles.activeSession]}>
              <View style={styles.sessionHeading}><Text numberOfLines={1} style={styles.sessionTitle}>{session.title}</Text><Pressable onPress={() => store.deleteSession(session.id)}><Text style={styles.deleteSession}>×</Text></Pressable></View><Text style={styles.sessionMeta}>{session.symbol} · {session.messages.length} messages</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Card variant="outlined" style={styles.chatCard}>
          {active.messages.slice(-4).map((message) => <View key={message.id} style={[styles.message, message.role === 'user' && styles.userMessage]}><Text style={styles.messageRole}>{message.role === 'user' ? 'YOU' : 'FUND MANAGER'}</Text><Text style={styles.messageText}>{message.content}</Text></View>)}
          <View style={styles.chatRow}>
            <TextInput value={chat} onChangeText={setChat} onSubmitEditing={sendChat} placeholder={streamId ? 'Inject context into this analysis…' : 'Ask the fund manager…'} placeholderTextColor={colors.textTertiary} style={styles.chatInput} />
            <Pressable onPress={sendChat} style={styles.send}><Text style={styles.sendText}>{loading === 'chat' ? '…' : 'Send'}</Text></Pressable>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Segmented({ values, active, onChange }: { values: string[]; active: string; onChange: (value: string) => void }) {
  return <View style={styles.segmented}>{values.map((value) => <Pressable key={value} onPress={() => onChange(value)} style={[styles.segment, value === active && styles.activeSegment]}><Text style={[styles.segmentText, value === active && styles.activeSegmentText]}>{value.toUpperCase()}</Text></Pressable>)}</View>;
}

function BrokerCard({ name, role, detail, status, onPress }: { name: string; role: string; detail: string; status?: BrokerStatus; onPress: () => void }) {
  const connected = Boolean(status?.authenticated);
  const routed = connected && status?.role === role.toLowerCase();
  return <Card onPress={onPress} variant="outlined" style={styles.brokerCard}><View style={styles.brokerTitleRow}><Text style={styles.brokerName}>{name}</Text><Text style={styles.role}>{role}</Text></View><Text style={styles.brokerDetail}>{detail}</Text><View style={styles.brokerState}><View style={[styles.dot, { backgroundColor: connected ? colors.gain : colors.textTertiary }]} /><Text style={styles.connect}>{connected ? (routed ? `${role} route active` : `Set as ${role.toLowerCase()}`) : (status?.configured ? 'Authenticate →' : 'Connect securely →')}</Text></View></Card>;
}

function Chip({ text, onPress }: { text: string; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.chip}><Text style={styles.chipText}>{text}</Text></Pressable>; }

function StreamProgress({ events }: { events: StreamEvent[] }) {
  const analysts = events.filter((event) => event.type === 'analyst');
  const debates = events.filter((event) => event.type === 'debate_step');
  const hint = [...events].reverse().find((event) => event.type === 'hint_applied' || event.type === 'hint_ack');
  return <View style={styles.streamProgress}>
    <View style={styles.streamStats}>
      <Text style={styles.streamStat}>{analysts.length}/7 analysts</Text>
      <Text style={styles.streamStat}>{debates.length} debate rounds</Text>
    </View>
    {analysts.slice(-3).map((event, index) => <Text key={`${String(event.name)}-${index}`} style={styles.streamLine}>✓ {String(event.name ?? 'Analyst')} · {String(event.verdict ?? 'complete')} · {String(event.confidence ?? '—')}%</Text>)}
    {hint && <Text style={styles.hintApplied}>◆ {hint.type === 'hint_applied' ? 'Context applied to synthesis' : 'Context queued for synthesis'}</Text>}
  </View>;
}

function ResultContent({ value }: { value: any }) {
  if (value?.personalized && Array.isArray(value?.strategies)) {
    return <View style={styles.structuredResult}>
      <Text style={styles.contextLine}>{value.risk_persona?.toUpperCase()} · ₹{Number(value.portfolio_context?.available_cash || 0).toLocaleString('en-IN')} available</Text>
      {value.strategies.slice(0, 4).map((strategy: any, index: number) => <View key={`${strategy.name}-${index}`} style={styles.strategyResult}>
        <View style={styles.resultHeading}><Text style={styles.resultRank}>#{index + 1}</Text><Text style={styles.resultName}>{strategy.name}</Text><Text style={styles.fit}>{strategy.personalized_fit_score}/100</Text></View>
        {(strategy.why || []).slice(0, 3).map((why: string) => <Text key={why} style={styles.reason}>• {why}</Text>)}
        <Text style={[styles.budget, strategy.risk_budget_breached && styles.budgetBreach]}>Risk ₹{Number(Math.abs(strategy.max_loss || 0)).toLocaleString('en-IN')} · Budget ₹{Number(strategy.risk_budget_inr || 0).toLocaleString('en-IN')}</Text>
      </View>)}
    </View>;
  }
  if (value?.personalized && value?.scenario_name) {
    return <View style={styles.structuredResult}>
      <Text style={styles.resultName}>{value.scenario_name}</Text>
      <Text style={[styles.scenarioPnl, Number(value.projected_pnl) < 0 && styles.negative]}>₹{Number(value.projected_pnl || 0).toLocaleString('en-IN')} ({value.projected_pnl_pct || 0}%)</Text>
      <Text style={[styles.budget, value.risk_budget_breached && styles.budgetBreach]}>Risk budget: ₹{Number(value.risk_budget_inr || 0).toLocaleString('en-IN')} · {value.risk_budget_used_pct ?? 0}% used</Text>
      {(value.dominant_exposures || []).map((item: any) => <View key={item.symbol} style={styles.exposureRow}><Text style={styles.reason}>{item.symbol}</Text><Text style={[styles.reason, Number(item.pnl) < 0 && styles.negative]}>₹{Number(item.pnl || 0).toLocaleString('en-IN')}</Text></View>)}
      {(value.suggested_hedges || []).map((item: any) => <Text key={`${item.action}-${item.symbol}`} style={styles.hedge}>HEDGE · {item.action} — {item.symbol}</Text>)}
    </View>;
  }
  if (value?.personalized && value?.daily_agenda) {
    return <View style={styles.structuredResult}>
      <Text style={styles.contextLine}>Watchlist: {(value.watchlist_from_memory || []).join(', ') || 'Builds as analyses are saved'}</Text>
      {(value.daily_agenda || []).map((item: any, index: number) => <View key={`${item.action}-${index}`} style={styles.agendaRow}><Text style={styles.agendaPriority}>{item.priority?.toUpperCase()}</Text><Text style={styles.agendaText}>{item.action}</Text></View>)}
      <Text style={styles.resultSubheading}>Market snapshot</Text>
      <Text selectable style={styles.resultText}>{JSON.stringify(value.market_snapshot, null, 2)}</Text>
    </View>;
  }
  if (value?.intrinsic_value !== undefined) {
    return <View style={styles.structuredResult}><Text style={styles.contextLine}>DCF VALUATION</Text><Text style={styles.scenarioPnl}>₹{Number(value.intrinsic_value || 0).toLocaleString('en-IN')}</Text><Text style={[styles.budget, Number(value.margin_of_safety) < 0 && styles.budgetBreach]}>Margin of safety {Number(value.margin_of_safety || 0).toFixed(1)}% · WACC {value.wacc}%</Text><Text style={styles.reason}>Terminal value: {Number(value.terminal_pct || 0).toFixed(1)}% of enterprise value</Text></View>;
  }
  if (value?.feature_importances && value?.direction) {
    return <View style={styles.structuredResult}><Text style={styles.contextLine}>GRADIENT-BOOSTING MODEL</Text><Text style={[styles.scenarioPnl, value.direction === 'DOWN' && styles.negative]}>{value.direction} · {value.confidence_pct}%</Text><Text style={styles.reason}>Held-out accuracy {(Number(value.test_accuracy || 0) * 100).toFixed(1)}% · {value.training_samples} training samples</Text>{Object.entries(value.feature_importances).map(([name, importance]: any) => <View key={name} style={styles.exposureRow}><Text style={styles.reason}>{name}</Text><Text style={styles.reason}>{(Number(importance) * 100).toFixed(1)}%</Text></View>)}</View>;
  }
  if (value?.breakdown && value?.verdict) {
    return <View style={styles.structuredResult}><Text style={styles.contextLine}>ENSEMBLE CONSENSUS</Text><Text style={[styles.scenarioPnl, value.verdict === 'BEARISH' && styles.negative]}>{value.verdict} · {(Number(value.confidence || 0) * 100).toFixed(0)}%</Text>{Object.entries(value.breakdown).map(([name, vote]: any) => <View key={name} style={styles.exposureRow}><Text style={styles.reason}>{name.replace('_', ' ')}</Text><Text style={[styles.reason, vote.label === 'BEARISH' && styles.negative]}>{vote.label}</Text></View>)}</View>;
  }
  if (Array.isArray(value?.strategies) && value?.total !== undefined) {
    return <View style={styles.structuredResult}><Text style={styles.contextLine}>{value.total} STRATEGIES · {value.options_count} OPTIONS · {value.technical_count} TECHNICAL</Text>{value.strategies.slice(0, 12).map((item: any) => <View key={`${item.kind}-${item.id}`} style={styles.strategyResult}><View style={styles.resultHeading}><Text style={styles.resultRank}>{item.kind?.toUpperCase()}</Text><Text style={styles.resultName}>{item.name}</Text></View><Text style={styles.reason}>{item.layman_explanation || item.explanation}</Text></View>)}</View>;
  }
  if (Array.isArray(value?.strategies) && value?.days_ahead !== undefined) {
    return <View style={styles.structuredResult}>{value.strategies.map((item: any, index: number) => <View key={`${item.event}-${index}`} style={styles.strategyResult}><View style={styles.resultHeading}><Text style={styles.resultRank}>{item.days_away}D</Text><Text style={styles.resultName}>{item.event}</Text><Text style={styles.fit}>{item.risk_level}</Text></View><Text style={styles.reason}>{item.strategy} · {item.timing}</Text><Text style={styles.reason}>{item.rationale}</Text></View>)}</View>;
  }
  return <Text selectable style={styles.resultText}>{JSON.stringify(value, null, 2)}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.offWhite }, content: { padding: spacing.md, paddingBottom: 120, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, headerActions: { alignItems: 'flex-end', gap: 5 }, settingsButton: { paddingHorizontal: 8, paddingVertical: 4 }, settingsText: { ...typography.small, color: colors.teal, fontWeight: '800' }, eyebrow: { ...typography.caption, color: colors.gold, fontWeight: '800', letterSpacing: 1.4 },
  title: { ...typography.h2, color: colors.textPrimary, marginTop: 2 }, status: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: borderRadius.full }, online: { backgroundColor: colors.gainBg }, offline: { backgroundColor: colors.lossBg },
  dot: { width: 7, height: 7, borderRadius: 4 }, statusText: { ...typography.small, color: colors.textPrimary, fontWeight: '600' },
  notice: { backgroundColor: colors.lossBg }, noticeTitle: { ...typography.h4, color: colors.loss }, noticeText: { ...typography.small, color: colors.textSecondary, marginTop: 4 },
  hero: { backgroundColor: colors.indigo }, modeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  segmented: { flexDirection: 'row', backgroundColor: colors.inputBg, borderRadius: borderRadius.md, padding: 3, flex: 1 }, segment: { flex: 1, alignItems: 'center', paddingHorizontal: 9, paddingVertical: 8, borderRadius: borderRadius.sm }, activeSegment: { backgroundColor: colors.white }, segmentText: { fontSize: 10, fontWeight: '700', color: colors.textTertiary }, activeSegmentText: { color: colors.indigo },
  orderButton: { marginLeft: spacing.sm, padding: 9, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.goldMuted }, orderButtonText: { color: colors.goldLight, fontWeight: '700', fontSize: 12 },
  label: { ...typography.caption, color: colors.textTertiary, fontWeight: '700', marginBottom: 5 }, symbolRow: { flexDirection: 'row', gap: spacing.sm }, symbolInput: { flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.h3, color: colors.textPrimary },
  analyzeButton: { backgroundColor: colors.gold, minWidth: 92, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' }, analyzeText: { color: colors.white, fontWeight: '800' }, helper: { ...typography.small, color: colors.goldLight, marginTop: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs }, sectionTitle: { ...typography.h4, color: colors.textPrimary }, sectionHint: { ...typography.small, color: colors.textTertiary, marginTop: 2 },
  orderCard: { gap: spacing.md }, modeBadge: { fontSize: 10, fontWeight: '800', color: colors.gain, backgroundColor: colors.gainBg, padding: 6, borderRadius: 8 }, liveBadge: { color: colors.loss, backgroundColor: colors.lossBg }, ticketRow: { flexDirection: 'row', gap: spacing.sm }, ticketField: { flex: 1 }, ticketValue: { ...typography.bodyMd, fontWeight: '700', color: colors.textPrimary }, qtyInput: { borderWidth: 1, borderColor: colors.border, padding: 7, borderRadius: 8, color: colors.textPrimary }, ackRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, checkbox: { width: 22, height: 22, borderWidth: 1, borderColor: colors.border, borderRadius: 5, alignItems: 'center', justifyContent: 'center' }, checkboxOn: { backgroundColor: colors.loss, borderColor: colors.loss }, check: { color: colors.white, fontWeight: '900' }, ackText: { flex: 1, ...typography.small, color: colors.textSecondary }, placeButton: { backgroundColor: colors.gain, borderRadius: 12, alignItems: 'center', padding: 13 }, sellButton: { backgroundColor: colors.loss }, placeText: { color: colors.white, fontWeight: '800' }, cancelButton: { borderWidth: 1, borderColor: colors.loss, borderRadius: 12, alignItems: 'center', padding: 11 }, cancelText: { color: colors.loss, fontWeight: '800' },
  brokerRow: { flexDirection: 'row', gap: spacing.sm }, brokerCard: { flex: 1 }, brokerTitleRow: { flexDirection: 'row', justifyContent: 'space-between' }, brokerName: { ...typography.h4, color: colors.textPrimary }, role: { fontSize: 9, color: colors.teal, backgroundColor: colors.tealLight, padding: 5, borderRadius: 7, fontWeight: '800' }, brokerDetail: { ...typography.small, color: colors.textSecondary, marginTop: 10, minHeight: 34 }, brokerState: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }, connect: { ...typography.small, color: colors.teal, fontWeight: '700' },
  analystGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }, analyst: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 6 }, agentNumber: { width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, agentNumberText: { fontSize: 11, fontWeight: '800', color: colors.indigo }, analystName: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.textPrimary }, ready: { fontSize: 8, color: colors.gain, fontWeight: '800' }, debateFlow: { marginTop: spacing.sm, padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.offWhite, flexDirection: 'row', justifyContent: 'space-between' }, bull: { fontSize: 9, color: colors.gain, fontWeight: '900' }, bear: { fontSize: 9, color: colors.loss, fontWeight: '900' }, vs: { fontSize: 9, color: colors.textTertiary, fontWeight: '700' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, actionCard: { width: '48%', minHeight: 66, backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight, padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 9 }, actionAccent: { width: 4, alignSelf: 'stretch', borderRadius: 4 }, actionLabel: { flex: 1, fontSize: 12, fontWeight: '700', color: colors.textPrimary }, actionArrow: { fontSize: 24, color: colors.textTertiary },
  alertCard: { gap: spacing.sm }, alertInput: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, paddingVertical: 10, color: colors.textPrimary }, alertButton: { backgroundColor: colors.teal, borderRadius: borderRadius.md, alignItems: 'center', padding: 12 },
  settingsCard: { gap: spacing.sm }, settingsActions: { flexDirection: 'row', gap: spacing.sm }, secondaryButton: { flex: 1, borderWidth: 1, borderColor: colors.teal, borderRadius: borderRadius.md, alignItems: 'center', padding: 11 }, secondaryButtonText: { color: colors.teal, fontWeight: '800' }, settingsDivider: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.xs },
  resultCard: { maxHeight: 520 }, resultText: { fontFamily: 'monospace', fontSize: 11, lineHeight: 16, color: colors.textSecondary, marginTop: spacing.sm }, resultControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, exportButton: { backgroundColor: colors.indigoLight, borderRadius: borderRadius.sm, paddingHorizontal: 9, paddingVertical: 6 }, exportText: { color: colors.indigo, fontSize: 10, fontWeight: '800' }, close: { color: colors.teal, fontWeight: '700' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: spacing.md }, chip: { backgroundColor: colors.indigoLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7 }, chipText: { fontSize: 10, color: colors.indigo, fontWeight: '700' },
  streamCard: { gap: spacing.sm, borderColor: colors.indigo }, streamProgress: { gap: 5 }, streamStats: { flexDirection: 'row', gap: spacing.sm }, streamStat: { fontSize: 10, fontWeight: '800', color: colors.indigo, backgroundColor: colors.indigoLight, padding: 6, borderRadius: borderRadius.sm }, streamLine: { ...typography.small, color: colors.textSecondary }, streamHint: { ...typography.small, color: colors.teal, fontWeight: '700' }, hintApplied: { ...typography.small, color: colors.gain, fontWeight: '800' }, stopStream: { color: colors.loss, fontWeight: '800' },
  structuredResult: { gap: spacing.sm, marginTop: spacing.sm }, contextLine: { ...typography.small, color: colors.textSecondary, backgroundColor: colors.offWhite, padding: spacing.sm, borderRadius: borderRadius.sm }, strategyResult: { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: spacing.sm, gap: 4 }, resultHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs }, resultRank: { color: colors.gold, fontWeight: '900' }, resultName: { ...typography.h4, color: colors.textPrimary, flex: 1 }, fit: { fontSize: 11, color: colors.gain, fontWeight: '900', backgroundColor: colors.gainBg, padding: 5, borderRadius: 7 }, reason: { ...typography.small, color: colors.textSecondary, flex: 1 }, budget: { fontSize: 10, fontWeight: '700', color: colors.gain }, budgetBreach: { color: colors.loss }, scenarioPnl: { ...typography.h2, color: colors.gain }, negative: { color: colors.loss }, exposureRow: { flexDirection: 'row', justifyContent: 'space-between' }, hedge: { fontSize: 10, fontWeight: '800', color: colors.teal, backgroundColor: colors.tealLight, padding: spacing.xs, borderRadius: borderRadius.sm }, agendaRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingBottom: spacing.xs }, agendaPriority: { fontSize: 9, fontWeight: '900', color: colors.gold }, agendaText: { ...typography.small, color: colors.textPrimary, flex: 1 }, resultSubheading: { ...typography.h4, color: colors.textPrimary, marginTop: spacing.sm },
  newSession: { color: colors.teal, fontWeight: '800' }, sessions: { gap: spacing.sm }, session: { width: 170, padding: spacing.sm, backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border }, activeSession: { borderColor: colors.teal, backgroundColor: colors.tealLight }, sessionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sessionTitle: { flex: 1, fontSize: 12, fontWeight: '700', color: colors.textPrimary }, deleteSession: { color: colors.textTertiary, fontSize: 18, lineHeight: 18, paddingLeft: 8 }, sessionMeta: { fontSize: 10, color: colors.textTertiary, marginTop: 4 },
  chatCard: { gap: spacing.sm }, message: { backgroundColor: colors.offWhite, borderRadius: borderRadius.md, padding: spacing.sm, maxWidth: '92%' }, userMessage: { alignSelf: 'flex-end', backgroundColor: colors.indigoLight }, messageRole: { fontSize: 8, letterSpacing: .7, color: colors.textTertiary, fontWeight: '800', marginBottom: 3 }, messageText: { ...typography.small, color: colors.textPrimary }, chatRow: { flexDirection: 'row', gap: spacing.sm }, chatInput: { flex: 1, backgroundColor: colors.inputBg, borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, paddingVertical: 10, color: colors.textPrimary }, send: { backgroundColor: colors.indigo, borderRadius: borderRadius.md, paddingHorizontal: 16, justifyContent: 'center' }, sendText: { color: colors.white, fontWeight: '700' },
});
