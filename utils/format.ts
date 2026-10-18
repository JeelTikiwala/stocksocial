import type { ColumnType } from '@/types';

const inIntl = (max: number, min = 0) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: max, minimumFractionDigits: min });
const int0 = inIntl(0);
const dec2 = inIntl(2, 2);
const dec1 = inIntl(1, 0);

/** Indian compact notation for counts (OI, volume): 12.3K · 4.5L · 1.2Cr */
export function compactIndian(n: number, decimals = 1): string {
  const a = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (a >= 1e7) return `${sign}${(a / 1e7).toFixed(decimals).replace(/\.0$/, '')}Cr`;
  if (a >= 1e5) return `${sign}${(a / 1e5).toFixed(decimals).replace(/\.0$/, '')}L`;
  if (a >= 1e3) return `${sign}${(a / 1e3).toFixed(decimals).replace(/\.0$/, '')}K`;
  return `${sign}${int0.format(a)}`;
}

/** INR amounts: ₹1.2 L Cr · ₹45 Cr · ₹3.2 L · ₹12,340 */
export function inr(n: number, decimals = 1): string {
  const a = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (a >= 1e12) return `${sign}₹${(a / 1e12).toFixed(decimals)} L Cr`;
  if (a >= 1e7) return `${sign}₹${(a / 1e7).toFixed(decimals)} Cr`;
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(decimals)} L`;
  return `${sign}₹${int0.format(a)}`;
}

export function price(n: number): string {
  if (Math.abs(n) >= 1000) return dec1.format(n);
  return dec2.format(n);
}

export function signedPct(n: number, decimals = 2): string {
  const s = n > 0 ? '+' : '';
  return `${s}${n.toFixed(decimals)}%`;
}

export function ivPct(v: number | null | undefined): string {
  return v == null ? '—' : `${(v * 100).toFixed(1)}%`;
}

export function signedCompact(n: number): string {
  return (n > 0 ? '+' : '') + compactIndian(n);
}

export function formatCell(type: ColumnType, value: string | number | null | undefined): string {
  if (value == null || value === '') return '—';
  switch (type) {
    case 'text':
    case 'badge':
      return String(value);
    case 'int':
      return int0.format(Number(value));
    case 'number':
      return price(Number(value));
    case 'pct':
      return `${Number(value).toFixed(2)}%`;
    case 'signedPct':
      return signedPct(Number(value));
    case 'inr':
      return inr(Number(value));
    case 'compact':
      return compactIndian(Number(value));
    case 'iv':
      return ivPct(Number(value));
    default:
      return String(value);
  }
}

/** Colour semantics for a cell: only signed values and known badge labels carry colour. */
export function cellTone(type: ColumnType, value: string | number | null | undefined): 'gain' | 'loss' | 'neutral' | 'teal' | 'warning' {
  if (value == null) return 'neutral';
  if (type === 'signedPct') {
    const n = Number(value);
    return n > 0 ? 'gain' : n < 0 ? 'loss' : 'neutral';
  }
  if (type === 'compact' && typeof value === 'number' && value < 0) return 'loss';
  if (type === 'badge') {
    const s = String(value);
    if (s === 'Long Buildup' || s === 'Bullish') return 'gain';
    if (s === 'Short Buildup' || s === 'Bearish') return 'loss';
    if (s === 'Short Covering') return 'teal';
    if (s === 'Long Unwinding') return 'warning';
  }
  return 'neutral';
}

export function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(d)} ${months[Number(m) - 1]}${y ? ` '${y.slice(2)}` : ''}`;
}

export function expiryLabel(iso: string): string {
  const [y, m, d] = iso.split('-');
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${Number(d)} ${months[Number(m) - 1]} ${y.slice(2)}`;
}
