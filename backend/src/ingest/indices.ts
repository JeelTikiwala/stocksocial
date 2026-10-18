/**
 * NSE indices close file — sectoral indices and India VIX.
 * URL verified 2026-10-16: https://nsearchives.nseindia.com/content/indices/ind_close_all_DDMMYYYY.csv
 */
import axios from 'axios';
import type { IndexEod } from '../shared';
import { NSE_HEADERS } from './bhavcopy';

export function indicesUrl(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `https://nsearchives.nseindia.com/content/indices/ind_close_all_${d}${m}${y}.csv`;
}

function num(v: string | undefined): number | null {
  if (v == null || v.trim() === '' || v.trim() === '-') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Columns: Index Name, Index Date (DD-MM-YYYY), Open, High, Low, Closing Index Value, Points Change, Change(%), ... */
export function parseIndicesCsv(csv: string): IndexEod[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map((h) => h.trim());
  const iName = header.indexOf('Index Name');
  const iDate = header.indexOf('Index Date');
  const iClose = header.indexOf('Closing Index Value');
  const iChg = header.indexOf('Points Change');
  if (iName < 0 || iDate < 0 || iClose < 0 || iChg < 0) throw new Error('Indices header missing expected columns');
  const seen = new Set<string>();
  const out: IndexEod[] = [];
  for (let i = 1; i < lines.length; i++) {
    const f = lines[i].split(',');
    const name = f[iName]?.trim();
    const close = num(f[iClose]);
    if (!name || close == null || seen.has(name)) continue;
    seen.add(name);
    const [dd, mm, yyyy] = (f[iDate] ?? '').trim().split('-');
    const chg = num(f[iChg]) ?? 0;
    out.push({ tradeDate: `${yyyy}-${mm}-${dd}`, name, close, prevClose: +(close - chg).toFixed(2) });
  }
  return out;
}

export async function fetchIndices(isoDate: string): Promise<IndexEod[]> {
  const res = await axios.get<string>(indicesUrl(isoDate), { responseType: 'text', timeout: 30_000, headers: NSE_HEADERS });
  return parseIndicesCsv(res.data);
}
