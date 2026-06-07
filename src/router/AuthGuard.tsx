import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { hasPermission } from "../utils/permission";
import { getRoutePermission } from "./routes";

export interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
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
  const { token, user } = useAuthStore();

  // Check authentication
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Determine the required permission: explicit prop or route-based lookup
  const permission = requiredPermission ?? getRoutePermission(location.pathname);

  // Check permission if one is required
  if (permission && user) {
    if (!hasPermission(user.permissions, permission)) {
      return <Navigate to="/403" replace />;
    }
  }

  // If permission is required but user data is missing, still allow access
  // (the user is authenticated but user data may not be loaded yet)

  return <>{children}</>;
}
