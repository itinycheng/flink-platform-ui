import type { UserRoles } from "@/types/entities";
import type { UserStatus } from "@/constants/enums";

/**
 * Current authenticated user, sourced from GET /user/info.
 * `roles` is the backend's UserRoles shape (global role + per-workspace roles);
 * effective Permissions are derived from it via computeEffectivePermissions,
 * never persisted directly.
 */
export interface AuthUser {
  username: string;
  roles: UserRoles;
  status?: UserStatus;
  avatar?: string;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  /** Fetch GET /user/info and store the result. Called after login and to rehydrate on refresh. */
  loadUserInfo: () => Promise<void>;
  logout: () => Promise<void>;
  checkToken: () => boolean;
}
