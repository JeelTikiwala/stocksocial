/**
 * NSE F&O UDiFF bhavcopy — fetch + parse.
 * URL verified 2026-10-16: https://nsearchives.nseindia.com/content/fo/BhavCopy_NSE_FO_0_0_0_YYYYMMDD_F_0000.csv.zip
 */
import axios from 'axios';
import { unzipSync, strFromU8 } from 'fflate';
import type { FoContract, InstrumentType, OptionType } from '../shared';

export const NSE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  Accept: '*/*',
  Referer: 'https://www.nseindia.com/',
};

export function bhavcopyUrl(isoDate: string): string {
  const d = isoDate.replace(/-/g, '');
  return `https://nsearchives.nseindia.com/content/fo/BhavCopy_NSE_FO_0_0_0_${d}_F_0000.csv.zip`;
}

const KEEP: ReadonlySet<string> = new Set<InstrumentType>(['IDO', 'STO', 'IDF', 'STF']);

function num(v: string | undefined): number {
  if (v == null || v === '' || v === '-') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Parse the UDiFF CSV. Column order is read from the header so reordering is harmless. */
export function parseBhavcopyCsv(csv: string): FoContract[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map((h) => h.trim());
  const col = (name: string) => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`Bhavcopy header missing column ${name}`);
    return i;
  };
  const c = {
    tradDt: col('TradDt'), tp: col('FinInstrmTp'), sym: col('TckrSymb'), xpry: col('XpryDt'), strk: col('StrkPric'), opt: col('OptnTp'),
    open: col('OpnPric'), high: col('HghPric'), low: col('LwPric'), close: col('ClsPric'), last: col('LastPric'), prev: col('PrvsClsgPric'),
    undr: col('UndrlygPric'), sttl: col('SttlmPric'), oi: col('OpnIntrst'), chg: col('ChngInOpnIntrst'), vol: col('TtlTradgVol'), trf: col('TtlTrfVal'), ntx: col('TtlNbOfTxsExctd'), lot: col('NewBrdLotQty'),
  };
  const out: FoContract[] = [];
  for (let i = 1; i < lines.length; i++) {
    const f = lines[i].split(',');
    const tp = f[c.tp];
    if (!KEEP.has(tp)) continue;
    const isOpt = tp === 'IDO' || tp === 'STO';
    const opt = f[c.opt];
    out.push({
      tradeDate: f[c.tradDt],
      symbol: f[c.sym],
      instrumentType: tp as InstrumentType,
      expiry: f[c.xpry],
      strike: isOpt ? num(f[c.strk]) : null,
      optionType: isOpt && (opt === 'CE' || opt === 'PE') ? (opt as OptionType) : null,
      open: num(f[c.open]), high: num(f[c.high]), low: num(f[c.low]), close: num(f[c.close]), last: num(f[c.last]), prevClose: num(f[c.prev]),
      underlyingPrice: num(f[c.undr]), settle: num(f[c.sttl]),
      oi: Math.round(num(f[c.oi])), chgOi: Math.round(num(f[c.chg])), volume: Math.round(num(f[c.vol])), turnover: num(f[c.trf]), trades: Math.round(num(f[c.ntx])), lotSize: Math.round(num(f[c.lot])) || 1,
    });
  }
  return out;
}

export function unzipCsv(zip: Uint8Array): string {
  const files = unzipSync(zip);
  const name = Object.keys(files).find((n) => n.toLowerCase().endsWith('.csv'));
  if (!name) throw new Error('Zip contained no CSV');
  return strFromU8(files[name]);
}

export async function fetchBhavcopy(isoDate: string): Promise<FoContract[]> {
  const res = await axios.get<ArrayBuffer>(bhavcopyUrl(isoDate), { responseType: 'arraybuffer', timeout: 60_000, headers: NSE_HEADERS });
  return parseBhavcopyCsv(unzipCsv(new Uint8Array(res.data)));
}
