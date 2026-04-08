/**
 * BatchListTable — Tabular view of maintenance batches with status badges
 * and contextual action buttons per row.
 */

import React from "react";
import { Eye, Pencil, Play, Plus, XCircle, Wrench } from "lucide-react";
import { DataTable, StatusBadge, type ColumnDef } from "../../../../../components/ui";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { getMaintenanceBatchStatusLabel } from "../../../../../utils/statusLabels";
import type { MaintenanceBatchListItem } from "../../../../../types/api";

interface BatchListTableProps {
  /** Batch rows to display. */
  batches: MaintenanceBatchListItem[];
  /** Loading state. */
  loading: boolean;
  /** View batch detail callback. */
  onView: (batch: MaintenanceBatchListItem) => void;
  /** Edit batch callback (draft only). */
  onEdit: (batch: MaintenanceBatchListItem) => void;
  /** Start batch callback (draft only, requires items). */
  onStart: (batch: MaintenanceBatchListItem) => void;
  /** Cancel batch callback (draft | in_progress). */
  onCancel: (batch: MaintenanceBatchListItem) => void;
  /** Add items callback (draft only). */
  onAddItems: (batch: MaintenanceBatchListItem) => void;
  /** Repair materials callback (in_progress only). */
  onRepairItems: (batch: MaintenanceBatchListItem) => void;
}

export function BatchListTable({
  batches,
  loading,
  onView,
  onEdit,
  onStart,
  onCancel,
  onAddItems,
  onRepairItems,
}: BatchListTableProps) {
  const { t, formatDate, formatCurrency, language } = useLanguage();

  const columns: ColumnDef<MaintenanceBatchListItem>[] = [
    {
      key: "batchNumber",
      header: t("maintenance.batchNumber"),
      render: (row) => (
        <span className="font-mono text-xs text-[#FFD700] bg-[#FFD700]/10 px-2 py-0.5 rounded">
          {row.batchNumber ?? `#${row._id.slice(-6).toUpperCase()}`}
        </span>
      ),
      width: "w-40",
    },
    {
      key: "name",
      header: t("maintenance.batchName"),
      truncate: 40,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusBadge
          status={row.status}
          label={getMaintenanceBatchStatusLabel(row.status, language)}
        />
      ),
      width: "w-32",
    },
    {
      key: "items",
      header: t("maintenance.items"),
      render: (row) => <span>{row.items.length}</span>,
      width: "w-20",
      align: "center",
    },
    {
      key: "totalEstimatedCost",
      header: t("maintenance.totalEstimatedCost"),
      render: (row) => <span>{formatCurrency(row.totalEstimatedCost)}</span>,
      width: "w-28",
      hideBelow: "md",
    },
    {
      key: "totalActualCost",
      header: t("maintenance.totalActualCost"),
      render: (row) => <span>{formatCurrency(row.totalActualCost)}</span>,
      width: "w-28",
      hideBelow: "md",
    },
    {
      key: "createdAt",
      header: t("maintenance.createdAt"),
      render: (row) => <span>{formatDate(row.createdAt)}</span>,
      width: "w-32",
      hideBelow: "lg",
    },
    {
      key: "actions",
      header: t("maintenance.actions"),
      width: "w-36",
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title={t("maintenance.action.viewDetail")}
            onClick={(e) => {
              e.stopPropagation();
              onView(row);
            }}
          >
            <Eye size={16} />
          </button>
          {row.status === "draft" && (
            <>
              <button
                type="button"
                className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title={t("maintenance.action.edit")}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(row);
                }}
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                className="p-1 rounded hover:bg-white/10 text-[#FFD700] hover:text-yellow-300 transition-colors"
                title={t("maintenance.action.addItems")}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddItems(row);
                }}
              >
                <Plus size={16} />
              </button>
              {row.items.length > 0 && (
                <button
                  type="button"
                  className="p-1 rounded hover:bg-white/10 text-green-400 hover:text-green-300 transition-colors"
                  title={t("maintenance.action.start")}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStart(row);
                  }}
                >
                  <Play size={16} />
                </button>
              )}
            </>
          )}
          {row.status === "in_progress" && (
            <button
              type="button"
              className="p-1 rounded hover:bg-white/10 text-[#FFD700] hover:text-yellow-300 transition-colors"
              title={t("maintenance.action.repairItems")}
              onClick={(e) => {
                e.stopPropagation();
                onRepairItems(row);
              }}
            >
              <Wrench size={16} />
            </button>
          )}
          {(row.status === "draft" || row.status === "in_progress") && (
            <button
              type="button"
              className="p-1 rounded hover:bg-white/10 text-red-400 hover:text-red-300 transition-colors"
              title={t("maintenance.action.cancel")}
              onClick={(e) => {
                e.stopPropagation();
                onCancel(row);
              }}
            >
              <XCircle size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div data-help-id="maintenance-batch-table">
      <DataTable
        data={batches}
        columns={columns}
        loading={loading}
        emptyMessage={t("maintenance.noBatches")}
        onRowClick={onView}
      />
    </div>
  );
}
