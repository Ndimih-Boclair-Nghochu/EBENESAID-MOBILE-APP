import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { clearQueryCache } from '@/src/lib/queryClient';
import {
  AUTH_STORAGE_KEY,
  clearStorageCache,
  clearSessionCookies,
  zustandStorage
} from '@/src/lib/storage';
import type { SafeUser } from '@/src/types';

import { useUserStore } from './userStore';

interface AuthState {
  user: SafeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  setUser: (user: SafeUser) => void;
  setLoading: (isLoading: boolean) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  clearAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
          isLoading: false
        }),
      setLoading: (isLoading) => set({ isLoading }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      clearAuth: async () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
        useUserStore.getState().clearProfile();
        await clearSessionCookies();
        await clearQueryCache();
        await clearStorageCache();
      }
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ user: state.user }),
      merge: (persistedState, currentState) => {
        const persistedUser =
          typeof persistedState === 'object' && persistedState !== null && 'user' in persistedState
            ? (persistedState.user as SafeUser | null)
            : null;

        return {
          ...currentState,
          user: persistedUser,
          isAuthenticated: Boolean(persistedUser),
          isLoading: false
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);

