/**
 * Admin export service — super-admin only.
 *
 * Wraps the three GET /admin/exports/* endpoints.
 * Each endpoint supports `includeIds` toggling:
 *   - `true`  (default) → detailed rows (paginated for subscriptions/usage)
 *   - `false` → aggregated summary with enriched metrics
 */

import { get, type ApiSuccessResponse } from "../lib/api";
import type {
  AdminExportPlatformKpisParams,
  AdminPlatformKpisDetailData,
  AdminPlatformKpisSummaryData,
  AdminExportSubscriptionsParams,
  AdminSubscriptionsDetailData,
  AdminSubscriptionsSummaryData,
  AdminExportUsageParams,
  AdminUsageDetailData,
  AdminUsageSummaryData,
} from "../types/api";

// ─── Platform KPIs ─────────────────────────────────────────────────────────

/** Fetch monthly breakdown rows (includeIds=true). */
export async function getAdminExportPlatformKpisDetail(
  params: Omit<AdminExportPlatformKpisParams, "includeIds"> = {},
): Promise<ApiSuccessResponse<AdminPlatformKpisDetailData>> {
  return get<AdminPlatformKpisDetailData>("/admin/exports/platform-kpis", {
    ...params,
    includeIds: true,
  });
}

/** Fetch aggregated KPI summary (includeIds=false). */
export async function getAdminExportPlatformKpisSummary(
  params: Omit<AdminExportPlatformKpisParams, "includeIds"> = {},
): Promise<ApiSuccessResponse<AdminPlatformKpisSummaryData>> {
  return get<AdminPlatformKpisSummaryData>("/admin/exports/platform-kpis", {
    ...params,
    includeIds: false,
  });
}

// ─── Subscriptions ─────────────────────────────────────────────────────────

/** Fetch paginated subscription rows (includeIds=true). */
export async function getAdminExportSubscriptionsDetail(
  params: Omit<AdminExportSubscriptionsParams, "includeIds"> = {},
): Promise<ApiSuccessResponse<AdminSubscriptionsDetailData>> {
  return get<AdminSubscriptionsDetailData>("/admin/exports/subscriptions", {
    ...params,
    includeIds: true,
  });
}

/** Fetch subscription analytics summary (includeIds=false). */
export async function getAdminExportSubscriptionsSummary(
  params: Omit<AdminExportSubscriptionsParams, "includeIds"> = {},
): Promise<ApiSuccessResponse<AdminSubscriptionsSummaryData>> {
  return get<AdminSubscriptionsSummaryData>("/admin/exports/subscriptions", {
    ...params,
    includeIds: false,
  });
}

// ─── Usage ─────────────────────────────────────────────────────────────────

/** Fetch paginated per-org usage rows (includeIds=true). */
export async function getAdminExportUsageDetail(
  params: Omit<AdminExportUsageParams, "includeIds"> = {},
): Promise<ApiSuccessResponse<AdminUsageDetailData>> {
  return get<AdminUsageDetailData>("/admin/exports/usage", {
    ...params,
    includeIds: true,
  });
}

/** Fetch platform-wide usage aggregates (includeIds=false). */
export async function getAdminExportUsageSummary(
  params: Omit<AdminExportUsageParams, "includeIds"> = {},
): Promise<ApiSuccessResponse<AdminUsageSummaryData>> {
  return get<AdminUsageSummaryData>("/admin/exports/usage", {
    ...params,
    includeIds: false,
  });
}
