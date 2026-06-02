import axios, { type InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';

import { toast } from '@/src/components/ui/Toast';
import { useAuthStore } from '@/src/stores/authStore';

import { API_URL } from './config';
import { getSessionCookieHeader, getSessionToken, persistSetCookieHeader } from './storage';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-EBENESAID-Client': 'mobile'
  }
});

function setHeader(config: InternalAxiosRequestConfig, name: string, value: string): void {
  if (typeof config.headers.set === 'function') {
    config.headers.set(name, value);
    return;
  }

  config.headers[name] = value;
}

function setCookieHeader(config: InternalAxiosRequestConfig, cookieHeader: string): void {
  setHeader(config, 'Cookie', cookieHeader);
}

function isAuthSessionCheck(url: unknown): boolean {
  return typeof url === 'string' && url.includes('/api/auth/me');
}

api.interceptors.request.use(async (config) => {
  const [cookieHeader, sessionToken] = await Promise.all([
    getSessionCookieHeader(),
    getSessionToken()
  ]);

  if (cookieHeader) {
    setCookieHeader(config, cookieHeader);
  }

  if (sessionToken) {
    setHeader(config, 'Authorization', `Bearer ${sessionToken}`);
    setHeader(config, 'X-EBENESAID-Session', sessionToken);
  }

  return config;
});

api.interceptors.response.use(
  async (response) => {
    await persistSetCookieHeader(response.headers['set-cookie'] ?? response.headers['Set-Cookie']);
    return response;
  },
  async (error) => {
    await persistSetCookieHeader(
      error.response?.headers?.['set-cookie'] ?? error.response?.headers?.['Set-Cookie']
    );

    if (error.response?.status === 401 && isAuthSessionCheck(error.config?.url)) {
      void useAuthStore.getState().clearAuth();
      router.replace('/(auth)/login');
    }

    if (error.response?.status === 429) {
      toast.info('Too many requests. Please wait.');
    }

    return Promise.reject(error);
  }
);

