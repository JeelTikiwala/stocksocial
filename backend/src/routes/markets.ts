import { Router } from 'express';
import axios from 'axios';
import { prisma } from '../index';

const router = Router();
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';

type AlphaTopTicker = {
  ticker: string;
  price: string;
  change_amount: string;
  change_percentage: string;
  volume?: string;
};

const parseCsv = (csv: string): string[][] => {
  return csv
    .trim()
    .split('\n')
    .map((line) => line.split(',').map((v) => v.replace(/^"|"$/g, '').trim()));
};

// GET /markets/events
router.get('/events', async (req, res, next) => {
  try {
    const events = await prisma.marketEvent.findMany({
      where: {
        dateTime: {
          gte: new Date(),
        },
      },
      orderBy: { dateTime: 'asc' },
      take: 10,
    });

    // If no events, return mock data
    if (events.length === 0) {
      return res.json({
        success: true,
        data: [
          {
            id: '1',
            title: 'Q4 Earnings Season Preview',
            subtitle: 'Weekly Market Insights',
            dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            type: 'WEBINAR',
          },
          {
            id: '2',
            title: 'IPO Spotlight: TechCorp India',
            subtitle: 'New Listings',
            dateTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
            type: 'IPO',
          },
        ],
      });
    }

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
});

// GET /markets/earnings-calendar
router.get('/earnings-calendar', async (req, res, next) => {
  try {
    let earningsDays: { date: string; companies: { ticker: string; companyName: string }[] }[] = [];

    try {
      // Real free source: Alpha Vantage EARNINGS_CALENDAR (CSV)
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'EARNINGS_CALENDAR',
          horizon: '3month',
          apikey: ALPHA_VANTAGE_API_KEY,
        },
        timeout: 15000,
        responseType: 'text',
      });

      const rows = parseCsv(response.data as string);
      const [, ...dataRows] = rows;
      const groupedByDate: Record<string, { ticker: string; companyName: string }[]> = {};

      for (const row of dataRows) {
        const [symbol, name, reportDate] = row;
        if (!symbol || !reportDate) continue;
        const dateKey = reportDate;
        if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
        groupedByDate[dateKey].push({
          ticker: symbol.toUpperCase(),
          companyName: name || symbol.toUpperCase(),
        });
      }

      const requestedFrom = req.query.from ? new Date(req.query.from as string) : new Date();
      const requestedTo = req.query.to
        ? new Date(req.query.to as string)
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      earningsDays = Object.entries(groupedByDate)
        .filter(([date]) => {
          const dt = new Date(date);
          return dt >= requestedFrom && dt <= requestedTo;
        })
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(0, 40)
        .map(([date, companies]) => ({ date, companies }));
    } catch {
      // Alpha Vantage failed, use Indian stock earnings mock data
      const today = new Date();
      earningsDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
        const stocks = [
          ['RELIANCE', 'Reliance Industries'], ['TCS', 'Tata Consultancy Services'],
          ['HDFCBANK', 'HDFC Bank'], ['INFY', 'Infosys'], ['ICICIBANK', 'ICICI Bank'],
          ['SBIN', 'State Bank of India'], ['ITC', 'ITC Ltd'], ['LT', 'Larsen & Toubro'],
          ['BHARTIARTL', 'Bharti Airtel'], ['KOTAKBANK', 'Kotak Mahindra Bank'],
        ];
        const idx = i % stocks.length;
        return {
          date: date.toISOString().split('T')[0],
          companies: [{ ticker: stocks[idx][0], companyName: stocks[idx][1] }],
        };
      });
    }

    res.json({
      success: true,
      data: earningsDays,
    });
  } catch (error) {
    next(error);
  }
});

// GET /markets/featured-lists
router.get('/featured-lists', async (req, res, next) => {
  try {
    let lists: any[] = [];

    try {
      // Real free source: Alpha Vantage TOP_GAINERS_LOSERS
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'TOP_GAINERS_LOSERS',
          apikey: ALPHA_VANTAGE_API_KEY,
        },
        timeout: 15000,
      });

      const payload = response.data || {};
      const topGainers: AlphaTopTicker[] = payload.top_gainers || [];
      const mostActivelyTraded: AlphaTopTicker[] = payload.most_actively_traded || [];
      const topLosers: AlphaTopTicker[] = payload.top_losers || [];

      if (topGainers.length > 0 || mostActivelyTraded.length > 0) {
        lists = [
          {
            id: '1',
            name: 'Top Gainers',
            description: 'Top market gainers today',
            stocks: topGainers.slice(0, 20).map((s) => ({
              ticker: s.ticker,
              companyName: `${s.ticker} (${s.change_percentage})`,
            })),
          },
          {
            id: '2',
            name: 'Most Active',
            description: 'Most actively traded tickers',
            stocks: mostActivelyTraded.slice(0, 20).map((s) => ({
              ticker: s.ticker,
              companyName: `${s.ticker} (vol ${s.volume || '-'})`,
            })),
          },
          {
            id: '3',
            name: 'Top Losers',
            description: 'Largest daily declines',
            stocks: topLosers.slice(0, 20).map((s) => ({
              ticker: s.ticker,
              companyName: `${s.ticker} (${s.change_percentage})`,
            })),
          },
        ];
      }
    } catch {
      // Alpha Vantage failed
    }

    // Fallback to Indian market lists
    if (lists.length === 0) {
      const { POPULAR_INDIAN_STOCKS } = await import('../services/stockData');
      lists = [
        {
          id: '1',
          name: 'Top Gainers',
          description: 'Top Indian market large-caps',
          stocks: POPULAR_INDIAN_STOCKS.slice(0, 10).map(s => ({
            ticker: s.ticker,
            companyName: s.companyName,
          })),
        },
        {
          id: '2',
          name: 'Most Active',
          description: 'Most actively traded Indian stocks',
          stocks: POPULAR_INDIAN_STOCKS.slice(5, 15).map(s => ({
            ticker: s.ticker,
            companyName: s.companyName,
          })),
        },
        {
          id: '3',
          name: 'Top Losers',
          description: 'Large-cap movers',
          stocks: POPULAR_INDIAN_STOCKS.slice(10, 20).map(s => ({
            ticker: s.ticker,
            companyName: s.companyName,
          })),
        },
      ];
    }

    res.json({ success: true, data: lists });
  } catch (error) {
    next(error);
  }
});

// GET /markets/fear-greed
router.get('/fear-greed', async (req, res, next) => {
  try {
    // Real free source: Alternative.me Fear & Greed API
    const response = await axios.get('https://api.alternative.me/fng/', {
      params: { limit: 31, format: 'json' },
      timeout: 10000,
    });

    const rows = response.data?.data || [];
    const latest = rows[0];
    const score = Number(latest?.value || 50);
    const label = latest?.value_classification || 'Neutral';
    const historical = rows
      .slice(0, 30)
      .reverse()
      .map((row: any) => ({
        date: new Date(Number(row.timestamp) * 1000).toISOString(),
        value: Number(row.value),
      }));

    res.json({
      success: true,
      data: {
        score,
        label,
        historical,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
