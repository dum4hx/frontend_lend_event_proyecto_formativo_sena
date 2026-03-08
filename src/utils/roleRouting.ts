/**
 * Routing utilities
 *
 * Provides functions to determine the appropriate dashboard URL based on
 * user permissions (primary) or role name (legacy fallback).
 */

import { allNavItems } from "../config/modulePermissions";

// ---------------------------------------------------------------------------
// Permission-based routing (preferred)
// ---------------------------------------------------------------------------

/** Module prefixes ordered by priority for the post-login redirect. */
const MODULE_PREFIXES = [
  "/admin",
  "/super-admin",
  "/warehouse-operator",
  "/location-manager",
  "/commercial-advisor",
] as const;

/**
 * Determine the best dashboard URL for a user based on their permissions.
 *
 * Iterates through module prefixes in priority order and returns the first
 * module root whose index page permissions the user satisfies (OR logic).
 * Falls back to "/" if no module matches.
 */
export function getDashboardUrlByPermissions(permissions: string[]): string {
  const permSet = new Set(permissions);

  for (const prefix of MODULE_PREFIXES) {
    // The index item for a module has its path equal to the prefix
    const indexItem = allNavItems.find((item) => item.path === prefix);
    if (!indexItem) continue;

    const hasAccess =
      indexItem.requiredPermissions.length === 0 ||
      indexItem.requiredPermissions.some((p) => permSet.has(p));

    if (hasAccess) return prefix;
  }

  return "/";
}

/**
 * Check if the user's permissions include any that typically require an
 * active subscription (organization-scoped permissions).
 */
export function requiresActiveSubscriptionByPermissions(permissions: string[]): boolean {
  const orgPermissions = [
    "analytics:read",
    "organization:read",
    "organization:update",
    "materials:read",
    "loans:read",
    "customers:read",
  ];
  return permissions.some((p) => orgPermissions.includes(p));
}

// ---------------------------------------------------------------------------
// Legacy role-based helpers (kept for backward compatibility)
// ---------------------------------------------------------------------------

const ROLE_DASHBOARDS: Record<string, string> = {
  super_admin: "/super-admin",
  warehouse_operator: "/warehouse-operator",
  manager: "/location-manager",
  commercial_advisor: "/commercial-advisor",
  owner: "/admin",
};

/**
 * @deprecated Use `getDashboardUrlByPermissions` instead.
 */
export function getDashboardUrlByRole(role: string): string {
  const normalizedRole = role.toLowerCase();
  return ROLE_DASHBOARDS[normalizedRole] || "/";
}

/**
 * @deprecated Use `requiresActiveSubscriptionByPermissions` instead.
 */
export function requiresActiveSubscription(role: string): boolean {
  const normalizedRole = role.toLowerCase();
  return (
    normalizedRole === "owner" ||
    normalizedRole === "manager" ||
    normalizedRole === "commercial_advisor"
  );
}
