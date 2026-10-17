# StockSocial

StockSocial is a cross-platform social investing app for Indian-market communities. It combines a social feed, stock discovery, watchlists, portfolio views, and account privacy controls in an Expo app backed by an Express and PostgreSQL API.

> [!IMPORTANT]
> This project is under active development. Market-data requests may fall back to sample data, the Zerodha connection and sync flow is currently a prototype that uses mock holdings, and the optional trading sidecar referenced by the UI is not included in this repository. Do not use it to place or manage live trades.

## Features

- Social posts, comments, likes, follows, profiles, and activity feeds
- NSE/BSE stock search, quotes, company details, charts, and news
- Portfolios, holdings, trades, and public/private watchlists
- JWT-based authentication and user privacy settings
- iOS, Android, and web clients through Expo
- Optional Zerodha and external trading-service integration points

## Tech stack

| Area | Technology |
| --- | --- |
| App | React Native, Expo 55, Expo Router, TypeScript |
| Client state | Zustand, TanStack Query |
| API | Node.js, Express, TypeScript |
| Data | PostgreSQL, Prisma |
| Authentication | JWT, bcrypt |

## Repository layout

```text
stocksocial/
├── app/                 # Expo Router screens
├── components/          # Reusable UI and feature components
├── constants/           # Theme and design tokens
├── services/            # API clients
├── stores/              # Zustand stores
├── types/               # Shared TypeScript types
├── utils/               # Formatting and utility functions
└── backend/
    ├── prisma/          # PostgreSQL schema
    └── src/             # Express API, routes, middleware, and services
```

## Prerequisites

- Node.js 20.19.4 or newer
- npm
- PostgreSQL
- Optional: Expo Go, Android Studio, or Xcode for mobile testing

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/stocksocial.git
cd stocksocial
npm ci
npm --prefix backend ci
```

Replace `YOUR_USERNAME` with the GitHub account or organization that owns your fork.

### 2. Configure the app

```bash
cp .env.example .env
```

The default API URL works for the web app and iOS Simulator. Choose the URL for your target device:

| Target | `EXPO_PUBLIC_API_URL` |
| --- | --- |
| Web or iOS Simulator | `http://localhost:3000/v1` |
| Android Emulator | `http://10.0.2.2:3000/v1` |
| Physical device | `http://YOUR_COMPUTER_LAN_IP:3000/v1` |

For a physical device, keep the computer and phone on the same network and replace `YOUR_COMPUTER_LAN_IP` with an address such as `192.168.1.25`.

### 3. Configure the API

```bash
cp backend/.env.example backend/.env
```

Create two independent JWT secrets and one 32-byte encryption key, then paste them into `backend/.env`:

```bash
openssl rand -base64 32
openssl rand -base64 32
openssl rand -hex 32
```

Set `DATABASE_URL` to a PostgreSQL database you control. For a local PostgreSQL installation, you can create the example database with:

```bash
createdb stocksocial
```

Then initialize Prisma:

```bash
npm --prefix backend run db:generate
npm --prefix backend run db:push
```

`db:push` is intended for local development. Use reviewed Prisma migrations for production databases.

### 4. Start the API

In the first terminal:

```bash
npm --prefix backend run dev
```

The API connects to PostgreSQL before listening on port 3000. Once it is running, verify it with:

```bash
curl http://localhost:3000/health
```

### 5. Start the app

In a second terminal:

```bash
npm start
```

Scan the QR code with Expo Go, or press `i`, `a`, or `w` for iOS, Android, or web. You can also launch a target directly:

```bash
npm run ios
npm run android
npm run web
```

## Environment variables

### App (`.env`)

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Base URL for the Express API, including `/v1` |
| `EXPO_PUBLIC_TRADING_API_URL` | Optional external trading sidecar URL; that service is not included here |

Variables prefixed with `EXPO_PUBLIC_` are bundled into the client. Never put secrets in them.

### API (`backend/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Access-token signing secret |
| `JWT_REFRESH_SECRET` | Yes | Refresh-token signing secret |
| `ENCRYPTION_KEY` | Yes | Stable 64-character hex key for encrypted broker tokens |
| `PORT` | No | API port; defaults to `3000` |
| `NODE_ENV` | No | `development` or `production` |
| `ALPHA_VANTAGE_API_KEY` | No | Enables Alpha Vantage-backed market features |
| `ZERODHA_API_KEY` | No | Prototype Zerodha integration |
| `ZERODHA_API_SECRET` | No | Reserved for completing the Zerodha token exchange |
| `ZERODHA_REDIRECT_URL` | No | Zerodha callback URL |

## Useful commands

### App

| Command | Description |
| --- | --- |
| `npm start` | Start the Expo development server |
| `npm run ios` | Open the iOS target |
| `npm run android` | Open the Android target |
| `npm run web` | Open the web target |
| `npm run typecheck` | Run the TypeScript checker |
| `npm run lint` | Run ESLint |

### API

| Command | Description |
| --- | --- |
| `npm --prefix backend run dev` | Start the API with automatic reload |
| `npm --prefix backend run build` | Compile the API into `backend/dist` |
| `npm --prefix backend start` | Run the compiled API |
| `npm --prefix backend run db:generate` | Generate the Prisma client |
| `npm --prefix backend run db:push` | Sync the schema to a development database |
| `npm --prefix backend run db:migrate -- --name NAME` | Create a development migration |
| `npm --prefix backend run db:studio` | Open Prisma Studio |

## Validation

Run the current static checks before opening a pull request:

```bash
npm run typecheck
npm run lint
npm --prefix backend run build
```

An automated test suite is not configured yet.

## Production notes

- Serve the API over HTTPS and restrict CORS to trusted origins.
- Use strong, unique production secrets and a stable `ENCRYPTION_KEY`.
- Commit and deploy reviewed Prisma migrations instead of running `db:push` against production.
- Configure a production `EXPO_PUBLIC_API_URL` before building the app.
- EAS builds are not configured in this repository yet. Run `npx eas-cli build:configure` before creating store builds.

## Security and data notes

- `.env` files, generated builds, and dependencies are excluded from Git. Check `git status` before every commit.
- Quote/news providers are third-party services and may be delayed, unavailable, or rate-limited.
- This software is for development and educational use and is not financial advice.

## License

Released under the [MIT License](LICENSE).
