import { create } from "zustand";
import type { AuthState, User } from "@/types/auth";
import { login as apiLogin } from "@/api/auth";

const TOKEN_KEY = "token";
const USER_KEY = "user";

function loadTokenFromStorage(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function loadUserFromStorage(): User | null {
  const userStr = localStorage.getItem(USER_KEY);
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
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null, isAuthenticated: false });
  },

  checkToken: () => {
    const token = get().token;
    return !!token;
  },
}));
