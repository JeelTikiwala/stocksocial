import { Router, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import { badRequest, notFound } from '../middleware/errorHandler';
import { encrypt, decrypt } from '../utils/encryption';

const router = Router();

// Chart colors for holdings
const CHART_COLORS = [
  '#6C63FF', '#00C2A8', '#F59E0B', '#F04444',
  '#3B82F6', '#10B981', '#EC4899', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

// GET /broker/status
router.get('/status', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const connection = await prisma.brokerConnection.findFirst({
      where: { userId: req.userId },
    });

    if (!connection) {
      return res.json({
        success: true,
        data: {
          connected: false,
          broker: null,
          lastSynced: null,
        },
      });
    }

    res.json({
      success: true,
      data: {
        connected: true,
        broker: connection.broker,
        lastSynced: connection.lastSyncedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /broker/zerodha/auth-url
router.get('/zerodha/auth-url', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const apiKey = process.env.ZERODHA_API_KEY;
    const redirectUrl = process.env.ZERODHA_REDIRECT_URL;

    if (!apiKey || !redirectUrl) {
      throw badRequest('Zerodha integration not configured');
    }

    // In production, use kiteconnect SDK
    const authUrl = `https://kite.zerodha.com/connect/login?v=3&api_key=${apiKey}`;

    res.json({
      success: true,
      data: { url: authUrl },
    });
  } catch (error) {
    next(error);
  }
});

// GET /broker/zerodha/callback
router.get('/zerodha/callback', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { request_token } = req.query;

    if (!request_token || typeof request_token !== 'string') {
      throw badRequest('Request token required');
    }

    // In production, exchange request_token for access_token using kiteconnect SDK
    // For now, simulate successful connection
    const mockAccessToken = `zerodha_${Date.now()}`;

    // Encrypt and store token
    const encryptedToken = encrypt(mockAccessToken);

    await prisma.brokerConnection.upsert({
      where: {
        userId_broker: {
          userId: req.userId!,
          broker: 'ZERODHA',
        },
      },
      create: {
        userId: req.userId!,
        broker: 'ZERODHA',
        accessToken: encryptedToken,
        lastSyncedAt: new Date(),
      },
      update: {
        accessToken: encryptedToken,
        lastSyncedAt: new Date(),
      },
    });

    // TODO: Trigger initial holdings sync

    res.json({
      success: true,
      message: 'Broker connected successfully',
    });
  } catch (error) {
    next(error);
  }
});

// POST /broker/sync
router.post('/sync', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const connection = await prisma.brokerConnection.findFirst({
      where: { userId: req.userId },
    });

    if (!connection) {
      throw badRequest('No broker connected');
    }

    // Decrypt access token
    const accessToken = decrypt(connection.accessToken);

    // TODO: Use kiteconnect SDK to fetch holdings
    // For now, create mock holdings
    const mockHoldings = [
      { ticker: 'RELIANCE', companyName: 'Reliance Industries', quantity: 50, avgBuyPrice: 2400, currentPrice: 2550 },
      { ticker: 'TCS', companyName: 'Tata Consultancy Services', quantity: 20, avgBuyPrice: 3200, currentPrice: 3150 },
      { ticker: 'HDFCBANK', companyName: 'HDFC Bank', quantity: 40, avgBuyPrice: 1500, currentPrice: 1550 },
      { ticker: 'INFY', companyName: 'Infosys', quantity: 30, avgBuyPrice: 1450, currentPrice: 1420 },
      { ticker: 'ICICIBANK', companyName: 'ICICI Bank', quantity: 60, avgBuyPrice: 900, currentPrice: 920 },
    ];

    // Calculate total value for allocation percentages
    const totalValue = mockHoldings.reduce(
      (sum, h) => sum + h.currentPrice * h.quantity,
      0
    );

    // Upsert holdings
    for (let i = 0; i < mockHoldings.length; i++) {
      const h = mockHoldings[i];
      const value = h.currentPrice * h.quantity;
      const allocationPct = (value / totalValue) * 100;
      const todayChangePct = ((h.currentPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100;

      await prisma.holding.upsert({
        where: {
          userId_ticker_exchange: {
            userId: req.userId!,
            ticker: h.ticker,
            exchange: 'NSE',
          },
        },
        create: {
          userId: req.userId!,
          ticker: h.ticker,
          companyName: h.companyName,
          exchange: 'NSE',
          quantity: h.quantity,
          avgBuyPrice: h.avgBuyPrice,
          currentPrice: h.currentPrice,
          todayChangePct,
          allocationPct,
          colorHex: CHART_COLORS[i % CHART_COLORS.length],
          lastSyncedAt: new Date(),
        },
        update: {
          quantity: h.quantity,
          avgBuyPrice: h.avgBuyPrice,
          currentPrice: h.currentPrice,
          todayChangePct,
          allocationPct,
          lastSyncedAt: new Date(),
        },
      });
    }

    // Update connection last synced
    await prisma.brokerConnection.update({
      where: { id: connection.id },
      data: { lastSyncedAt: new Date() },
    });

    res.json({
      success: true,
      message: 'Portfolio synced successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
