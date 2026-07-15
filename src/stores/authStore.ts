import { create } from "zustand";
import type { AuthState, User } from "@/types/auth";
import { login as apiLogin } from "@/api/auth";
import { STORAGE_KEYS } from "@/constants/storage";

function loadTokenFromStorage(): string | null {
  return localStorage.getItem(STORAGE_KEYS.token);
}

function loadUserFromStorage(): User | null {
  const userStr = localStorage.getItem(STORAGE_KEYS.user);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: loadTokenFromStorage(),
  user: loadUserFromStorage(),
  isAuthenticated: !!loadTokenFromStorage(),

  login: async (username: string, password: string) => {
    const { token, user } = await apiLogin({ username, password });
    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    set({ token: null, user: null, isAuthenticated: false });
  },

  checkToken: () => {
    const token = get().token;
    return !!token;
  },
}));
