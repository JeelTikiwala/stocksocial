import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, Pressable, ViewStyle, Platform } from 'react-native';
import Svg, { Path, Circle, Line, G } from 'react-native-svg';
import { colors, typography, spacing } from '@/constants';
import { formatPercentage } from '@/utils';
import { ChartSegment } from '@/types';

// Conditionally import Haptics only on native
const Haptics = Platform.OS !== 'web' ? require('expo-haptics') : null;

interface DonutChartProps {
  data: ChartSegment[];
  size?: number;
  strokeWidth?: number;
  innerRadiusRatio?: number;
  todayChangePct: number;
  onSegmentPress?: (segment: ChartSegment) => void;
  style?: ViewStyle;
}

const MIN_SEGMENT_PCT = 3; // Segments below this % are merged into "Other"

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 280,
  strokeWidth = 32,
  innerRadiusRatio = 0.65,
  todayChangePct,
  onSegmentPress,
  style,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const outerPadding = 40;
  const containerSize = size + outerPadding * 2;

  const { segments, center, radius, innerRadius } = useMemo(() => {
    const centerPoint = size / 2;
    const outerRadius = (size - strokeWidth) / 2;
    const inner = outerRadius * innerRadiusRatio;

    // Process segments: sort by allocation and merge small ones
    const sortedData = [...data].sort((a, b) => b.allocationPct - a.allocationPct);

    const mainSegments: ChartSegment[] = [];
    let otherPct = 0;
    let otherChangePct = 0;

    sortedData.forEach((segment) => {
      if (segment.allocationPct >= MIN_SEGMENT_PCT) {
        mainSegments.push(segment);
      } else {
        otherPct += segment.allocationPct;
        otherChangePct += segment.todayChangePct * (segment.allocationPct / 100);
      }
    });

    if (otherPct > 0) {
      mainSegments.push({
        ticker: 'Other',
        allocationPct: otherPct,
        todayChangePct: otherChangePct / (otherPct / 100),
        color: colors.chartOther,
      });
    }

    // Calculate arc paths
    let startAngle = -90; // Start from top
    const processedSegments = mainSegments.map((segment, index) => {
      const sweepAngle = (segment.allocationPct / 100) * 360;
      const endAngle = startAngle + sweepAngle;
      const midAngle = startAngle + sweepAngle / 2;

      const path = describeArc(
        centerPoint,
        centerPoint,
        outerRadius,
        inner,
        startAngle,
        endAngle
      );

      const labelAngleRad = (midAngle * Math.PI) / 180;
      const labelRadius = outerRadius + 32;
      const labelX = centerPoint + Math.cos(labelAngleRad) * labelRadius;
      const labelY = centerPoint + Math.sin(labelAngleRad) * labelRadius;

      const lineStartRadius = outerRadius + 4;
      const lineEndRadius = outerRadius + 28;
      const lineStartX = centerPoint + Math.cos(labelAngleRad) * lineStartRadius;
      const lineStartY = centerPoint + Math.sin(labelAngleRad) * lineStartRadius;
      const lineEndX = centerPoint + Math.cos(labelAngleRad) * lineEndRadius;
      const lineEndY = centerPoint + Math.sin(labelAngleRad) * lineEndRadius;

      const result = {
        ...segment,
        path,
        startAngle,
        endAngle,
        midAngle,
        labelX,
        labelY,
        lineStartX,
        lineStartY,
        lineEndX,
        lineEndY,
      };

      startAngle = endAngle;
      return result;
    });

    return {
      segments: processedSegments,
      center: centerPoint,
      radius: outerRadius,
      innerRadius: inner,
    };
  }, [data, size, strokeWidth, innerRadiusRatio]);

  const handleSegmentPress = (segment: ChartSegment, index: number) => {
    if (Haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedIndex(selectedIndex === index ? null : index);
    onSegmentPress?.(segment);
  };

  const isPositive = todayChangePct >= 0;

  return (
    <View style={[styles.container, { width: containerSize, height: containerSize }, style]}>
      <Svg
        width={containerSize}
        height={containerSize}
        viewBox={`-${outerPadding} -${outerPadding} ${containerSize} ${containerSize}`}
      >
        {/* Segments */}
        {segments.map((segment, index) => (
          <G key={segment.ticker}>
            <Path
              d={segment.path}
              fill={segment.color}
              opacity={selectedIndex !== null && selectedIndex !== index ? 0.4 : 1}
              onPress={() => handleSegmentPress(segment, index)}
            />
            {/* Leader line */}
            {segment.allocationPct >= 5 && (
              <Line
                x1={segment.lineStartX}
                y1={segment.lineStartY}
                x2={segment.lineEndX}
                y2={segment.lineEndY}
                stroke={segment.color}
                strokeWidth={1}
                opacity={0.6}
              />
            )}
          </G>
        ))}
      </Svg>

      {/* Outer labels */}
      {segments.map((segment, index) => {
        if (segment.allocationPct < 5) return null;

        const isLeft = segment.labelX < center + 40;

        return (
          <View
            key={`label-${segment.ticker}`}
            style={[
              styles.outerLabel,
              {
                left: Math.max(
                  4,
                  Math.min(
                    containerSize - 64,
                    segment.labelX + outerPadding - (isLeft ? 50 : -10)
                  )
                ),
                top: Math.max(4, Math.min(containerSize - 28, segment.labelY + outerPadding - 12)),
              },
            ]}
          >
            <View style={[styles.labelBadge, { backgroundColor: segment.color }]}>
              <Text style={styles.labelTicker}>
                {segment.ticker.slice(0, 3)}
              </Text>
            </View>
            <Text style={styles.labelPct}>
              {segment.allocationPct.toFixed(0)}%
            </Text>
          </View>
        );
      })}

      {/* Center content */}
      <View style={[styles.centerContent, { width: innerRadius * 2, height: innerRadius * 2 }]}>
        <Text
          style={[
            styles.centerPnl,
            { color: isPositive ? colors.gain : colors.loss },
          ]}
        >
          {formatPercentage(todayChangePct)}
        </Text>
        <Pressable style={styles.timeRangeButton}>
          <Text style={styles.timeRangeText}>Today ↓</Text>
        </Pressable>
      </View>
    </View>
  );
};

// Helper function to describe an arc path
function describeArc(
  x: number,
  y: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const outerStartX = x + Math.cos(startRad) * outerRadius;
  const outerStartY = y + Math.sin(startRad) * outerRadius;
  const outerEndX = x + Math.cos(endRad) * outerRadius;
  const outerEndY = y + Math.sin(endRad) * outerRadius;

  const innerStartX = x + Math.cos(endRad) * innerRadius;
  const innerStartY = y + Math.sin(endRad) * innerRadius;
  const innerEndX = x + Math.cos(startRad) * innerRadius;
  const innerEndY = y + Math.sin(startRad) * innerRadius;

  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  const path = [
    `M ${outerStartX} ${outerStartY}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEndX} ${outerEndY}`,
    `L ${innerStartX} ${innerStartY}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerEndX} ${innerEndY}`,
    'Z',
  ].join(' ');

  return path;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPnl: {
    ...typography.h1,
    fontSize: 28,
    fontWeight: '700',
  },
  timeRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxs,
  },
  timeRangeText: {
    ...typography.small,
    color: colors.textTertiary,
  },
  outerLabel: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  labelBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelTicker: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '700',
  },
  labelPct: {
    ...typography.smallMd,
    color: colors.textPrimary,
  },
});

export default DonutChart;
