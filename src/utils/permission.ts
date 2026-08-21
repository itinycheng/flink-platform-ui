import { ROLE_PERMISSIONS, type Permission, type Role } from "@/constants/enums";
import type { UserRoles } from "@/types/entities";

/**
 * Check whether a given role includes a specific backend Permission.
 * Backed by the ROLE_PERMISSIONS map mirrored from Role.java.
 */
export function roleHasPermission(role: Role, p: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(p);
}

/**
 * Compute the effective set of Permissions for a user given their global role
 * and their per-workspace roles, scoped to the currently selected workspace.
 * Effective permissions = union of the global role's permissions and the
 * current workspace role's permissions (deduped).
 */
export function computeEffectivePermissions(roles: UserRoles, currentWorkspaceId: number | null): Permission[] {
  const globalPerms = roles.global ? ROLE_PERMISSIONS[roles.global] : [];
  const workspaceRole = currentWorkspaceId != null ? roles.workspaces?.[currentWorkspaceId] : undefined;
  const workspacePerms = workspaceRole ? ROLE_PERMISSIONS[workspaceRole] : [];
  return [...new Set([...globalPerms, ...workspacePerms])];
}

/**
 * Check whether an effective Permission list (as computed by
 * computeEffectivePermissions) includes the required Permission.
 */
export function hasPermission(effective: Permission[], required: Permission): boolean {
  return effective.includes(required);
}
