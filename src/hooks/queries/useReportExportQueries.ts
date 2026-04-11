/**
 * TanStack Query hooks for Report Export endpoints.
 */

import { useQuery } from "@tanstack/react-query";
import {
  getExportLoanActivity,
  getExportSales,
  getExportInventory,
  getExportDamages,
  getExportTransfers,
  getExportCustomers,
  getExportLocations,
  getExportRequests,
} from "../../services/reportExportService";
import type {
  ExportLoanActivityParams,
  ExportSalesParams,
  ExportInventoryParams,
  ExportDamagesParams,
  ExportTransfersParams,
  ExportCustomersParams,
  ExportLocationsParams,
  ExportRequestsParams,
} from "../../types/api";

interface ExportQueryOptions {
  enabled?: boolean;
}

export const exportReportKeys = {
  all: ["reportExports"] as const,
  loanActivity: (params: ExportLoanActivityParams) =>
    [...exportReportKeys.all, "loanActivity", params] as const,
  sales: (params: ExportSalesParams) => [...exportReportKeys.all, "sales", params] as const,
  inventory: (params: ExportInventoryParams) =>
    [...exportReportKeys.all, "inventory", params] as const,
  damages: (params: ExportDamagesParams) => [...exportReportKeys.all, "damages", params] as const,
  transfers: (params: ExportTransfersParams) =>
    [...exportReportKeys.all, "transfers", params] as const,
  customers: (params: ExportCustomersParams) =>
    [...exportReportKeys.all, "customers", params] as const,
  locations: (params: ExportLocationsParams) =>
    [...exportReportKeys.all, "locations", params] as const,
  requests: (params: ExportRequestsParams) =>
    [...exportReportKeys.all, "requests", params] as const,
};

export function useExportLoanActivity(
  params: ExportLoanActivityParams = {},
  options?: ExportQueryOptions,
) {
  return useQuery({
    queryKey: exportReportKeys.loanActivity(params),
    queryFn: () => getExportLoanActivity(params),
    select: (res) => res.data,
    enabled: options?.enabled ?? true,
  });
}

export function useExportSales(params: ExportSalesParams = {}, options?: ExportQueryOptions) {
  return useQuery({
    queryKey: exportReportKeys.sales(params),
    queryFn: () => getExportSales(params),
    select: (res) => res.data,
    enabled: options?.enabled ?? true,
  });
}

export function useExportInventory(
  params: ExportInventoryParams = {},
  options?: ExportQueryOptions,
) {
  return useQuery({
    queryKey: exportReportKeys.inventory(params),
    queryFn: () => getExportInventory(params),
    select: (res) => res.data,
    enabled: options?.enabled ?? true,
  });
}

export function useExportDamages(params: ExportDamagesParams = {}, options?: ExportQueryOptions) {
  return useQuery({
    queryKey: exportReportKeys.damages(params),
    queryFn: () => getExportDamages(params),
    select: (res) => res.data,
    enabled: options?.enabled ?? true,
  });
}

export function useExportTransfers(
  params: ExportTransfersParams = {},
  options?: ExportQueryOptions,
) {
  return useQuery({
    queryKey: exportReportKeys.transfers(params),
    queryFn: () => getExportTransfers(params),
    select: (res) => res.data,
    enabled: options?.enabled ?? true,
  });
}

export function useExportCustomers(
  params: ExportCustomersParams = {},
  options?: ExportQueryOptions,
) {
  return useQuery({
    queryKey: exportReportKeys.customers(params),
    queryFn: () => getExportCustomers(params),
    select: (res) => res.data,
    enabled: options?.enabled ?? true,
  });
}

export function useExportLocations(
  params: ExportLocationsParams = {},
  options?: ExportQueryOptions,
) {
  return useQuery({
    queryKey: exportReportKeys.locations(params),
    queryFn: () => getExportLocations(params),
    select: (res) => res.data,
    enabled: options?.enabled ?? true,
  });
}

export function useExportRequests(params: ExportRequestsParams = {}, options?: ExportQueryOptions) {
  return useQuery({
    queryKey: exportReportKeys.requests(params),
    queryFn: () => getExportRequests(params),
    select: (res) => res.data,
    enabled: options?.enabled ?? true,
  });
}
