/** Live-server (backend) control endpoints: provider switch and Kite login for the operator's own account. */
import { apiClient } from '@/services/api';
import type { LiveStatus } from '@/types';

export interface LiveServerStatus extends LiveStatus {
  clients: number;
  kite: { configured: boolean; redirectUrl: string | null; loggedIn: boolean; userId?: string; userName?: string; loginTime?: string; validUntil?: string; valid?: boolean };
}

export const kiteApi = {
  status: async () => (await apiClient.get('/live/status')).data.data as LiveServerStatus,
  loginUrl: async () => (await apiClient.get('/live/kite/login-url')).data.data as { configured: boolean; url: string | null; redirectUrl: string | null },
  submitRequestToken: async (requestToken: string) => (await apiClient.post('/live/kite/session', { requestToken })).data.data,
  logout: async () => (await apiClient.delete('/live/kite/session')).data.data as LiveStatus,
  setProvider: async (kind: 'simulated' | 'kite' | 'none') => (await apiClient.post('/live/provider', { kind })).data.data as LiveStatus,
};
