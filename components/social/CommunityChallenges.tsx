import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Share,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card } from '@/components/ui';
import { formatIndianCurrency } from '@/utils';

type ChallengeStatus = 'active' | 'completed' | 'upcoming';

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  startDate: string;
  endDate: string;
  status: ChallengeStatus;
  target?: number;
  current?: number;
  participants: number;
  badge?: string;
  isJoined: boolean;
}

interface CommunityChallengesProps {
  style?: ViewStyle;
}

const mockChallenges: Challenge[] = [
  {
    id: '1',
    title: 'Save ₹50,000 this month',
    description: 'Add at least ₹50,000 to your portfolio by month end',
    icon: '💰',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    status: 'active',
    target: 50000,
    current: 32000,
    participants: 1234,
    badge: '🏆 Saver',
    isJoined: true,
  },
  {
    id: '2',
    title: 'Dividend Diversifier',
    description: 'Add a new dividend-paying stock to your portfolio',
    icon: '📊',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    status: 'active',
    participants: 890,
    badge: '💎 Dividend Hunter',
    isJoined: false,
  },
  {
    id: '3',
    title: 'Week of Learning',
    description: 'Complete 5 educational articles in 7 days',
    icon: '📚',
    startDate: '2026-03-15',
    endDate: '2026-03-22',
    status: 'active',
    target: 5,
    current: 2,
    participants: 567,
    badge: '🎓 Scholar',
    isJoined: true,
  },
  {
    id: '4',
    title: 'IPO Explorer',
    description: 'Research and add notes on 3 upcoming IPOs',
    icon: '🚀',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    status: 'upcoming',
    participants: 0,
    badge: '🔍 Explorer',
    isJoined: false,
  },
];

export const CommunityChallenges: React.FC<CommunityChallengesProps> = ({ style }) => {
  const [challenges, setChallenges] = useState(mockChallenges);

  const handleJoin = (challengeId: string) => {
    setChallenges(prev =>
      prev.map(c =>
        c.id === challengeId ? { ...c, isJoined: true, participants: c.participants + 1 } : c
      )
    );
  };

  const handleShare = async (challenge: Challenge) => {
    try {
      await Share.share({
        message: `I'm taking the "${challenge.title}" challenge on StockCircle! Join me and earn the ${challenge.badge} badge. 🚀`,
      });
    } catch (error) {
      // Handle error
    }
  };

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const upcomingChallenges = challenges.filter(c => c.status === 'upcoming');

  return (
    <View style={[styles.container, style]}>
      {/* Active Challenges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Challenges</Text>
        {activeChallenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onJoin={() => handleJoin(challenge.id)}
            onShare={() => handleShare(challenge)}
          />
        ))}
      </View>

      {/* Upcoming Challenges */}
      {upcomingChallenges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coming Soon</Text>
          {upcomingChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onJoin={() => handleJoin(challenge.id)}
              onShare={() => handleShare(challenge)}
            />
          ))}
        </View>
      )}

      {/* Completed Badge Showcase */}
      <Card style={styles.badgeShowcase}>
        <Text style={styles.badgeTitle}>Your Badges</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>🏆</Text>
            <Text style={styles.badgeLabel}>Saver</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>🎯</Text>
            <Text style={styles.badgeLabel}>Goal Getter</Text>
          </View>
          <View style={[styles.badge, styles.badgeLocked]}>
            <Text style={styles.badgeIcon}>🔒</Text>
            <Text style={styles.badgeLabel}>Scholar</Text>
          </View>
          <View style={[styles.badge, styles.badgeLocked]}>
            <Text style={styles.badgeIcon}>🔒</Text>
            <Text style={styles.badgeLabel}>Explorer</Text>
          </View>
        </View>
      </Card>
    </View>
  );
};

interface ChallengeCardProps {
  challenge: Challenge;
  onJoin: () => void;
  onShare: () => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, onJoin, onShare }) => {
  const progress = challenge.target && challenge.current
    ? (challenge.current / challenge.target) * 100
    : 0;

  const daysLeft = Math.max(0, Math.ceil(
    (new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ));

  return (
    <Card style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <Text style={styles.challengeIcon}>{challenge.icon}</Text>
        <View style={styles.challengeInfo}>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.challengeDescription}>{challenge.description}</Text>
        </View>
      </View>

      {/* Progress bar (if applicable) */}
      {challenge.target && challenge.isJoined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {challenge.current !== undefined && (
              typeof challenge.target === 'number' && challenge.target >= 1000
                ? `${formatIndianCurrency(challenge.current, { showSymbol: false })} / ${formatIndianCurrency(challenge.target, { showSymbol: false })}`
                : `${challenge.current} / ${challenge.target}`
            )}
          </Text>
        </View>
      )}

      {/* Badge & Stats */}
      <View style={styles.challengeFooter}>
        <View style={styles.challengeMeta}>
          {challenge.badge && (
            <View style={styles.badgePreview}>
              <Text style={styles.badgePreviewText}>{challenge.badge}</Text>
            </View>
          )}
          <Text style={styles.participants}>
            {challenge.participants.toLocaleString()} participants
          </Text>
          {challenge.status === 'active' && (
            <Text style={styles.daysLeft}>{daysLeft}d left</Text>
          )}
        </View>

        {challenge.isJoined ? (
          <Pressable onPress={onShare} style={styles.shareButton}>
            <Text style={styles.shareText}>Share ↗</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onJoin}
            style={[
              styles.joinButton,
              challenge.status === 'upcoming' && styles.joinButtonDisabled,
            ]}
            disabled={challenge.status === 'upcoming'}
          >
            <Text style={[
              styles.joinText,
              challenge.status === 'upcoming' && styles.joinTextDisabled,
            ]}>
              {challenge.status === 'upcoming' ? 'Notify Me' : 'Join'}
            </Text>
          </Pressable>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  challengeCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  challengeHeader: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  challengeIcon: {
    fontSize: 32,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  challengeDescription: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.offWhite,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.teal,
    borderRadius: 4,
  },
  progressText: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
    textAlign: 'right',
  },
  challengeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  challengeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
    flex: 1,
  },
  badgePreview: {
    backgroundColor: colors.purpleLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgePreviewText: {
    ...typography.small,
    color: colors.purple,
    fontSize: 10,
  },
  participants: {
    ...typography.small,
    color: colors.textTertiary,
  },
  daysLeft: {
    ...typography.small,
    color: colors.warning,
  },
  shareButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  shareText: {
    ...typography.smallMd,
    color: colors.teal,
  },
  joinButton: {
    backgroundColor: colors.teal,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  joinButtonDisabled: {
    backgroundColor: colors.offWhite,
  },
  joinText: {
    ...typography.smallMd,
    color: colors.white,
    fontWeight: '600',
  },
  joinTextDisabled: {
    color: colors.textSecondary,
  },
  badgeShowcase: {
    padding: spacing.md,
  },
  badgeTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  badge: {
    alignItems: 'center',
    width: 60,
  },
  badgeLocked: {
    opacity: 0.4,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: spacing.xxs,
  },
  badgeLabel: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default CommunityChallenges;
