/**
 * TanStack Query hooks for Organization & Analytics.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOrganization,
  updateOrganization,
  getOrganizationUsage,
  getAvailablePlans,
} from "../../services/organizationService";
import { getLocations } from "../../services/warehouseOperatorService";
import {
  getAnalyticsOverview,
  getAnalyticsMaterials,
  getAnalyticsRevenue,
  getAnalyticsCustomers,
} from "../../services/analyticsService";
import type { Organization } from "../../types/api";

export const orgKeys = {
  all: ["organization"] as const,
  details: () => [...orgKeys.all, "detail"] as const,
  usage: () => [...orgKeys.all, "usage"] as const,
  plans: () => [...orgKeys.all, "plans"] as const,
  analytics: {
    all: ["orgAnalytics"] as const,
    overview: () => [...orgKeys.analytics.all, "overview"] as const,
    materials: () => [...orgKeys.analytics.all, "materials"] as const,
    revenue: (months: number) => [...orgKeys.analytics.all, "revenue", months] as const,
    customers: () => [...orgKeys.analytics.all, "customers"] as const,
  },
};

export function useOrganization() {
  return useQuery({
    queryKey: orgKeys.details(),
    queryFn: () => getOrganization(),
    select: (res) => res.data.organization,
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      updates: Partial<
        Pick<Organization, "name" | "legalName" | "email" | "phone" | "address" | "taxId">
      >,
    ) => updateOrganization(updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.all });
    },
  });
}

export function useOrganizationUsage() {
  return useQuery({
    queryKey: orgKeys.usage(),
    queryFn: () => getOrganizationUsage(),
    select: (res) => res.data.usage,
  });
}

export function useAvailablePlans() {
  return useQuery({
    queryKey: orgKeys.plans(),
    queryFn: () => getAvailablePlans(),
    select: (res) => res.data.plans,
    staleTime: 1000 * 60 * 60,
  });
}

// ─── Organization Analytics ────────────────────────────────────────────────

export function useOrgAnalyticsOverview() {
  return useQuery({
    queryKey: orgKeys.analytics.overview(),
    queryFn: () => getAnalyticsOverview(),
    select: (res) => res.data,
  });
}

export function useOrgAnalyticsMaterials() {
  return useQuery({
    queryKey: orgKeys.analytics.materials(),
    queryFn: () => getAnalyticsMaterials(),
    select: (res) => res.data,
  });
}

export function useOrgAnalyticsRevenue(periodMonths = 12) {
  return useQuery({
    queryKey: orgKeys.analytics.revenue(periodMonths),
    queryFn: () => getAnalyticsRevenue(),
    select: (res) => res.data,
  });
}

export function useOrgAnalyticsCustomers() {
  return useQuery({
    queryKey: orgKeys.analytics.customers(),
    queryFn: () => getAnalyticsCustomers(),
    select: (res) => res.data,
  });
}

// ─── Locations ─────────────────────────────────────────────────────────────

export const locationKeys = {
  all: ["locations"] as const,
  list: () => [...locationKeys.all, "list"] as const,
};

export function useLocations() {
  return useQuery({
    queryKey: locationKeys.list(),
    queryFn: () => getLocations({ limit: 100 }),
    select: (res) => res.data.items,
    staleTime: 1000 * 60 * 5,
  });
}
