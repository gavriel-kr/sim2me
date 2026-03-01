import { create } from 'zustand';
import { storage } from './storage';

const TOKEN_KEY = 'sim2me.auth.token';
const USER_KEY = 'sim2me.auth.user';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  setAuth: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  hydrated: false,

  setAuth: async (token, user) => {
    await storage.setItem(TOKEN_KEY, token);
    await storage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },

  logout: async () => {
    await storage.deleteItem(TOKEN_KEY);
    await storage.deleteItem(USER_KEY);
    set({ token: null, user: null });
  },

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const [token, userJson] = await Promise.all([
        storage.getItem(TOKEN_KEY),
        storage.getItem(USER_KEY),
      ]);
      const user = userJson ? (JSON.parse(userJson) as AuthUser) : null;
      set({ token, user, hydrated: true });
    } catch {
      set({ token: null, user: null, hydrated: true });
    }
  },
}));
