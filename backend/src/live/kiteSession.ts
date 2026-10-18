/**
 * Kite Connect login state for a single (personal) account.
 *
 * Kite's terms allow using its market data for your own consumption; they do not permit
 * displaying it to other users of a third-party app. This module therefore manages ONE
 * session for the operator's own account. Tokens are stored encrypted on disk so the
 * server survives restarts within the trading day (Kite access tokens expire ~06:00 IST).
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { KiteConnect } from 'kiteconnect';
import { encrypt, decrypt } from '../utils/encryption';

export interface KiteConfig {
  apiKey: string;
  apiSecret: string;
  redirectUrl: string;
}

export interface KiteSession {
  accessToken: string;
  userId: string;
  userName: string;
  loginTime: string;   // ISO
  validUntil: string;  // ISO — next 06:00 IST
}

const DATA_DIR = path.resolve(__dirname, '../../.data');
const SESSION_FILE = path.join(DATA_DIR, 'kite-session.enc');

export function getKiteConfig(): KiteConfig | null {
  const apiKey = process.env.KITE_API_KEY || process.env.ZERODHA_API_KEY;
  const apiSecret = process.env.KITE_API_SECRET || process.env.ZERODHA_API_SECRET;
  if (!apiKey || !apiSecret) return null;
  const redirectUrl = process.env.KITE_REDIRECT_URL || `http://localhost:${process.env.PORT || 3000}/v1/live/kite/callback`;
  return { apiKey, apiSecret, redirectUrl };
}

export function kiteLoginUrl(cfg: KiteConfig): string {
  return `https://kite.zerodha.com/connect/login?v=3&api_key=${encodeURIComponent(cfg.apiKey)}`;
}

/** Kite tokens die at ~06:00 IST the next morning. */
export function nextKiteExpiry(from = new Date()): Date {
  const ist = new Date(from.getTime() + 330 * 60_000);
  const next = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate(), 6 - 5, 30 - 30, 0)); // 06:00 IST = 00:30 UTC
  if (next.getTime() <= from.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

let cached: KiteSession | null | undefined;

export async function loadKiteSession(): Promise<KiteSession | null> {
  if (cached !== undefined) return cached;
  try {
    const raw = await fs.readFile(SESSION_FILE, 'utf8');
    const s = JSON.parse(decrypt(raw.trim())) as KiteSession;
    cached = s;
  } catch {
    cached = null;
  }
  return cached;
}

export function isSessionValid(s: KiteSession | null, now = new Date()): boolean {
  return !!s && new Date(s.validUntil).getTime() > now.getTime();
}

export async function saveKiteSession(s: KiteSession): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SESSION_FILE, encrypt(JSON.stringify(s)), { mode: 0o600 });
  cached = s;
}

export async function clearKiteSession(): Promise<void> {
  cached = null;
  await fs.rm(SESSION_FILE, { force: true });
}

export async function exchangeRequestToken(cfg: KiteConfig, requestToken: string): Promise<KiteSession> {
  const kc = new KiteConnect({ api_key: cfg.apiKey });
  const data = await kc.generateSession(requestToken, cfg.apiSecret);
  const session: KiteSession = {
    accessToken: data.access_token,
    userId: data.user_id,
    userName: data.user_name,
    loginTime: new Date().toISOString(),
    validUntil: nextKiteExpiry().toISOString(),
  };
  await saveKiteSession(session);
  return session;
}

/** Public view (never includes the token). */
export function describeSession(s: KiteSession | null) {
  if (!s) return { loggedIn: false as const };
  return { loggedIn: true as const, userId: s.userId, userName: s.userName, loginTime: s.loginTime, validUntil: s.validUntil, valid: isSessionValid(s) };
}
