/**
 * Organization-level analytics service.
 *
 * Fetches aggregate stats for the current organization's dashboard.
 * Endpoints: GET /analytics/overview | /analytics/materials | /analytics/revenue | /analytics/customers
 */

import { get, type ApiSuccessResponse } from "../lib/api";
import type {
  OrgAnalyticsOverview,
  OrgAnalyticsMaterials,
  OrgAnalyticsRevenue,
  OrgAnalyticsCustomers,
} from "../types/api";

/** Fetch organisation-wide KPI overview. */
export async function getAnalyticsOverview(): Promise<ApiSuccessResponse<OrgAnalyticsOverview>> {
  return get<OrgAnalyticsOverview>("/analytics/overview");
}

/** Fetch material utilisation stats. */
export async function getAnalyticsMaterials(): Promise<ApiSuccessResponse<OrgAnalyticsMaterials>> {
  return get<OrgAnalyticsMaterials>("/analytics/materials");
}

/** Fetch revenue trends. */
export async function getAnalyticsRevenue(): Promise<ApiSuccessResponse<OrgAnalyticsRevenue>> {
  return get<OrgAnalyticsRevenue>("/analytics/revenue");
}

/** Fetch customer analytics. */
export async function getAnalyticsCustomers(): Promise<ApiSuccessResponse<OrgAnalyticsCustomers>> {
  return get<OrgAnalyticsCustomers>("/analytics/customers");
}
