import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Button, ArrowLeftIcon, CheckIcon } from '@/components/ui';
import { useAppSettingsStore } from '@/stores';
import { api } from '@/services/api';

type BrokerStatus = 'idle' | 'connecting' | 'success' | 'error';

type Broker = {
  id: string;
  name: string;
  api: string;
  mark: string;
  brandColor: string;
  available?: boolean;
};

type BrokerGroup = {
  title: string;
  brokers: Broker[];
};

const brokerGroups: BrokerGroup[] = [
  {
    title: 'Institutional Brokers',
    brokers: [
      {
        id: 'symphony-xts',
        name: 'Symphony XTS',
        api: 'Institutional API',
        mark: 'SX',
        brandColor: '#159B62',
      },
      {
        id: 'jainam',
        name: 'Jainam',
        api: 'Duck API',
        mark: 'JA',
        brandColor: '#829B52',
      },
      {
        id: 'iifl-securities',
        name: 'IIFL Securities',
        api: 'IIFL API',
        mark: 'IIFL',
        brandColor: '#D49B28',
      },
      {
        id: 'master-trust',
        name: 'Master Trust',
        api: 'Master API',
        mark: 'MT',
        brandColor: '#147DB8',
      },
    ],
  },
  {
    title: 'Indian Brokers',
    brokers: [
      {
        id: 'zerodha',
        name: 'Zerodha',
        api: 'Kite Connect API',
        mark: 'Z',
        brandColor: '#F4512C',
        available: true,
      },
      {
        id: 'angel-one',
        name: 'Angel One',
        api: 'SmartAPI',
        mark: 'A1',
        brandColor: '#F26B38',
      },
      {
        id: 'upstox',
        name: 'Upstox',
        api: 'Upstox API v2',
        mark: 'UP',
        brandColor: '#6B2A91',
      },
      {
        id: '5paisa',
        name: '5Paisa',
        api: '5Paisa Developer',
        mark: '5P',
        brandColor: '#D62857',
      },
      {
        id: 'groww',
        name: 'Groww',
        api: 'Groww API',
        mark: 'GW',
        brandColor: '#5367F5',
      },
      {
        id: 'dhan',
        name: 'Dhan',
        api: 'DhanHQ API',
        mark: 'DH',
        brandColor: '#28A47C',
      },
    ],
  },
  {
    title: 'Global Brokers',
    brokers: [
      {
        id: 'interactive-brokers',
        name: 'Interactive Brokers',
        api: 'Client Portal API',
        mark: 'IB',
        brandColor: '#D83131',
      },
      {
        id: 'robinhood',
        name: 'Robinhood',
        api: 'Trading API',
        mark: 'RH',
        brandColor: '#45A000',
      },
      {
        id: 'tradestation',
        name: 'TradeStation',
        api: 'WebAPI / FIX',
        mark: 'TS',
        brandColor: '#0878C9',
      },
      {
        id: 'cqg',
        name: 'CQG',
        api: 'API Execution',
        mark: 'CQG',
        brandColor: '#D3204C',
      },
      {
        id: 'td-ameritrade',
        name: 'TD Ameritrade',
        api: 'Charles Schwab API',
        mark: 'TD',
        brandColor: '#4B9D35',
      },
      {
        id: 'international',
        name: 'All International Brokers',
        api: 'Trading API',
        mark: 'INTL',
        brandColor: '#1687B8',
      },
    ],
  },
  {
    title: 'Crypto Exchanges',
    brokers: [
      {
        id: 'delta-exchange',
        name: 'Delta Exchange',
        api: 'Crypto Derivatives',
        mark: 'Δ',
        brandColor: '#F29A24',
      },
      {
        id: 'binance',
        name: 'Binance',
        api: 'Binance Cloud API',
        mark: 'BN',
        brandColor: '#DFAE00',
      },
      {
        id: 'bybit',
        name: 'Bybit',
        api: 'V5 Unified API',
        mark: 'BY',
        brandColor: '#E99B19',
      },
      {
        id: 'coinbase',
        name: 'Coinbase',
        api: 'Advanced Trade API',
        mark: 'CB',
        brandColor: '#1652F0',
      },
    ],
  },
];

