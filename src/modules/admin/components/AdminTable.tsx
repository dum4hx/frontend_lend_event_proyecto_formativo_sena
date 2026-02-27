import type { ReactNode } from "react";

interface AdminTableProps {
  children: ReactNode;
  className?: string;
}

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  className?: string;
}

export function AdminTable({ children, className = "" }: AdminTableProps) {
  return (
    <div className={`bg-[#121212] border border-[#333] rounded-lg overflow-hidden ${className}`.trim()}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">{children}</table>
      </div>
    </div>
  );
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  itemLabel = "items",
  onPageChange,
  className = "",
}: AdminPaginationProps) {
  if (totalItems <= pageSize || totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`mt-4 flex items-center justify-between ${className}`.trim()}>
      <p className="text-sm text-gray-400">
        Showing {start} - {end} of {totalItems} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-[#1a1a1a] border border-[#333] rounded text-gray-200 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-400">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-[#1a1a1a] border border-[#333] rounded text-gray-200 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
