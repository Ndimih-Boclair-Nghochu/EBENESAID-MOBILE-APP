import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_STORAGE_KEY = 'ebenesaid.auth';
export const USER_PROFILE_STORAGE_KEY = 'ebenesaid.userProfile';
export const QUERY_CACHE_STORAGE_KEY = 'ebenesaid.queryCache';
export const SESSION_COOKIE_NAME = 'eb_session';
const SESSION_COOKIE_STORAGE_KEY = `${SESSION_COOKIE_NAME}.value`;

export const zustandStorage = {
  getItem: (name: string) => AsyncStorage.getItem(name),
  setItem: (name: string, value: string) => AsyncStorage.setItem(name, value),
  removeItem: (name: string) => AsyncStorage.removeItem(name)
};

export const queryStorage = {
  getItem: (name: string) => AsyncStorage.getItem(name),
  setItem: (name: string, value: string) => AsyncStorage.setItem(name, value),
  removeItem: (name: string) => AsyncStorage.removeItem(name)
};

export const storage = {
  getString: (name: string) => AsyncStorage.getItem(name),
  getBoolean: async (name: string) => {
    const value = await AsyncStorage.getItem(name);

    if (value === null) {
      return null;
    }

    return value === 'true';
  },
  set: (name: string, value: string | number | boolean) =>
    AsyncStorage.setItem(name, String(value)),
  delete: (name: string) => AsyncStorage.removeItem(name)
};

export async function getSessionCookieHeader(): Promise<string | undefined> {
  const sessionCookie = await AsyncStorage.getItem(SESSION_COOKIE_STORAGE_KEY);

  if (!sessionCookie) {
    return undefined;
  }

  return `${SESSION_COOKIE_NAME}=${sessionCookie}`;
}

function getSetCookieHeaders(setCookieHeader: unknown): string[] {
  if (Array.isArray(setCookieHeader)) {
    return setCookieHeader.filter((header): header is string => typeof header === 'string');
  }

  return typeof setCookieHeader === 'string' ? [setCookieHeader] : [];
}

function parseSessionCookie(header: string): string | null {
  const parts = header.split(';');
  const cookiePart = parts[0];

  if (!cookiePart) {
    return null;
  }

  const attributes = parts.slice(1);
  const separatorIndex = cookiePart.indexOf('=');

  if (separatorIndex === -1) {
    return null;
  }

  const cookieName = cookiePart.slice(0, separatorIndex).trim();

  if (cookieName !== SESSION_COOKIE_NAME) {
    return null;
  }

  const isCleared = attributes.some((attribute) => {
    const normalized = attribute.trim().toLowerCase();
    return normalized === 'max-age=0' || normalized === 'expires=thu, 01 jan 1970 00:00:00 gmt';
  });

  if (isCleared) {
    return '';
  }

  return cookiePart.slice(separatorIndex + 1).trim();
}

export async function persistSetCookieHeader(setCookieHeader: unknown): Promise<void> {
  const headers = getSetCookieHeaders(setCookieHeader);

  for (const header of headers) {
    const value = parseSessionCookie(header);

    if (value === null) {
      continue;
    }

    if (!value) {
      await AsyncStorage.removeItem(SESSION_COOKIE_STORAGE_KEY);
      continue;
    }

    await AsyncStorage.setItem(SESSION_COOKIE_STORAGE_KEY, value);
  }
}

export async function clearSessionCookies(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_COOKIE_STORAGE_KEY);
}

export async function clearStorageCache(): Promise<void> {
  await AsyncStorage.multiRemove([AUTH_STORAGE_KEY, USER_PROFILE_STORAGE_KEY, QUERY_CACHE_STORAGE_KEY]);
}

