/**
 * Pagination — Standalone pagination control.
 *
 * Shows page numbers with ellipsis for large ranges, plus prev/next buttons.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  /** Current 1-based page index. */
  page: number;
  /** Total number of pages. */
  totalPages: number;
  /** Called when the user selects a different page. */
  onPageChange: (page: number) => void;
  /** Extra class names. */
  className?: string;
}

function getRange(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("ellipsis");

  pages.push(total);
  return pages;
}

export function Pagination({ page, totalPages, onPageChange, className = "" }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getRange(page, totalPages);

  return (
    <nav className={`flex items-center justify-center gap-1 ${className}`} aria-label="Pagination">
      {/* Prev */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Page buttons */}
      {pages.map((p, idx) =>
        p === "ellipsis" ? (
          <span key={`ell-${idx}`} className="px-2 text-gray-600 text-sm select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`min-w-[32px] h-8 rounded-lg text-xs font-semibold transition-colors ${
              p === page
                ? "bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        ),
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
