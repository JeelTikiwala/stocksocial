# Delta — NSE F&O analytics

Options and futures analytics for the Indian market (NSE), built with React Native + Expo and an
Express/Prisma backend. Four screener zones — **Scalper**, **Intraday**, **Seller**, **Index** —
plus a sector heatmap, options chain, IV and straddle charts, a SPAN-style margin estimator and a
strategy builder.

**Current phase: B — live data.** Phase A (EOD product on free NSE data) is complete; Phase B adds a
live engine with pluggable providers (simulated for development, Zerodha Kite for your own account),
live Premium Spike / Volume Spike / Unusual Options, a Watchlist · Chart · Screeners · News · Profile
IA, and a glass UI. See [`docs/DELTA_PORT_PLAN_INDIA.md`](docs/DELTA_PORT_PLAN_INDIA.md),
[`docs/PHASE_A_PROGRESS.md`](docs/PHASE_A_PROGRESS.md) and [`docs/PHASE_B_PROGRESS.md`](docs/PHASE_B_PROGRESS.md).

## How it works

- **Shared engine** (`backend/src/shared/`): domain types, Black–Scholes IV/greeks, payoff and
  margin math, the screener engine (18 declarative specs), sector/pulse analytics and a
  deterministic mock-market generator. It is imported by the backend *and* bundled into the app, so
  mock mode on-device and the API produce identical results.
- **Mobile/web app** (Expo Router) reads through one `DataSource` interface with two
  implementations: `mock` (on-device, no network — the default) and `api` (Express backend).
  Switch in **Settings → Market data**.
- **Backend** serves `/v1/market`, `/v1/screeners`, `/v1/options`, `/v1/tools`, `/v1/news` from either
  the in-memory mock (`DATA_STORE=memory`) or Postgres filled by the NSE bhavcopy ingestion, and
  streams live quotes/screeners over `ws://…/ws` from a pluggable provider (`LIVE_PROVIDER=simulated|kite`).
- **Live mode** in the app: mock data source → on-device simulated session; API source → backend WebSocket.

## Run the app (mock data, no backend needed)

```bash
yarn install
yarn web        # http://localhost:8081
yarn ios        # iOS Simulator (Expo Go)
```

## Run the backend

```bash
cd backend && npm install
cp .env.example .env
npm run dev                 # DATA_STORE=memory → mock market on http://localhost:3000
npm test                    # 39 tests incl. parsers against a real NSE bhavcopy sample
```

With Postgres (`DATABASE_URL` set, `DATA_STORE=prisma`):

```bash
npm run db:push
npm run ingest -- 2026-10-16            # downloads NSE F&O bhavcopy + indices file, computes IV/straddles
npm run ingest -- 2026-10-16 --dry-run  # fetch + derive only, prints a summary
```

Then in the app choose **API server** in Settings (set `EXPO_PUBLIC_API_URL` for devices).

## Live data with your Kite account

```bash
# backend/.env
LIVE_PROVIDER=kite
KITE_API_KEY=...      KITE_API_SECRET=...
KITE_REDIRECT_URL=http://localhost:3000/v1/live/kite/callback   # must match your Kite Connect app
```
Start the backend, set the app's data source to **API server** (Profile), then **Connect Kite**.
Tokens expire ~06:00 IST, so log in once per trading day. Kite's terms allow its data for your own use
only; the provider interface is where Upstox/Fyers (per-user tokens) will be added for other users.

## Data & licensing posture

Phase A uses only **free, public NSE end-of-day reports** (UDiFF F&O bhavcopy, indices close file).
No broker API or vendor feed data is redistributed. Live data arrives in later phases via each
user's own broker login (Phase B) and a licensed feed (Phase C). The app displays and filters
published data; it does not issue recommendations.

## Project structure

```
app/                      Expo Router screens
  (tabs)/                 Watchlist · Chart · Screeners · News · Profile (+ hidden Portfolio)
  screener/[id].tsx       Generic results table for table-style screeners
  tools/                  Market Pulse, Heatmap, Sector Scope, IV Chart, Straddle, Strike Open,
                          Options Chain, Strategy Builder, Margin Calculator
  stock/[ticker].tsx      Underlying detail
components/screener/      Screener UI kit (pickers, tables, tiles, banners)
components/charts/        LineChart · MirrorBars (OI by strike) · Treemap · PayoffChart
components/ui/Glass.tsx   GlassView / ScreenBackground (glassmorphism); navigation/FloatingTabBar
services/data/            DataSource interface, mock + api implementations
services/live/            Live clients (on-device simulator, backend WebSocket) + manager
hooks/useMarketData.ts    react-query hooks · hooks/useLive.ts live quotes/screeners
backend/src/shared/       Shared engine (see above)
backend/src/ingest/       NSE bhavcopy / indices fetch + parse + derive
backend/src/live/         LiveEngine, providers (simulated, Kite), Kite session, WebSocket server
backend/src/routes/       Express routes
backend/test/fixtures/    Real NSE samples (2026-10-16) used by tests
docs/                     Plan, progress log, archived Americas assessment
```
