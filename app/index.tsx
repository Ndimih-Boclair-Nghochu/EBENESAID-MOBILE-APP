import axios from 'axios';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '@/src/components/ui/ErrorState';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import { colors, spacing, typography } from '@/src/constants';
import { api } from '@/src/lib/api';
import { getPortalRoute } from '@/src/lib/roleRoutes';
import { useAuthStore } from '@/src/stores/authStore';
import type { AuthMeResponse, SafeUser } from '@/src/types';

const brandLogo = require('../assets/ebenesaid-logo.jpeg');

type BootstrapState = 'loading' | 'server-error';

function extractUser(data: AuthMeResponse | SafeUser): SafeUser {
  if ('user' in data) {
    return data.user;
  }

  return data;
}

export default function BootstrapScreen() {
  const [state, setState] = useState<BootstrapState>('loading');
  const setUser = useAuthStore((store) => store.setUser);

  const bootstrap = useCallback(async () => {
    setState('loading');

    try {
      await api.get('/api/health');
    } catch {
      setState('server-error');
      return;
    }

    try {
      const response = await api.get<AuthMeResponse | SafeUser>('/api/auth/me');
      const user = extractUser(response.data);
      setUser(user);
      router.replace(getPortalRoute(user.userType));
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.replace('/(auth)/login');
        return;
      }

      setState('server-error');
    }
  }, [setUser]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  if (state === 'server-error') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Cannot connect to server"
          message="Check your connection and try again."
          onRetry={bootstrap}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.loading}>
        <Image source={brandLogo} style={styles.logo} resizeMode="cover" />
        <Text style={styles.brand}>EBENESAID</Text>
        <LoadingSpinner />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.xl
  },
  brand: {
    ...typography.headingLarge
  },
  logo: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 52,
    borderWidth: 1,
    height: 104,
    width: 104
  }
});

