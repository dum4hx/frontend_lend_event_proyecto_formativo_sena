/**
 * Role-based routing utilities
 *
 * Provides functions to determine the appropriate URL based on user role.
 */

import type { UserRole } from "../types/api";

/**
 * Get the dashboard URL for a given user role
 * @param role The user's role
 * @returns The appropriate dashboard URL
 */
export function getDashboardUrlByRole(role: UserRole): string {
  switch (role) {
    case "super_admin":
      return "/super-admin";
    case "warehouse_operator":
      return "/warehouse-operator";
    case "manager":
      return "/location-manager";
    case "commercial_advisor":
      return "/commercial-advisor";
    case "owner":
      return "/admin";
    default:
      return "/";
  }
}

/**
 * Check if a role requires active subscription
 * @param role The user's role
 * @returns true if the role requires an active subscription
 */
export function requiresActiveSubscription(role: UserRole): boolean {
  // Only owner (and possibly other organization roles) require subscription
  return role === "owner" || role === "manager" || role === "commercial_advisor";
}
