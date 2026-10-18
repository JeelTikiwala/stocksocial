import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, typography } from '@/constants';
import {
  Button,
  LayersIcon,
  PieChartIcon,
  ShieldIcon,
  ZapIcon,
} from '@/components/ui';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo & Branding */}
        <View style={styles.brandingSection}>
          <View style={styles.logoContainer}>
            <LayersIcon size={44} color={colors.indigo} />
          </View>
          <Text style={styles.appName}>Delta</Text>
          <Text style={styles.tagline}>
            NSE F&O analytics, built for option traders
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <FeatureItem
            icon={<ZapIcon size={26} color={colors.indigo} />}
            title="Four screener zones"
            description="Scalper, Intraday, Seller and Index tools on NSE F&O data"
          />
          <FeatureItem
            icon={<ShieldIcon size={26} color={colors.indigo} />}
            title="Seller-grade analytics"
            description="IV rank, straddles, OI by strike, chains with greeks and FutEq OI"
          />
          <FeatureItem
            icon={<PieChartIcon size={26} color={colors.indigo} />}
            title="Sync your account"
            description="Sign in to save watchlists and link a broker for portfolio sync"
          />
        </View>
      </View>

      {/* CTA Buttons */}
      <View style={styles.ctaSection}>
        <Button
          title="Get Started"
          onPress={() => router.push('/(auth)/register')}
          fullWidth
          size="lg"
        />
        <Button
          title="I already have an account"
          variant="ghost"
          onPress={() => router.push('/(auth)/login')}
          fullWidth
          size="lg"
          style={styles.loginButton}
        />
        <Button
          title="Continue without an account"
          variant="ghost"
          onPress={() => router.replace('/(tabs)')}
          fullWidth
          size="md"
        />
      </View>
    </SafeAreaView>
  );
}

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      {icon}
    </View>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  brandingSection: {
    alignItems: 'center',
    paddingTop: spacing.xxxxl,
    paddingBottom: spacing.tabBar,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
  },
  featuresSection: {
    gap: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.purpleLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  featureDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },
  ctaSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  loginButton: {
    marginTop: spacing.sm,
  },
});
