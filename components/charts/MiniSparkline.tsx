import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '@/constants';

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  showGradient?: boolean;
  style?: ViewStyle;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data,
  width = 60,
  height = 24,
  color,
  strokeWidth = 1.5,
  showGradient = true,
  style,
}) => {
  if (data.length < 2) return null;

  // Determine color based on trend if not provided
  const isPositive = data[data.length - 1] >= data[0];
  const lineColor = color || (isPositive ? colors.gain : colors.loss);

  // Normalize data to fit within the view
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;
  const padding = 2;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = padding + ((maxVal - value) / range) * (height - padding * 2);
    return { x, y };
  });

  // Create line path
  const linePath = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;

      // Use curve for smoother line
      const prev = points[index - 1];
      const cp1x = prev.x + (point.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = cp1x;
      const cp2y = point.y;

      return `C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${point.x} ${point.y}`;
    })
    .join(' ');

  // Create area path for gradient
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {showGradient && (
          <>
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={lineColor} stopOpacity={0.2} />
                <Stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Path d={areaPath} fill={`url(#${gradientId})`} />
          </>
        )}
        <Path
          d={linePath}
          stroke={lineColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

export default MiniSparkline;
