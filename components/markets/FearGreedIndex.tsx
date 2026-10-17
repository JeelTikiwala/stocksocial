import React, { useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
  ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card } from '@/components/ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FearGreedLabel = 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';

interface HistoricalPoint {
  date: string;
  value: number;
}

interface FearGreedData {
  score: number;
  label: FearGreedLabel;
  historical: HistoricalPoint[];
}

interface FearGreedIndexProps {
  data?: FearGreedData;
  onInfoPress?: () => void;
  style?: ViewStyle;
}

const ZONES = [
  { start: -180, end: -144, color: '#EF4444', label: 'Extreme Fear (0-24)' },
  { start: -144, end: -101, color: '#F97316', label: 'Fear (25-44)' },
  { start: -101, end: -79, color: '#EAB308', label: 'Neutral (45-55)' },
  { start: -79, end: -36, color: '#84CC16', label: 'Greed (56-74)' },
  { start: -36, end: 0, color: '#22C55E', label: 'Extreme Greed (75-100)' },
] as const;

const getZoneColor = (score: number): string => {
  if (score <= 24) return '#EF4444';
  if (score <= 44) return '#F97316';
  if (score <= 55) return '#EAB308';
  if (score <= 74) return '#84CC16';
  return '#22C55E';
};

const getLabel = (score: number): FearGreedLabel => {
  if (score <= 24) return 'Extreme Fear';
  if (score <= 44) return 'Fear';
  if (score <= 55) return 'Neutral';
  if (score <= 74) return 'Greed';
  return 'Extreme Greed';
};

const defaultData: FearGreedData = {
  score: 58,
  label: 'Greed',
  historical: [
    44, 42, 45, 47, 46, 49, 48, 50, 51, 53,
    52, 50, 49, 51, 54, 56, 57, 55, 53, 54,
    56, 58, 57, 56, 55, 57, 58, 59, 58, 58,
  ].map((value, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    return { date: date.toISOString(), value };
  }),
};

export const FearGreedIndex: React.FC<FearGreedIndexProps> = ({
  data = defaultData,
  onInfoPress,
  style,
}) => {
  const needleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(needleAnim, {
      toValue: data.score,
      useNativeDriver: true,
      tension: 34,
      friction: 8,
    }).start();
  }, [data.score, needleAnim]);

  const gaugeWidth = Math.min(SCREEN_WIDTH - spacing.md * 4, 300);
  const gaugeHeight = 184;
  const centerX = gaugeWidth / 2;
  const centerY = gaugeHeight - 42;
  const radius = Math.min(centerX - 14, centerY - 12);
  const needleLength = Math.max(46, radius - 26);
  const needleContainerHeight = needleLength + 12;

  const createArcPath = (startAngle: number, endAngle: number, r: number): string => {
    const start = {
      x: centerX + r * Math.cos((startAngle * Math.PI) / 180),
      y: centerY + r * Math.sin((startAngle * Math.PI) / 180),
    };
    const end = {
      x: centerX + r * Math.cos((endAngle * Math.PI) / 180),
      y: centerY + r * Math.sin((endAngle * Math.PI) / 180),
    };
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const needleRotation = needleAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['-180deg', '0deg'],
  });

  const sparkPath = useMemo(() => {
    const points = data.historical;
    if (points.length < 2) return '';

    const sparkWidth = gaugeWidth;
    const sparkHeight = 42;
    const minVal = Math.min(...points.map((p) => p.value));
    const maxVal = Math.max(...points.map((p) => p.value));
    const range = maxVal - minVal || 1;

    return points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * sparkWidth;
        const y = sparkHeight - ((p.value - minVal) / range) * (sparkHeight - 4);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [data.historical, gaugeWidth]);

  return (
    <Card style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Fear & Greed Index</Text>
        <Pressable onPress={onInfoPress} hitSlop={10} style={styles.infoButton}>
          <Text style={styles.infoIcon}>ℹ️</Text>
        </Pressable>
      </View>

      <View style={[styles.gaugeContainer, { width: gaugeWidth, height: gaugeHeight }]}>
        <Svg width={gaugeWidth} height={gaugeHeight}>
          {ZONES.map((zone) => (
            <Path
              key={zone.label}
              d={createArcPath(zone.start, zone.end, radius)}
              stroke={zone.color}
              strokeWidth={16}
              fill="none"
              strokeLinecap="round"
            />
          ))}
        </Svg>

        <Animated.View
          style={[
            styles.needleContainer,
            {
              left: centerX - 4,
              bottom: gaugeHeight - centerY - 6,
              height: needleContainerHeight,
              transformOrigin: `4px ${needleContainerHeight - 4}px`,
              transform: [{ rotate: needleRotation }],
            },
          ]}
        >
          <View style={[styles.needle, { height: needleLength }]} />
          <View style={styles.needleCenter} />
        </Animated.View>

      </View>

      <View style={styles.scoreContainer}>
        <Text style={[styles.score, { color: getZoneColor(data.score) }]}>{data.score}</Text>
        <Text style={styles.label}>{getLabel(data.score)}</Text>
      </View>

      <View style={styles.tickRow}>
        {[0, 25, 50, 75, 100].map((tick) => (
          <Text key={tick} style={styles.tickText}>{tick}</Text>
        ))}
      </View>

      <View style={styles.legend}>
        {ZONES.map((zone) => (
          <View key={zone.label} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: zone.color }]} />
            <Text style={styles.legendText}>{zone.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sparklineContainer}>
        <Text style={styles.sparklineLabel}>30-day trend</Text>
        <Svg width={gaugeWidth} height={42}>
          <Path
            d={sparkPath}
            stroke={getZoneColor(data.score)}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
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
  infoButton: {
    padding: spacing.xs,
  },
  infoIcon: {
    fontSize: 16,
  },
  gaugeContainer: {
    alignSelf: 'center',
    position: 'relative',
  },
  needleContainer: {
    position: 'absolute',
    width: 8,
    alignItems: 'center',
  },
  needle: {
    width: 3,
    backgroundColor: colors.textPrimary,
    borderRadius: 2,
  },
  needleCenter: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.textPrimary,
    marginTop: -2,
  },
  scoreContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  score: {
    fontSize: 34,
    fontWeight: '700',
  },
  label: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  tickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  tickText: {
    ...typography.small,
    color: colors.textTertiary,
  },
  legend: {
    marginTop: spacing.sm,
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.xxs,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  sparklineContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  sparklineLabel: {
    ...typography.small,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
});

export default FearGreedIndex;
