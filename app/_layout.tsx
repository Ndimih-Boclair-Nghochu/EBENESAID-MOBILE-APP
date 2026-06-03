import 'react-native-gesture-handler';

import { QueryClientProvider } from '@tanstack/react-query';
import { router, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NotificationPromptModal } from '@/src/components/NotificationPromptModal';
import { OfflineBanner } from '@/src/components/ui/OfflineBanner';
import { ToastHost } from '@/src/components/ui/Toast';
import { colors } from '@/src/constants';
import { useOfflineStatus } from '@/src/hooks/useOfflineStatus';
import { I18nProvider } from '@/src/lib/i18n';
import {
  setupNotifications,
  setupNotificationListeners
} from '@/src/lib/notifications';
import { initializeQueryPersistence, queryClient } from '@/src/lib/queryClient';
import { getSessionToken } from '@/src/lib/storage';
import { useAuthStore } from '@/src/stores/authStore';

const protectedRouteGroups = new Set([
  '(student)',
  '(agent)',
  '(supplier)',
  '(job-partner)',
  '(transport)',
  '(university)',
  '(investor)',
  '(staff)',
  '(admin)'
]);

function AppChrome() {
  const isOffline = useOfflineStatus();
  const isAuthenticated = useAuthStore((store) => store.isAuthenticated);
  const hasHydrated = useAuthStore((store) => store.hasHydrated);
  const user = useAuthStore((store) => store.user);
  const segments = useSegments();
  const routeGroup = segments[0];
  const isProtectedRoute = protectedRouteGroups.has(routeGroup ?? '');

  useEffect(() => {
    const cleanup = setupNotificationListeners();
    return cleanup;
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      void setupNotifications(user);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!hasHydrated || !isProtectedRoute) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace('/landing');
    }
  }, [hasHydrated, isAuthenticated, isProtectedRoute, user]);

  useEffect(() => {
    if (!hasHydrated || !isProtectedRoute || !isAuthenticated || !user) {
      return;
    }

    let isMounted = true;

    void getSessionToken().then(async (sessionToken) => {
      if (!isMounted || sessionToken) {
        return;
      }

      await useAuthStore.getState().clearAuth();
      router.replace('/landing');
    });

    return () => {
      isMounted = false;
    };
  }, [hasHydrated, isAuthenticated, isProtectedRoute, user]);

  return (
    <>
      <OfflineBanner visible={isOffline} />
      <NotificationPromptModal user={user} />
      <ToastHost />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void initializeQueryPersistence();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <I18nProvider>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="dark" backgroundColor={colors.background} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: colors.background
                }
              }}
            />
            <AppChrome />
          </QueryClientProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1
  }
});
