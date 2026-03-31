/**
 * Location Operations Service
 *
 * Provides functions for the warehouse operator operations dashboard.
 * Each function maps to a GET /locations/:locationId/operations/* endpoint.
 */

import { get, type ApiSuccessResponse } from "../lib/api";
import type {
  OpsOverview,
  OpsInspectionsResponse,
  OpsOverdueFinancialsResponse,
  OpsInventoryIssuesResponse,
  OpsTransfersResponse,
  OpsLoanDeadlinesResponse,
  OpsDamagesResponse,
  OpsTasksResponse,
} from "../types/api";

const base = (locationId: string) => `/locations/${locationId}/operations`;

/** KPI snapshot: active loans, pending inspections, overdue invoices, etc. */
export async function getOpsOverview(locationId: string): Promise<ApiSuccessResponse<OpsOverview>> {
  return get<OpsOverview>(`${base(locationId)}/overview`);
}

/** Inspection queue grouped by status (pending vs in-progress). */
export async function getOpsInspections(
  locationId: string,
): Promise<ApiSuccessResponse<OpsInspectionsResponse>> {
  return get<OpsInspectionsResponse>(`${base(locationId)}/inspections`);
}

/** Overdue invoices with customer details, amounts, due dates. */
export async function getOpsOverdueFinancials(
  locationId: string,
): Promise<ApiSuccessResponse<OpsOverdueFinancialsResponse>> {
  return get<OpsOverdueFinancialsResponse>(`${base(locationId)}/financials/overdue`);
}

/** Inventory problems categorized as damaged, maintenance, or lost. */
export async function getOpsInventoryIssues(
  locationId: string,
): Promise<ApiSuccessResponse<OpsInventoryIssuesResponse>> {
  return get<OpsInventoryIssuesResponse>(`${base(locationId)}/inventory/issues`);
}

/** Transfer queue: inbound transfers plus pending transfer requests. */
export async function getOpsTransfers(
  locationId: string,
): Promise<ApiSuccessResponse<OpsTransfersResponse>> {
  return get<OpsTransfersResponse>(`${base(locationId)}/transfers`);
}

/** Loans with approaching or overdue deadlines. */
export async function getOpsLoanDeadlines(
  locationId: string,
): Promise<ApiSuccessResponse<OpsLoanDeadlinesResponse>> {
  return get<OpsLoanDeadlinesResponse>(`${base(locationId)}/loans/deadlines`);
}

/** Damage resolution queue: pending assessment, repair, and billing. */
export async function getOpsDamages(
  locationId: string,
): Promise<ApiSuccessResponse<OpsDamagesResponse>> {
  return get<OpsDamagesResponse>(`${base(locationId)}/damages`);
}

/** Unified prioritized TO-DO list aggregating all operational endpoints. */
export async function getOpsTasks(
  locationId: string,
): Promise<ApiSuccessResponse<OpsTasksResponse>> {
  return get<OpsTasksResponse>(`${base(locationId)}/tasks`);
}
