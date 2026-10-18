/**
 * NSE trading-calendar helpers (Asia/Kolkata). Pure date arithmetic on YYYY-MM-DD strings.
 *
 * NOTE: Expiry dates in production must be taken from the bhavcopy itself — NSE moves an
 * expiry to the previous trading day when the scheduled day is a holiday (e.g. Dussehra
 * 2026 pushed the 20-Oct NIFTY weekly to Mon 19-Oct). These helpers are for the mock
 * generator and for "days to expiry" math only.
 */

export const IST_OFFSET_MINUTES = 330;

export function toIsoDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(iso: string, n: number): string {
  const d = parseIsoDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toIsoDate(d);
}

/** Calendar days between two ISO dates (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseIsoDate(b).getTime() - parseIsoDate(a).getTime()) / 86_400_000);
}

export function isWeekend(iso: string): boolean {
  const dow = parseIsoDate(iso).getUTCDay();
  return dow === 0 || dow === 6;
}

/** Previous weekday (holidays not considered). */
export function previousWeekday(iso: string): string {
  let d = addDays(iso, -1);
  while (isWeekend(d)) d = addDays(d, -1);
  return d;
}

/** Next occurrence of a weekday (0=Sun..6=Sat) strictly after `iso`. */
export function nextWeekday(iso: string, weekday: number): string {
  let d = addDays(iso, 1);
  while (parseIsoDate(d).getUTCDay() !== weekday) d = addDays(d, 1);
  return d;
}

/** Last given weekday of the month containing `iso`. */
export function lastWeekdayOfMonth(iso: string, weekday: number): string {
  const d = parseIsoDate(iso);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  while (last.getUTCDay() !== weekday) last.setUTCDate(last.getUTCDate() - 1);
  return toIsoDate(last);
}

export const TUESDAY = 2;
export const THURSDAY = 4;

/**
 * Post-Sep-2025 NSE schedule: weekly contracts only on NIFTY (Tuesday); all other NSE
 * index and stock derivatives are monthly, expiring on the last Tuesday of the month.
 */
export function mockExpiriesFor(symbol: string, tradeDate: string): string[] {
  const monthlyThis = lastWeekdayOfMonth(tradeDate, TUESDAY);
  const nextMonthStart = toIsoDate(
    new Date(Date.UTC(parseIsoDate(tradeDate).getUTCFullYear(), parseIsoDate(tradeDate).getUTCMonth() + 1, 1))
  );
  const monthlyNext = lastWeekdayOfMonth(nextMonthStart, TUESDAY);
  const monthlies = (monthlyThis > tradeDate ? [monthlyThis, monthlyNext] : [monthlyNext, lastWeekdayOfMonth(addDays(monthlyNext, 10), TUESDAY)]);

  if (symbol !== 'NIFTY') return monthlies;

  const weeklies: string[] = [];
  let d = tradeDate;
  while (weeklies.length < 4) {
    d = nextWeekday(d, TUESDAY);
    weeklies.push(d);
  }
  return Array.from(new Set([...weeklies, ...monthlies])).sort();
}

/** Generate N trading-day ISO dates ending at `endDate` (weekends skipped, holidays ignored). */
export function tradingDaysEndingAt(endDate: string, n: number): string[] {
  const out: string[] = [];
  let d = endDate;
  while (out.length < n) {
    if (!isWeekend(d)) out.unshift(d);
    d = addDays(d, -1);
  }
  return out;
}

/** Year fraction for option pricing (ACT/365, with a tiny floor so T>0 at expiry). */
export function yearFraction(fromDate: string, toDate: string): number {
  const days = Math.max(daysBetween(fromDate, toDate), 0);
  return Math.max(days, 0.25) / 365;
}