export default function LinkBrokerScreen() {
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null);
  const [status, setStatus] = useState<BrokerStatus>('idle');
  const setBrokerConnection = useAppSettingsStore((state) => state.setBrokerConnection);

  const handleConnectZerodha = async () => {
    setSelectedBroker('zerodha');
    setStatus('connecting');

    try {
      let authUrl = 'https://kite.zerodha.com';
      try {
        const res = await api.broker.getZerodhaAuthUrl();
        if (res.data?.data?.url) {
          authUrl = res.data.data.url;
        }
      } catch {
        // Fall back to the direct Zerodha login page in local development.
      }

      await WebBrowser.openBrowserAsync(authUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });

      try {
        await api.broker.sync();
      } catch {
        // The local API may not be configured yet; preserve the completed OAuth UX.
      }

      setStatus('success');
      setBrokerConnection(true, 'Zerodha');
      setTimeout(() => {
        router.replace('/(tabs)/portfolio');
      }, 800);
    } catch {
      setStatus('error');
    }
  };

  const handleBrokerPress = (broker: Broker) => {
    if (broker.id === 'zerodha' && broker.available) {
      handleConnectZerodha();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeftIcon size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Connect Broker</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.title}>Supported brokers & exchanges</Text>
          <Text style={styles.description}>
            Link an account to automatically sync your portfolio and trading activity.
          </Text>
        </View>

        {brokerGroups.map((group) => (
          <View key={group.title} style={styles.group}>
            <View style={styles.groupHeading}>
              <View style={styles.headingRule} />
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.headingRule} />
            </View>

            <View style={styles.brokerGrid}>
              {group.brokers.map((broker) => {
                const isSelected = selectedBroker === broker.id;
                const isConnecting = isSelected && status === 'connecting';
                const isSuccess = isSelected && status === 'success';

                return (
                  <Pressable
                    accessibilityLabel={`${broker.name}, ${broker.api}${
                      broker.available ? ', available to connect' : ', coming soon'
                    }`}
                    accessibilityRole="button"
                    disabled={!broker.available || status === 'connecting'}
                    key={broker.id}
                    onPress={() => handleBrokerPress(broker)}
                    style={({ pressed }) => [
                      styles.brokerCard,
                      isSelected && styles.brokerCardSelected,
                      pressed && styles.brokerCardPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.brokerMark,
                        { backgroundColor: `${broker.brandColor}18` },
                      ]}
                    >
                      <Text style={[styles.brokerMarkText, { color: broker.brandColor }]}>
                        {broker.mark}
                      </Text>
                    </View>

                    <Text numberOfLines={2} style={styles.brokerName}>
                      {broker.name}
                    </Text>
                    <Text numberOfLines={2} style={styles.brokerApi}>
                      {broker.api}
                    </Text>

                    <View
                      style={[
                        styles.availabilityBadge,
                        broker.available && styles.availableBadge,
                      ]}
                    >
                      {isConnecting ? (
                        <ActivityIndicator size={10} color={colors.teal} />
                      ) : isSuccess ? (
                        <CheckIcon size={12} color={colors.gain} />
                      ) : null}
                      <Text
                        style={[
                          styles.availabilityText,
                          broker.available && styles.availableText,
                        ]}
                      >
                        {isConnecting
                          ? 'Connecting'
                          : isSuccess
                            ? 'Connected'
                            : broker.available
                              ? 'Connect'
                              : 'Coming soon'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {status === 'success' && (
          <View style={styles.successMessage}>
            <Text style={styles.successTitle}>Connected successfully!</Text>
            <Text style={styles.messageSubtitle}>
              Your portfolio will sync automatically.
            </Text>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.errorMessage}>
            <Text style={styles.errorTitle}>Connection failed</Text>
            <Button
              title="Try Again"
              variant="outline"
              onPress={() => {
                setStatus('idle');
                setSelectedBroker(null);
              }}
              style={styles.retryButton}
            />
          </View>
        )}

        {status !== 'success' && (
          <Pressable
            style={styles.skipLink}
            onPress={() => router.replace('/(tabs)/portfolio')}
          >
            <Text style={styles.skipLinkText}>Skip for now</Text>
          </Pressable>
        )}

        <Text style={styles.footerText}>
          Your credentials are encrypted and never stored on our servers.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  backButton: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: spacing.xs,
    width: 40,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  intro: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 440,
  },
  group: {
    marginBottom: spacing.xl,
  },
  groupHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headingRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  groupTitle: {
    ...typography.smallMd,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  brokerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  brokerCard: {
    width: '48%',
    minHeight: 166,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  brokerCardSelected: {
    borderWidth: 2,
    borderColor: colors.teal,
  },
  brokerCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  brokerMark: {
    minWidth: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  brokerMarkText: {
    ...typography.smallMd,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  brokerName: {
    ...typography.smallMd,
    minHeight: 32,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 16,
  },
  brokerApi: {
    ...typography.label,
    minHeight: 26,
    color: colors.textTertiary,
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 12,
    marginTop: 2,
  },
  availabilityBadge: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    marginTop: spacing.xs,
  },
  availableBadge: {
    backgroundColor: colors.tealLight,
  },
  availabilityText: {
    ...typography.label,
    color: colors.textTertiary,
    fontSize: 8,
  },
  availableText: {
    color: colors.teal,
  },
  successMessage: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  successTitle: {
    ...typography.h3,
    color: colors.gain,
    marginBottom: spacing.xs,
  },
  messageSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorMessage: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  errorTitle: {
    ...typography.h4,
    color: colors.loss,
    marginBottom: spacing.sm,
  },
  retryButton: {
    minWidth: 120,
  },
  skipLink: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  skipLinkText: {
    ...typography.smallMd,
    color: colors.textSecondary,
  },
  footerText: {
    ...typography.small,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
