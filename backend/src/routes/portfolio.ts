import { Router, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import { notFound } from '../middleware/errorHandler';

const router = Router();

// GET /portfolio/summary
router.get('/summary', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const holdings = await prisma.holding.findMany({
      where: { userId: req.userId },
    });

    if (holdings.length === 0) {
      return res.json({
        success: true,
        data: {
          totalValue: 0,
          todayChangePct: 0,
          todayChangePnl: 0,
          allTimeChangePct: 0,
        },
      });
    }

    const totalValue = holdings.reduce(
      (sum, h) => sum + h.currentPrice * h.quantity,
      0
    );

    const totalCost = holdings.reduce(
      (sum, h) => sum + h.avgBuyPrice * h.quantity,
      0
    );

    const weightedTodayChange = holdings.reduce((sum, h) => {
      const weight = (h.currentPrice * h.quantity) / totalValue;
      return sum + h.todayChangePct * weight;
    }, 0);

    const todayChangePnl = (weightedTodayChange / 100) * totalValue;
    const allTimeChangePct = ((totalValue - totalCost) / totalCost) * 100;

    res.json({
      success: true,
      data: {
        totalValue,
        todayChangePct: weightedTodayChange,
        todayChangePnl,
        allTimeChangePct,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /portfolio/holdings
router.get('/holdings', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const holdings = await prisma.holding.findMany({
      where: { userId: req.userId },
      orderBy: { allocationPct: 'desc' },
    });

    res.json({
      success: true,
      data: holdings,
    });
  } catch (error) {
    next(error);
  }
});

// GET /portfolio/chart-data
router.get('/chart-data', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const holdings = await prisma.holding.findMany({
      where: { userId: req.userId },
      orderBy: { allocationPct: 'desc' },
    });

    const chartData = holdings.map((h) => ({
      ticker: h.ticker,
      allocationPct: h.allocationPct,
      todayChangePct: h.todayChangePct,
      color: h.colorHex,
      companyName: h.companyName,
      currentValue: h.currentPrice * h.quantity,
    }));

    res.json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    next(error);
  }
});

// GET /portfolio/trades
router.get('/trades', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const trades = await prisma.trade.findMany({
      where: { userId: req.userId },
      orderBy: { executedAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      data: trades,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
