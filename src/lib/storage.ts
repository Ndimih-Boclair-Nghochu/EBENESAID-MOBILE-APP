import CookieManager from '@react-native-cookies/cookies';
import { MMKV } from 'react-native-mmkv';

import { API_URL } from './config';

export const storage = new MMKV({
  id: 'ebenesaid-storage'
});

export const AUTH_STORAGE_KEY = 'ebenesaid.auth';
export const USER_PROFILE_STORAGE_KEY = 'ebenesaid.userProfile';
export const QUERY_CACHE_STORAGE_KEY = 'ebenesaid.queryCache';
export const SESSION_COOKIE_NAME = 'eb_session';

export const zustandStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name)
};

export const queryStorage = {
  getItem: async (name: string) => storage.getString(name) ?? null,
  setItem: async (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: async (name: string) => {
    storage.delete(name);
  }
};

export async function getSessionCookieHeader(): Promise<string | undefined> {
  const cookies = await CookieManager.get(API_URL);
  const sessionCookie = cookies[SESSION_COOKIE_NAME];

  if (!sessionCookie?.value) {
    return undefined;
  }

  return `${SESSION_COOKIE_NAME}=${sessionCookie.value}`;
}

export async function persistSetCookieHeader(setCookieHeader: unknown): Promise<void> {
  if (!setCookieHeader) {
    return;
  }

  const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

  await Promise.all(
    headers
      .filter((header): header is string => typeof header === 'string' && header.length > 0)
      .map((header) => CookieManager.setFromResponse(API_URL, header))
  );
}

export async function clearSessionCookies(): Promise<void> {
  await Promise.all([
    CookieManager.clearByName(API_URL, SESSION_COOKIE_NAME).catch(() => false),
    CookieManager.clearByName(API_URL, SESSION_COOKIE_NAME, true).catch(() => false)
  ]);
}

export function clearMMKVCache(): void {
  storage.delete(AUTH_STORAGE_KEY);
  storage.delete(USER_PROFILE_STORAGE_KEY);
  storage.delete(QUERY_CACHE_STORAGE_KEY);
}

