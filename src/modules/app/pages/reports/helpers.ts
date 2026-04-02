import type { Customer, MaterialCategory, ReportRow } from "./types";

// ─── Constants ─────────────────────────────────────────────────────────────

export const PAGE_SIZE = 20;

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

export function getReferenceId(
  value: string | { _id?: string } | undefined,
): string | undefined {
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

// ─── CSV Export ─────────────────────────────────────────────────────────────

export function exportToCSV(headers: string[], rows: ReportRow[], filename: string): void {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row.columns[h] ?? "";
          const str = String(val).replace(/"/g, '""');
          return str.includes(",") || str.includes('"') ? `"${str}"` : str;
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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
      return "bg-blue-900/60 text-blue-300";
    default:
      return "bg-zinc-700 text-zinc-300";
  }
};

export const STATUS_COLUMNS = new Set(["Status", "status"]);
