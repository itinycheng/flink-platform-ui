import type { RouteConfig } from "../utils/permission";

/**
 * Application route definitions with permission requirements.
 * Each route can optionally specify a permission string that the user must have.
 * Routes without a permission field are accessible to all authenticated users.
 */
export const routeConfigs: RouteConfig[] = [
  {
    path: "/dashboard",
    permission: "dashboard:view",
  },
  {
    path: "/studio",
    permission: "workflow:view",
  },
  {
    path: "/jobs",
    permission: "workflow:view",
  },
  {
    path: "/query",
    permission: "workflow:view",
  },
  {
    path: "/admin",
    permission: "admin:view",
  },
  {
    path: "/runs",
    permission: "workflow:view",
  },
  {
    path: "/monitor",
    permission: "monitor:view",
  },
];

/**
 * Map of route paths to their permission requirements.
 * Used by AuthGuard to quickly look up the required permission for a given path.
 */
export function getRoutePermission(pathname: string): string | undefined {
  // Match against first-level path segment, e.g. /workflow/xxx matches /workflow
  const config = routeConfigs.find((route) => pathname === route.path || pathname.startsWith(route.path + "/"));
  return config?.permission;
}
