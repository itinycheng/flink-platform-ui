import { http } from "@/utils/request";
import type { AuthUser } from "@/types/auth";
import type { UserRoles } from "@/types/entities";
import type { UserStatus } from "@/constants/enums";
import { adaptUserRoles } from "@/api/legacy/contracts";

export interface LoginRequest {
  username: string;
  password: string;
  /** Only meaningful for SSO flows (CAS/OIDC); omitted for LOCAL. */
  workspaceId?: number;
}

export interface LoginResponse {
  token: string;
  /** Server-resolved starting workspace (from the user's roles); null if none. */
  workspaceId: number | null;
}

/** POST /login. No user is returned — callers must follow up with getUserInfo(). */
export function login(data: LoginRequest): Promise<LoginResponse> {
  return http.post<LoginResponse>("/login", data);
}

export function logout(token: string): Promise<{ redirectUrl?: string }> {
  return http.post<{ redirectUrl?: string }>("/logout", { token });
}

export function getLoginConfig(): Promise<{ authType: string; ssoLoginUrl?: string }> {
  return http.get<{ authType: string; ssoLoginUrl?: string }>("/login/config");
}

/** Backend shape for GET /user/info; `name` is mapped to `username` for AuthUser. */
interface UserInfoResponse {
  name: string;
  roles: UserRoles | string[];
  status?: UserStatus;
  avatar?: string;
}

/** GET /user/info (sends X-Workspace-Id via the request interceptor). */
export function getUserInfo(): Promise<AuthUser> {
  return http.get<UserInfoResponse>("/user/info").then((u) => ({
    username: u.name,
    roles: adaptUserRoles(u.roles),
    status: u.status,
    avatar: u.avatar,
  }));
}
