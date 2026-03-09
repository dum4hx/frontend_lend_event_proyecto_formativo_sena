/**
 * Central permission mapping for all application paths.
 *
 * A single flat registry of navigation items and route-level permissions.
 * The unified sidebar filters items by the user's permissions.
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
  /** Visual grouping label rendered as a section header in the sidebar. */
  section?: string;
}

// ---------------------------------------------------------------------------
// Single flat registry of ALL sidebar navigation items.
// ---------------------------------------------------------------------------

export const allNavItems: NavItem[] = [
  // -- Overview --
  { id: "dashboard",           label: "Dashboard",            path: "/app",                         requiredPermissions: ["analytics:read"],                      section: "Overview" },

  // -- Organization --
  { id: "events",              label: "My Events",            path: "/app/events",                  requiredPermissions: ["loans:read"],                          section: "Organization" },
  { id: "customers",           label: "Customers",            path: "/app/customers",               requiredPermissions: ["customers:read"],                      section: "Organization" },
  { id: "team",                label: "Team",                 path: "/app/team",                    requiredPermissions: ["users:read"],                          section: "Organization" },
  { id: "roles",               label: "Role Management",      path: "/app/roles",                   requiredPermissions: ["roles:read"],                          section: "Organization" },
  { id: "subscription",        label: "Subscription",         path: "/app/subscription",            requiredPermissions: ["subscription:manage", "billing:manage"], section: "Organization" },
  { id: "ia-settings",         label: "IA Settings",          path: "/app/ia-settings",             requiredPermissions: ["organization:update"],                 section: "Organization" },
  { id: "settings",            label: "Settings",             path: "/app/settings",                requiredPermissions: ["organization:read"],                   section: "Organization" },

  // -- Materials --
  { id: "material-categories", label: "Categories",           path: "/app/material-categories",     requiredPermissions: ["materials:read"],                      section: "Materials" },
  { id: "material-types",      label: "Material Types",       path: "/app/material-types",          requiredPermissions: ["materials:read"],                      section: "Materials" },
  { id: "material-instances",  label: "Inventory Items",      path: "/app/material-instances",      requiredPermissions: ["materials:read"],                      section: "Materials" },
  { id: "attributes",          label: "Attributes",           path: "/app/attributes",              requiredPermissions: ["materials:read"],                      section: "Materials" },
  { id: "plans",               label: "Material Plans",       path: "/app/plans",                   requiredPermissions: ["materials:read"],                      section: "Materials" },

  // -- Warehouse --
  { id: "inventory",           label: "Inventory",            path: "/app/inventory",               requiredPermissions: ["materials:read"],                      section: "Warehouse" },
  { id: "locations",           label: "Locations",            path: "/app/locations",               requiredPermissions: ["materials:read"],                      section: "Warehouse" },
  { id: "stock-movements",     label: "Stock Movements",      path: "/app/stock-movements",         requiredPermissions: ["materials:update"],                    section: "Warehouse" },
  { id: "alerts",              label: "Alerts",               path: "/app/alerts",                  requiredPermissions: ["materials:read"],                      section: "Warehouse" },

  // -- Commerce --
  { id: "orders",              label: "Orders",               path: "/app/orders",                  requiredPermissions: ["requests:read"],                       section: "Commerce" },
  { id: "contracts",           label: "Contracts",            path: "/app/contracts",               requiredPermissions: ["loans:read"],                          section: "Commerce" },
  { id: "rentals",             label: "Rentals",              path: "/app/rentals",                 requiredPermissions: ["loans:read"],                          section: "Commerce" },
  { id: "invoices",            label: "Invoices",             path: "/app/invoices",                requiredPermissions: ["invoices:read"],                       section: "Commerce" },
  { id: "reports",             label: "Reports",              path: "/app/reports",                 requiredPermissions: ["reports:read"],                        section: "Commerce" },

  // -- /super-admin (separate module, kept here for getNavItemsByPrefix) --
  { id: "overview",            label: "Sales Overview",           path: "/super-admin",                requiredPermissions: ["platform:manage"],        section: "Overview" },
  { id: "clients",             label: "User Management",          path: "/super-admin/clients",        requiredPermissions: ["platform:manage"],        section: "Management" },
  { id: "organizations",       label: "Organization Management",  path: "/super-admin/organizations",  requiredPermissions: ["platform:manage"],        section: "Management" },
  { id: "sa-plans",            label: "Plan Configuration",       path: "/super-admin/subscriptions",  requiredPermissions: ["subscription_types:read"], section: "Management" },
  { id: "ai-monitor",          label: "AI Chatbot Monitor",       path: "/super-admin/ai-monitor",     requiredPermissions: ["platform:manage"],        section: "Monitoring" },
  { id: "sa-settings",         label: "System Settings",          path: "/super-admin/settings",       requiredPermissions: ["platform:manage"],        section: "Configuration" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the nav items whose path matches the given prefix.
 *
 * @example getNavItemsByPrefix("/app")
 */
export function getNavItemsByPrefix(prefix: string): NavItem[] {
  return allNavItems.filter(
    (item) => item.path === prefix || item.path.startsWith(prefix + "/"),
  );
}

/**
 * Groups nav items by their `section` field.
 * Items without a section are placed under "".
 */
export function groupNavItemsBySection(
  items: NavItem[],
): { section: string; items: NavItem[] }[] {
  const map = new Map<string, NavItem[]>();
  for (const item of items) {
    const key = item.section ?? "";
    const group = map.get(key);
    if (group) group.push(item);
    else map.set(key, [item]);
  }
  return Array.from(map, ([section, items]) => ({ section, items }));
}

// ---------------------------------------------------------------------------
// Route-level permission requirements
// ---------------------------------------------------------------------------

export interface RoutePermission {
  path: string;
  requiredPermissions: string[];
}

/** Additional sub-routes not present in sidebar navigation. */
const additionalRoutePermissions: RoutePermission[] = [
  { path: "/app/material-categories/create",  requiredPermissions: ["materials:create"] },
  { path: "/app/material-types/create",       requiredPermissions: ["materials:create"] },
  { path: "/app/material-instances/create",   requiredPermissions: ["materials:create"] },
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
