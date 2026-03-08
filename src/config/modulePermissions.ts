/**
 * Central permission mapping for all application paths.
 *
 * A single flat registry of navigation items and route-level permissions.
 * Sidebar components filter by URL prefix + the user's permissions.
 * Route guards look up required permissions by path.
 *
 * Permission keys come from PERMISSIONS_REFERENCE.md and are returned by
 * the backend on login / /auth/me.
 *
 * Roles are **dynamic** -- users can create custom roles with any permission
 * combination (except the owner role which is immutable).  This mapping is
 * keyed by PATH, never by role name.
 *
 * **Convention:** `requiredPermissions` uses OR logic -- access is granted
 * when the user holds *at least one* of the listed permissions.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NavItem {
  /** Stable identifier used as React key and icon-map key. */
  id: string;
  /** Display label shown in the sidebar. */
  label: string;
  /** Route path (also serves as the unique key across entries). */
  path: string;
  /**
   * Backend permission keys (OR logic).
   * If empty the item is always shown for authenticated users.
   */
  requiredPermissions: string[];
}

// ---------------------------------------------------------------------------
// Single flat registry of ALL sidebar navigation items.
// Grouped by URL prefix for readability only -- not by role.
// ---------------------------------------------------------------------------

export const allNavItems: NavItem[] = [
  // -- /admin --
  { id: "dashboard",            label: "Dashboard",            path: "/admin",                      requiredPermissions: ["analytics:read"] },
  { id: "events",               label: "My Events",            path: "/admin/events",               requiredPermissions: ["loans:read"] },
  { id: "customers",            label: "Customers",            path: "/admin/customers",            requiredPermissions: ["customers:read"] },
  { id: "team",                 label: "Team",                 path: "/admin/team",                 requiredPermissions: ["users:read"] },
  { id: "roles",                label: "Role Management",      path: "/admin/roles",                requiredPermissions: ["roles:read"] },
  { id: "material-categories",  label: "Material Categories",  path: "/admin/material-categories",  requiredPermissions: ["materials:read"] },
  { id: "material-types",       label: "Material Types",       path: "/admin/material-types",       requiredPermissions: ["materials:read"] },
  { id: "material-instances",   label: "Material Instances",   path: "/admin/material-instances",   requiredPermissions: ["materials:read"] },
  { id: "ia-settings",          label: "IA Settings",          path: "/admin/ia-settings",          requiredPermissions: ["organization:update"] },
  { id: "subscription",         label: "Subscription",         path: "/admin/subscription",         requiredPermissions: ["subscription:manage", "billing:manage"] },
  { id: "settings",             label: "Settings",             path: "/admin/settings",             requiredPermissions: ["organization:read"] },

  // -- /super-admin --
  { id: "overview",       label: "Sales Overview",           path: "/super-admin",                requiredPermissions: ["platform:manage"] },
  { id: "clients",        label: "User Management",          path: "/super-admin/clients",        requiredPermissions: ["platform:manage"] },
  { id: "organizations",  label: "Organization Management",  path: "/super-admin/organizations",  requiredPermissions: ["platform:manage"] },
  { id: "plans",          label: "Plan Configuration",       path: "/super-admin/subscriptions",  requiredPermissions: ["subscription_types:read"] },
  { id: "ai-monitor",     label: "AI Chatbot Monitor",       path: "/super-admin/ai-monitor",     requiredPermissions: ["platform:manage"] },
  { id: "sa-settings",    label: "System Settings",          path: "/super-admin/settings",       requiredPermissions: ["platform:manage"] },

  // -- /warehouse-operator --
  { id: "wo-dashboard",     label: "Dashboard",        path: "/warehouse-operator",                  requiredPermissions: ["materials:read"] },
  { id: "inventory",        label: "Inventory",        path: "/warehouse-operator/inventory",        requiredPermissions: ["materials:read"] },
  { id: "locations",        label: "Locations",        path: "/warehouse-operator/locations",        requiredPermissions: ["materials:read"] },
  { id: "stock-movements",  label: "Stock Movements",  path: "/warehouse-operator/stock-movements",  requiredPermissions: ["materials:update"] },
  { id: "alerts",           label: "Alerts",           path: "/warehouse-operator/alerts",           requiredPermissions: ["materials:read"] },
  { id: "wo-settings",      label: "Settings",         path: "/warehouse-operator/settings",         requiredPermissions: ["organization:read"] },

  // -- /location-manager --
  { id: "lm-dashboard",  label: "Dashboard",        path: "/location-manager",             requiredPermissions: ["materials:read"] },
  { id: "materials",      label: "Materials",        path: "/location-manager/materials",   requiredPermissions: ["materials:read"] },
  { id: "categories",     label: "Categories",       path: "/location-manager/categories",  requiredPermissions: ["materials:read"] },
  { id: "models",         label: "Material Models",  path: "/location-manager/models",      requiredPermissions: ["materials:read"] },
  { id: "attributes",     label: "Attributes",       path: "/location-manager/attributes",  requiredPermissions: ["materials:read"] },
  { id: "lm-plans",       label: "Material Plans",   path: "/location-manager/plans",       requiredPermissions: ["materials:read"] },
  { id: "lm-settings",    label: "Settings",         path: "/location-manager/settings",    requiredPermissions: ["organization:read"] },

  // -- /commercial-advisor --
  { id: "ca-dashboard",  label: "Dashboard",   path: "/commercial-advisor",            requiredPermissions: ["loans:read", "customers:read"] },
  { id: "ca-customers",  label: "Customers",   path: "/commercial-advisor/customers",  requiredPermissions: ["customers:read"] },
  { id: "orders",        label: "Orders",      path: "/commercial-advisor/orders",     requiredPermissions: ["requests:read"] },
  { id: "contracts",     label: "Contracts",   path: "/commercial-advisor/contracts",  requiredPermissions: ["loans:read"] },
  { id: "rentals",       label: "Rentals",     path: "/commercial-advisor/rentals",    requiredPermissions: ["loans:read"] },
  { id: "invoices",      label: "Invoices",    path: "/commercial-advisor/invoices",   requiredPermissions: ["invoices:read"] },
  { id: "reports",       label: "Reports",     path: "/commercial-advisor/reports",    requiredPermissions: ["reports:read"] },
  { id: "ca-settings",   label: "Settings",    path: "/commercial-advisor/settings",   requiredPermissions: ["organization:read"] },
];

