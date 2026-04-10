/**
 * Reports service.
 *
 * Covers server-side report endpoints for loans, inventory, financials,
 * damages, and transfers.
 */

import { get, type ApiSuccessResponse } from "../lib/api";
import type {
  ReportsQueryParams,
  ReportsLoansData,
  ReportsInventoryData,
  ReportsFinancialData,
  ReportsDamagesData,
  ReportsTransfersData,
} from "../types/api";

type QueryRecord = Record<string, string | number | boolean | undefined>;

function toQueryRecord(params: ReportsQueryParams): QueryRecord {
  return params as QueryRecord;
}

/** Fetch loans report. */
export async function getLoansReport(
  params: ReportsQueryParams = {},
): Promise<ApiSuccessResponse<ReportsLoansData>> {
  return get<ReportsLoansData>("/reports/loans", toQueryRecord(params));
}

/** Fetch inventory report. */
export async function getInventoryReport(
  params: ReportsQueryParams = {},
): Promise<ApiSuccessResponse<ReportsInventoryData>> {
  return get<ReportsInventoryData>("/reports/inventory", toQueryRecord(params));
}

/** Fetch financial report. */
export async function getFinancialReport(
  params: ReportsQueryParams = {},
): Promise<ApiSuccessResponse<ReportsFinancialData>> {
  return get<ReportsFinancialData>("/reports/financial", toQueryRecord(params));
}

/** Fetch damages report. */
export async function getDamagesReport(
  params: ReportsQueryParams = {},
): Promise<ApiSuccessResponse<ReportsDamagesData>> {
  return get<ReportsDamagesData>("/reports/damages", toQueryRecord(params));
}

/** Fetch transfers report. */
export async function getTransfersReport(
  params: ReportsQueryParams = {},
): Promise<ApiSuccessResponse<ReportsTransfersData>> {
  return get<ReportsTransfersData>("/reports/transfers", toQueryRecord(params));
}
