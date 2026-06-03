import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

import { toast } from '@/src/components/ui/Toast';
import type { SafeUser } from '@/src/types';

import { api } from './api';
import { storage } from './storage';

const PUSH_TOKEN_KEY = 'expo_push_token';
const PROMPT_KEY = 'show_notification_prompt';
const DEFERRED_PREFIX = 'notifications_deferred_until_';
const SETUP_PREFIX = 'notifications_setup_';
const deniedPrefix = 'notifications_denied_';
const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

type NotificationData = {
  type?: unknown;
};

type PromptListener = () => void;

const promptListeners = new Set<PromptListener>();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true
  })
});

function emitPromptChange() {
  promptListeners.forEach((listener) => listener());
}

export function subscribeNotificationPrompt(listener: PromptListener) {
  promptListeners.add(listener);
  return () => {
    promptListeners.delete(listener);
  };
}

function profileEndpointForUser(user: SafeUser) {
  switch (user.userType) {
    case 'agent':
      return '/api/agent/profile';
    case 'supplier':
      return '/api/supplier/profile';
    case 'job_partner':
      return '/api/job-partner/profile';
    case 'transport':
      return '/api/transport/profile';
    case 'university':
      return '/api/university/profile';
    case 'staff':
      return '/api/staff/profile';
    case 'admin':
      return '/api/admin/profile';
    case 'investor':
      return '/api/investor/profile';
    default:
      return '/api/student/profile';
  }
}

async function registerPushToken(user: SafeUser) {
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId
  });
  const token = tokenData.data;
  await storage.set(PUSH_TOKEN_KEY, token);

  try {
    await api.patch(profileEndpointForUser(user), {
      pushToken: token
    });
  } catch {
    await api.patch('/api/student/profile', {
      pushToken: token
    });
  }

  return token;
}

export async function setupNotifications(user: SafeUser): Promise<void> {
  const setupKey = `${SETUP_PREFIX}${user.id}`;
  const alreadySetup = await storage.getBoolean(setupKey);

  if (alreadySetup) {
    return;
  }

  const denied = await storage.getBoolean(`${deniedPrefix}${user.id}`);

  if (denied) {
    return;
  }

  const { status } = await Notifications.getPermissionsAsync();

  if (status === 'granted') {
    try {
      await registerPushToken(user);
      await storage.set(setupKey, true);
    } catch {
      // Notifications are optional. A token failure should not block the app.
    }
    return;
  }

  if (status === 'denied') {
    await storage.set(`${deniedPrefix}${user.id}`, true);
    return;
  }

  const deferredUntil = Number(await storage.getString(`${DEFERRED_PREFIX}${user.id}`));

  if (Number.isFinite(deferredUntil) && deferredUntil > Date.now()) {
    return;
  }

  setTimeout(() => {
    void storage.set(PROMPT_KEY, String(user.id)).then(emitPromptChange);
  }, 2000);
}

export async function shouldShowNotificationPrompt(user: SafeUser | null): Promise<boolean> {
  if (!user) {
    return false;
  }

  const promptUserId = await storage.getString(PROMPT_KEY);
  return promptUserId === String(user.id);
}

export async function deferNotificationPrompt(user: SafeUser): Promise<void> {
  await storage.set(`${DEFERRED_PREFIX}${user.id}`, Date.now() + threeDaysMs);
  await storage.delete(PROMPT_KEY);
  emitPromptChange();
}

export async function requestNotificationsFromPrompt(user: SafeUser): Promise<boolean> {
  const permissions = await Notifications.requestPermissionsAsync();
  await storage.delete(PROMPT_KEY);

  if (!permissions.granted) {
    if (permissions.status === 'denied') {
      await storage.set(`${deniedPrefix}${user.id}`, true);
    }
    emitPromptChange();
    return false;
  }

  try {
    await registerPushToken(user);
    await storage.set(`${SETUP_PREFIX}${user.id}`, true);
    emitPromptChange();
    return true;
  } catch {
    emitPromptChange();
    return false;
  }
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
