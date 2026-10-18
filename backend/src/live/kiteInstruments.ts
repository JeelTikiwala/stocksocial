import type { FoContract } from '../shared';
import { contractKey, type ContractKey } from '../shared';

/** Subset of a row from Kite's instruments dump (`GET /instruments/NFO`). */
export interface KiteInstrument {
  instrument_token: number;
  tradingsymbol: string;
  name: string;
  expiry: Date | string | null;
  strike: number;
  lot_size: number;
  instrument_type: string; // CE | PE | FUT
  segment: string;         // NFO-OPT | NFO-FUT
  exchange: string;        // NFO
}

function isoDate(d: Date | string | null): string {
  if (!d) return '';
  if (typeof d === 'string') return d.slice(0, 10);
  // kiteconnect parses expiry as a local-midnight Date; use local fields to avoid a UTC day shift.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Index of Kite instruments by our contract identity. */
export function indexKiteInstruments(instruments: KiteInstrument[]): Map<string, KiteInstrument> {
  const m = new Map<string, KiteInstrument>();
  for (const i of instruments) {
    if (i.exchange !== 'NFO') continue;
    const type = i.instrument_type === 'FUT' ? 'FUT' : i.instrument_type === 'CE' || i.instrument_type === 'PE' ? i.instrument_type : null;
    if (!type) continue;
    const strike = type === 'FUT' ? '' : String(Number(i.strike));
    m.set(`${i.name}|${isoDate(i.expiry)}|${strike}|${type}`, i);
  }
  return m;
}

export interface TokenMapping {
  tokenToKey: Map<number, ContractKey>;
  keyToToken: Map<ContractKey, number>;
  missing: ContractKey[];
}

export function mapContractsToTokens(instruments: KiteInstrument[], contracts: FoContract[]): TokenMapping {
  const idx = indexKiteInstruments(instruments);
  const tokenToKey = new Map<number, ContractKey>();
  const keyToToken = new Map<ContractKey, number>();
  const missing: ContractKey[] = [];
  for (const c of contracts) {
    const type = c.optionType ?? 'FUT';
    const strike = c.optionType ? String(Number(c.strike)) : '';
    const inst = idx.get(`${c.symbol}|${c.expiry}|${strike}|${type}`);
    const key = contractKey(c);
    if (!inst) {
      missing.push(key);
      continue;
    }
    tokenToKey.set(inst.instrument_token, key);
    keyToToken.set(key, inst.instrument_token);
  }
  return { tokenToKey, keyToToken, missing };
}
