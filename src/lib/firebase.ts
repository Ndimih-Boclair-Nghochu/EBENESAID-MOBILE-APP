import { getApp, getApps, initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
};

function isConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

export function getFirebaseApp() {
  if (!isConfigured()) {
    return null;
  }

  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseStorage() {
  const app = getFirebaseApp();
  return app ? getStorage(app) : null;
}

export const FIREBASE_CONFIGURED = isConfigured();
