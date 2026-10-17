import { Router, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  getStockQuote,
  getCompanyDetails,
  getHistoricalData,
  getStockNews,
  searchStocks,
  getIndexData,
  POPULAR_INDIAN_STOCKS,
} from '../services/stockData';

const router = Router();

// GET /stocks/search - Search for stocks
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.length < 1) {
      return res.json({ success: true, data: [] });
    }

    const results = await searchStocks(q);
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

// GET /stocks/popular - List popular Indian stocks
router.get('/popular', async (req, res, next) => {
  try {
    res.json({ success: true, data: POPULAR_INDIAN_STOCKS });
  } catch (error) {
    next(error);
  }
});

// GET /stocks/indices - Get major index data
router.get('/indices', async (req, res, next) => {
  try {
    const indices = await getIndexData();
    res.json({ success: true, data: indices });
  } catch (error) {
    next(error);
  }
});

// GET /stocks/:ticker - Get stock quote
router.get('/:ticker', async (req, res, next) => {
  try {
    const { ticker } = req.params;
    const exchange = (req.query.exchange as string) || 'NSE';

    const quote = await getStockQuote(ticker, exchange);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Stock not found' });
    }

    res.json({ success: true, data: quote });
  } catch (error) {
    next(error);
  }
});

// GET /stocks/:ticker/details - Get detailed company info and fundamentals
router.get('/:ticker/details', async (req, res, next) => {
  try {
    const { ticker } = req.params;
    const exchange = (req.query.exchange as string) || 'NSE';

    const { quote, info } = await getCompanyDetails(ticker, exchange);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Stock not found' });
    }

    res.json({ success: true, data: { quote, info } });
  } catch (error) {
    next(error);
  }
});

// GET /stocks/:ticker/history - Get historical price data
router.get('/:ticker/history', async (req, res, next) => {
  try {
    const { ticker } = req.params;
    const exchange = (req.query.exchange as string) || 'NSE';
    const range = (req.query.range as '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y') || '1mo';
    const interval = (req.query.interval as '1m' | '5m' | '15m' | '1h' | '1d' | '1wk' | '1mo') || '1d';

    const history = await getHistoricalData(ticker, exchange, range, interval);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
});

// GET /stocks/:ticker/news - Get stock news
router.get('/:ticker/news', async (req, res, next) => {
  try {
    const { ticker } = req.params;
    const companyName = req.query.companyName as string | undefined;

    const news = await getStockNews(ticker, companyName);
    res.json({ success: true, data: news });
  } catch (error) {
    next(error);
  }
});

// GET /stocks/:ticker/activity - Get in-app buying/selling activity
router.get('/:ticker/activity', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ticker } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get trade activity from the database
    const trades = await prisma.trade.groupBy({
      by: ['type'],
      where: {
        ticker: ticker.toUpperCase(),
        executedAt: { gte: since },
      },
      _count: true,
      _sum: { quantity: true },
    });

    const buyTrades = trades.find(t => t.type === 'BUY');
    const sellTrades = trades.find(t => t.type === 'SELL');

    const buyCount = buyTrades?._count || 0;
    const sellCount = sellTrades?._count || 0;
    const totalTrades = buyCount + sellCount;

    // Also get unique users who traded
    const uniqueBuyers = await prisma.trade.findMany({
      where: {
        ticker: ticker.toUpperCase(),
        type: 'BUY',
        executedAt: { gte: since },
      },
      distinct: ['userId'],
      select: { userId: true },
    });

    const uniqueSellers = await prisma.trade.findMany({
      where: {
        ticker: ticker.toUpperCase(),
        type: 'SELL',
        executedAt: { gte: since },
      },
      distinct: ['userId'],
      select: { userId: true },
    });

    // Get watchlist adds for this ticker
    const watchlistAdds = await prisma.watchlistItem.count({
      where: {
        ticker: ticker.toUpperCase(),
        addedAt: { gte: since },
      },
    });

    res.json({
      success: true,
      data: {
        ticker: ticker.toUpperCase(),
        period: `${days}d`,
        trades: {
          buyCount,
          sellCount,
          totalTrades,
          buyPercent: totalTrades > 0 ? Math.round((buyCount / totalTrades) * 100) : 50,
          sellPercent: totalTrades > 0 ? Math.round((sellCount / totalTrades) * 100) : 50,
        },
        users: {
          uniqueBuyers: uniqueBuyers.length,
          uniqueSellers: uniqueSellers.length,
        },
        watchlistAdds,
        netFlow: buyCount - sellCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /stocks/:ticker/track - Track a stock view/interest (for analytics)
router.post('/:ticker/track', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ticker } = req.params;
    const { action } = req.body; // 'view', 'search', 'watchlist_add', etc.

    await prisma.stockInteraction.create({
      data: {
        userId: req.userId!,
        ticker: ticker.toUpperCase(),
        action: action || 'view',
        createdAt: new Date(),
      },
    });

    res.json({ success: true });
  } catch (error) {
    // Non-critical, don't fail
    res.json({ success: true });
  }
});

export default router;
