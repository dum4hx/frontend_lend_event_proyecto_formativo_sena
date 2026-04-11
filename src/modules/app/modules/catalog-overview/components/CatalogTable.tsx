import React, { useMemo } from "react";
import { DataTable } from "../../../../../components/ui";
import type { ColumnDef } from "../../../../../components/ui/DataTable";
import { useLanguage } from "../../../../../contexts/useLanguage";
import type { CatalogMaterialType } from "../../../../../types/api";
import { AlertBadge } from "./AlertBadge";

/** Format a 0–1 rate as a percentage string with one decimal. */
function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/** Color class for availability ratio (green / yellow / red). */
function availabilityColor(available: number, total: number): string {
  if (total === 0) return "text-gray-500";
  const ratio = available / total;
  if (ratio >= 0.5) return "text-green-400";
  if (ratio >= 0.2) return "text-yellow-400";
  return "text-red-400";
}

interface CatalogTableProps {
  /** Material type rows from the catalog overview response. */
  data: CatalogMaterialType[];
  /** Whether data is currently loading.  */
  loading: boolean;
}

/**
 * CatalogTable — DataTable wrapper with typed columns for the catalog overview.
 * Shows name, price, categories, instances count, availability (color-coded),
 * utilization, and alert badges.
 */
export const CatalogTable: React.FC<CatalogTableProps> = ({ data, loading }) => {
  const { t, formatCurrency } = useLanguage();

  const columns: ColumnDef<CatalogMaterialType>[] = useMemo(
    () => [
      {
        key: "name",
        header: t("catalogOverview.table.name"),
        width: "min-w-[180px]",
        render: (row) => <span className="font-medium text-white">{row.name}</span>,
      },
      {
        key: "pricePerDay",
        header: t("catalogOverview.table.pricePerDay"),
        align: "right",
        render: (row) => (
          <span className="font-mono text-gray-300">{formatCurrency(row.pricePerDay)}</span>
        ),
      },
      {
        key: "categories",
        header: t("catalogOverview.table.categories"),
        hideBelow: "md",
        render: (row) => (
          <span className="text-gray-400 text-xs">
            {row.categories.map((c) => c.name).join(", ") || "—"}
          </span>
        ),
      },
      {
        key: "totalInstances",
        header: t("catalogOverview.table.instances"),
        align: "center",
        render: (row) => <span className="font-mono text-white">{row.totals.totalInstances}</span>,
      },
      {
        key: "available",
        header: t("catalogOverview.table.available"),
        align: "center",
        render: (row) => (
          <span
            className={`font-mono font-bold ${availabilityColor(row.totals.available, row.totals.totalInstances)}`}
          >
            {row.totals.available}
          </span>
        ),
      },
      {
        key: "availabilityRate",
        header: t("catalogOverview.table.availability"),
        align: "center",
        hideBelow: "lg",
        render: (row) => (
          <span className="font-mono text-gray-300">{pct(row.metrics.availabilityRate)}</span>
        ),
      },
      {
        key: "utilizationRate",
        header: t("catalogOverview.table.utilization"),
        align: "center",
        hideBelow: "lg",
        render: (row) => (
          <span className="font-mono text-gray-300">{pct(row.metrics.utilizationRate)}</span>
        ),
      },
      {
        key: "alerts",
        header: t("catalogOverview.table.alerts"),
        align: "center",
        render: (row) =>
          row.alerts.length > 0 ? (
            <div className="flex flex-wrap gap-1 justify-center">
              {row.alerts.map((alert, i) => (
                <AlertBadge key={`${alert.type}-${i}`} alert={alert} />
              ))}
            </div>
          ) : (
            <span className="text-gray-600 text-xs">—</span>
          ),
      },
    ],
    [t, formatCurrency],
  );

  return (
    <div className="bg-[#121212] border border-[#222] rounded-2xl overflow-hidden shadow-2xl">
      <DataTable<CatalogMaterialType>
        data={data}
        columns={columns}
        loading={loading}
        skeletonRows={8}
        emptyMessage={t("catalogOverview.table.emptyFilter")}
      />
    </div>
  );
};
