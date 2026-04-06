import React, { useState, useCallback, useMemo } from "react";
import { RefreshCcw, FileText, Table2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { exportTableToPDF, exportTableToXLSX } from "../../../../../utils/tableExport";
import type { CatalogMaterialType } from "../../../../../types/api";
import {
  useCatalogOverview,
  useMaterialCategories,
  materialKeys,
  useLocations,
} from "../../../../../hooks/queries";
import { ErrorDisplay, EmptyState } from "../../../../../components/ui";
import { AdminPagination } from "../../../components";
import { CatalogSummaryCards, CatalogFilters, CatalogTable } from "../components";
import type { CatalogOverviewQueryParams } from "../../../../../types/api";
import type { SelectOption } from "../../../../../components/ui";

/**
 * CatalogOverview — Aggregated operational view of the material catalog.
 *
 * Displays org-wide summary stats, a filterable/searchable table of material
 * types with instance counts, availability/utilization metrics, and alerts.
 */
export const CatalogOverview: React.FC = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  // ── Filter state ──────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const params: CatalogOverviewQueryParams = {
    ...(search && { search }),
    ...(categoryId && { categoryId }),
    ...(locationId && { locationId }),
    page,
    limit,
  };

  // ── Data hooks ────────────────────────────────────────────────────────
  const { data, isLoading, isError, error } = useCatalogOverview(params);
  const { data: categories = [] } = useMaterialCategories();
  const { data: locations = [] } = useLocations();

  const locationOptions: SelectOption[] = locations.map((loc) => ({
    value: loc._id,
    label: loc.name,
  }));
  // ── Derived data ──────────────────────────────────────────────────
  const summary = data?.summary;
  const materialTypes = useMemo(() => data?.materialTypes ?? [], [data?.materialTypes]);
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  // ── Handlers ──────────────────────────────────────────────────────────
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setCategoryId(value);
    setPage(1);
  }, []);

  const handleLocationChange = useCallback((value: string) => {
    setLocationId(value);
    setPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: materialKeys.catalogOverview.all });
  }, [queryClient]);

  const buildExportData = useCallback(
    (items: CatalogMaterialType[]) => {
      const headers = [
        t("catalogOverview.table.name"),
        t("catalogOverview.table.pricePerDay"),
        t("catalogOverview.table.categories"),
        t("catalogOverview.table.instances"),
        t("catalogOverview.table.available"),
        t("catalogOverview.table.availability"),
        t("catalogOverview.table.utilization"),
        t("catalogOverview.table.alerts"),
      ];
      const rows = items.map((mt) => ({
        Name: mt.name,
        "Price / Day": mt.pricePerDay,
        Categories: mt.categories.map((c) => c.name).join(", ") || "—",
        Instances: mt.totals.totalInstances,
        Available: mt.totals.available,
        "Availability %": `${(mt.metrics.availabilityRate * 100).toFixed(1)}%`,
        "Utilization %": `${(mt.metrics.utilizationRate * 100).toFixed(1)}%`,
        Alerts: mt.alerts.map((a) => a.type).join(", ") || "—",
      }));
      return { headers, rows };
    },
    [t],
  );

  const handleExportPDF = useCallback(() => {
    const date = new Date().toISOString().slice(0, 10);
    const exportData = buildExportData(materialTypes);
    exportTableToPDF(exportData, `catalog-overview-${date}.pdf`, "Catalog Overview");
  }, [materialTypes, buildExportData]);

  const handleExportXLSX = useCallback(() => {
    const date = new Date().toISOString().slice(0, 10);
    const exportData = buildExportData(materialTypes);
    exportTableToXLSX(exportData, `catalog-overview-${date}.xlsx`);
  }, [materialTypes, buildExportData]);

  // ── Loading / Error states ────────────────────────────────────────────
  if (isError) {
    return (
      <ErrorDisplay
        error={error?.message ?? t("catalogOverview.errorLoad")}
        onRetry={handleRefresh}
      />
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-500">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {t("catalogOverview.title")}{" "}
            <span className="text-[#FFD700]">{t("catalogOverview.titleHighlight")}</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm max-w-lg">{t("catalogOverview.description")}</p>
        </div>

        <div className="flex items-center gap-3 self-start">
          <button
            onClick={handleExportPDF}
            disabled={isLoading || materialTypes.length === 0}
            className="flex items-center gap-2 px-4 py-2 gold-action-btn font-semibold rounded-lg transition disabled:opacity-50"
            title={t("catalogOverview.exportPdf")}
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={handleExportXLSX}
            disabled={isLoading || materialTypes.length === 0}
            className="flex items-center gap-2 px-4 py-2 gold-action-btn font-semibold rounded-lg transition disabled:opacity-50"
            title={t("catalogOverview.exportExcel")}
          >
            <Table2 className="w-4 h-4" />
            XLS
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-3 bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white hover:border-[#444] rounded-xl transition-all disabled:opacity-50"
            title={t("catalogOverview.refresh")}
          >
            <RefreshCcw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────── */}
      {summary && <CatalogSummaryCards summary={summary} />}

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <CatalogFilters
        search={search}
        onSearchChange={handleSearchChange}
        categoryId={categoryId}
        onCategoryChange={handleCategoryChange}
        categories={categories}
        locationId={locationId}
        onLocationChange={handleLocationChange}
        locationOptions={locationOptions}
      />

      {/* ── Table ──────────────────────────────────────────────────────── */}
      {materialTypes.length === 0 && !isLoading ? (
        <EmptyState
          title={t("catalogOverview.empty")}
          description={t("catalogOverview.emptyHint")}
        />
      ) : (
        <CatalogTable data={materialTypes} loading={isLoading} />
      )}

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {totalPages > 1 && pagination && (
        <AdminPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={pagination.total}
          pageSize={limit}
          itemLabel={t("catalogOverview.paginationLabel")}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};
