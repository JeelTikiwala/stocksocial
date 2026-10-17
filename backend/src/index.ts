import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Routes
import authRoutes from './routes/auth';
import portfolioRoutes from './routes/portfolio';
import brokerRoutes from './routes/broker';
import feedRoutes from './routes/feed';
import userRoutes from './routes/users';
import marketRoutes from './routes/markets';
import stockRoutes from './routes/stocks';
import socialRoutes from './routes/social';
import settingsRoutes from './routes/settings';
import watchlistRoutes from './routes/watchlist';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/v1/auth', authRoutes);
app.use('/v1/portfolio', portfolioRoutes);
app.use('/v1/broker', brokerRoutes);
app.use('/v1/feed', feedRoutes);
app.use('/v1/posts', feedRoutes);
app.use('/v1/users', userRoutes);
app.use('/v1/markets', marketRoutes);
app.use('/v1/stocks', stockRoutes);
app.use('/v1/social', socialRoutes);
app.use('/v1/settings', settingsRoutes);
app.use('/v1/watchlist', watchlistRoutes);

// Error handler
app.use(errorHandler);

// Start server
async function main() {
  try {
    await prisma.$connect();
    console.log('Connected to database');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };
