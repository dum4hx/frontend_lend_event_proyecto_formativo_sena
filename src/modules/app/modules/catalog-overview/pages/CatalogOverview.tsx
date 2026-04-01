import React, { useState, useCallback } from "react";
import { RefreshCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCatalogOverview, useMaterialCategories, materialKeys } from "../../../../../hooks/queries";
import { LoadingSpinner, ErrorDisplay, EmptyState } from "../../../../../components/ui";
import { AdminPagination } from "../../../components";
import { CatalogSummaryCards, CatalogFilters, CatalogTable } from "../components";
import type { CatalogOverviewQueryParams } from "../../../../../types/api";

/**
 * CatalogOverview — Aggregated operational view of the material catalog.
 *
 * Displays org-wide summary stats, a filterable/searchable table of material
 * types with instance counts, availability/utilization metrics, and alerts.
 */
export const CatalogOverview: React.FC = () => {
  const queryClient = useQueryClient();

  // ── Filter state ──────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const params: CatalogOverviewQueryParams = {
    ...(search && { search }),
    ...(categoryId && { categoryId }),
    page,
    limit,
  };

  // ── Data hooks ────────────────────────────────────────────────────────
  const { data, isLoading, isError, error } = useCatalogOverview(params);
  const { data: categories = [] } = useMaterialCategories();

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setCategoryId(value);
    setPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: materialKeys.catalogOverview.all });
  }, [queryClient]);

  // ── Loading / Error states ────────────────────────────────────────────
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorDisplay error={error?.message ?? "Failed to load catalog overview"} onRetry={handleRefresh} />;
  }

  const summary = data?.summary;
  const materialTypes = data?.materialTypes ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-500">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Catalog <span className="text-[#FFD700]">Overview</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm max-w-lg">
            Aggregated operational view of your material catalog — availability,
            utilization, and alerts at a glance.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-3 bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white hover:border-[#444] rounded-xl transition-all disabled:opacity-50 self-start"
          title="Refresh data"
        >
          <RefreshCcw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
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
      />

      {/* ── Table ──────────────────────────────────────────────────────── */}
      {materialTypes.length === 0 && !isLoading ? (
        <EmptyState
          title="No material types found"
          description="Try adjusting your search or category filter."
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
          itemLabel="material types"
          onPageChange={setPage}
        />
      )}
    </div>
  );
};
