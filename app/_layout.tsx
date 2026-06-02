import 'react-native-gesture-handler';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/src/components/ui/OfflineBanner';
import { ToastHost } from '@/src/components/ui/Toast';
import { colors } from '@/src/constants';
import { useOfflineStatus } from '@/src/hooks/useOfflineStatus';
import { initializeQueryPersistence, queryClient } from '@/src/lib/queryClient';

function AppChrome() {
  const isOffline = useOfflineStatus();

  return (
    <>
      <OfflineBanner visible={isOffline} />
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

