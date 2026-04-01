/**
 * Organization service.
 *
 * Covers organization details, usage stats, and available plans.
 */

import { get, patch, publicGet, type ApiSuccessResponse } from "../lib/api";
import type {
  Organization,
  OrganizationSettings,
  OrganizationUsage,
  AvailablePlan,
} from "../types/api";

// ─── Details ───────────────────────────────────────────────────────────────

/** Fetch the current organization's details. */
export async function getOrganization(): Promise<
  ApiSuccessResponse<{ organization: Organization }>
> {
  return get<{ organization: Organization }>("/organizations");
}

/** Update the current organization's details. */
export async function updateOrganization(
  updates: Partial<
    Pick<Organization, "name" | "legalName" | "email" | "phone" | "address" | "taxId">
  >,
): Promise<ApiSuccessResponse<{ organization: Organization }>> {
  return patch<{ organization: Organization }>("/organizations", updates);
}

// ─── Usage ─────────────────────────────────────────────────────────────────

/** Fetch current plan usage and limits. */
export async function getOrganizationUsage(): Promise<
  ApiSuccessResponse<{ usage: OrganizationUsage }>
> {
  return get<{ usage: OrganizationUsage }>("/organizations/usage");
}

// ─── Plans ─────────────────────────────────────────────────────────────────

/** Fetch available subscription plans. */
export async function getAvailablePlans(): Promise<ApiSuccessResponse<{ plans: AvailablePlan[] }>> {
  // Public endpoint — allow unauthenticated users without triggering refresh flow
  return publicGet<{ plans: AvailablePlan[] }>("/organizations/plans");
}

// ─── Settings ──────────────────────────────────────────────────────────────

/** Fetch the current organization's policy settings. */
export async function getOrganizationSettings(): Promise<
  ApiSuccessResponse<{ settings: OrganizationSettings }>
> {
  return get<{ settings: OrganizationSettings }>("/organizations/settings");
}

/** Update the organization's policy settings (partial update). */
export async function updateOrganizationSettings(
  updates: Partial<OrganizationSettings>,
): Promise<ApiSuccessResponse<{ settings: OrganizationSettings }>> {
  return patch<{ settings: OrganizationSettings }>("/organizations/settings", updates);
}
