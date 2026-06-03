import axios from 'axios';
import { router } from 'expo-router';

import { api } from '@/src/lib/api';
import { clearQueryCache } from '@/src/lib/queryClient';
import { getPortalRoute } from '@/src/lib/roleRoutes';
import { getSessionToken, persistSessionFromAuthPayload } from '@/src/lib/storage';
import { useAuthStore } from '@/src/stores/authStore';
import type {
  AuthLoginResponse,
  AuthMeResponse,
  RegisterPayload,
  ResetPasswordPayload,
  SafeUser
} from '@/src/types';

function extractUser(data: AuthMeResponse | { user?: SafeUser } | SafeUser): SafeUser {
  const user = extractOptionalUser(data);

  if (user) {
    return user;
  }

  return data as SafeUser;
}

function isSafeUser(value: unknown): value is SafeUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value &&
    'userType' in value
  );
}

function extractOptionalUser(data: unknown): SafeUser | null {
  if (isSafeUser(data)) {
    return data;
  }

  if (typeof data === 'object' && data !== null && 'user' in data) {
    const user = (data as { user?: unknown }).user;
    return isSafeUser(user) ? user : null;
  }

  return null;
}

export function getHttpStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export function getApiMessage(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string } | undefined;
    return data?.error ?? data?.message;
  }

  return error instanceof Error ? error.message : undefined;
}

export function useAuth() {
  const auth = useAuthStore();

  const verifyMobileSession = async (): Promise<SafeUser> => {
    const sessionToken = await getSessionToken();

    if (!sessionToken) {
      throw new Error('The server did not return a mobile session. Please sign in again.');
    }

    const response = await api.get<AuthMeResponse | SafeUser>('/api/auth/me');
    return extractUser(response.data);
  };

  const login = async (email: string, password: string): Promise<AuthLoginResponse> => {
    auth.setLoading(true);

    try {
      const response = await api.post<AuthLoginResponse>('/api/auth/login', {
        email,
        password
      });

      await persistSessionFromAuthPayload(response.data);
      await clearQueryCache();

      let user: SafeUser;

      try {
        user = await verifyMobileSession();
      } catch (verificationError) {
        await auth.clearAuth();

        if (axios.isAxiosError(verificationError) && verificationError.response?.status === 401) {
          throw new Error('Signed in, but the mobile session could not be verified. Please try again.');
        }

        throw verificationError;
      }

      auth.setUser(user);
      router.replace(getPortalRoute(user.userType));

      return {
        ...response.data,
        user
      };
    } finally {
      auth.setLoading(false);
    }
  };

  const probeSession = async (): Promise<SafeUser> => {
    const response = await api.get<AuthMeResponse | SafeUser>('/api/auth/me');
    const user = extractUser(response.data);
    auth.setUser(user);
    return user;
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      await auth.clearAuth();
      router.replace('/(auth)/login');
    }
  };

  const register = async (payload: RegisterPayload): Promise<SafeUser | null> => {
    const response = await api.post<AuthLoginResponse | AuthMeResponse | SafeUser | { message?: string }>(
      '/api/auth/register',
      payload
    );
    const responseUser = extractOptionalUser(response.data);

    if (!responseUser) {
      return null;
    }

    await persistSessionFromAuthPayload(response.data);
    await clearQueryCache();

    try {
      const verifiedUser = await verifyMobileSession();
      auth.setUser(verifiedUser);
      router.replace(getPortalRoute(verifiedUser.userType));
      return verifiedUser;
    } catch {
      await auth.clearAuth();
      return null;
    }
  };

  const forgotPassword = (email: string) =>
    api.post('/api/auth/forgot-password', {
      email
    });

  const resetPassword = (payload: ResetPasswordPayload) =>
    api.post('/api/auth/reset-password', payload);

  return {
    ...auth,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    probeSession
  };
}

