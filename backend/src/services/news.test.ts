import { describe, expect, it } from 'vitest';
import { parseRss } from './news';
import { generateMockMarket, generateMockNews } from '../shared';

const xml = `<?xml version="1.0"?><rss><channel><item><title><![CDATA[Nifty slips as Bank Nifty writers add calls; RELIANCE steady]]></title><link>https://news.google.com/a</link><pubDate>Fri, 16 Oct 2026 12:30:00 GMT</pubDate><source url="https://x">Mint</source></item><item><title>SEBI tweaks F&amp;O position limits</title><link>https://news.google.com/b</link><pubDate>Fri, 16 Oct 2026 10:00:00 GMT</pubDate><source url="https://y">Reuters</source></item></channel></rss>`;

describe('news', () => {
  it('parses Google News RSS and tags symbols', () => {
    const items = parseRss(xml, 'market', ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS']);
    expect(items.length).toBe(2);
    expect(items[0].source).toBe('Mint');
    expect(items[0].symbols).toEqual(['NIFTY', 'RELIANCE']);
    expect(items[1].title).toBe('SEBI tweaks F&O position limits');
    expect(items[1].publishedAt).toBe('2026-10-16T10:00:00.000Z');
  });

  it('mock news is deterministic and references the dataset', () => {
    const ds = generateMockMarket();
    const a = generateMockNews(ds);
    const b = generateMockNews(ds);
    expect(a.map((n) => n.title)).toEqual(b.map((n) => n.title));
    expect(a.length).toBeGreaterThan(10);
    expect(a.some((n) => n.symbols.includes('NIFTY'))).toBe(true);
  });
});
