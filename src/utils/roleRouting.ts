/**
 * Role-based routing utilities
 *
 * Provides functions to determine the appropriate URL based on user role.
 */

// Mapping of internal/dynamic role names to their dashboard routes
const ROLE_DASHBOARDS: Record<string, string> = {
  super_admin: "/super-admin",
  warehouse_operator: "/warehouse-operator",
  manager: "/location-manager",
  commercial_advisor: "/commercial-advisor",
  owner: "/admin",
};

/**
 * Get the dashboard URL for a given user role
 * @param role The user's role name (normalized to lowercase)
 * @returns The appropriate dashboard URL
 */
export function getDashboardUrlByRole(role: string): string {
  const normalizedRole = role.toLowerCase();
  return ROLE_DASHBOARDS[normalizedRole] || "/";
}

/**
 * Check if a role requires active subscription
 * @param role The user's role name (normalized to lowercase)
 * @returns true if the role requires an active subscription
 */
export function requiresActiveSubscription(role: string): boolean {
  const normalizedRole = role.toLowerCase();
  // Only owner (and possibly other organization roles) require subscription
  return (
    normalizedRole === "owner" ||
    normalizedRole === "manager" ||
    normalizedRole === "commercial_advisor"
  );
}
