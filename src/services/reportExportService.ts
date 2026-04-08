/**
 * Report Export service.
 *
 * Calls the new `/reports/exports/*` endpoints. Every function defaults
 * `includeIds` to `false` so the response includes enriched summaries
 * and omits internal ObjectIds.
 */

import { get, type ApiSuccessResponse } from "../lib/api";
import type {
  ExportLoanActivityParams,
  ExportLoanActivityData,
  ExportSalesParams,
  ExportSalesData,
  ExportInventoryParams,
  ExportInventoryData,
  ExportDamagesParams,
  ExportDamagesData,
  ExportTransfersParams,
  ExportTransfersData,
  ExportBillingHistoryParams,
  ExportBillingHistoryData,
  ExportCustomersParams,
  ExportCustomersData,
  ExportLocationsParams,
  ExportLocationsData,
  ExportRequestsParams,
  ExportRequestsData,
} from "../types/api";

type QueryRecord = Record<string, string | number | boolean | undefined>;

function toQueryRecord<T extends Record<string, unknown>>(params: T): QueryRecord {
  const record: QueryRecord = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      record[key] = value as string | number | boolean;
    }
  }
  return record;
}

/** Fetch loan activity export. */
export async function getExportLoanActivity(
  params: ExportLoanActivityParams = {},
): Promise<ApiSuccessResponse<ExportLoanActivityData>> {
  return get<ExportLoanActivityData>(
    "/reports/exports/loan-activity",
    toQueryRecord({ includeIds: false, ...params }),
  );
}

/** Fetch combined sales (loans + invoices) export. */
export async function getExportSales(
  params: ExportSalesParams = {},
): Promise<ApiSuccessResponse<ExportSalesData>> {
  return get<ExportSalesData>(
    "/reports/exports/sales",
    toQueryRecord({ includeIds: false, ...params }),
  );
}

/** Fetch inventory catalog export. */
export async function getExportInventory(
  params: ExportInventoryParams = {},
): Promise<ApiSuccessResponse<ExportInventoryData>> {
  return get<ExportInventoryData>(
    "/reports/exports/inventory",
    toQueryRecord({ includeIds: false, ...params }),
  );
}

/** Fetch maintenance / damages export. */
export async function getExportDamages(
  params: ExportDamagesParams = {},
): Promise<ApiSuccessResponse<ExportDamagesData>> {
  return get<ExportDamagesData>(
    "/reports/exports/damages",
    toQueryRecord({ includeIds: false, ...params }),
  );
}

/** Fetch transfers export. */
export async function getExportTransfers(
  params: ExportTransfersParams = {},
): Promise<ApiSuccessResponse<ExportTransfersData>> {
  return get<ExportTransfersData>(
    "/reports/exports/transfers",
    toQueryRecord({ includeIds: false, ...params }),
  );
}

/** Fetch billing history export. */
export async function getExportBillingHistory(
  params: ExportBillingHistoryParams = {},
): Promise<ApiSuccessResponse<ExportBillingHistoryData>> {
  return get<ExportBillingHistoryData>(
    "/reports/exports/billing-history",
    toQueryRecord({ includeIds: false, ...params }),
  );
}

/** Fetch customers export. */
export async function getExportCustomers(
  params: ExportCustomersParams = {},
): Promise<ApiSuccessResponse<ExportCustomersData>> {
  return get<ExportCustomersData>(
    "/reports/exports/customers",
    toQueryRecord({ includeIds: false, ...params }),
  );
}

/** Fetch locations export. */
export async function getExportLocations(
  params: ExportLocationsParams = {},
): Promise<ApiSuccessResponse<ExportLocationsData>> {
  return get<ExportLocationsData>(
    "/reports/exports/locations",
    toQueryRecord({ includeIds: false, ...params }),
  );
}

/** Fetch loan requests export. */
export async function getExportRequests(
  params: ExportRequestsParams = {},
): Promise<ApiSuccessResponse<ExportRequestsData>> {
  return get<ExportRequestsData>(
    "/reports/exports/loan-requests",
    toQueryRecord({ includeIds: false, ...params }),
  );
}
