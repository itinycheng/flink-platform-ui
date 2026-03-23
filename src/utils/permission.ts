export interface TabItem {
  key: string;
  label: string;
  permission?: string;
}

/**
 * Route configuration interface with permission support.
 * Used by the router to define routes that can be filtered by user permissions.
 */
export interface RouteConfig {
  path: string;
  permission?: string;
  children?: RouteConfig[];
}

/**
 * Check if a user has a specific permission.
 * Returns true if the required permission is found in the user's permission list,
 * or if no permission is required (empty string or undefined-like cases handled by caller).
 */
export function hasPermission(userPermissions: string[], required: string): boolean {
  return userPermissions.includes(required);
}

/**
 * Filter routes based on user permissions.
 * Routes without a permission field are always included (public routes).
 * Routes with a permission field are included only if the user has that permission.
 * Children routes are recursively filtered.
 */
export function filterRoutesByPermission(routes: RouteConfig[], permissions: string[]): RouteConfig[] {
  return routes
    .filter((route) => route.permission === undefined || hasPermission(permissions, route.permission))
    .map((route) => {
      if (route.children && route.children.length > 0) {
        return {
          ...route,
          children: filterRoutesByPermission(route.children, permissions),
        };
      }
      return route;
    });
}

/**
 * Filter tab items based on user permissions.
 * Tabs without a permission field are always included.
 * Tabs with a permission field are included only if the user has that permission.
 */
export function filterTabsByPermission(tabs: TabItem[], permissions: string[]): TabItem[] {
  return tabs.filter((tab) => tab.permission === undefined || hasPermission(permissions, tab.permission));
}
