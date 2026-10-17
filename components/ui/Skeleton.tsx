import React from 'react';
import { StyleSheet, View, ViewStyle, Animated, DimensionValue } from 'react-native';
import { colors, borderRadius, spacing } from '@/constants';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius: radius = borderRadius.sm,
  style,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: radius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Common skeleton patterns
interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: DimensionValue;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lastLineWidth = '60%',
}) => {
  return (
    <View style={styles.textContainer}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={14}
          style={styles.textLine}
        />
      ))}
    </View>
  );
};

export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <Skeleton width={size} height={size} borderRadius={size / 2} />
);

export const SkeletonCard: React.FC = () => (
  <View style={styles.cardContainer}>
    <View style={styles.cardHeader}>
      <SkeletonAvatar size={48} />
      <View style={styles.cardHeaderText}>
        <Skeleton width={120} height={14} />
        <Skeleton width={80} height={12} style={styles.marginTop} />
      </View>
    </View>
    <SkeletonText lines={3} />
  </View>
);

export const SkeletonListItem: React.FC = () => (
  <View style={styles.listItem}>
    <SkeletonAvatar size={40} />
    <View style={styles.listItemContent}>
      <Skeleton width={100} height={14} />
      <Skeleton width={60} height={12} style={styles.marginTop} />
    </View>
    <Skeleton width={60} height={24} borderRadius={borderRadius.full} />
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border,
  },
  textContainer: {
    gap: spacing.xs,
  },
  textLine: {
    marginBottom: spacing.xxs,
  },
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardHeaderText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  marginTop: {
    marginTop: spacing.xxs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  listItemContent: {
    flex: 1,
  },
});
