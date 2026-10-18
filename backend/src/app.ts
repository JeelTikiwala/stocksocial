import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth';
import portfolioRoutes from './routes/portfolio';
import brokerRoutes from './routes/broker';
import settingsRoutes from './routes/settings';
import watchlistRoutes from './routes/watchlist';
import marketRoutes from './routes/market';
import screenerRoutes from './routes/screeners';
import optionsRoutes from './routes/options';
import toolsRoutes from './routes/tools';
import liveRoutes from './routes/live';
import newsRoutes from './routes/news';

import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

export function createApp(opts: { quiet?: boolean } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (!opts.quiet) app.use(requestLogger);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Public EOD analytics (no auth: it is published exchange data, delayed by design)
  app.use('/v1/market', marketRoutes);
  app.use('/v1/screeners', screenerRoutes);
  app.use('/v1/options', optionsRoutes);
  app.use('/v1/tools', toolsRoutes);
  app.use('/v1/live', liveRoutes);
  app.use('/v1/news', newsRoutes);

  // Account features (need Postgres)
  app.use('/v1/auth', authRoutes);
  app.use('/v1/portfolio', portfolioRoutes);
  app.use('/v1/broker', brokerRoutes);
  app.use('/v1/settings', settingsRoutes);
  app.use('/v1/watchlist', watchlistRoutes);

  app.use(errorHandler);
  return app;
}
