import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, typography } from '@/constants';
import {
  Button,
  GlobeIcon,
  PieChartIcon,
  TrendingIcon,
  UsersIcon,
} from '@/components/ui';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo & Branding */}
        <View style={styles.brandingSection}>
          <View style={styles.logoContainer}>
            <GlobeIcon size={44} color={colors.teal} />
          </View>
          <Text style={styles.appName}>StockCircle</Text>
          <Text style={styles.tagline}>
            Invest smarter, together
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <FeatureItem
            icon={<PieChartIcon size={26} color={colors.purple} />}
            title="Track your portfolio"
            description="Connect your broker and see your investments in one place"
          />
          <FeatureItem
            icon={<UsersIcon size={26} color={colors.purple} />}
            title="Learn from others"
            description="Follow investors and see what they're buying"
          />
          <FeatureItem
            icon={<TrendingIcon size={26} color={colors.purple} />}
            title="Get insights"
            description="AI-powered analysis of your portfolio"
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
    paddingBottom: spacing.xxl,
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
