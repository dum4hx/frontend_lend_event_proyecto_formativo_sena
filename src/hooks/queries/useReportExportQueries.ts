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
} from "../../services/reportExportService";
import type {
  ExportLoanActivityParams,
  ExportSalesParams,
  ExportInventoryParams,
  ExportDamagesParams,
  ExportTransfersParams,
} from "../../types/api";

interface ExportQueryOptions {
  enabled?: boolean;
}

export const exportReportKeys = {
  all: ["reportExports"] as const,
  loanActivity: (params: ExportLoanActivityParams) =>
    [...exportReportKeys.all, "loanActivity", params] as const,
  sales: (params: ExportSalesParams) =>
    [...exportReportKeys.all, "sales", params] as const,
  inventory: (params: ExportInventoryParams) =>
    [...exportReportKeys.all, "inventory", params] as const,
  damages: (params: ExportDamagesParams) =>
    [...exportReportKeys.all, "damages", params] as const,
  transfers: (params: ExportTransfersParams) =>
    [...exportReportKeys.all, "transfers", params] as const,
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

export function useExportSales(
  params: ExportSalesParams = {},
  options?: ExportQueryOptions,
) {
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

export function useExportDamages(
  params: ExportDamagesParams = {},
  options?: ExportQueryOptions,
) {
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
