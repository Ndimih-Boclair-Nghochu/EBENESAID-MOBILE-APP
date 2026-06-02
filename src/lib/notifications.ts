import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

import { toast } from '@/src/components/ui/Toast';

import { api } from './api';
import { storage } from './storage';

const NOTIFICATION_PERMISSION_KEY = 'notifications_permission_requested';
const PUSH_TOKEN_KEY = 'expo_push_token';

type NotificationData = {
  type?: unknown;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true
  })
});

export async function requestPushNotificationsIfNeeded(): Promise<string | null> {
  const alreadyRequested = await storage.getBoolean(NOTIFICATION_PERMISSION_KEY);
  const savedToken = await storage.getString(PUSH_TOKEN_KEY);

  if (alreadyRequested && savedToken) {
    return savedToken;
  }

  const permissions = await Notifications.requestPermissionsAsync();
  await storage.set(NOTIFICATION_PERMISSION_KEY, true);

  if (!permissions.granted) {
    return null;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync();
  const token = tokenResponse.data;
  await storage.set(PUSH_TOKEN_KEY, token);

  try {
    await api.patch('/api/student/profile', {
      pushToken: token
    });
  } catch {
    // Non-student portals may not accept this endpoint; keep the token locally for the next profile sync.
  }

  return token;
}
export function setupNotificationListeners() {
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    const title = notification.request.content.title ?? 'EBENESAID';
    const body = notification.request.content.body ?? 'You have a new update.';
    toast.info(`${title}: ${body}`);
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as NotificationData;
    navigateFromNotification(data);
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

export function navigateFromNotification(data: NotificationData): void {
  switch (data.type) {
    case 'message':
      router.push('/(student)/messages');
      break;
    case 'housing':
      router.push('/(student)/housing');
      break;
    case 'order':
      router.push('/(student)/food');
      break;
    case 'job':
      router.push('/(student)/jobs');
      break;
    case 'support':
      router.push('/(student)/support');
      break;
    default:
      router.push('/');
      break;
  }
}
