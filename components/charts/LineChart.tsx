import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';
import { colors, typography } from '@/constants';

export interface LineSeries {
  id: string;
  color: string;
  data: number[];
  dashed?: boolean;
  area?: boolean;
}

interface Props {
  series: LineSeries[];
  labels?: string[];           // x labels aligned with data indices
  height?: number;
  yFormat?: (v: number) => string;
  gridLines?: number;
  markers?: Array<{ index: number; color?: string; label?: string }>;
  zeroLine?: boolean;
}

const PAD_R = 48;
const PAD_B = 20;
const PAD_T = 8;

export const LineChart: React.FC<Props> = ({ series, labels, height = 200, yFormat = (v) => v.toFixed(0), gridLines = 4, markers = [], zeroLine }) => {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const n = Math.max(...series.map((s) => s.data.length), 0);
  if (n < 2) return <View style={{ height }} onLayout={onLayout}><Text style={styles.empty}>Not enough data</Text></View>;
  const all = series.flatMap((s) => s.data).filter((v) => Number.isFinite(v));
  let min = Math.min(...all);
  let max = Math.max(...all);
  if (zeroLine) { min = Math.min(min, 0); max = Math.max(max, 0); }
  if (max === min) { max += 1; min -= 1; }
  const padY = (max - min) * 0.08;
  min -= padY; max += padY;
  const plotW = Math.max(width - PAD_R, 1);
  const plotH = height - PAD_B - PAD_T;
  const x = (i: number) => (i / (n - 1)) * plotW;
  const y = (v: number) => PAD_T + ((max - v) / (max - min)) * plotH;

  const path = (data: number[]) => data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const ticks = Array.from({ length: gridLines + 1 }, (_, i) => min + ((max - min) * i) / gridLines);
  const labelIdx = labels && labels.length ? [0, Math.floor((n - 1) / 2), n - 1] : [];

  return (
    <View style={{ height }} onLayout={onLayout}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {ticks.map((t, i) => (
            <React.Fragment key={i}>
              <Line x1={0} x2={plotW} y1={y(t)} y2={y(t)} stroke={colors.borderLight} strokeWidth={1} />
              <SvgText x={plotW + 6} y={y(t) + 4} fontSize={10} fill={colors.textTertiary}>{yFormat(t)}</SvgText>
            </React.Fragment>
          ))}
          {zeroLine && <Line x1={0} x2={plotW} y1={y(0)} y2={y(0)} stroke={colors.textTertiary} strokeWidth={1} />}
          {series.map((s) => (
            <React.Fragment key={s.id}>
              {s.area && <Path d={`${path(s.data)} L ${x(s.data.length - 1)} ${y(min)} L 0 ${y(min)} Z`} fill={s.color} opacity={0.08} />}
              <Path d={path(s.data)} stroke={s.color} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? '5,4' : undefined} />
              <Circle cx={x(s.data.length - 1)} cy={y(s.data[s.data.length - 1])} r={3} fill={s.color} />
            </React.Fragment>
          ))}
          {markers.map((m, i) => (
            <React.Fragment key={i}>
              <Line x1={x(m.index)} x2={x(m.index)} y1={PAD_T} y2={PAD_T + plotH} stroke={m.color ?? colors.gold} strokeWidth={1} strokeDasharray="3,3" />
              {m.label && <SvgText x={x(m.index) + 3} y={PAD_T + 10} fontSize={10} fill={m.color ?? colors.gold}>{m.label}</SvgText>}
            </React.Fragment>
          ))}
          {labelIdx.map((i) => (
            <SvgText key={i} x={x(i)} y={height - 4} fontSize={10} fill={colors.textTertiary} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>
              {labels![i]}
            </SvgText>
          ))}
        </Svg>
      )}
    </View>
  );
};

const styles = StyleSheet.create({ empty: { ...typography.small, color: colors.textTertiary, textAlign: 'center', paddingTop: 40 } });
