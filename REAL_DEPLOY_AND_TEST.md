# StockCircle - Deployment & Testing Guide

Complete guide for deploying and testing StockCircle, a premium stock social app for Indian investors.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile App (Expo)                         │
│  - React Native + TypeScript                                     │
│  - Expo Router for navigation                                    │
│  - Zustand for local and session state                            │
│  - Axios services for API requests                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API (Express)                       │
│  - Node.js + TypeScript                                          │
│  - Prisma ORM                                                    │
│  - JWT authentication                                            │
│  - Real-time Indian stock data (Yahoo Finance)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                         │
│  - User accounts, settings, portfolios                           │
│  - Posts, comments, social activity                              │
│  - Watchlists, trades, broker connections                        │
└─────────────────────────────────────────────────────────────────┘
```

## Data Sources

| Feature | Source | Notes |
|---------|--------|-------|
| Indian Stock Quotes | Yahoo Finance API | Real NSE/BSE prices |
| Stock Financials | Yahoo Finance QuoteSummary | P/E, P/B, EPS, Market Cap |
| Stock News | Google News RSS | Real-time news per ticker |
| Historical Data | Yahoo Finance Charts | 1D to 5Y price history |
| Stock Search | Yahoo Finance Search | Indian market stocks |
| Earnings Calendar | Alpha Vantage | Free with API key |
| Fear & Greed Index | Alternative.me | Free, no key needed |
| Market Gainers/Losers | Alpha Vantage | Free with API key |

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn
- PostgreSQL 14+ (local or cloud)
- Expo Go app (iOS/Android) for testing
- Git

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repo-url>
cd stocksocial

# Install mobile dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Setup

**Mobile (project root) `.env`:**

```env
# API endpoint (use LAN IP for physical device testing)
EXPO_PUBLIC_API_URL="http://localhost:3000/v1"

# For physical device, use your machine's LAN IP:
# EXPO_PUBLIC_API_URL="http://192.168.1.100:3000/v1"

# Zerodha OAuth callback scheme
EXPO_PUBLIC_ZERODHA_REDIRECT_SCHEME="stockcircle"
```

**Backend `backend/.env`:**

```env
# Database (required)
DATABASE_URL="postgresql://user:password@localhost:5432/stockcircle"

# JWT Secrets (required - use strong random strings)
JWT_SECRET="your-32-byte-jwt-secret-here"
JWT_REFRESH_SECRET="your-32-byte-refresh-secret-here"

# Encryption for broker tokens (required)
ENCRYPTION_KEY="64-hex-characters-for-aes-256-encryption"

# Alpha Vantage API key (optional, "demo" works with rate limits)
ALPHA_VANTAGE_API_KEY="demo"

# Server config
PORT=3000
NODE_ENV="development"

# Zerodha integration (optional for brokerage features)
ZERODHA_API_KEY=""
ZERODHA_API_SECRET=""
ZERODHA_REDIRECT_URL="http://localhost:3000/v1/broker/zerodha/callback"
```

### 3. Database Setup

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

### 4. Start Backend

```bash
cd backend
npm run dev
```

Verify it's running:
```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"..."}
```

### 5. Start Mobile App

```bash
# From project root
npm start
```

Scan QR code with Expo Go app or press `i` for iOS simulator / `a` for Android emulator.

## API Endpoints Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/auth/register` | Create new account |
| POST | `/v1/auth/login` | Sign in |
| POST | `/v1/auth/refresh` | Refresh access token |
| POST | `/v1/auth/logout` | Sign out |
| POST | `/v1/auth/change-password` | Update password |
| DELETE | `/v1/auth/account` | Delete account |

### Stocks (Real Market Data)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/stocks/search?q=` | Search Indian stocks |
| GET | `/v1/stocks/popular` | List popular NSE/BSE stocks |
| GET | `/v1/stocks/indices` | Nifty 50, Sensex, Bank Nifty |
| GET | `/v1/stocks/:ticker` | Get stock quote |
| GET | `/v1/stocks/:ticker/details` | Quote + company info |
| GET | `/v1/stocks/:ticker/history` | Historical price data |
| GET | `/v1/stocks/:ticker/news` | Stock-specific news |
| GET | `/v1/stocks/:ticker/activity` | In-app buy/sell activity |

