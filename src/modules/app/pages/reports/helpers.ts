import type { ApiSuccessResponse } from "../../../../lib/api";
import type { ExportPagination } from "../../../../types/api";
import type { MaterialCategory, ReportRow } from "./types";

// ─── Constants ─────────────────────────────────────────────────────────────

export const PAGE_SIZE = 20;
export const EXPORT_PAGE_SIZE = 200;

// ─── Formatters ────────────────────────────────────────────────────────────

export const fmtDate = (iso: string | undefined): string => {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
};

export const fmtCurrency = (cents: number): string =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(cents);

export const fmtId = (id: string | undefined): string => {
  if (!id) return "—";
  return id;
};

export function getReferenceId(value: string | { _id?: string } | undefined): string | undefined {
  if (!value) return undefined;
  return typeof value === "string" ? value : value._id;
}

type CategoryReference =
  | string
  | { _id?: string; name?: string }
  | Array<{ _id?: string; name?: string }>;

export function getCategoryName(
  categoryData: CategoryReference | null | undefined,
  categories: MaterialCategory[],
): string {
  if (!categoryData) return "—";

  if (Array.isArray(categoryData)) {
    const category = categoryData[0];
    return category?.name || category?._id || "—";
  }

  if (typeof categoryData === "object") {
    if (categoryData.name) return categoryData.name;
    if (categoryData._id) {
      const foundCategory = categories.find((category) => category._id === categoryData._id);
      return foundCategory?.name || categoryData._id;
    }
    return "—";
  }

  const category = categories.find((entry) => entry._id === categoryData);
  return category?.name || categoryData;
}

// ─── Summary entry type ────────────────────────────────────────────────────

/** A label/value pair used in CSV, PDF, and XLSX summary sections. */
export interface SummaryEntry {
  label: string;
  value: string | number;
}

// ─── Fetch all pages for full export ───────────────────────────────────────

export interface FetchAllPagesResult<R, S> {
  rows: R[];
  summary: S | undefined;
}

/**
 * Fetches all pages from a paginated export endpoint.
 * First request uses `limit=EXPORT_PAGE_SIZE` to discover `totalPages`,
 * then fetches remaining pages in parallel.
 *
 * @param serviceFn      - Service function that calls the export endpoint
 * @param params         - Query params (page/limit are overridden)
 * @param extractRows    - Extracts the row array from the response data
 * @param extractSummary - Extracts the summary object from the first page response
 */
export async function fetchAllPages<
  D extends { pagination: ExportPagination },
  R,
  P extends Record<string, unknown>,
  S = undefined,
>(
  serviceFn: (params: P) => Promise<ApiSuccessResponse<D>>,
  params: P,
  extractRows: (data: D) => R[],
  extractSummary?: (data: D) => S | undefined,
): Promise<FetchAllPagesResult<R, S>> {
  const first = await serviceFn({ ...params, page: 1, limit: EXPORT_PAGE_SIZE } as P);
  const allRows = [...extractRows(first.data)];
  const summary = extractSummary ? extractSummary(first.data) : undefined;
  const { totalPages } = first.data.pagination;

  if (totalPages > 1) {
    const remaining = Array.from({ length: totalPages - 1 }, (_, i) =>
      serviceFn({ ...params, page: i + 2, limit: EXPORT_PAGE_SIZE } as P),
    );
    const pages = await Promise.all(remaining);
    for (const page of pages) {
      allRows.push(...extractRows(page.data));
    }
  }

  return { rows: allRows, summary };
}

// ─── CSV Export ─────────────────────────────────────────────────────────────

function escapeCSVField(val: string | number): string {
  const str = String(val).replace(/"/g, '""');
  return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;
}

/**
 * Export rows to CSV with an optional summary section prepended.
 * When `summaryEntries` is non-empty the file layout is:
 *
 *   --- SUMMARY ---
 *   Metric,Value
 *   ...entries
 *   (blank line)
 *   --- DATA ---
 *   ...headers + rows
 */
export function exportToCSVWithSummary(
  headers: string[],
  rows: ReportRow[],
  filename: string,
  summaryEntries: SummaryEntry[],
  sectionLabels?: { summary: string; data: string; metric: string; value: string },
): void {
  const lines: string[] = [];

  if (summaryEntries.length > 0) {
    const labels = sectionLabels ?? { summary: "SUMMARY", data: "DATA", metric: "Metric", value: "Value" };
    lines.push(`--- ${labels.summary} ---`);
    lines.push(`${labels.metric},${labels.value}`);
    for (const entry of summaryEntries) {
      lines.push(`${escapeCSVField(entry.label)},${escapeCSVField(entry.value)}`);
    }
    lines.push("");
    lines.push(`--- ${labels.data} ---`);
  }

  lines.push(headers.join(","));
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCSVField(row.columns[h] ?? "")).join(","));
  }

  const csvContent = lines.join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToCSV(headers: string[], rows: ReportRow[], filename: string): void {
  exportToCSVWithSummary(headers, rows, filename, []);
}

// ─── Status badge classes ──────────────────────────────────────────────────

export const statusBadgeClass = (val: string): string => {
  switch (val) {
    case "active":
    case "paid":
    case "approved":
    case "available":
    case "returned":
      return "bg-emerald-900/60 text-emerald-300";
    case "inactive":
    case "cancelled":
    case "rejected":
    case "retired":
      return "bg-red-900/60 text-red-300";
    case "pending":
    case "invited":
    case "reserved":
      return "bg-yellow-900/60 text-yellow-300";
    case "overdue":
    case "damaged":
    case "lost":
      return "bg-orange-900/60 text-orange-300";
    case "blacklisted":
      return "bg-purple-900/60 text-purple-300";
    case "maintenance":
    case "in_transit":
      return "bg-blue-900/60 text-blue-300";
    case "completed":
    case "received":
    case "good":
    case "applied":
    case "refunded":
      return "bg-emerald-900/60 text-emerald-300";
    case "held":
      return "bg-yellow-900/60 text-yellow-300";
    case "refund_pending":
      return "bg-blue-900/60 text-blue-300";
    default:
      return "bg-zinc-700 text-zinc-300";
  }
};

export const STATUS_COLUMNS = new Set([
  "Status",
  "status",
  "Estado",
  "Condition Before",
  "Condition After",
  "Condición antes",
  "Condición después",
  "Deposit Status",
  "Estado depósito",
]);
