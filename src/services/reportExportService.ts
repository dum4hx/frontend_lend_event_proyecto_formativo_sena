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
  ExportCustomersRawData,
  ExportLocationsParams,
  ExportLocationsData,
  ExportLocationsRawData,
  ExportRequestsParams,
  ExportRequestsData,
  ExportRequestsRawData,
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

/** Fetch customers export. Normalises the API shape (customers[] + flat pagination) into rows[] + pagination. */
export async function getExportCustomers(
  params: ExportCustomersParams = {},
): Promise<ApiSuccessResponse<ExportCustomersData>> {
  const raw = await get<ExportCustomersRawData>(
    "/reports/exports/customers",
    toQueryRecord({ includeIds: false, ...params }),
  );
  const d = raw.data;
  return {
    ...raw,
    data: {
      rows: d.customers,
      pagination: {
        total: d.total,
        page: d.page,
        totalPages: Math.ceil(d.total / (d.limit || 50)),
      },
      summary: d.summary,
    },
  };
}

/** Fetch locations export. Normalises the API shape (locations[] + totalLocations) into rows[] + pagination. */
export async function getExportLocations(
  params: ExportLocationsParams = {},
): Promise<ApiSuccessResponse<ExportLocationsData>> {
  const raw = await get<ExportLocationsRawData>(
    "/reports/exports/locations",
    toQueryRecord({ includeIds: false, ...params }),
  );
  const d = raw.data;
  const limit = (params as Record<string, unknown>).limit as number | undefined;
  return {
    ...raw,
    data: {
      rows: d.locations,
      pagination: {
        total: d.totalLocations,
        page: ((params as Record<string, unknown>).page as number) ?? 1,
        totalPages: Math.ceil(d.totalLocations / (limit || 50)),
      },
      summary: d.summary,
    },
  };
}

/** Fetch loan requests export. Normalises the API shape (requests[] + flat pagination) into rows[] + pagination. */
export async function getExportRequests(
  params: ExportRequestsParams = {},
): Promise<ApiSuccessResponse<ExportRequestsData>> {
  const raw = await get<ExportRequestsRawData>(
    "/reports/exports/requests",
    toQueryRecord({ includeIds: false, ...params }),
  );
  const d = raw.data;
  return {
    ...raw,
    data: {
      rows: d.requests,
      pagination: {
        total: d.total,
        page: d.page,
        totalPages: Math.ceil(d.total / (d.limit || 50)),
      },
      summary: d.summary,
    },
  };
}
