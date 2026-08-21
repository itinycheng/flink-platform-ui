import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore, useAuthPermissions } from "@/stores/authStore";
import { hasPermission } from "@/utils/permission";
import type { Permission } from "@/constants/enums";
import { getRoutePermission } from "./routes";

export interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
}

/**
 * Route guard component that protects routes based on authentication and permissions.
 *
 * Behavior:
 * 1. If user is not authenticated (no token), redirects to /login
 * 2. If user is authenticated but lacks the required permission, redirects to /403
 * 3. If user is authenticated and has permission (or no permission required), renders children
 *
 * The requiredPermission prop takes precedence over route-based permission lookup.
 * If not provided, the guard will look up the permission from the route configuration
 * based on the current pathname.
 */
export default function AuthGuard({ children, requiredPermission }: AuthGuardProps) {
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const effectivePermissions = useAuthPermissions();

  // Check authentication
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Determine the required permission: explicit prop or route-based lookup
  const permission = requiredPermission ?? getRoutePermission(location.pathname);

  // If permission is required but user data hasn't loaded yet (e.g. a page
  // refresh, before MainLayout's rehydrate resolves), still allow access —
  // effective permissions are unknowable without `user`, so gating here would
  // false-positive to /403.
  if (permission && user && !hasPermission(effectivePermissions, permission)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
