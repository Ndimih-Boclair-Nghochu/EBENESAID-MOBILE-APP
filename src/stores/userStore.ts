import { create } from 'zustand';

interface UserState {
  profile: unknown | null;
  setProfile: (profile: unknown) => void;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  clearProfile: () => set({ profile: null })
}));

