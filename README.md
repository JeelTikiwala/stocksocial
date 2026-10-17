# StockCircle

A premium cross-platform stock social app for Indian investors built with React Native + Expo.

## Features

- **Portfolio Tracking**: Connect your broker (Zerodha) and visualize your portfolio with an interactive donut chart
- **Social Feed**: Share investment insights, follow other investors, like and comment on posts
- **Social Hub**: Discover investors, discussions, challenges, shared watchlists, and top portfolios
- **Markets**: View upcoming events, earnings calendar, and featured stock lists
- **Insights**: Get AI-powered analysis of your portfolio

## Tech Stack

### Mobile App
- React Native + Expo (managed workflow)
- TypeScript
- Expo Router (file-based navigation)
- Axios API services
- Zustand for session, settings, and watchlist state
- react-native-svg for charts

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication

## Project Structure

```
stockcircle/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Auth screens (login, register, etc.)
│   ├── (tabs)/            # Main tab screens
│   ├── profile/           # Profile screens
│   └── post/              # Post detail screens
├── components/
│   ├── ui/                # Primitive UI components
│   ├── charts/            # Chart components (DonutChart, Sparkline)
│   ├── feed/              # Feed-related components
│   ├── portfolio/         # Portfolio components
│   └── markets/           # Markets components
├── constants/             # Design system (colors, typography, spacing)
├── stores/                # Zustand stores
├── services/              # API client
├── types/                 # TypeScript types
├── utils/                 # Utility functions
└── backend/               # Node.js backend
    ├── src/
    │   ├── routes/        # API routes
    │   ├── middleware/    # Express middleware
    │   ├── services/      # Business logic
    │   └── utils/         # Utility functions
    └── prisma/            # Database schema
```

## Getting Started

### Prerequisites
- Node.js >= 18
- npm or yarn
- PostgreSQL database

### Mobile App Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm start
```

4. Run on iOS/Android:
```bash
npm run ios
# or
npm run android
```

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your database credentials and secrets
```

4. Generate Prisma client:
```bash
npm run db:generate
```

5. Push database schema:
```bash
npm run db:push
```

6. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Auth
- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/login` - Login user
- `POST /v1/auth/refresh` - Refresh access token
- `POST /v1/auth/logout` - Logout user

### Portfolio
- `GET /v1/portfolio/summary` - Get portfolio summary
- `GET /v1/portfolio/holdings` - Get all holdings
- `GET /v1/portfolio/chart-data` - Get chart data
- `GET /v1/portfolio/trades` - Get trade history

### Broker
- `GET /v1/broker/status` - Get broker connection status
- `GET /v1/broker/zerodha/auth-url` - Get Zerodha OAuth URL
- `POST /v1/broker/sync` - Sync portfolio with broker

### Feed
- `GET /v1/feed` - Get feed posts
- `POST /v1/posts` - Create new post
- `GET /v1/posts/:id` - Get post details
- `POST /v1/posts/:id/like` - Like/unlike post
- `POST /v1/posts/:id/comments` - Add comment

### Users
- `GET /v1/users/:username` - Get user profile
- `GET /v1/users/:username/holdings` - Get user's public holdings
- `GET /v1/users/:username/posts` - Get user's posts
- `POST /v1/users/:username/follow` - Follow user
- `DELETE /v1/users/:username/follow` - Unfollow user

### Markets
- `GET /v1/markets/events` - Get upcoming events
- `GET /v1/markets/earnings-calendar` - Get earnings calendar
- `GET /v1/markets/featured-lists` - Get featured stock lists
- `GET /v1/markets/fear-greed` - Get fear & greed index


See `constants/colors.ts` for the full color palette.

## License

MIT
