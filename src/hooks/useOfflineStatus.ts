import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef, useState } from 'react';

import { toast } from '@/src/components/ui/Toast';
import { flushQueue, getQueueLength } from '@/src/lib/offlineQueue';

export function useOfflineStatus(): boolean {
  const [isOffline, setIsOffline] = useState(false);
  const previousOfflineRef = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);

      if (previousOfflineRef.current && !offline) {
        void getQueueLength().then((queueLength) => {
          if (queueLength > 0) {
            toast.info(`Syncing ${queueLength} pending actions...`);
            void flushQueue().then(() => {
              toast.success('Sync complete');
            });
          }
        });
      }

      previousOfflineRef.current = offline;
    });

    return unsubscribe;
  }, []);

  return isOffline;
}
