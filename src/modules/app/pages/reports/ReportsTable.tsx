import { ChevronLeft, ChevronRight, FileText, RefreshCw } from "lucide-react";
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
  isEs: boolean;
}

export function ReportsTable({
  headers,
  rows,
  loading,
  error,
  page,
  onPageChange,
  moduleLabel,
  isEs,
}: ReportsTableProps) {
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Table header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div>
          <h2 className="text-white font-semibold">
            {moduleLabel} {isEs ? "- Reporte" : "Report"}
          </h2>
          <p className="text-gray-400 text-xs mt-0.5">
            {loading
              ? isEs
                ? "Cargando..."
                : "Loading…"
              : isEs
                ? `${rows.length} registros encontrados`
                : `${rows.length} records found`}
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
          {isEs ? "Cargando datos..." : "Loading data…"}
        </div>
      ) : rows.length === 0 ? (
        <div className="p-12 text-center text-gray-400">
          <FileText size={40} className="mx-auto mb-3 opacity-40" />
          {isEs
            ? "No hay registros para esta combinacion de filtros."
            : "No records for this filter combination."}
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
            {isEs
              ? `Mostrando ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, rows.length)} de ${rows.length}`
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, rows.length)} of ${rows.length}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 transition"
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
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
