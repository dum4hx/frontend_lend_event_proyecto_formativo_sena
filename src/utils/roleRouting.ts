/**
 * Routing utilities
 *
 * Provides functions to determine the appropriate dashboard URL based on
 * user permissions (primary) or role name (legacy fallback).
 */

import { allNavItems, getNavItemsByPrefix } from "../config/modulePermissions";

// ---------------------------------------------------------------------------
// Permission-based routing (preferred)
// ---------------------------------------------------------------------------

/**
 * Returns the first URL the user is authorised to visit after login.
 *
 * Resolution order:
 * 1. `platform:manage` → `/super-admin` (first accessible super-admin nav item)
 * 2. Any org-scoped permission → first `/app` nav item the user has access to
 * 3. Fallback → `/`
 */
export function getFirstAccessibleUrl(permissions: string[]): string {
  const permSet = new Set(permissions);

  if (permSet.has("platform:manage")) {
    const superAdminItems = getNavItemsByPrefix("/super-admin");
    const first = superAdminItems.find(
      (item) =>
        item.requiredPermissions.length === 0 ||
        item.requiredPermissions.some((p) => permSet.has(p)),
    );
    return first?.path ?? "/super-admin";
  }

  const appItems = getNavItemsByPrefix("/app");
  const first = appItems.find(
    (item) =>
      item.requiredPermissions.length === 0 || item.requiredPermissions.some((p) => permSet.has(p)),
  );
  if (first) return first.path;

  return "/";
}

/**
 * Determine the best dashboard URL for a user based on their permissions.
 *
 * - `platform:manage` → `/super-admin`
 * - Any organization-scoped permission → `/app`
 * - Otherwise → `/`
 */
export function getDashboardUrlByPermissions(permissions: string[]): string {
  const permSet = new Set(permissions);

  if (permSet.has("platform:manage")) return "/super-admin";

  const orgPermissions = [
    "analytics:read",
    "organization:read",
    "organization:update",
    "materials:read",
    "materials:create",
    "materials:update",
    "materials:delete",
    "loans:read",
    "customers:read",
    "requests:read",
    "invoices:read",
    "users:read",
    "roles:read",
    "reports:read",
  ];

  if (orgPermissions.some((p) => permSet.has(p))) return "/app";

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
  warehouse_operator: "/app",
  manager: "/app",
  commercial_advisor: "/app",
  owner: "/app",
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
