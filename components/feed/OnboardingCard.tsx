import React from 'react';
import { StyleSheet, View, Text, Pressable, ViewStyle } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card, ChevronRightIcon, CheckIcon } from '@/components/ui';

interface OnboardingTask {
  id: string;
  label: string;
  completed: boolean;
  onPress: () => void;
}

interface OnboardingCardProps {
  onDismiss?: () => void;
  style?: ViewStyle;
}

const defaultTasks: OnboardingTask[] = [
  { id: '1', label: 'Personalize your feed', completed: false, onPress: () => {} },
  { id: '2', label: 'Add bio and profile photo', completed: false, onPress: () => {} },
  { id: '3', label: 'Review Community Guidelines', completed: true, onPress: () => {} },
  { id: '4', label: 'Follow someone', completed: false, onPress: () => {} },
  { id: '5', label: 'Add your investments', completed: false, onPress: () => {} },
];

export const OnboardingCard: React.FC<OnboardingCardProps> = ({
  onDismiss,
  style,
}) => {
  const completedCount = defaultTasks.filter((t) => t.completed).length;
  const progress = completedCount / defaultTasks.length;

  return (
    <Card style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Finish account setup</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{completedCount}/{defaultTasks.length}</Text>
        </View>
      </View>

      {/* Tasks */}
      <View style={styles.tasks}>
        {defaultTasks.map((task) => (
          <Pressable
            key={task.id}
            style={styles.taskRow}
            onPress={task.onPress}
          >
            <Text
              style={[
                styles.taskLabel,
                task.completed && styles.taskLabelCompleted,
              ]}
            >
              {task.label}
            </Text>
            {task.completed ? (
              <View style={styles.checkContainer}>
                <CheckIcon size={16} color={colors.white} />
              </View>
            ) : (
              <View style={styles.arrowContainer}>
                <ChevronRightIcon size={16} color={colors.teal} />
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.teal,
    borderRadius: 2,
  },
  progressText: {
    ...typography.small,
    color: colors.textTertiary,
  },
  tasks: {
    gap: spacing.xs,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  taskLabel: {
    ...typography.body,
    color: colors.purple,
    flex: 1,
  },
  taskLabelCompleted: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OnboardingCard;
