import type { IvPoint } from '../types';

export interface IvStats {
  current: number | null;
  min: number | null;
  max: number | null;
  /** (current - min) / (max - min) over the lookback, 0..100 */
  rank: number | null;
  /** % of lookback days with IV below current, 0..100 */
  percentile: number | null;
  change1d: number | null;   // vol points
  change5d: number | null;
  change30d: number | null;
}

export function ivStats(points: IvPoint[], lookback = 252): IvStats {
  if (!points || points.length === 0) {
    return { current: null, min: null, max: null, rank: null, percentile: null, change1d: null, change5d: null, change30d: null };
  }
  const series = points.slice(-lookback);
  const current = series[series.length - 1].atmIv;
  let min = Infinity;
  let max = -Infinity;
  let below = 0;
  for (const p of series) {
    if (p.atmIv < min) min = p.atmIv;
    if (p.atmIv > max) max = p.atmIv;
    if (p.atmIv < current) below++;
  }
  const rank = max > min ? ((current - min) / (max - min)) * 100 : 50;
  const percentile = series.length > 1 ? (below / (series.length - 1)) * 100 : 50;
  const at = (n: number) => (series.length > n ? series[series.length - 1 - n].atmIv : null);
  const diff = (n: number) => {
    const v = at(n);
    return v == null ? null : (current - v) * 100;
  };
  return {
    current,
    min,
    max,
    rank,
    percentile,
    change1d: diff(1),
    change5d: diff(5),
    change30d: diff(21),
  };
}
