import type { Availability, DataMode, MarketDataset, Zone } from '../types';

export type ParamValue = string | number;

export interface ParamDef {
  key: string;
  label: string;
  type: 'select' | 'number';
  default: ParamValue;
  options?: Array<{ label: string; value: ParamValue }>;
  min?: number;
  max?: number;
  step?: number;
  /** For number params: suffix for display, e.g. '%' or 'x' */
  unit?: string;
}

export type ColumnType = 'text' | 'int' | 'number' | 'pct' | 'signedPct' | 'inr' | 'compact' | 'badge' | 'iv';

export interface ColumnDef {
  key: string;
  label: string;
  type: ColumnType;
  /** Shown in compact list rows (first 3 rendered) */
  primary?: boolean;
  width?: number;
}

export interface ScreenerRow {
  key: string;
  symbol: string;
  values: Record<string, string | number | null>;
  trend?: 'up' | 'down' | 'flat';
}

export interface ScreenerSpec {
  id: string;
  zone: Zone;
  name: string;
  tagline: string;
  description: string;
  mode: DataMode;
  availability: Availability;
  /** How the EOD version differs from the intraday idea (shown as a note). */
  eodNote?: string;
  params: ParamDef[];
  columns: ColumnDef[];
  /** Custom screen instead of the generic results table. */
  detailRoute?: string;
  run?: (ds: MarketDataset, params: Record<string, ParamValue>) => ScreenerRow[];
}

export type ScreenerSummary = Omit<ScreenerSpec, 'run'>;

export interface ScreenerResult {
  id: string;
  asOf: string;
  params: Record<string, ParamValue>;
  rows: ScreenerRow[];
  total: number;
}
