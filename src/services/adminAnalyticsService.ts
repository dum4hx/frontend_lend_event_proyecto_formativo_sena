/**
 * Admin analytics service (super-admin only).
 *
 * Returns aggregated, non-PII platform statistics.
 */

import { get, type ApiSuccessResponse } from "../lib/api";
import type {
  PlatformOverview,
  OrganizationStats,
  UserStats,
  RevenueStats,
  SubscriptionStats,
  PlatformHealth,
  ActivityEvent,
  AdminDashboardData,
} from "../types/api";

/** Fetch high-level platform statistics. */
export async function getAnalyticsOverview(): Promise<
  ApiSuccessResponse<{ overview: PlatformOverview }>
> {
  return get<{ overview: PlatformOverview }>("/admin/analytics/overview");
}

/** Fetch aggregated organization activity stats. */
export async function getAnalyticsOrganizations(
  periodMonths = 12,
): Promise<
  ApiSuccessResponse<{ periodMonths: number; stats: OrganizationStats }>
> {
  return get<{ periodMonths: number; stats: OrganizationStats }>(
    "/admin/analytics/organizations",
    { periodMonths },
  );
}

/** Fetch aggregated user activity stats. */
export async function getAnalyticsUsers(
  periodMonths = 12,
): Promise<ApiSuccessResponse<{ periodMonths: number; stats: UserStats }>> {
  return get<{ periodMonths: number; stats: UserStats }>(
    "/admin/analytics/users",
    { periodMonths },
  );
}

/** Fetch revenue statistics and trends. */
export async function getAnalyticsRevenue(
  periodMonths = 12,
): Promise<ApiSuccessResponse<{ periodMonths: number; stats: RevenueStats }>> {
  return get<{ periodMonths: number; stats: RevenueStats }>(
    "/admin/analytics/revenue",
    { periodMonths },
  );
}

/** Fetch subscription distribution and churn metrics. */
export async function getAnalyticsSubscriptions(): Promise<
  ApiSuccessResponse<{ stats: SubscriptionStats }>
> {
  return get<{ stats: SubscriptionStats }>("/admin/analytics/subscriptions");
}

/** Fetch platform health metrics. */
export async function getAnalyticsHealth(): Promise<
  ApiSuccessResponse<{ health: PlatformHealth }>
> {
  return get<{ health: PlatformHealth }>("/admin/analytics/health");
}

/** Fetch recent platform activity (non-PII event log). */
export async function getAnalyticsActivity(
  limit = 50,
): Promise<ApiSuccessResponse<{ activity: ActivityEvent[] }>> {
  return get<{ activity: ActivityEvent[] }>("/admin/analytics/activity", {
    limit,
  });
}

/** Fetch all analytics in a single call for dashboard rendering. */
export async function getAnalyticsDashboard(): Promise<
  ApiSuccessResponse<AdminDashboardData>
> {
  return get<AdminDashboardData>("/admin/analytics/dashboard");
}
