import axios from 'axios';

// Indian Stock Market Data Service
// Uses Yahoo Finance (free, no API key) with in-memory cache and mock fallbacks

const YAHOO_FINANCE_V8 = 'https://query1.finance.yahoo.com/v8/finance';
const GOOGLE_NEWS_RSS = 'https://news.google.com/rss/search';

// Simple in-memory cache (TTL in ms)
const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL_QUOTE = 60 * 1000;        // 1 minute for quotes
const CACHE_TTL_DETAILS = 5 * 60 * 1000;  // 5 minutes for details
const CACHE_TTL_HISTORY = 10 * 60 * 1000; // 10 minutes for history
const CACHE_TTL_NEWS = 15 * 60 * 1000;    // 15 minutes for news
const CACHE_TTL_SEARCH = 30 * 60 * 1000;  // 30 minutes for search

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiry) return entry.data as T;
  if (entry) cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown, ttl: number): void {
  cache.set(key, { data, expiry: Date.now() + ttl });
}

interface StockQuote {
  ticker: string;
  companyName: string;
  exchange: string;
  currentPrice: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  peRatio: number | null;
  pbRatio: number | null;
  dividendYield: number | null;
  eps: number | null;
  dayChange: number;
  dayChangePercent: number;
  currency: string;
  lastUpdated: string;
}

interface StockNews {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  snippet?: string;
}

interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CompanyInfo {
  ticker: string;
  companyName: string;
  sector: string;
  industry: string;
  description: string;
  website: string;
  employees: number | null;
  headquarters: string;
}

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
};

// NSE/BSE ticker to Yahoo Finance symbol conversion
const toYahooSymbol = (ticker: string, exchange: string = 'NSE'): string => {
  const cleanTicker = ticker.toUpperCase().replace(/\.(NS|BO)$/, '');
  return exchange.toUpperCase() === 'BSE' ? `${cleanTicker}.BO` : `${cleanTicker}.NS`;
};

// Get real-time stock quote from Yahoo Finance
export const getStockQuote = async (ticker: string, exchange: string = 'NSE'): Promise<StockQuote | null> => {
  const cacheKey = `quote:${ticker}:${exchange}`;
  const cached = getCached<StockQuote>(cacheKey);
  if (cached) return cached;

  try {
    const symbol = toYahooSymbol(ticker, exchange);
    const response = await axios.get(`${YAHOO_FINANCE_V8}/chart/${symbol}`, {
      params: {
        interval: '1d',
        range: '5d',
      },
      timeout: 10000,
      headers: YAHOO_HEADERS,
    });

    const result = response.data?.chart?.result?.[0];
    if (!result) return getMockQuote(ticker, exchange);

    const meta = result.meta || {};
    const quote = result.indicators?.quote?.[0] || {};
    const closes = (quote.close || []).filter((v: number | null) => v != null);
    const currentPrice = meta.regularMarketPrice || closes[closes.length - 1] || 0;
    const previousClose = meta.previousClose || meta.chartPreviousClose || (closes.length > 1 ? closes[closes.length - 2] : currentPrice);

    const stockQuote: StockQuote = {
      ticker: ticker.toUpperCase(),
      companyName: meta.longName || meta.shortName || ticker.toUpperCase(),
      exchange: exchange.toUpperCase(),
      currentPrice,
      previousClose,
      open: quote.open?.[quote.open.length - 1] || meta.regularMarketOpen || 0,
      dayHigh: meta.regularMarketDayHigh || Math.max(...(quote.high || [0]).filter((v: number | null) => v != null)),
      dayLow: meta.regularMarketDayLow || Math.min(...(quote.low || [Infinity]).filter((v: number | null) => v != null && v > 0)),
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow || 0,
      volume: meta.regularMarketVolume || (quote.volume?.[quote.volume.length - 1]) || 0,
      avgVolume: meta.averageDailyVolume10Day || 0,
      marketCap: meta.marketCap || 0,
      peRatio: null,
      pbRatio: null,
      dividendYield: null,
      eps: null,
      dayChange: currentPrice - previousClose,
      dayChangePercent: previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0,
      currency: meta.currency || 'INR',
      lastUpdated: new Date().toISOString(),
    };

    setCache(cacheKey, stockQuote, CACHE_TTL_QUOTE);
    return stockQuote;
  } catch (error) {
    console.error(`Error fetching quote for ${ticker}:`, error instanceof Error ? error.message : error);
    return getMockQuote(ticker, exchange);
  }
};

