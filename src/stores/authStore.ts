import { create } from "zustand";
import type { AuthState, User } from "@/types/auth";
import { login as apiLogin } from "@/api/auth";
import { STORAGE_KEYS } from "@/constants/storage";

// Bump whenever the shape or vocabulary of the persisted auth changes (e.g. a
// permission-key rename). On mismatch we drop the stale token+user so the user
// is sent to login and re-authenticates cleanly instead of dead-ending on 403.
const AUTH_SCHEMA_VERSION = "2";

function migrateAuthSchema(): void {
  if (localStorage.getItem(STORAGE_KEYS.authVersion) === AUTH_SCHEMA_VERSION) return;
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.setItem(STORAGE_KEYS.authVersion, AUTH_SCHEMA_VERSION);
}

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

// Runs once at module load, before the store reads token/user from storage.
migrateAuthSchema();

export const useAuthStore = create<AuthState>((set, get) => ({
  token: loadTokenFromStorage(),
  user: loadUserFromStorage(),
  isAuthenticated: !!loadTokenFromStorage(),

  login: async (username: string, password: string) => {
    const { token, user } = await apiLogin({ username, password });
    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.authVersion, AUTH_SCHEMA_VERSION);
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
