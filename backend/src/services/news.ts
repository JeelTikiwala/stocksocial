/**
 * Headlines via Google News RSS (India edition). Used as-is for personal/dev use; a
 * licensed news API should replace this before any public launch.
 */
import axios from 'axios';
import { generateMockNews, type MarketDataset, type NewsItem } from '../shared';

const RSS = 'https://news.google.com/rss/search';
const TTL = 10 * 60_000;
const cache = new Map<string, { at: number; items: NewsItem[] }>();

function text(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return (m?.[1] ?? '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
}

export function parseRss(xml: string, topic: NewsItem['topic'], universe: string[]): NewsItem[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return items.map((it, i) => {
    const title = text(it, 'title');
    const link = text(it, 'link');
    const pub = text(it, 'pubDate');
    const source = text(it, 'source') || 'News';
    const upper = title.toUpperCase();
    const symbols = universe.filter((s) => s.length >= 3 && new RegExp(`\\b${s.replace(/[&]/g, '\\&')}\\b`).test(upper)).slice(0, 4);
    return { id: `${topic}-${i}-${hash(title)}`, title, url: link, source, publishedAt: pub ? new Date(pub).toISOString() : new Date().toISOString(), symbols, topic };
  }).filter((n) => n.title && n.url);
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

async function query(q: string, topic: NewsItem['topic'], universe: string[]): Promise<NewsItem[]> {
  const key = `${topic}:${q}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.items;
  const res = await axios.get<string>(RSS, { params: { q, hl: 'en-IN', gl: 'IN', ceid: 'IN:en' }, timeout: 10_000, responseType: 'text', headers: { 'User-Agent': 'Mozilla/5.0' } });
  const items = parseRss(res.data, topic, universe);
  cache.set(key, { at: Date.now(), items });
  return items;
}

export async function fetchNews(ds: MarketDataset, symbols: string[] = []): Promise<{ items: NewsItem[]; source: 'google-news' | 'mock' }> {
  const universe = ds.universe.map((u) => u.symbol);
  const queries: Array<[string, NewsItem['topic']]> = [
    ['Nifty F&O options expiry', 'market'],
    ['Bank Nifty options', 'market'],
    ['SEBI derivatives', 'policy'],
    ...symbols.slice(0, 4).map((s): [string, NewsItem['topic']] => [`${s} stock NSE`, 'stock']),
  ];
  try {
    const results = await Promise.allSettled(queries.map(([q, t]) => query(q, t, universe)));
    const seen = new Set<string>();
    const items: NewsItem[] = [];
    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      for (const n of r.value) {
        const k = n.title.toLowerCase().slice(0, 60);
        if (seen.has(k)) continue;
        seen.add(k);
        items.push(n);
      }
    }
    if (items.length === 0) throw new Error('no items');
    return { items: items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 40), source: 'google-news' };
  } catch {
    return { items: generateMockNews(ds), source: 'mock' };
  }
}
