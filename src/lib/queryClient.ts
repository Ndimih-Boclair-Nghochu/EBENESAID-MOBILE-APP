import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import {
  QueryClient,
  dehydrate,
  hydrate
} from '@tanstack/react-query';

import { QUERY_CACHE_STORAGE_KEY, queryStorage } from './storage';

const queryCacheBuster = 'phase-1';
let persistenceInitialized = false;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 0
    }
  }
});

export const queryPersister = createAsyncStoragePersister({
  key: QUERY_CACHE_STORAGE_KEY,
  storage: queryStorage,
  throttleTime: 1000
});

function persistCurrentQueryState(): void {
  void queryPersister.persistClient({
    timestamp: Date.now(),
    buster: queryCacheBuster,
    clientState: dehydrate(queryClient)
  });
}

export async function initializeQueryPersistence(): Promise<void> {
  if (persistenceInitialized) {
    return;
  }

  persistenceInitialized = true;
  const restoredClient = await queryPersister.restoreClient();

  if (restoredClient?.buster === queryCacheBuster && restoredClient.clientState) {
    hydrate(queryClient, restoredClient.clientState);
  }

  queryClient.getQueryCache().subscribe(persistCurrentQueryState);
  queryClient.getMutationCache().subscribe(persistCurrentQueryState);
}

export async function clearQueryCache(): Promise<void> {
  queryClient.clear();
  await queryPersister.removeClient();
}

