/**
 * TanStack Query hooks for Reports.
 */

import { useQuery } from "@tanstack/react-query";
import {
  getLoansReport,
  getInventoryReport,
  getFinancialReport,
  getDamagesReport,
  getTransfersReport,
} from "../../services/reportService";
import type { ReportsQueryParams } from "../../types/api";

export const reportKeys = {
  all: ["reports"] as const,
  loans: (params: ReportsQueryParams) => [...reportKeys.all, "loans", params] as const,
  inventory: (params: ReportsQueryParams) => [...reportKeys.all, "inventory", params] as const,
  financial: (params: ReportsQueryParams) => [...reportKeys.all, "financial", params] as const,
  damages: (params: ReportsQueryParams) => [...reportKeys.all, "damages", params] as const,
  transfers: (params: ReportsQueryParams) => [...reportKeys.all, "transfers", params] as const,
};

export function useLoansReport(params: ReportsQueryParams = {}) {
  return useQuery({
    queryKey: reportKeys.loans(params),
    queryFn: () => getLoansReport(params),
    select: (res) => res.data,
  });
}

export function useInventoryReport(params: ReportsQueryParams = {}) {
  return useQuery({
    queryKey: reportKeys.inventory(params),
    queryFn: () => getInventoryReport(params),
    select: (res) => res.data,
  });
}

export function useFinancialReport(params: ReportsQueryParams = {}) {
  return useQuery({
    queryKey: reportKeys.financial(params),
    queryFn: () => getFinancialReport(params),
    select: (res) => res.data,
  });
}

export function useDamagesReport(params: ReportsQueryParams = {}) {
  return useQuery({
    queryKey: reportKeys.damages(params),
    queryFn: () => getDamagesReport(params),
    select: (res) => res.data,
  });
}

export function useTransfersReport(params: ReportsQueryParams = {}) {
  return useQuery({
    queryKey: reportKeys.transfers(params),
    queryFn: () => getTransfersReport(params),
    select: (res) => res.data,
  });
}
