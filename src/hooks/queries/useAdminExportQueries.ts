/**
 * TanStack Query hooks for Admin Export endpoints (super-admin).
 *
 * Each endpoint exposes two hooks:
 *   - Detail (includeIds=true)  → row-level data for tables
 *   - Summary (includeIds=false) → aggregated KPIs for stat cards
 */

import { useQuery } from "@tanstack/react-query";
import {
  getAdminExportPlatformKpisDetail,
  getAdminExportPlatformKpisSummary,
  getAdminExportSubscriptionsDetail,
  getAdminExportSubscriptionsSummary,
  getAdminExportUsageDetail,
  getAdminExportUsageSummary,
} from "../../services/adminExportService";
import type {
  AdminExportPlatformKpisParams,
  AdminExportSubscriptionsParams,
  AdminExportUsageParams,
} from "../../types/api";

interface AdminExportQueryOptions {
  enabled?: boolean;
}

export const adminExportKeys = {
  all: ["adminExports"] as const,
  platformKpisDetail: (params: Omit<AdminExportPlatformKpisParams, "includeIds">) =>
    [...adminExportKeys.all, "platformKpis", "detail", params] as const,
  platformKpisSummary: (params: Omit<AdminExportPlatformKpisParams, "includeIds">) =>
    [...adminExportKeys.all, "platformKpis", "summary", params] as const,
  subscriptionsDetail: (params: Omit<AdminExportSubscriptionsParams, "includeIds">) =>
    [...adminExportKeys.all, "subscriptions", "detail", params] as const,
  subscriptionsSummary: (params: Omit<AdminExportSubscriptionsParams, "includeIds">) =>
    [...adminExportKeys.all, "subscriptions", "summary", params] as const,
  usageDetail: (params: Omit<AdminExportUsageParams, "includeIds">) =>
    [...adminExportKeys.all, "usage", "detail", params] as const,
  usageSummary: (params: Omit<AdminExportUsageParams, "includeIds">) =>
    [...adminExportKeys.all, "usage", "summary", params] as const,
};

// ─── Platform KPIs ─────────────────────────────────────────────────────────

export function useAdminPlatformKpisDetail(
  params: Omit<AdminExportPlatformKpisParams, "includeIds"> = {},
  options?: AdminExportQueryOptions,
) {
  return useQuery({
    queryKey: adminExportKeys.platformKpisDetail(params),
    queryFn: () => getAdminExportPlatformKpisDetail(params),
    select: (res) => res.data,
    enabled: options?.enabled ?? true,
  });
}

export function useAdminPlatformKpisSummary(
  params: Omit<AdminExportPlatformKpisParams, "includeIds"> = {},
  options?: AdminExportQueryOptions,
) {
  return useQuery({
    queryKey: adminExportKeys.platformKpisSummary(params),
    queryFn: () => getAdminExportPlatformKpisSummary(params),
    select: (res) => res.data,
    enabled: options?.enabled ?? true,
  });
}

// ─── Subscriptions ─────────────────────────────────────────────────────────

export function useAdminSubscriptionsDetail(
  params: Omit<AdminExportSubscriptionsParams, "includeIds"> = {},
  options?: AdminExportQueryOptions,
) {
  return useQuery({
    queryKey: adminExportKeys.subscriptionsDetail(params),
    queryFn: () => getAdminExportSubscriptionsDetail(params),
    select: (res) => res.data,
    enabled: options?.enabled ?? true,
  });
}

export function useAdminSubscriptionsSummary(
  params: Omit<AdminExportSubscriptionsParams, "includeIds"> = {},
  options?: AdminExportQueryOptions,
) {
  return useQuery({
    queryKey: adminExportKeys.subscriptionsSummary(params),
    queryFn: () => getAdminExportSubscriptionsSummary(params),
    select: (res) => res.data,
    enabled: options?.enabled ?? true,
  });
}

// ─── Usage ─────────────────────────────────────────────────────────────────

export function useAdminUsageDetail(
  params: Omit<AdminExportUsageParams, "includeIds"> = {},
  options?: AdminExportQueryOptions,
) {
  return useQuery({
    queryKey: adminExportKeys.usageDetail(params),
    queryFn: () => getAdminExportUsageDetail(params),
    select: (res) => res.data,
    enabled: options?.enabled ?? true,
  });
}

export function useAdminUsageSummary(
  params: Omit<AdminExportUsageParams, "includeIds"> = {},
  options?: AdminExportQueryOptions,
) {
  return useQuery({
    queryKey: adminExportKeys.usageSummary(params),
    queryFn: () => getAdminExportUsageSummary(params),
    select: (res) => res.data,
    enabled: options?.enabled ?? true,
  });
}