// ---------------------------------------------------------------------------
// Helper -- sidebar components call this with their URL prefix
// ---------------------------------------------------------------------------

/**
 * Returns the nav items whose path matches the given prefix.
 *
 * @example getNavItemsByPrefix("/admin")
 */
export function getNavItemsByPrefix(prefix: string): NavItem[] {
  return allNavItems.filter(
    (item) => item.path === prefix || item.path.startsWith(prefix + "/"),
  );
}

// ---------------------------------------------------------------------------
// Route-level permission requirements
//
// Derived from allNavItems plus sub-routes (create / edit pages) that are
// not shown in sidebars but still need access control.
//
// Used by <RequirePermission> guards.  OR logic: user needs at least one.
// ---------------------------------------------------------------------------

export interface RoutePermission {
  path: string;
  requiredPermissions: string[];
}

/** Additional sub-routes not present in sidebar navigation. */
const additionalRoutePermissions: RoutePermission[] = [
  { path: "/admin/material-categories/create",  requiredPermissions: ["materials:create"] },
  { path: "/admin/material-types/create",       requiredPermissions: ["materials:create"] },
  { path: "/admin/material-instances/create",   requiredPermissions: ["materials:create"] },
];

export const routePermissions: RoutePermission[] = [
  ...allNavItems.map(({ path, requiredPermissions }) => ({ path, requiredPermissions })),
  ...additionalRoutePermissions,
];

/**
 * Look up the required permissions for a route path.
 * Returns `undefined` if no explicit mapping exists.
 */
export function getRoutePermissions(path: string): string[] | undefined {
  const entry = routePermissions.find((r) => r.path === path);
  return entry?.requiredPermissions;
}
