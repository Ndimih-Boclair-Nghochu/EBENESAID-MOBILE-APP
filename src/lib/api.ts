import axios, { type InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';

import { toast } from '@/src/components/ui/Toast';
import { useAuthStore } from '@/src/stores/authStore';

import { API_URL } from './config';
import { getSessionCookieHeader, persistSetCookieHeader } from './storage';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

function setCookieHeader(config: InternalAxiosRequestConfig, cookieHeader: string): void {
  if (typeof config.headers.set === 'function') {
    config.headers.set('Cookie', cookieHeader);
    return;
  }

  config.headers.Cookie = cookieHeader;
}

function isAuthSessionCheck(url: unknown): boolean {
  return typeof url === 'string' && url.includes('/api/auth/me');
}

api.interceptors.request.use(async (config) => {
  const cookieHeader = await getSessionCookieHeader();

  if (cookieHeader) {
    setCookieHeader(config, cookieHeader);
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

