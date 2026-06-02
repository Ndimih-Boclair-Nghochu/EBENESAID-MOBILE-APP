import Constants from 'expo-constants';

const fallbackApiUrl = 'https://ebenesaid.com';
const extraApiUrl = Constants.expoConfig?.extra?.apiUrl;
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL ?? extraApiUrl ?? fallbackApiUrl;

export const API_URL = configuredApiUrl.replace(/\/$/, '');

