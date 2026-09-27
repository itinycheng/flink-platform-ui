import { useMemo } from "react";
import { create } from "zustand";
import type { AuthState, AuthUser } from "@/types/auth";
import type { Permission } from "@/constants/enums";
import { login as apiLogin, logout as apiLogout, getUserInfo } from "@/api/auth";
import { computeEffectivePermissions } from "@/utils/permission";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { STORAGE_KEYS } from "@/constants/storage";
import { queryClient } from "@/app/queryClient";

// Bump whenever the shape or vocabulary of the persisted auth changes (e.g. a
// permission-key rename). On mismatch we drop the stale token+user so the user
// is sent to login and re-authenticates cleanly instead of dead-ending on 403.
// v3: `user.roles` moved from string[] to the backend's UserRoles shape.
const AUTH_SCHEMA_VERSION = "4";

function migrateAuthSchema(): void {
  if (localStorage.getItem(STORAGE_KEYS.authVersion) === AUTH_SCHEMA_VERSION) return;
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.setItem(STORAGE_KEYS.authVersion, AUTH_SCHEMA_VERSION);
}

function loadTokenFromStorage(): string | null {
  return localStorage.getItem(STORAGE_KEYS.token);
}

function loadUserFromStorage(): AuthUser | null {
  const userStr = localStorage.getItem(STORAGE_KEYS.user);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as AuthUser;
  } catch {
    return null;
  }
}

function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
  // Clear the workspace too — otherwise the next login on a shared browser
  // inherits the previous user's stale workspaceId (and X-Workspace-Id header).
  localStorage.removeItem(STORAGE_KEYS.workspaceId);
  useWorkspaceStore.setState({ currentId: null, workspaces: [] });
  queryClient.clear();
}

// Runs once at module load, before the store reads token/user from storage.
migrateAuthSchema();

export const useAuthStore = create<AuthState>((set, get) => ({
  token: loadTokenFromStorage(),
  user: loadUserFromStorage(),
  isAuthenticated: !!loadTokenFromStorage(),

  login: async (username: string, password: string) => {
    const { token, workspaceId } = await apiLogin({ username, password });
    localStorage.setItem(STORAGE_KEYS.token, token);
    if (workspaceId != null) {
      localStorage.setItem(STORAGE_KEYS.workspaceId, String(workspaceId));
      // Set directly on the workspace store; login will navigate after the
      // scoped user information has loaded.
      useWorkspaceStore.setState({ currentId: workspaceId });
    }
    set({ token, isAuthenticated: true });
    // X-Workspace-Id is now in place, so /user/info resolves against the
    // right workspace's role.
    await get().loadUserInfo();
  },

  loadUserInfo: async () => {
    const user = await getUserInfo();
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    set({ user });
  },

  logout: async () => {
    const token = get().token;
    try {
      if (token) await apiLogout(token);
    } finally {
      clearSession();
      set({ token: null, user: null, isAuthenticated: false });
    }
  },

  checkToken: () => {
    return !!get().token;
  },
}));

/**
 * Effective Permissions for the current user, scoped to the active workspace.
 * Derived (not persisted): union of the global role's permissions and the
 * current workspace role's permissions.
 */
export function useAuthPermissions(): Permission[] {
  const user = useAuthStore((s) => s.user);
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentId);
  return useMemo(
    () => (user ? computeEffectivePermissions(user.roles, currentWorkspaceId) : []),
    [user, currentWorkspaceId],
  );
}
