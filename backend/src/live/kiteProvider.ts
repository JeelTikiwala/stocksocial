import { promises as fs } from 'node:fs';
import path from 'node:path';
import { KiteConnect, KiteTicker } from 'kiteconnect';
import { parseContractKey, sessionProgressAt, type FoContract, type LiveStatus, type LiveTick } from '../shared';
import type { LiveProvider } from './provider';
import { mapContractsToTokens, type KiteInstrument, type TokenMapping } from './kiteInstruments';

interface KiteProviderOptions {
  apiKey: string;
  accessToken: string;
  /** Cache instruments dump here (it's ~40k rows and refreshes daily). */
  cacheDir?: string;
  log?: (m: string) => void;
}

/**
 * Live ticks from Zerodha Kite Connect (WebSocket, "full" mode → LTP, volume, OI, depth).
 * Limits: 3,000 instruments per connection; one connection per api_key here.
 */
export class KiteProvider implements LiveProvider {
  readonly kind = 'kite' as const;
  private ticker: InstanceType<typeof KiteTicker> | null = null;
  private mapping: TokenMapping | null = null;
  private tickCb: ((t: LiveTick[]) => void) | null = null;
  private statusCb: ((p: Partial<LiveStatus>) => void) | null = null;
  private lotByKey = new Map<string, number>();
  private readonly log: (m: string) => void;

  constructor(private opts: KiteProviderOptions) {
    this.log = opts.log ?? (() => {});
  }

  private async loadInstruments(): Promise<KiteInstrument[]> {
    const dir = this.opts.cacheDir ?? path.resolve(__dirname, '../../.data');
    const today = new Date().toISOString().slice(0, 10);
    const file = path.join(dir, `kite-instruments-NFO-${today}.json`);
    try {
      return JSON.parse(await fs.readFile(file, 'utf8')) as KiteInstrument[];
    } catch {
      const kc = new KiteConnect({ api_key: this.opts.apiKey });
      kc.setAccessToken(this.opts.accessToken);
      const rows = (await kc.getInstruments('NFO')) as unknown as KiteInstrument[];
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(file, JSON.stringify(rows));
      return rows;
    }
  }

  async connect(contracts: FoContract[]): Promise<void> {
    const instruments = await this.loadInstruments();
    this.mapping = mapContractsToTokens(instruments, contracts);
    for (const c of contracts) this.lotByKey.set(`${c.symbol}`, c.lotSize);
    const tokens = Array.from(this.mapping.tokenToKey.keys()).slice(0, 3000);
    this.log(`kite: mapped ${tokens.length} instruments (${this.mapping.missing.length} missing)`);

    const ticker = new KiteTicker({ api_key: this.opts.apiKey, access_token: this.opts.accessToken });
    this.ticker = ticker;
    ticker.autoReconnect(true, 50, 5);
    ticker.on('connect', () => {
      ticker.subscribe(tokens);
      ticker.setMode(ticker.modeFull, tokens);
      this.statusCb?.({ connected: true, subscribed: tokens.length, note: `Kite · ${tokens.length} instruments` });
    });
    ticker.on('ticks', (ticks: any[]) => this.tickCb?.(this.translate(ticks)));
    ticker.on('disconnect', (e: Error) => this.statusCb?.({ connected: false, note: `Kite disconnected: ${e?.message ?? ''}` }));
    ticker.on('error', (e: Error) => this.statusCb?.({ note: `Kite error: ${e?.message ?? e}` }));
    ticker.on('reconnect', (n: number) => this.statusCb?.({ note: `Kite reconnecting (${n})` }));
    ticker.on('noreconnect', () => this.statusCb?.({ connected: false, note: 'Kite gave up reconnecting — log in again' }));
    ticker.connect();
  }

  private translate(raw: any[]): LiveTick[] {
    if (!this.mapping) return [];
    const out: LiveTick[] = [];
    const now = Date.now();
    for (const t of raw) {
      const key = this.mapping.tokenToKey.get(t.instrument_token);
      if (!key) continue;
      const p = parseContractKey(key);
      const ts = t.exchange_timestamp instanceof Date ? t.exchange_timestamp.getTime() : now;
      out.push({
        key,
        symbol: p.symbol,
        instrumentType: p.instrumentType,
        expiry: p.expiry,
        strike: p.strike,
        optionType: p.optionType,
        ltp: Number(t.last_price) || 0,
        volume: Number(t.volume_traded) || 0,
        oi: t.oi != null ? Number(t.oi) : null,
        bid: t.depth?.buy?.[0]?.price,
        ask: t.depth?.sell?.[0]?.price,
        ts,
      });
    }
    return out;
  }

  async disconnect(): Promise<void> {
    try {
      this.ticker?.autoReconnect(false, 0, 0);
      this.ticker?.disconnect();
    } catch {
      /* ignore */
    }
    this.ticker = null;
    this.statusCb?.({ connected: false, subscribed: 0 });
  }

  onTicks(cb: (ticks: LiveTick[]) => void): void {
    this.tickCb = cb;
  }

  onStatus(cb: (p: Partial<LiveStatus>) => void): void {
    this.statusCb = cb;
  }

  session(): { progress: number; open: boolean } {
    return sessionProgressAt(Date.now());
  }
}
