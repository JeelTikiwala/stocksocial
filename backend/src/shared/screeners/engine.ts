import type { MarketDataset } from '../types';
import type { ParamValue, ScreenerResult, ScreenerSpec, ScreenerSummary } from './types';
import { SCREENERS } from './registry';

export function listScreeners(): ScreenerSummary[] {
  return SCREENERS.map(({ run: _run, ...rest }) => rest);
}

export function getScreener(id: string): ScreenerSpec | undefined {
  return SCREENERS.find((s) => s.id === id);
}

export function resolveParams(spec: ScreenerSpec, raw: Record<string, unknown> = {}): Record<string, ParamValue> {
  const out: Record<string, ParamValue> = {};
  for (const p of spec.params) {
    const v = raw[p.key];
    if (v == null || v === '') {
      out[p.key] = p.default;
      continue;
    }
    if (p.type === 'number') {
      const n = typeof v === 'number' ? v : Number(v);
      out[p.key] = Number.isFinite(n) ? Math.min(Math.max(n, p.min ?? -Infinity), p.max ?? Infinity) : (p.default as number);
    } else {
      const allowed = p.options?.some((o) => String(o.value) === String(v));
      out[p.key] = allowed ? (p.options!.find((o) => String(o.value) === String(v))!.value) : p.default;
    }
  }
  return out;
}

export function runScreener(id: string, ds: MarketDataset, raw: Record<string, unknown> = {}, limit = 100): ScreenerResult {
  const spec = getScreener(id);
  if (!spec) throw new Error(`Unknown screener: ${id}`);
  const params = resolveParams(spec, raw);
  const rows = spec.run ? spec.run(ds, params) : [];
  return { id, asOf: ds.tradeDate, params, rows: rows.slice(0, limit), total: rows.length };
}
