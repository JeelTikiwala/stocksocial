import React, { useState } from 'react';
import { View, LayoutChangeEvent, Pressable, StyleSheet, Platform } from 'react-native';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
import { colors } from '@/constants';

export interface TreemapLeaf { key: string; label: string; weight: number; value: number; sub?: string }
export interface TreemapGroup { key: string; label: string; weight: number; value: number; items: TreemapLeaf[] }

interface RectBox { x: number; y: number; w: number; h: number }
interface Placed<T> extends RectBox { item: T }

/** Squarified treemap (Bruls, Huizing, van Wijk). Items must be sorted by weight desc. */
function squarify<T extends { weight: number }>(items: T[], box: RectBox): Placed<T>[] {
  const total = items.reduce((a, i) => a + i.weight, 0);
  if (total <= 0 || items.length === 0 || box.w <= 0 || box.h <= 0) return [];
  const scale = (box.w * box.h) / total;
  const out: Placed<T>[] = [];
  let x = box.x, y = box.y, w = box.w, h = box.h;
  let row: T[] = [];
  const areaOf = (it: T) => it.weight * scale;
  const worst = (r: T[], side: number) => {
    const s = r.reduce((a, i) => a + areaOf(i), 0);
    let mx = 0, mn = Infinity;
    for (const i of r) { const a = areaOf(i); if (a > mx) mx = a; if (a < mn) mn = a; }
    if (mn === 0) return Infinity;
    return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn));
  };
  const layoutRow = (r: T[]) => {
    const s = r.reduce((a, i) => a + areaOf(i), 0);
    if (w >= h) {
      const rw = s / h; let yy = y;
      for (const it of r) { const ih = areaOf(it) / rw; out.push({ x, y: yy, w: rw, h: ih, item: it }); yy += ih; }
      x += rw; w -= rw;
    } else {
      const rh = s / w; let xx = x;
      for (const it of r) { const iw = areaOf(it) / rh; out.push({ x: xx, y, w: iw, h: rh, item: it }); xx += iw; }
      y += rh; h -= rh;
    }
  };
  for (const it of items) {
    const side = Math.min(w, h);
    if (row.length === 0 || worst([...row, it], side) <= worst(row, side)) row.push(it);
    else { layoutRow(row); row = [it]; }
  }
  if (row.length) layoutRow(row);
  return out;
}

function colorFor(pct: number): string {
  const t = Math.max(-1, Math.min(1, pct / 3)); // ±3% saturates
  const mix = (a: string, b: string, k: number) => {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',')})`;
  };
  if (t >= 0) return mix('#E3F5EC', '#1A7A4A', Math.pow(t, 0.8));
  return mix('#FAEAEA', '#B83232', Math.pow(-t, 0.8));
}

interface Props {
  groups: TreemapGroup[];
  height?: number;
  onPressLeaf?: (leaf: TreemapLeaf) => void;
  showGroupLabels?: boolean;
}

export const Treemap: React.FC<Props> = ({ groups, height = 320, onPressLeaf, showGroupLabels = true }) => {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const sorted = [...groups].sort((a, b) => b.weight - a.weight);
  const placedGroups = width > 0 ? squarify(sorted, { x: 0, y: 0, w: width, h: height }) : [];
  const PAD = 2;
  const HEAD = 14;

  return (
    <View style={{ height }} onLayout={onLayout}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {placedGroups.map((g) => {
            const inner: RectBox = { x: g.x + PAD, y: g.y + PAD + (showGroupLabels && g.h > 40 ? HEAD : 0), w: Math.max(g.w - PAD * 2, 0), h: Math.max(g.h - PAD * 2 - (showGroupLabels && g.h > 40 ? HEAD : 0), 0) };
            const leaves = squarify([...g.item.items].sort((a, b) => b.weight - a.weight), inner);
            return (
              <G key={g.item.key}>
                <Rect x={g.x} y={g.y} width={g.w} height={g.h} fill={colors.offWhite} stroke={colors.white} strokeWidth={2} />
                {showGroupLabels && g.h > 40 && g.w > 50 && (
                  <SvgText x={g.x + 5} y={g.y + 11} fontSize={9} fontWeight="700" fill={colors.textSecondary}>
                    {truncate(g.item.label.toUpperCase(), g.w / 5.5)}
                  </SvgText>
                )}
                {leaves.map((l) => (
                  <G key={l.item.key} {...pressProps(onPressLeaf ? () => onPressLeaf(l.item) : undefined)}>
                    <Rect x={l.x} y={l.y} width={Math.max(l.w - 1, 0)} height={Math.max(l.h - 1, 0)} fill={colorFor(l.item.value)} rx={2} />
                    {l.w > 34 && l.h > 24 && (
                      <>
                        <SvgText x={l.x + l.w / 2} y={l.y + l.h / 2 - (l.h > 36 ? 2 : -3)} fontSize={Math.min(11, l.w / 5)} fontWeight="700" fill={Math.abs(l.item.value) > 1.5 ? colors.white : colors.textPrimary} textAnchor="middle">
                          {truncate(l.item.label, l.w / 6.5)}
                        </SvgText>
                        {l.h > 36 && (
                          <SvgText x={l.x + l.w / 2} y={l.y + l.h / 2 + 11} fontSize={Math.min(10, l.w / 6)} fill={Math.abs(l.item.value) > 1.5 ? colors.white : colors.textSecondary} textAnchor="middle">
                            {(l.item.value > 0 ? '+' : '') + l.item.value.toFixed(2)}%
                          </SvgText>
                        )}
                      </>
                    )}
                  </G>
                ))}
              </G>
            );
          })}
        </Svg>
      )}
    </View>
  );
};

/** react-native-svg on web passes unknown handlers to the DOM; use onClick there. */
function pressProps(handler?: () => void): Record<string, unknown> {
  if (!handler) return {};
  return Platform.OS === 'web' ? { onClick: handler, style: { cursor: 'pointer' } } : { onPress: handler };
}

function truncate(s: string, maxChars: number): string {
  const n = Math.max(Math.floor(maxChars), 2);
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

export const TreemapLegend: React.FC = () => (
  <View style={legend.row}>
    {[-3, -1.5, 0, 1.5, 3].map((v) => (
      <View key={v} style={legend.item}>
        <View style={[legend.swatch, { backgroundColor: colorFor(v) }]} />
      </View>
    ))}
  </View>
);
// Legend labels are rendered by the caller; keep this component dependency-free.
const legend = StyleSheet.create({ row: { flexDirection: 'row', gap: 2 }, item: {}, swatch: { width: 22, height: 10, borderRadius: 2 } });

export const TreemapPressable = Pressable;