// Get detailed company info and fundamentals
export const getCompanyDetails = async (ticker: string, exchange: string = 'NSE'): Promise<{ quote: StockQuote | null; info: CompanyInfo | null }> => {
  const cacheKey = `details:${ticker}:${exchange}`;
  const cached = getCached<{ quote: StockQuote | null; info: CompanyInfo | null }>(cacheKey);
  if (cached) return cached;

  try {
    const symbol = toYahooSymbol(ticker, exchange);

    // Use the v6 quoteSummary endpoint
    const response = await axios.get(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}`, {
      params: {
        modules: 'price,summaryProfile,summaryDetail,defaultKeyStatistics',
      },
      timeout: 15000,
      headers: YAHOO_HEADERS,
    });

    const result = response.data?.quoteSummary?.result?.[0];
    if (!result) {
      const quote = await getStockQuote(ticker, exchange);
      return { quote, info: getMockCompanyInfo(ticker) };
    }

    const price = result.price || {};
    const profile = result.summaryProfile || {};
    const detail = result.summaryDetail || {};
    const keyStats = result.defaultKeyStatistics || {};

    const currentPrice = price.regularMarketPrice?.raw || 0;
    const previousClose = price.regularMarketPreviousClose?.raw || currentPrice;

    const quote: StockQuote = {
      ticker: ticker.toUpperCase(),
      companyName: price.longName || price.shortName || ticker.toUpperCase(),
      exchange: exchange.toUpperCase(),
      currentPrice,
      previousClose,
      open: price.regularMarketOpen?.raw || 0,
      dayHigh: price.regularMarketDayHigh?.raw || 0,
      dayLow: price.regularMarketDayLow?.raw || 0,
      fiftyTwoWeekHigh: detail.fiftyTwoWeekHigh?.raw || 0,
      fiftyTwoWeekLow: detail.fiftyTwoWeekLow?.raw || 0,
      volume: price.regularMarketVolume?.raw || 0,
      avgVolume: detail.averageVolume?.raw || 0,
      marketCap: price.marketCap?.raw || 0,
      peRatio: detail.trailingPE?.raw || keyStats.trailingPE?.raw || null,
      pbRatio: keyStats.priceToBook?.raw || null,
      dividendYield: detail.dividendYield?.raw ? detail.dividendYield.raw * 100 : null,
      eps: keyStats.trailingEps?.raw || null,
      dayChange: currentPrice - previousClose,
      dayChangePercent: previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0,
      currency: price.currency || 'INR',
      lastUpdated: new Date().toISOString(),
    };

    const info: CompanyInfo = {
      ticker: ticker.toUpperCase(),
      companyName: price.longName || price.shortName || ticker.toUpperCase(),
      sector: profile.sector || 'N/A',
      industry: profile.industry || 'N/A',
      description: profile.longBusinessSummary || '',
      website: profile.website || '',
      employees: profile.fullTimeEmployees || null,
      headquarters: profile.city && profile.country ? `${profile.city}, ${profile.country}` : '',
    };

    const result2 = { quote, info };
    setCache(cacheKey, result2, CACHE_TTL_DETAILS);
    return result2;
  } catch (error) {
    console.error(`Error fetching company details for ${ticker}:`, error instanceof Error ? error.message : error);
    // Fallback: get basic quote + mock company info
    const quote = await getStockQuote(ticker, exchange);
    return { quote, info: getMockCompanyInfo(ticker) };
  }
};

// Get historical price data
export const getHistoricalData = async (
  ticker: string,
  exchange: string = 'NSE',
  range: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y' = '1mo',
  interval: '1m' | '5m' | '15m' | '1h' | '1d' | '1wk' | '1mo' = '1d'
): Promise<HistoricalData[]> => {
  const cacheKey = `history:${ticker}:${exchange}:${range}:${interval}`;
  const cached = getCached<HistoricalData[]>(cacheKey);
  if (cached) return cached;

  try {
    const symbol = toYahooSymbol(ticker, exchange);
    const response = await axios.get(`${YAHOO_FINANCE_V8}/chart/${symbol}`, {
      params: { interval, range },
      timeout: 15000,
      headers: YAHOO_HEADERS,
    });

    const result = response.data?.chart?.result?.[0];
    if (!result) return getMockHistoricalData(range);

    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};

    const data = timestamps.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString(),
      open: quote.open?.[i] || 0,
      high: quote.high?.[i] || 0,
      low: quote.low?.[i] || 0,
      close: quote.close?.[i] || 0,
      volume: quote.volume?.[i] || 0,
    })).filter((d: HistoricalData) => d.close > 0);

    setCache(cacheKey, data, CACHE_TTL_HISTORY);
    return data;
  } catch (error) {
    console.error(`Error fetching historical data for ${ticker}:`, error instanceof Error ? error.message : error);
    return getMockHistoricalData(range);
  }
};

// Get stock news from Google News RSS
export const getStockNews = async (ticker: string, companyName?: string): Promise<StockNews[]> => {
  const cacheKey = `news:${ticker}`;
  const cached = getCached<StockNews[]>(cacheKey);
  if (cached) return cached;

  try {
    const searchQuery = `${ticker} NSE BSE ${companyName || ''} stock`;
    const response = await axios.get(GOOGLE_NEWS_RSS, {
      params: {
        q: searchQuery,
        hl: 'en-IN',
        gl: 'IN',
        ceid: 'IN:en',
      },
      timeout: 10000,
      headers: YAHOO_HEADERS,
    });

    const xml = response.data as string;
    const items: StockNews[] = [];
    const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

    for (const item of itemMatches.slice(0, 10)) {
      const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || '';
      const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || '';
      const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || '';
      const source = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.trim() || 'News';

      if (title && link) {
        items.push({
          title,
          link,
          source,
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        });
      }
    }

    if (items.length > 0) {
      setCache(cacheKey, items, CACHE_TTL_NEWS);
    }
    return items.length > 0 ? items : getMockNews(ticker);
  } catch (error) {
    console.error(`Error fetching news for ${ticker}:`, error instanceof Error ? error.message : error);
    return getMockNews(ticker);
  }
};

// Search for stocks by name or ticker
export const searchStocks = async (query: string): Promise<Array<{
  ticker: string;
  companyName: string;
  exchange: string;
  type: string;
}>> => {
  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = getCached<Array<{ ticker: string; companyName: string; exchange: string; type: string }>>(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get('https://query2.finance.yahoo.com/v1/finance/search', {
      params: {
        q: query,
        lang: 'en-IN',
        region: 'IN',
        quotesCount: 15,
        newsCount: 0,
        enableFuzzyQuery: true,
        enableEnhancedTrivialQuery: true,
      },
      timeout: 10000,
      headers: YAHOO_HEADERS,
    });

    const quotes = response.data?.quotes || [];
    const results = quotes
      .filter((q: any) => q.symbol && (q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO')))
      .map((q: any) => ({
        ticker: q.symbol.replace(/\.(NS|BO)$/, ''),
        companyName: q.longname || q.shortname || q.symbol,
        exchange: q.symbol.endsWith('.BO') ? 'BSE' : 'NSE',
        type: q.quoteType || 'EQUITY',
      }));

    if (results.length > 0) {
      setCache(cacheKey, results, CACHE_TTL_SEARCH);
      return results;
    }

    // Fallback: search in popular stocks list
    return searchPopularStocks(query);
  } catch (error) {
    console.error('Error searching stocks:', error instanceof Error ? error.message : error);
    return searchPopularStocks(query);
  }
};

// Search within popular stocks as fallback
function searchPopularStocks(query: string) {
  const q = query.toLowerCase();
  return POPULAR_INDIAN_STOCKS.filter(s =>
    s.ticker.toLowerCase().includes(q) || s.companyName.toLowerCase().includes(q)
  ).map(s => ({ ...s, type: 'EQUITY' }));
}

// Popular Indian stocks for suggestions/defaults
export const POPULAR_INDIAN_STOCKS = [
  { ticker: 'RELIANCE', companyName: 'Reliance Industries Ltd', exchange: 'NSE' },
  { ticker: 'TCS', companyName: 'Tata Consultancy Services Ltd', exchange: 'NSE' },
  { ticker: 'HDFCBANK', companyName: 'HDFC Bank Ltd', exchange: 'NSE' },
  { ticker: 'INFY', companyName: 'Infosys Ltd', exchange: 'NSE' },
  { ticker: 'ICICIBANK', companyName: 'ICICI Bank Ltd', exchange: 'NSE' },
  { ticker: 'HINDUNILVR', companyName: 'Hindustan Unilever Ltd', exchange: 'NSE' },
  { ticker: 'SBIN', companyName: 'State Bank of India', exchange: 'NSE' },
  { ticker: 'BHARTIARTL', companyName: 'Bharti Airtel Ltd', exchange: 'NSE' },
  { ticker: 'ITC', companyName: 'ITC Ltd', exchange: 'NSE' },
  { ticker: 'KOTAKBANK', companyName: 'Kotak Mahindra Bank Ltd', exchange: 'NSE' },
  { ticker: 'LT', companyName: 'Larsen & Toubro Ltd', exchange: 'NSE' },
  { ticker: 'AXISBANK', companyName: 'Axis Bank Ltd', exchange: 'NSE' },
  { ticker: 'BAJFINANCE', companyName: 'Bajaj Finance Ltd', exchange: 'NSE' },
  { ticker: 'WIPRO', companyName: 'Wipro Ltd', exchange: 'NSE' },
  { ticker: 'HCLTECH', companyName: 'HCL Technologies Ltd', exchange: 'NSE' },
  { ticker: 'MARUTI', companyName: 'Maruti Suzuki India Ltd', exchange: 'NSE' },
  { ticker: 'TATAMOTORS', companyName: 'Tata Motors Ltd', exchange: 'NSE' },
  { ticker: 'SUNPHARMA', companyName: 'Sun Pharmaceutical Industries Ltd', exchange: 'NSE' },
  { ticker: 'TITAN', companyName: 'Titan Company Ltd', exchange: 'NSE' },
  { ticker: 'ADANIENT', companyName: 'Adani Enterprises Ltd', exchange: 'NSE' },
];

// Index data (Nifty 50, Sensex)
export const getIndexData = async (): Promise<Array<{
  name: string;
  value: number;
  change: number;
  changePercent: number;
}>> => {
  const cacheKey = 'indices';
  const cached = getCached<Array<{ name: string; value: number; change: number; changePercent: number }>>(cacheKey);
  if (cached) return cached;

  try {
    const indices = [
      { symbol: '^NSEI', name: 'NIFTY 50' },
      { symbol: '^BSESN', name: 'SENSEX' },
      { symbol: '^NSEBANK', name: 'BANK NIFTY' },
    ];

    const results = await Promise.all(
      indices.map(async (idx) => {
        try {
          const response = await axios.get(`${YAHOO_FINANCE_V8}/chart/${idx.symbol}`, {
            params: { interval: '1d', range: '5d' },
            timeout: 10000,
            headers: YAHOO_HEADERS,
          });
          const meta = response.data?.chart?.result?.[0]?.meta || {};
          const current = meta.regularMarketPrice || 0;
          const previous = meta.previousClose || current;
          return {
            name: idx.name,
            value: current,
            change: current - previous,
            changePercent: previous > 0 ? ((current - previous) / previous) * 100 : 0,
          };
        } catch {
          return null;
        }
      })
    );

    const validResults = results.filter((r): r is NonNullable<typeof r> => r !== null && r.value > 0);

    if (validResults.length > 0) {
      setCache(cacheKey, validResults, CACHE_TTL_QUOTE);
      return validResults;
    }

    return MOCK_INDEX_DATA;
  } catch (error) {
    console.error('Error fetching index data:', error instanceof Error ? error.message : error);
    return MOCK_INDEX_DATA;
  }
};

// ===== Mock data fallbacks =====

const MOCK_INDEX_DATA = [
  { name: 'NIFTY 50', value: 23456.70, change: 198.45, changePercent: 0.85 },
  { name: 'SENSEX', value: 77123.50, change: 654.20, changePercent: 0.86 },
  { name: 'BANK NIFTY', value: 49876.30, change: -123.40, changePercent: -0.25 },
];

const MOCK_PRICES: Record<string, { price: number; prev: number; name: string }> = {
  'RELIANCE': { price: 2890.50, prev: 2865.20, name: 'Reliance Industries Ltd' },
  'TCS': { price: 3942.75, prev: 3978.40, name: 'Tata Consultancy Services Ltd' },
  'HDFCBANK': { price: 1687.30, prev: 1672.10, name: 'HDFC Bank Ltd' },
  'INFY': { price: 1534.20, prev: 1548.90, name: 'Infosys Ltd' },
  'ICICIBANK': { price: 1245.60, prev: 1238.40, name: 'ICICI Bank Ltd' },
  'HINDUNILVR': { price: 2356.80, prev: 2341.50, name: 'Hindustan Unilever Ltd' },
  'SBIN': { price: 812.45, prev: 805.30, name: 'State Bank of India' },
  'BHARTIARTL': { price: 1645.90, prev: 1632.70, name: 'Bharti Airtel Ltd' },
  'ITC': { price: 438.25, prev: 435.60, name: 'ITC Ltd' },
  'KOTAKBANK': { price: 1876.40, prev: 1889.20, name: 'Kotak Mahindra Bank Ltd' },
  'LT': { price: 3567.80, prev: 3542.90, name: 'Larsen & Toubro Ltd' },
  'AXISBANK': { price: 1134.50, prev: 1128.70, name: 'Axis Bank Ltd' },
  'BAJFINANCE': { price: 6789.20, prev: 6745.80, name: 'Bajaj Finance Ltd' },
  'WIPRO': { price: 478.60, prev: 482.30, name: 'Wipro Ltd' },
  'HCLTECH': { price: 1623.40, prev: 1612.80, name: 'HCL Technologies Ltd' },
  'MARUTI': { price: 12456.70, prev: 12389.50, name: 'Maruti Suzuki India Ltd' },
  'TATAMOTORS': { price: 945.30, prev: 938.60, name: 'Tata Motors Ltd' },
  'SUNPHARMA': { price: 1789.40, prev: 1776.20, name: 'Sun Pharmaceutical Industries Ltd' },
  'TITAN': { price: 3456.80, prev: 3478.90, name: 'Titan Company Ltd' },
  'ADANIENT': { price: 2890.60, prev: 2912.40, name: 'Adani Enterprises Ltd' },
};

function getMockQuote(ticker: string, exchange: string): StockQuote | null {
  const data = MOCK_PRICES[ticker.toUpperCase()];
  if (!data) return null;

  const currentPrice = data.price;
  const previousClose = data.prev;

  return {
    ticker: ticker.toUpperCase(),
    companyName: data.name,
    exchange: exchange.toUpperCase(),
    currentPrice,
    previousClose,
    open: previousClose + (currentPrice - previousClose) * 0.3,
    dayHigh: currentPrice * 1.012,
    dayLow: currentPrice * 0.988,
    fiftyTwoWeekHigh: currentPrice * 1.25,
    fiftyTwoWeekLow: currentPrice * 0.72,
    volume: 5000000 + Math.floor(Math.random() * 10000000),
    avgVolume: 8000000,
    marketCap: currentPrice * 1000000000,
    peRatio: 20 + Math.random() * 30,
    pbRatio: 2 + Math.random() * 5,
    dividendYield: Math.random() * 3,
    eps: currentPrice / (20 + Math.random() * 30),
    dayChange: currentPrice - previousClose,
    dayChangePercent: ((currentPrice - previousClose) / previousClose) * 100,
    currency: 'INR',
    lastUpdated: new Date().toISOString(),
  };
}

function getMockCompanyInfo(ticker: string): CompanyInfo | null {
  const data = MOCK_PRICES[ticker.toUpperCase()];
  if (!data) return null;

  const sectors: Record<string, { sector: string; industry: string }> = {
    'RELIANCE': { sector: 'Energy', industry: 'Oil & Gas Refining & Marketing' },
    'TCS': { sector: 'Technology', industry: 'Information Technology Services' },
    'HDFCBANK': { sector: 'Financial Services', industry: 'Banks - Private Sector' },
    'INFY': { sector: 'Technology', industry: 'Information Technology Services' },
    'ICICIBANK': { sector: 'Financial Services', industry: 'Banks - Private Sector' },
    'SBIN': { sector: 'Financial Services', industry: 'Banks - Public Sector' },
    'ITC': { sector: 'Consumer Goods', industry: 'FMCG' },
    'BHARTIARTL': { sector: 'Telecommunication', industry: 'Telecom Services' },
    'WIPRO': { sector: 'Technology', industry: 'Information Technology Services' },
    'TATAMOTORS': { sector: 'Automobile', industry: 'Auto Manufacturers' },
    'MARUTI': { sector: 'Automobile', industry: 'Auto Manufacturers' },
    'SUNPHARMA': { sector: 'Healthcare', industry: 'Pharmaceuticals' },
    'TITAN': { sector: 'Consumer Goods', industry: 'Jewelry & Watches' },
    'BAJFINANCE': { sector: 'Financial Services', industry: 'NBFC' },
  };

  const sectorInfo = sectors[ticker.toUpperCase()] || { sector: 'N/A', industry: 'N/A' };

  return {
    ticker: ticker.toUpperCase(),
    companyName: data.name,
    sector: sectorInfo.sector,
    industry: sectorInfo.industry,
    description: `${data.name} is a major Indian company listed on the National Stock Exchange.`,
    website: '',
    employees: null,
    headquarters: 'India',
  };
}

function getMockHistoricalData(range: string): HistoricalData[] {
  const days = range === '1d' ? 1 : range === '5d' ? 5 : range === '1mo' ? 30 : range === '3mo' ? 90 : range === '6mo' ? 180 : range === '1y' ? 365 : 30;
  const data: HistoricalData[] = [];
  const basePrice = 1000 + Math.random() * 2000;

  for (let i = days; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends

    const drift = (Math.random() - 0.48) * 0.03;
    const prevClose = data.length > 0 ? data[data.length - 1].close : basePrice;
    const close = prevClose * (1 + drift);
    const high = close * (1 + Math.random() * 0.015);
    const low = close * (1 - Math.random() * 0.015);
    const open = prevClose + (close - prevClose) * Math.random();

    data.push({
      date: date.toISOString(),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: 3000000 + Math.floor(Math.random() * 7000000),
    });
  }

  return data;
}

function getMockNews(ticker: string): StockNews[] {
  const data = MOCK_PRICES[ticker.toUpperCase()];
  const name = data?.name || ticker.toUpperCase();

  return [
    {
      title: `${name} reports strong quarterly results, beats estimates`,
      link: '#',
      source: 'Economic Times',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: `Analysts upgrade ${ticker} target price after sector rally`,
      link: '#',
      source: 'Moneycontrol',
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: `${ticker}: FII holdings increase in latest quarter data`,
      link: '#',
      source: 'LiveMint',
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
