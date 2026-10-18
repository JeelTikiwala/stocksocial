import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { prisma } from './db';
import http from 'node:http';
import { getDataStore } from './data/store';
import { getLiveEngine } from './live/engine';
import { attachLiveWebSocket } from './live/wsServer';

const PORT = Number(process.env.PORT || 3000);

async function main() {
  const store = getDataStore();
  if (store.kind === 'prisma') {
    await prisma.$connect();
    console.log('Connected to database');
  } else {
    console.log('DATA_STORE=memory — serving the deterministic mock market; account routes need DATABASE_URL');
  }
  const status = await store.getStatus();
  console.log(`Market data: ${status.source} · as of ${status.tradeDate} · ${status.contractCount} contracts`);

  const app = createApp();
  const server = http.createServer(app);
  const engine = getLiveEngine(() => store.getDataset(), { log: (m) => console.log(m) });
  attachLiveWebSocket(server, engine);
  await engine.start();
  const live = engine.getStatus();
  console.log(`Live feed: ${live.provider}${live.note ? ` — ${live.note}` : ''} (ws://localhost:${PORT}/ws)`);
  server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };
