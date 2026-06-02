import 'dotenv/config';

import type { ConfigContext, ExpoConfig } from 'expo/config';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://ebenesaid.com';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'EBENESAID',
  slug: 'ebenesaid-mobile-app',
  scheme: 'ebenesaid',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  assetBundlePatterns: ['**/*'],
  ios: {
    ...config.ios,
    supportsTablet: true,
    bundleIdentifier: 'com.ebenesaid.mobile'
  },
  android: {
    ...config.android,
    package: 'com.ebenesaid.mobile',
    adaptiveIcon: {
      backgroundColor: '#FFFFFF'
    }
  },
  plugins: ['expo-router', 'expo-secure-store'],
  extra: {
    ...config.extra,
    apiUrl
  }
});

