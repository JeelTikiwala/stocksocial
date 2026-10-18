import type { Server } from 'node:http';
import { WebSocketServer } from 'ws';
import type { LiveEngine } from './engine';

/** Mounts the live WebSocket at `/ws` on an existing HTTP server. */
export function attachLiveWebSocket(server: Server, engine: LiveEngine, path = '/ws'): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });
  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname !== path) return; // let other upgrade handlers (none) deal with it
    wss.handleUpgrade(req, socket, head, (ws) => engine.addClient(ws));
  });
  return wss;
}
