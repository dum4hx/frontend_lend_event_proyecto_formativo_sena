import { ChevronLeft, ChevronRight, FileText, RefreshCw } from "lucide-react";
import { useLanguage } from "../../../../contexts/useLanguage";
import { PAGE_SIZE, statusBadgeClass, STATUS_COLUMNS } from "./helpers";
import type { ReportRow } from "./types";

interface ReportsTableProps {
  headers: string[];
  rows: ReportRow[];
  loading: boolean;
  error: string | null;
  page: number;
  onPageChange: (page: number) => void;
  moduleLabel: string;
  totalCount?: number;
  isEs?: boolean;
}

export function ReportsTable({
  headers,
  rows,
  loading,
  error,
  page,
  onPageChange,
  moduleLabel,
  totalCount,
}: ReportsTableProps) {
  const { t } = useLanguage();

  const isServerPaginated = totalCount !== undefined;
  const effectiveTotal = isServerPaginated ? totalCount : rows.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / PAGE_SIZE));
  const pagedRows = isServerPaginated ? rows : rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Table header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div>
          <h2 className="text-white font-semibold">
            {moduleLabel} — {t("reports.table.page")} {page} {t("reports.table.of")} {totalPages}
          </h2>
          <p className="text-gray-400 text-xs mt-0.5">
            {loading ? t("reports.table.loading") : `${effectiveTotal} records`}
          </p>
        </div>
      </div>

      {error && (
        <div className="m-4 p-4 bg-red-900/20 border border-red-500/40 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-gray-400">
          <RefreshCw size={32} className="animate-spin mx-auto mb-3 text-yellow-400" />
          {t("reports.table.loading")}
        </div>
      ) : rows.length === 0 ? (
        <div className="p-12 text-center text-gray-400">
          <FileText size={40} className="mx-auto mb-3 opacity-40" />
          {t("reports.noData")}
          <p className="text-xs mt-1 text-gray-500">{t("reports.noDataHint")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-800/60 border-b border-zinc-700">
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-gray-400 font-medium whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {pagedRows.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-800/40 transition-colors">
                  {headers.map((h) => {
                    const val = row.columns[h] ?? "—";
                    const isStatus = STATUS_COLUMNS.has(h);
                    return (
                      <td key={h} className="px-5 py-3 text-gray-300 whitespace-nowrap">
                        {isStatus ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(String(val))}`}
                          >
                            {String(val)}
                          </span>
                        ) : (
                          String(val)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && rows.length > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
          <span className="text-xs text-gray-400">
            {t("reports.table.showing", {
              from: (page - 1) * PAGE_SIZE + 1,
              to: Math.min(page * PAGE_SIZE, effectiveTotal),
              total: effectiveTotal,
            })}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 transition"
              aria-label={t("reports.table.previous")}
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 6, page - 3)) + i;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                    p === page
                      ? "bg-yellow-400 text-black"
                      : "text-gray-400 hover:bg-zinc-700 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 transition"
              aria-label={t("reports.table.next")}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
