/**
 * DataTable — Generic, typed table with column definitions, loading skeleton,
 * empty state, text truncation, responsive horizontal scroll, and row actions.
 *
 * Usage:
 * ```tsx
 * <DataTable
 *   data={customers}
 *   columns={[
 *     { key: "name", header: "Name", render: (c) => formatName(c.name) },
 *     { key: "email", header: "Email" },
 *     { key: "status", header: "Status", render: (c) => <StatusBadge status={c.status} /> },
 *   ]}
 *   onRowClick={(c) => openDetail(c)}
 *   loading={isLoading}
 * />
 * ```
 */

import React from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { TruncatedText } from "./TruncatedText";

// ─── Column definition ────────────────────────────────────────────────────

export interface ColumnDef<T> {
  /** Unique key — also used to access `row[key]` when no `render` is provided. */
  key: string;
  /** Column header text. */
  header: string;
  /** Custom renderer. When omitted, the value at `row[key]` is converted to string. */
  render?: (row: T, index: number) => React.ReactNode;
  /** Max characters before truncation (only applied to the default string renderer). */
  truncate?: number;
  /** Tailwind width class override (e.g. `"w-52"`, `"min-w-[200px]"`). */
  width?: string;
  /** Hide column below this breakpoint. Uses Tailwind responsive prefixes. */
  hideBelow?: "sm" | "md" | "lg" | "xl";
  /** Text alignment. */
  align?: "left" | "center" | "right";
}

// ─── Props ─────────────────────────────────────────────────────────────────

export interface DataTableProps<T> {
  /** Rows to render. */
  data: T[];
  /** Column definitions. */
  columns: ColumnDef<T>[];
  /** Callback when a row is clicked. */
  onRowClick?: (row: T) => void;
  /** Whether data is currently loading. */
  loading?: boolean;
  /** Number of skeleton rows shown while loading. */
  skeletonRows?: number;
  /** Custom empty-state message. */
  emptyMessage?: string;
  /** Extra class names on the wrapper. */
  className?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const responsiveMap: Record<string, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

const alignMap: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[part];
    return undefined;
  }, obj);
}

function getRowKey<T>(row: T, fallback: number): string | number {
  const record = row as Record<string, unknown>;
  if (typeof record._id === "string") return record._id;
  if (typeof record.id === "string") return record.id;
  if (typeof record.id === "number") return record.id;
  return fallback;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function DataTable<T>({ 
  data,
  columns,
  onRowClick,
  loading = false,
  skeletonRows = 5,
  emptyMessage = "No data to display.",
  className = "",
}: DataTableProps<T>) {
  return (
    <div className={`table-container ${className}`}>
      <table className="table">
        {/* Header */}
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  col.width,
                  col.hideBelow ? responsiveMap[col.hideBelow] : "",
                  col.align ? alignMap[col.align] : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {loading
            ? Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={`skel-${i}`}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={col.hideBelow ? responsiveMap[col.hideBelow] : ""}
                    >
                      <div className="h-4 bg-white/5 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            : data.length === 0
              ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-16 text-gray-500 text-sm">
                    {emptyMessage}
                  </td>
                </tr>
              )
              : data.map((row, idx) => (
                <tr
                  key={getRowKey(row, idx)}
                  className={onRowClick ? "cursor-pointer" : ""}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => {
                    const cellClass = [
                      col.hideBelow ? responsiveMap[col.hideBelow] : "",
                      col.align ? alignMap[col.align] : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    if (col.render) {
                      return (
                        <td key={col.key} className={cellClass}>
                          {col.render(row, idx)}
                        </td>
                      );
                    }

                    const raw = getNestedValue(row, col.key);
                    const text = raw != null ? String(raw) : "—";

                    return (
                      <td key={col.key} className={cellClass}>
                        {col.truncate ? (
                          <TruncatedText text={text} maxLength={col.truncate} />
                        ) : (
                          text
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
        </tbody>
      </table>

      {/* Centered loading overlay when refetching existing data */}
      {loading && data.length > 0 && (
        <div className="flex justify-center py-4 border-t border-[#333]">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  );
}
