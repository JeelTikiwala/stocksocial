import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { formatPercentage, formatIndianCurrency } from '@/utils';

type TimePeriod = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

interface DataPoint {
  date: string;
  value: number;
}

interface PerformanceChartProps {
  data: Record<TimePeriod, DataPoint[]>;
  currentValue: number;
  style?: ViewStyle;
}

const TIME_PERIODS: TimePeriod[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

// Generate mock data for each time period
const generateMockData = (period: TimePeriod, baseValue: number): DataPoint[] => {
  const points: DataPoint[] = [];
  let numPoints = 0;
  let startDate = new Date();

  switch (period) {
    case '1D':
      numPoints = 24;
      startDate.setHours(startDate.getHours() - 24);
      break;
    case '1W':
      numPoints = 7;
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '1M':
      numPoints = 30;
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case '3M':
      numPoints = 90;
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '1Y':
      numPoints = 52;
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case 'ALL':
      numPoints = 100;
      startDate.setFullYear(startDate.getFullYear() - 3);
      break;
  }

  let value = baseValue * 0.85;
  for (let i = 0; i < numPoints; i++) {
    const wave = Math.sin(i * 0.7) * 0.008;
    const drift = 0.0008;
    const change = baseValue * (wave + drift);
    value = Math.max(value + change, baseValue * 0.5);
    points.push({
      date: new Date(startDate.getTime() + (i * (Date.now() - startDate.getTime()) / numPoints)).toISOString(),
      value,
    });
  }
  points.push({ date: new Date().toISOString(), value: baseValue });
  return points;
};

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  currentValue,
  style,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M');
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  // Chart dimensions constrained to viewport width with safe area and horizontal padding.
  const HORIZONTAL_PADDING = spacing.md;
  const availableWidth = Math.max(
    220,
    windowWidth - insets.left - insets.right - HORIZONTAL_PADDING * 2
  );
  const chartWidth = availableWidth;
  const chartHeight = 180;

  useEffect(() => {
    // Generate or use provided data
    const newData = data[selectedPeriod] || generateMockData(selectedPeriod, currentValue);

    // Animate transition
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setChartData(newData);
  }, [selectedPeriod, data, currentValue]);

  useEffect(() => {
    const index = TIME_PERIODS.indexOf(selectedPeriod);
    Animated.spring(indicatorAnim, {
      toValue: index,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [selectedPeriod]);

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
  };

  // Calculate chart path
  const getChartPath = () => {
    if (chartData.length < 2) return '';

    const minValue = Math.min(...chartData.map(d => d.value));
    const maxValue = Math.max(...chartData.map(d => d.value));
    const valueRange = maxValue - minValue || 1;

    const points = chartData.map((point, index) => {
      const x = (index / (chartData.length - 1)) * chartWidth;
      const y = chartHeight - ((point.value - minValue) / valueRange) * (chartHeight - 20);
      return { x, y };
    });

    // Create smooth bezier curve
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cp1x = prev.x + (curr.x - prev.x) / 3;
      const cp2x = prev.x + (2 * (curr.x - prev.x)) / 3;
      path += ` C ${cp1x} ${prev.y} ${cp2x} ${curr.y} ${curr.x} ${curr.y}`;
    }

    return path;
  };

  const getGradientPath = () => {
    const linePath = getChartPath();
    if (!linePath) return '';
    return `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;
  };

  const startValue = chartData[0]?.value || currentValue;
  const changeValue = currentValue - startValue;
  const changePct = ((currentValue - startValue) / startValue) * 100;
  const isPositive = changePct >= 0;
  const lineColor = isPositive ? colors.gain : colors.loss;

  const pillWidth = (chartWidth - spacing.xs * (TIME_PERIODS.length - 1)) / TIME_PERIODS.length;

  return (
    <View style={[styles.container, style]}>
      {/* Value Display */}
      <View style={styles.valueContainer}>
        <Text style={styles.currentValue}>
          {formatIndianCurrency(currentValue)}
        </Text>
        <View style={styles.changeContainer}>
          <Text style={[styles.changeValue, { color: isPositive ? colors.gain : colors.loss }]}>
            {isPositive ? '+' : ''}{formatIndianCurrency(changeValue, { showSymbol: false })}
          </Text>
          <View style={[styles.changePill, { backgroundColor: isPositive ? colors.gainBg : colors.lossBg }]}>
            <Text style={[styles.changePct, { color: isPositive ? colors.gain : colors.loss }]}>
              {formatPercentage(changePct)}
            </Text>
          </View>
        </View>
      </View>

      {/* Chart - Constrained Container */}
      <View style={[styles.chartWrapper, { width: '100%', overflow: 'hidden' }]}>
        <Animated.View style={[styles.chartContainer, { opacity: fadeAnim, width: chartWidth }]}>
          <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            <Defs>
              <LinearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={lineColor} stopOpacity={0.2} />
                <Stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            {/* Gradient fill */}
            <Path d={getGradientPath()} fill="url(#chartGradient)" />

            {/* Line */}
            <Path
              d={getChartPath()}
              stroke={lineColor}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Current value dot */}
            {chartData.length > 0 && (
              <Circle
                cx={chartWidth}
                cy={chartHeight - ((currentValue - Math.min(...chartData.map(d => d.value))) / (Math.max(...chartData.map(d => d.value)) - Math.min(...chartData.map(d => d.value)) || 1)) * (chartHeight - 20)}
                r={4}
                fill={lineColor}
              />
            )}
          </Svg>
        </Animated.View>
      </View>

      {/* Time Period Selector */}
      <View style={styles.periodSelector}>
        <View style={styles.periodContainer}>
          {/* Animated indicator */}
          <Animated.View
            style={[
              styles.periodIndicator,
              {
                width: pillWidth,
                transform: [{
                  translateX: indicatorAnim.interpolate({
                    inputRange: TIME_PERIODS.map((_, i) => i),
                    outputRange: TIME_PERIODS.map((_, i) => i * (pillWidth + spacing.xs)),
                  }),
                }],
              },
            ]}
          />

          {TIME_PERIODS.map((period) => (
            <Pressable
              key={period}
              onPress={() => handlePeriodChange(period)}
              style={[styles.periodButton, { width: pillWidth, minHeight: 44, minWidth: 44 }]}
            >
              <Text
                style={[
                  styles.periodText,
                  selectedPeriod === period && styles.periodTextActive,
                ]}
              >
                {period}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing.md,
  },
  valueContainer: {
    marginBottom: spacing.md,
  },
  currentValue: {
    ...typography.h1,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  changeValue: {
    ...typography.bodyMd,
    flexShrink: 1,
  },
  changePill: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  changePct: {
    ...typography.smallMd,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    height: 180,
    alignSelf: 'center',
  },
  periodSelector: {
    marginTop: spacing.md,
  },
  periodContainer: {
    flexDirection: 'row',
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.md,
    padding: spacing.xxs,
    gap: spacing.xs,
  },
  periodIndicator: {
    position: 'absolute',
    top: spacing.xxs,
    left: spacing.xxs,
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  periodButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    zIndex: 1,
  },
  periodText: {
    ...typography.smallMd,
    fontSize: 12,
    color: colors.textSecondary,
  },
  periodTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});

export default PerformanceChart;
