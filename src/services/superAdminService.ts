/**
 * Super-Admin Service.
 *
 * Consolidates every API interaction required by the super-admin module
 * into a single, testable surface.  Each function returns a typed
 * `ApiSuccessResponse<T>` so callers only destructure `data`.
 *
 * Delegates to the lower-level service modules (adminAnalyticsService,
 * subscriptionTypeService, etc.) and re-exports their functions under a
 * unified namespace so the super-admin views import from one place.
 */

import type { ApiSuccessResponse } from "../lib/api";
import type {
  AdminDashboardData,
  PlatformOverview,
  OrganizationStats,
  UserStats,
  RevenueStats,
  SubscriptionStats,
  PlatformHealth,
  ActivityEvent,
  SubscriptionType,
  CreateSubscriptionTypePayload,
  PlanCostResult,
  AnalyticsQueryParams,
  ActivityQueryParams,
} from "../types/api";

import {
  getAnalyticsDashboard,
  getAnalyticsOverview,
  getAnalyticsOrganizations,
  getAnalyticsUsers,
  getAnalyticsRevenue,
  getAnalyticsSubscriptions,
  getAnalyticsHealth,
  getAnalyticsActivity,
} from "./adminAnalyticsService";

import {
  getSubscriptionTypes,
  getSubscriptionType,
  createSubscriptionType,
  updateSubscriptionType,
  deleteSubscriptionType,
  calculatePlanCost,
} from "./subscriptionTypeService";

// ─── Analytics ─────────────────────────────────────────────────────────────

export async function fetchDashboard(): Promise<ApiSuccessResponse<AdminDashboardData>> {
  return getAnalyticsDashboard();
}

export async function fetchOverview(): Promise<ApiSuccessResponse<{ overview: PlatformOverview }>> {
  return getAnalyticsOverview();
}

export async function fetchOrganizationStats(
  params: AnalyticsQueryParams = {},
): Promise<ApiSuccessResponse<{ periodMonths: number; stats: OrganizationStats }>> {
  return getAnalyticsOrganizations(params.periodMonths);
}

export async function fetchUserStats(
  params: AnalyticsQueryParams = {},
): Promise<ApiSuccessResponse<{ periodMonths: number; stats: UserStats }>> {
  return getAnalyticsUsers(params.periodMonths);
}

export async function fetchRevenueStats(
  params: AnalyticsQueryParams = {},
): Promise<ApiSuccessResponse<{ periodMonths: number; stats: RevenueStats }>> {
  return getAnalyticsRevenue(params.periodMonths);
}

export async function fetchSubscriptionStats(): Promise<
  ApiSuccessResponse<{ stats: SubscriptionStats }>
> {
  return getAnalyticsSubscriptions();
}

export async function fetchPlatformHealth(): Promise<
  ApiSuccessResponse<{ health: PlatformHealth }>
> {
  return getAnalyticsHealth();
}

export async function fetchActivity(
  params: ActivityQueryParams = {},
): Promise<ApiSuccessResponse<{ activity: ActivityEvent[] }>> {
  return getAnalyticsActivity(params.limit);
}

// ─── Subscription Plans CRUD ───────────────────────────────────────────────

export async function fetchPlans(): Promise<
  ApiSuccessResponse<{ subscriptionTypes: SubscriptionType[] }>
> {
  return getSubscriptionTypes();
}

export async function fetchPlan(
  plan: string,
): Promise<ApiSuccessResponse<{ subscriptionType: SubscriptionType }>> {
  return getSubscriptionType(plan);
}

export async function createPlan(
  payload: CreateSubscriptionTypePayload,
): Promise<ApiSuccessResponse<{ subscriptionType: SubscriptionType }>> {
  return createSubscriptionType(payload);
}

export async function updatePlan(
  plan: string,
  updates: Partial<Omit<CreateSubscriptionTypePayload, "plan">>,
): Promise<ApiSuccessResponse<{ subscriptionType: SubscriptionType }>> {
  return updateSubscriptionType(plan, updates);
}

export async function deletePlan(plan: string): Promise<ApiSuccessResponse<null>> {
  return deleteSubscriptionType(plan);
}

export async function calculateCost(
  plan: string,
  seatCount: number,
): Promise<ApiSuccessResponse<PlanCostResult>> {
  return calculatePlanCost(plan, seatCount);
}

// ─── Aggregated fetchers for dashboard composition ─────────────────────────

/**
 * Fetch all data needed by the Sales Overview page in a single
 * `Promise.all` call. Returns a plain object so destructuring is easy.
 */
export async function fetchSalesOverviewData(periodMonths = 12) {
  const [dashboardRes, plansRes, revenueRes] = await Promise.all([
    fetchDashboard(),
    fetchPlans(),
    fetchRevenueStats({ periodMonths }),
  ]);

  return {
    dashboard: dashboardRes.data,
    plans: plansRes.data.subscriptionTypes,
    revenue: revenueRes.data.stats,
  } as const;
}

/**
 * Fetch all data needed by the Client Management page.
 */
export async function fetchClientManagementData(periodMonths = 12) {
  const [overviewRes, orgRes, subRes, activityRes] = await Promise.all([
    fetchOverview(),
    fetchOrganizationStats({ periodMonths }),
    fetchSubscriptionStats(),
    fetchActivity({ limit: 50 }),
  ]);

  return {
    overview: overviewRes.data.overview,
    orgStats: orgRes.data.stats,
    subStats: subRes.data.stats,
    activity: activityRes.data.activity,
  } as const;
}
