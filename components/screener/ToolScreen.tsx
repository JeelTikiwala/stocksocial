import React from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants';
import { ScreenHeader } from './ScreenHeader';
import { AsOfBanner } from './AsOfBanner';
import { Disclaimer } from './Disclaimer';

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  disclaimerExtra?: string;
  scroll?: boolean;
}

/** Shared chrome for the custom tool screens. */
export const ToolScreen: React.FC<Props> = ({ title, subtitle, children, refreshing = false, onRefresh, disclaimerExtra, scroll = true }) => (
  <SafeAreaView style={styles.safe} edges={['top']}>
    <ScreenHeader title={title} subtitle={subtitle} />
    {scroll ? (
      <ScrollView contentContainerStyle={styles.content} refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined} keyboardShouldPersistTaps="handled">
        <AsOfBanner compact />
        {children}
        <Disclaimer extra={disclaimerExtra} />
      </ScrollView>
    ) : (
      <>
        <AsOfBanner compact />
        {children}
      </>
    )}
  </SafeAreaView>
);

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: 'transparent' }, content: { paddingBottom: spacing.tabBar } });
