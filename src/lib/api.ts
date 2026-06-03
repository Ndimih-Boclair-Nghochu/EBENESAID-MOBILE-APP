import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import { toast } from '@/src/components/ui/Toast';
import { useAuthStore } from '@/src/stores/authStore';
import type { SafeUser } from '@/src/types';

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

function emptyStudentOverview(user: SafeUser | null) {
  return {
    firstName: user?.firstName ?? 'there',
    completionPercent: 0,
    nextSteps: [],
    housingStatus: null,
    jobsCount: 0,
    communityCirclesCount: 0,
    recentActivity: [],
    university: user?.university ?? '',
    countryOfOrigin: user?.countryOfOrigin ?? '',
    arrivalDate: null
  };
}

function getEndpointPath(url: unknown): string {
  if (typeof url !== 'string') {
    return '';
  }

  try {
    return new URL(url, API_URL).pathname;
  } catch {
    return url.split('?')[0] ?? '';
  }
}

function getAccountFallback(path: string, user: SafeUser | null): unknown | undefined {
  const fallbacks: Record<string, unknown> = {
    '/api/student/overview': emptyStudentOverview(user),
    '/api/student/profile': { profile: user ?? {} },
    '/api/student/housing': { listings: [], favorites: [], activeRequests: [] },
    '/api/jobs': { jobs: [], applications: [] },
    '/api/food': { menu: [], orders: [] },
    '/api/student/documents': { documents: [] },
    '/api/student/programs': { programs: [], applications: [] },
    '/api/student/community': { circles: [], events: [], buddyMatches: [] },
    '/api/student/messages': { conversations: [] },
    '/api/student/arrival': { booking: null, directory: [] },
    '/api/student/support': { messages: [], status: 'open' },
    '/api/agent/summary': { recentActivity: [] },
    '/api/agent/profile': {},
    '/api/agent/bookings': { bookings: [] },
    '/api/agent/listings': { listings: [] },
    '/api/agent/verification': { documents: [], verification: [] },
    '/api/supplier/summary': { recentActivity: [] },
    '/api/supplier/profile': {},
    '/api/supplier/enquiries': { enquiries: [] },
    '/api/supplier/menu': { menu: [], items: [] },
    '/api/supplier/orders': { orders: [] },
    '/api/supplier/payouts': { payouts: [], transactions: [] },
    '/api/job-partner/summary': { recentActivity: [] },
    '/api/job-partner/profile': {},
    '/api/job-partner/jobs': { jobs: [] },
    '/api/job-partner/applicants': { applicants: [] },
    '/api/transport/summary': { recentActivity: [] },
    '/api/transport/profile': {},
    '/api/transport/services': { services: [] },
    '/api/transport/pickups': { pickups: [], bookings: [] },
    '/api/transport/fleet': { vehicles: [], fleet: [] },
    '/api/transport/revenue': { revenue: 0, transactions: [] },
    '/api/university/summary': { students: [], programs: [], applications: [], recentActivity: [] },
    '/api/university/profile': {},
    '/api/university/programs': { programs: [] },
    '/api/university/applications': { applications: [] },
    '/api/university/chat': { conversations: [], messages: [] },
    '/api/staff/summary': { metrics: {}, workQueues: [] },
    '/api/admin/summary': {
      overview: {},
      modules: [],
      enrollmentData: [],
      topUniversities: [],
      recentActivity: [],
      finance: {},
      statistics: {},
      institutions: {}
    },
    '/api/admin/users': { users: [] },
    '/api/admin/verification': { documents: [], verification: [] },
    '/api/admin/content': { content: [], pages: [] },
    '/api/admin/finance': { totals: {}, studentPayments: [], partnerTransactions: [] },
    '/api/admin/commissions': { commissions: [], overrides: [] },
    '/api/admin/payments': { payments: [] },
    '/api/admin/pricing': { pricing: {} },
    '/api/admin/institutions': { institutions: [] },
    '/api/admin/employers': { employers: [] },
    '/api/admin/reports': { reports: [] },
    '/api/investor/summary': { growthMetrics: [], growth: [], metrics: [] }
  };

  if (path.startsWith('/api/admin/users/')) {
    return {};
  }

  return fallbacks[path];
}

function buildFallbackResponse(error: unknown): AxiosResponse | null {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  const method = error.config?.method?.toLowerCase() ?? 'get';

  if (method !== 'get') {
    return null;
  }

  const status = error.response?.status;

  if (status === 401 || status === 429) {
    return null;
  }

  const path = getEndpointPath(error.config?.url);
  const fallback = getAccountFallback(path, useAuthStore.getState().user);

  if (fallback === undefined) {
    return null;
  }

  return {
    data: fallback,
    status: 200,
    statusText: 'OK',
    headers: error.response?.headers ?? {},
    config: error.config!,
    request: error.request
  };
}

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

    if (error.response?.status === 429) {
      toast.info('Too many requests. Please wait.');
    }

    const fallbackResponse = buildFallbackResponse(error);

    if (fallbackResponse) {
      return fallbackResponse;
    }

    return Promise.reject(error);
  }
);

