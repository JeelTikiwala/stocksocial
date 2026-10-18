import React, { useState } from 'react';
import { View, LayoutChangeEvent, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';
import { colors, typography } from '@/constants';
import type { PayoffPoint } from '@/types';
import { compactIndian } from '@/utils';

interface Props {
  points: PayoffPoint[];
  spot: number;
  breakevens: number[];
  height?: number;
}

const PAD_R = 52;
const PAD_B = 18;
const PAD_T = 14;

export const PayoffChart: React.FC<Props> = ({ points, spot, breakevens, height = 220 }) => {
  const [width, setWidth] = useState(0);
  if (points.length < 2) return <View style={{ height }}><Text style={styles.empty}>Add a leg to see the payoff</Text></View>;
  const xs = points.map((p) => p.spot);
  const ys = points.flatMap((p) => [p.expiryPnl, p.todayPnl ?? p.expiryPnl]);
  const xMin = xs[0], xMax = xs[xs.length - 1];
  let yMin = Math.min(0, ...ys), yMax = Math.max(0, ...ys);
  if (yMax === yMin) { yMax += 1; yMin -= 1; }
  const pad = (yMax - yMin) * 0.1; yMin -= pad; yMax += pad;
  const plotW = Math.max(width - PAD_R, 1);
  const plotH = height - PAD_B - PAD_T;
  const x = (v: number) => ((v - xMin) / (xMax - xMin)) * plotW;
  const y = (v: number) => PAD_T + ((yMax - v) / (yMax - yMin)) * plotH;

  const line = (sel: (p: PayoffPoint) => number | null) => {
    let d = '';
    points.forEach((p, i) => { const v = sel(p); if (v == null) return; d += `${i === 0 || d === '' ? 'M' : 'L'} ${x(p.spot).toFixed(1)} ${y(v).toFixed(1)} `; });
    return d;
  };
  const area = (positive: boolean) => {
    const parts = points.map((p) => `${x(p.spot).toFixed(1)} ${y(positive ? Math.max(p.expiryPnl, 0) : Math.min(p.expiryPnl, 0)).toFixed(1)}`);
    return `M ${x(xMin)} ${y(0)} L ${parts.join(' L ')} L ${x(xMax)} ${y(0)} Z`;
  };
  const hasToday = points.some((p) => p.todayPnl != null);
  const ticks = [yMin + pad, (yMin + pad + yMax - pad) / 2, yMax - pad, 0].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <View style={{ height }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Path d={area(true)} fill={colors.gain} opacity={0.15} />
          <Path d={area(false)} fill={colors.loss} opacity={0.15} />
          {ticks.map((t, i) => (
            <SvgText key={i} x={plotW + 6} y={y(t) + 4} fontSize={10} fill={colors.textTertiary}>{compactIndian(Math.round(t))}</SvgText>
          ))}
          <Line x1={0} x2={plotW} y1={y(0)} y2={y(0)} stroke={colors.textSecondary} strokeWidth={1} />
          <Line x1={x(spot)} x2={x(spot)} y1={PAD_T} y2={PAD_T + plotH} stroke={colors.indigo} strokeWidth={1} strokeDasharray="4,3" />
          <SvgText x={x(spot) + 4} y={PAD_T + 10} fontSize={10} fill={colors.indigo}>Spot {spot.toFixed(0)}</SvgText>
          {breakevens.map((b, i) => (
            <React.Fragment key={i}>
              <Line x1={x(b)} x2={x(b)} y1={PAD_T} y2={PAD_T + plotH} stroke={colors.gold} strokeWidth={1} strokeDasharray="2,3" />
              <SvgText x={x(b)} y={height - 5} fontSize={10} fill={colors.gold} textAnchor="middle">BE {b.toFixed(0)}</SvgText>
            </React.Fragment>
          ))}
          <Path d={line((p) => p.expiryPnl)} stroke={colors.indigo} strokeWidth={2.2} fill="none" strokeLinejoin="round" />
          {hasToday && <Path d={line((p) => p.todayPnl)} stroke={colors.gold} strokeWidth={2} fill="none" strokeDasharray="5,4" strokeLinejoin="round" />}
          <SvgText x={4} y={height - 5} fontSize={10} fill={colors.textTertiary}>{xMin.toFixed(0)}</SvgText>
          <SvgText x={plotW - 4} y={height - 5} fontSize={10} fill={colors.textTertiary} textAnchor="end">{xMax.toFixed(0)}</SvgText>
        </Svg>
      )}
    </View>
  );
};

const styles = StyleSheet.create({ empty: { ...typography.small, color: colors.textTertiary, textAlign: 'center', paddingTop: 40 } });
