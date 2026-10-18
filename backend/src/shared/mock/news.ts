import type { MarketDataset } from '../types';
import { Prng } from '../prng';

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  symbols: string[];
  topic: 'market' | 'stock' | 'policy' | 'global';
}

const SOURCES = ['Economic Times', 'Moneycontrol', 'Mint', 'Business Standard', 'Reuters', 'NDTV Profit', 'CNBC-TV18'];

export function generateMockNews(ds: MarketDataset, seed = 42, count = 24): NewsItem[] {
  const rng = new Prng(seed);
  const stocks = ds.underlyings.filter((u) => !u.isIndex);
  const nifty = ds.indices.find((i) => i.name === 'Nifty 50');
  const vix = ds.indices.find((i) => i.name === 'India VIX');
  const pct = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : 0);
  const gainers = [...stocks].sort((a, b) => pct(b.close, b.prevClose) - pct(a.close, a.prevClose));
  const items: NewsItem[] = [];
  const push = (title: string, topic: NewsItem['topic'], symbols: string[] = []) => {
    const minsAgo = Math.round(rng.range(5, 60 * 30));
    items.push({ id: `n${items.length + 1}`, title, source: rng.pick(SOURCES), url: 'https://www.nseindia.com/', publishedAt: new Date(Date.now() - minsAgo * 60_000).toISOString(), symbols, topic });
  };
  if (nifty) push(`Nifty ends ${pct(nifty.close, nifty.prevClose) >= 0 ? 'higher' : 'lower'} at ${nifty.close.toLocaleString('en-IN')}; ${gainers[0].symbol} leads F&O movers`, 'market', ['NIFTY', gainers[0].symbol]);
  if (vix) push(`India VIX at ${vix.close.toFixed(2)} — option writers ${vix.close > 15 ? 'stay cautious ahead of expiry' : 'see premiums compress'}`, 'market', ['NIFTY']);
  push('Weekly Nifty expiry: traders watch max-pain cluster as straddle premium drifts lower', 'market', ['NIFTY']);
  push('Bank Nifty monthly expiry approaches; PCR hovers near 1 as writers add puts at round strikes', 'market', ['BANKNIFTY']);
  for (const g of gainers.slice(0, 5)) push(`${g.symbol} ${pct(g.close, g.prevClose) >= 0 ? 'rallies' : 'slips'} ${Math.abs(pct(g.close, g.prevClose)).toFixed(1)}% on heavy F&O volumes; ${pct(g.close, g.prevClose) >= 0 ? 'long build-up' : 'short build-up'} seen`, 'stock', [g.symbol]);
  for (const g of gainers.slice(-4)) push(`${g.symbol} under pressure; options data shows call writing at higher strikes`, 'stock', [g.symbol]);
  push('SEBI reiterates FutEq (delta-based) OI limits; brokers update intraday monitoring', 'policy');
  push('NSE: no change to Tuesday expiry calendar for November derivatives', 'policy');
  push('FIIs net sellers in index futures for third session; DIIs absorb supply', 'market');
  push('US yields steady ahead of Fed minutes; Asian markets mixed in early trade', 'global');
  push('Crude eases below $80; OMC stocks see put unwinding', 'stock', ['ONGC', 'RELIANCE']);
  push('IT majors: TCS and Infosys see rising IV ahead of Q2 earnings', 'stock', ['TCS', 'INFY']);
  return items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, count);
}
