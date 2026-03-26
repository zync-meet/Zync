import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

/**
 * Persister for TanStack Query using localStorage.
 * This works in both Web and Electron environments.
 */
export const queryPersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'ZYNC_QUERY_CACHE',
});

/**
 * Clears the query cache from localStorage.
 * Should be called on logout.
 */
export const clearQueryCache = () => {
  window.localStorage.removeItem('ZYNC_QUERY_CACHE');
};
