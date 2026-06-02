import NetInfo from '@react-native-community/netinfo';
import { toast } from '@/src/components/ui/Toast';

import { api } from './api';
import { storage } from './storage';

export interface QueuedAction {
  id: string;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body: unknown;
  queuedAt: number;
  retries: number;
}

export type QueueableAction = Omit<QueuedAction, 'id' | 'queuedAt' | 'retries'>;

const OFFLINE_QUEUE_KEY = 'offline_queue';

function createQueueId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const value = Math.floor(Math.random() * 16);
    const nibble = character === 'x' ? value : (value & 0x3) | 0x8;
    return nibble.toString(16);
  });
}

function readQueue(): QueuedAction[] {
  const raw = storage.getString(OFFLINE_QUEUE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isQueuedAction) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedAction[]): void {
  storage.set(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

function isQueuedAction(value: unknown): value is QueuedAction {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as QueuedAction;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.endpoint === 'string' &&
    ['POST', 'PATCH', 'PUT', 'DELETE'].includes(candidate.method) &&
    typeof candidate.queuedAt === 'number' &&
    typeof candidate.retries === 'number'
  );
}

export function enqueueAction(action: QueueableAction): void {
  const queue = readQueue();
  queue.push({
    ...action,
    id: createQueueId(),
    queuedAt: Date.now(),
    retries: 0
  });
  writeQueue(queue);
}

export function getQueueLength(): number {
  return readQueue().length;
}

export async function flushQueue(): Promise<void> {
  const queue = readQueue();

  if (queue.length === 0) {
    return;
  }

  const remaining: QueuedAction[] = [];

  for (const action of queue) {
    try {
      await api.request({
        url: action.endpoint,
        method: action.method,
        data: action.body
      });
    } catch {
      const nextRetries = action.retries + 1;

      if (nextRetries < 3) {
        remaining.push({
          ...action,
          retries: nextRetries
        });
      }
    }
  }

  writeQueue(remaining);
}

export async function requestOrQueue<T>(
  action: QueueableAction,
  onlineRequest: () => Promise<T>
): Promise<T | { queued: true }> {
  const state = await NetInfo.fetch();
  const isOffline = state.isConnected === false || state.isInternetReachable === false;

  if (isOffline) {
    enqueueAction(action);
    toast.info('Action saved. It will sync when you are online.');
    return { queued: true };
  }

  return onlineRequest();
}