### Social
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/social/activity` | Activity feed |
| GET | `/v1/social/leaderboard` | Top performing portfolios |
| GET | `/v1/social/discussions` | Stock discussions |
| GET | `/v1/social/discover` | Discover users to follow |
| GET | `/v1/social/trending-tickers` | Trending stocks |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/settings` | Get user settings |
| PUT | `/v1/settings` | Update settings |
| GET | `/v1/settings/profile` | Get profile |
| PUT | `/v1/settings/profile` | Update profile |

### Watchlist
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/watchlist` | Get all watchlists |
| POST | `/v1/watchlist` | Create watchlist |
| POST | `/v1/watchlist/:id/items` | Add stock to watchlist |
| DELETE | `/v1/watchlist/:id/items/:ticker` | Remove stock |

## Testing Checklist

### Authentication Flow
- [ ] Register new account with email/username/password
- [ ] Login with email/password
- [ ] Persist session across app restart
- [ ] Change password from Settings
- [ ] Logout and re-login
- [ ] Delete account

### Stock Data (Real Data)
- [ ] Search for Indian stocks (e.g., "Reliance", "TCS")
- [ ] View stock detail with real price
- [ ] Check price chart with different time ranges (1D, 1M, 1Y)
- [ ] View key statistics (P/E, Market Cap, etc.)
- [ ] Read stock news
- [ ] See in-app buying/selling activity

### Markets Tab
- [ ] View market indices (Nifty 50, Sensex)
- [ ] Check earnings calendar
- [ ] View top gainers/losers (Alpha Vantage)
- [ ] See Fear & Greed index

### Social Features
- [ ] Create a post
- [ ] Like/comment on posts
- [ ] View activity feed
- [ ] Check portfolio leaderboard
- [ ] Discover users to follow
- [ ] Follow/unfollow users

### Settings
- [ ] Edit profile (display name, bio)
- [ ] Toggle notifications
- [ ] Set portfolio goals
- [ ] Privacy settings

### Watchlist
- [ ] Create watchlist
- [ ] Add stocks to watchlist
- [ ] Remove stocks from watchlist

## Production Deployment

### Backend Deployment (Railway/Render/Fly.io)

1. **Database**: Set up managed PostgreSQL
2. **Deploy**: Push backend to hosting service
3. **Environment**: Configure all env vars
4. **Domain**: Set up custom domain with HTTPS

```bash
# Example: Railway
railway login
railway new
railway add postgresql
railway up
```

### Mobile Build (EAS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure eas.json (already generated)

# Build for iOS
eas build -p ios

# Build for Android
eas build -p android

# Submit to stores
eas submit -p ios
eas submit -p android
```

### Environment for Production

**Backend:**
```env
DATABASE_URL="postgresql://...@prod-db:5432/stockcircle"
JWT_SECRET="<strong-random-secret>"
JWT_REFRESH_SECRET="<strong-random-secret>"
ENCRYPTION_KEY="<64-hex-chars>"
ALPHA_VANTAGE_API_KEY="<your-free-key>"
NODE_ENV="production"
```

**Mobile:**
```env
EXPO_PUBLIC_API_URL="https://api.stockcircle.app/v1"
```

## Troubleshooting

### Cannot connect to API from mobile
- Use your machine's LAN IP instead of localhost
- Check firewall settings
- Verify backend is running on correct port

### Stock data not loading
- Yahoo Finance may rate limit heavy requests
- Check network connectivity
- Verify ticker symbols use NSE format (e.g., RELIANCE, TCS)

### Database errors
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Run `npm run db:push` after schema changes

### Auth issues
- Verify JWT secrets are set
- Check token expiration
- Clear app storage and re-login

## Supported Stock Symbols

The app supports all NSE and BSE listed stocks. Popular examples:

| Ticker | Company |
|--------|---------|
| RELIANCE | Reliance Industries |
| TCS | Tata Consultancy Services |
| HDFCBANK | HDFC Bank |
| INFY | Infosys |
| ICICIBANK | ICICI Bank |
| HINDUNILVR | Hindustan Unilever |
| SBIN | State Bank of India |
| BHARTIARTL | Bharti Airtel |
| ITC | ITC Limited |
| KOTAKBANK | Kotak Mahindra Bank |

## Rate Limits

| Service | Free Tier Limit |
|---------|-----------------|
| Yahoo Finance | ~2000 requests/hour |
| Alpha Vantage | 5 requests/minute (demo), 500/day (free key) |
| Google News | No documented limit |
| Alternative.me | No documented limit |

## Support

- GitHub Issues: Report bugs or request features
- Documentation: Check CLAUDE.md for detailed specs
