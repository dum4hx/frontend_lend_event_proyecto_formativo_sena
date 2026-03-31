/**
 * Reports service.
 *
 * Covers server-side report endpoints for loans, inventory, financials,
 * damages, and transfers.
 */

import { get, type ApiSuccessResponse } from "../lib/api";
import type {
  ReportsQueryParams,
  ReportsLoansResponse,
  ReportsInventoryResponse,
  ReportsFinancialResponse,
  ReportsDamagesResponse,
  ReportsTransfersResponse,
} from "../types/api";

type QueryRecord = Record<string, string | number | boolean | undefined>;

function toQueryRecord(params: ReportsQueryParams): QueryRecord {
  return params as QueryRecord;
}

/** Fetch loans report. */
export async function getLoansReport(
  params: ReportsQueryParams = {},
): Promise<ApiSuccessResponse<ReportsLoansResponse>> {
  return get<ReportsLoansResponse>("/reports/loans", toQueryRecord(params));
}

/** Fetch inventory report. */
export async function getInventoryReport(
  params: ReportsQueryParams = {},
): Promise<ApiSuccessResponse<ReportsInventoryResponse>> {
  return get<ReportsInventoryResponse>("/reports/inventory", toQueryRecord(params));
}

/** Fetch financial report. */
export async function getFinancialReport(
  params: ReportsQueryParams = {},
): Promise<ApiSuccessResponse<ReportsFinancialResponse>> {
  return get<ReportsFinancialResponse>("/reports/financial", toQueryRecord(params));
}

/** Fetch damages report. */
export async function getDamagesReport(
  params: ReportsQueryParams = {},
): Promise<ApiSuccessResponse<ReportsDamagesResponse>> {
  return get<ReportsDamagesResponse>("/reports/damages", toQueryRecord(params));
}

/** Fetch transfers report. */
export async function getTransfersReport(
  params: ReportsQueryParams = {},
): Promise<ApiSuccessResponse<ReportsTransfersResponse>> {
  return get<ReportsTransfersResponse>("/reports/transfers", toQueryRecord(params));
}
