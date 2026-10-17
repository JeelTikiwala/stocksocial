import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/constants';
import { Card, SectionHeader } from '@/components/ui';

export default function LearnScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Learn</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Getting Started" />

        <Card style={styles.courseCard}>
          <View style={styles.courseIcon}>
            <Text style={styles.courseEmoji}>📈</Text>
          </View>
          <View style={styles.courseInfo}>
            <Text style={styles.courseTitle}>Investing Basics</Text>
            <Text style={styles.courseDescription}>
              Learn the fundamentals of stock market investing
            </Text>
            <View style={styles.courseMeta}>
              <Text style={styles.courseMetaText}>8 lessons · 45 min</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.courseCard}>
          <View style={styles.courseIcon}>
            <Text style={styles.courseEmoji}>📊</Text>
          </View>
          <View style={styles.courseInfo}>
            <Text style={styles.courseTitle}>Understanding Charts</Text>
            <Text style={styles.courseDescription}>
              Master technical analysis and chart patterns
            </Text>
            <View style={styles.courseMeta}>
              <Text style={styles.courseMetaText}>12 lessons · 1h 20m</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.courseCard}>
          <View style={styles.courseIcon}>
            <Text style={styles.courseEmoji}>💰</Text>
          </View>
          <View style={styles.courseInfo}>
            <Text style={styles.courseTitle}>Portfolio Management</Text>
            <Text style={styles.courseDescription}>
              Build and manage a diversified portfolio
            </Text>
            <View style={styles.courseMeta}>
              <Text style={styles.courseMetaText}>10 lessons · 55 min</Text>
            </View>
          </View>
        </Card>

        <SectionHeader title="Popular Topics" style={styles.sectionHeader} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topicsContainer}
        >
          {['Mutual Funds', 'IPOs', 'Dividends', 'Tax Saving', 'SIP'].map(
            (topic) => (
              <View key={topic} style={styles.topicPill}>
                <Text style={styles.topicText}>{topic}</Text>
              </View>
            )
          )}
        </ScrollView>
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
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing.xxl,
  },
  courseCard: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  courseIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.purpleLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseEmoji: {
    fontSize: 28,
  },
  courseInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  courseTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  courseDescription: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 4,
  },
  courseMeta: {
    marginTop: spacing.xs,
  },
  courseMetaText: {
    ...typography.small,
    color: colors.textTertiary,
  },
  sectionHeader: {
    marginTop: spacing.lg,
  },
  topicsContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  topicPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  topicText: {
    ...typography.smallMd,
    color: colors.textPrimary,
  },
});
