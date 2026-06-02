import 'dotenv/config';

import type { ConfigContext, ExpoConfig } from 'expo/config';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://ebenesaid.com';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'EBENESAID',
  slug: 'ebenesaid',
  scheme: 'ebenesaid',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    backgroundColor: '#FFFFFF',
    resizeMode: 'contain'
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    ...config.ios,
    supportsTablet: false,
    bundleIdentifier: 'com.ebenesaid.app',
    infoPlist: {
      ...config.ios?.infoPlist,
      NSLocationWhenInUseUsageDescription: 'Used for arrival planning to detect your location.',
      NSCameraUsageDescription: 'Used to upload documents to your wallet.',
      NSPhotoLibraryUsageDescription: 'Used to select documents from your library.',
      NSFaceIDUsageDescription: 'Used for quick and secure login.'
    }
  },
  android: {
    ...config.android,
    package: 'com.ebenesaid.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#22c55e'
    }
  },
  web: {
    ...config.web,
    favicon: './assets/favicon.png'
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-local-authentication',
      {
        faceIDPermission: 'Allow EBENESAID to use Face ID.'
      }
    ],
    'expo-notifications'
  ],
  extra: {
    ...config.extra,
    apiUrl
  }
});
