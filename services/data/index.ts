import { useAppSettingsStore } from '@/stores/appSettingsStore';
import { apiSource } from './apiSource';
import { mockSource } from './mockSource';
import type { DataSource, DataSourceKind } from './types';

export type { DataSource, DataSourceKind } from './types';
export { NotFoundError } from './types';

export const DEFAULT_DATA_SOURCE: DataSourceKind = process.env.EXPO_PUBLIC_DATA_SOURCE === 'api' ? 'api' : 'mock';

/** Active source follows the persisted setting; defaults to the env var, which defaults to mock. */
export function getDataSource(): DataSource {
  const kind = useAppSettingsStore.getState().dataSource ?? DEFAULT_DATA_SOURCE;
  return kind === 'api' ? apiSource : mockSource;
}
