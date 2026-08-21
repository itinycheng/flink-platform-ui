import type { Permission } from "@/constants/enums";

export interface RouteConfig {
  path: string;
  permission: Permission;
}

/**
 * Frontend path → required Permission, mirroring each page's backend
 * `@RequirePermission` view guard. Admin sub-pages are listed before the
 * `/admin` fallback; getRoutePermission matches the longest path prefix so a
 * sub-page (e.g. `/admin/users`) always wins over the parent fallback.
 */
export const routeConfigs: RouteConfig[] = [
  { path: "/dashboard", permission: "WORKSPACE_VIEW" },
  { path: "/audit-logs", permission: "WORKSPACE_VIEW" },

  { path: "/studio", permission: "TASK_VIEW" },
  { path: "/jobs", permission: "TASK_VIEW" },
  { path: "/query", permission: "TASK_VIEW" },
  { path: "/runs", permission: "TASK_VIEW" },
  { path: "/monitor", permission: "TASK_VIEW" },

  { path: "/admin/users", permission: "WORKSPACE_MANAGE" },
  { path: "/admin/sys-configs", permission: "WORKSPACE_MANAGE" },

  { path: "/admin/workspaces", permission: "WORKSPACE_VIEW" },
  { path: "/admin/workers", permission: "WORKSPACE_VIEW" },

  { path: "/admin/resources", permission: "TASK_VIEW" },
  { path: "/admin/datasources", permission: "TASK_VIEW" },
  { path: "/admin/catalogs", permission: "TASK_VIEW" },
  { path: "/admin/tags", permission: "TASK_VIEW" },
  { path: "/admin/alert-rules", permission: "TASK_VIEW" },
  { path: "/admin/params", permission: "TASK_VIEW" },

  { path: "/admin", permission: "WORKSPACE_VIEW" },
];

/**
 * Look up the required Permission for a given pathname, using longest-prefix
 * matching so nested routes (e.g. `/admin/users`) take precedence over their
 * parent fallback (`/admin`).
 */
export function getRoutePermission(pathname: string): Permission | undefined {
  let best: RouteConfig | undefined;
  for (const route of routeConfigs) {
    const matches = pathname === route.path || pathname.startsWith(route.path + "/");
    if (matches && (!best || route.path.length > best.path.length)) {
      best = route;
    }
  }
  return best?.permission;
}
