import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

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

async function getSessionCookieValue(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_COOKIE_STORAGE_KEY);
}

export async function getSessionToken(): Promise<string | null> {
  return getSessionCookieValue();
}

async function setSessionCookieValue(value: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_COOKIE_STORAGE_KEY, value);
}

async function deleteSessionCookieValue(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_COOKIE_STORAGE_KEY);
}

export async function getSessionCookieHeader(): Promise<string | undefined> {
  const sessionCookie = await getSessionCookieValue();

  if (!sessionCookie) {
    return undefined;
  }

  return `${SESSION_COOKIE_NAME}=${sessionCookie}`;
}

function splitCombinedSetCookieHeader(header: string): string[] {
  return header
    .split(/,\s*(?=[A-Za-z0-9_.-]+=)/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getSetCookieHeaders(setCookieHeader: unknown): string[] {
  if (Array.isArray(setCookieHeader)) {
    return setCookieHeader
      .filter((header): header is string => typeof header === 'string')
      .flatMap(splitCombinedSetCookieHeader);
  }

  return typeof setCookieHeader === 'string' ? splitCombinedSetCookieHeader(setCookieHeader) : [];
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
      await deleteSessionCookieValue();
      continue;
    }

    await setSessionCookieValue(value);
  }
}

function getSessionCandidateFromRecord(record: Record<string, unknown>): unknown {
  const nestedSession = record.session;

  if (typeof nestedSession === 'object' && nestedSession !== null) {
    const sessionRecord = nestedSession as Record<string, unknown>;
    const nestedCandidate =
      sessionRecord.token ??
      sessionRecord.sessionToken ??
      sessionRecord.session_token ??
      sessionRecord.value;

    if (nestedCandidate) {
      return nestedCandidate;
    }
  }

  const nestedData = record.data;
  if (typeof nestedData === 'object' && nestedData !== null) {
    const nestedCandidate = getSessionCandidateFromRecord(nestedData as Record<string, unknown>);

    if (nestedCandidate) {
      return nestedCandidate;
    }
  }

  return (
    record[SESSION_COOKIE_NAME] ??
    record.sessionToken ??
    record.session_token ??
    record.sessionCookie ??
    record.session_cookie ??
    record.token ??
    record.accessToken ??
    record.access_token ??
    record.authToken ??
    record.auth_token
  );
}

function getSessionCandidateFromPayload(payload: unknown): unknown {
  if (typeof payload !== 'object' || payload === null) {
    return undefined;
  }

  return getSessionCandidateFromRecord(payload as Record<string, unknown>);
}

function normalizeSessionCandidate(candidate: string): string {
  const trimmed = candidate.trim();
  const parsedCookieValue = parseSessionCookie(trimmed);

  if (parsedCookieValue !== null) {
    return parsedCookieValue;
  }

  const bearerMatch = /^bearer\s+(.+)$/i.exec(trimmed);
  return bearerMatch?.[1]?.trim() ?? trimmed;
}

export async function persistSessionFromAuthPayload(payload: unknown): Promise<string | null> {
  const candidate = getSessionCandidateFromPayload(payload);

  if (typeof candidate !== 'string' || candidate.trim().length === 0) {
    return null;
  }

  const value = normalizeSessionCandidate(candidate);

  if (!value) {
    await deleteSessionCookieValue();
    return null;
  }

  await setSessionCookieValue(value);
  return value;
}

export async function clearSessionCookies(): Promise<void> {
  await deleteSessionCookieValue();
}

export async function clearStorageCache(): Promise<void> {
  await AsyncStorage.multiRemove([AUTH_STORAGE_KEY, USER_PROFILE_STORAGE_KEY, QUERY_CACHE_STORAGE_KEY]);
}

