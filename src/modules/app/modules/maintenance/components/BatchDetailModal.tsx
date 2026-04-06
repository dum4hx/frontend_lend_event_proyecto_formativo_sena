/**
 * BatchDetailModal — Displays full maintenance batch detail with items table and contextual actions.
 */

import React from "react";
import { X, Play, XCircle, Plus, Trash2, Wrench } from "lucide-react";
import { StatusBadge } from "../../../../../components/ui";
import { useLanguage } from "../../../../../contexts/useLanguage";
import type {
  MaintenanceBatch,
  MaintenanceBatchItem,
  MaintenanceBatchStatus,
  MaintenanceItemStatus,
} from "../../../../../types/api";

interface BatchDetailModalProps {
  /** The batch to display. */
  batch: MaintenanceBatch | null;
  /** Close handler. */
  onClose: () => void;
  /** Called when the user clicks "Start Batch". */
  onStart: (id: string) => void;
  /** Called when the user clicks "Cancel Batch". */
  onCancel: (id: string) => void;
  /** Called when the user clicks "Add Items". */
  onAddItems: () => void;
  /** Called when the user clicks "Remove" on a specific item. */
  onRemoveItem: (instanceId: string) => void;
  /** Called when the user clicks "Resolve" on a specific item. */
  onResolveItem: (item: MaintenanceBatchItem) => void;
}

export function BatchDetailModal({
  batch,
  onClose,
  onStart,
  onCancel,
  onAddItems,
  onRemoveItem,
  onResolveItem,
}: BatchDetailModalProps) {
  const { t, formatDate, formatCurrency } = useLanguage();

  if (!batch) return null;

  const isDraft = batch.status === "draft";
  const isInProgress = batch.status === "in_progress";
  const canStart = isDraft && batch.items.length > 0;

  const getInstanceId = (item: MaintenanceBatchItem): string =>
    typeof item.materialInstanceId === "string"
      ? item.materialInstanceId
      : item.materialInstanceId._id;

  const getSerialNumber = (item: MaintenanceBatchItem): string =>
    typeof item.materialInstanceId === "string"
      ? item.materialInstanceId
      : item.materialInstanceId.serialNumber;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-[#121212] border border-[#333] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        data-help-id="maintenance-batch-detail"
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#121212] border-b border-[#333] p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">{batch.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={batch.status as MaintenanceBatchStatus} />
              <span className="text-sm text-gray-400">{formatDate(batch.createdAt)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#1a1a1a] rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Info section */}
          <div>
            <h3 className="text-xs font-semibold text-[#FFD700] uppercase tracking-widest mb-4">
              {t("maintenance.title")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#1a1a1a] p-5 rounded-lg border border-[#222]">
              {batch.description && (
                <div className="col-span-2">
                  <span className="block text-xs text-gray-400 uppercase mb-1">
                    {t("maintenance.batchDescription")}
                  </span>
                  <p className="text-white">{batch.description}</p>
                </div>
              )}
              {batch.scheduledStartDate && (
                <div>
                  <span className="block text-xs text-gray-400 uppercase mb-1">
                    {t("maintenance.scheduledStartDate")}
                  </span>
                  <p className="text-white">{formatDate(batch.scheduledStartDate)}</p>
                </div>
              )}
              {batch.scheduledEndDate && (
                <div>
                  <span className="block text-xs text-gray-400 uppercase mb-1">
                    {t("maintenance.scheduledEndDate")}
                  </span>
                  <p className="text-white">{formatDate(batch.scheduledEndDate)}</p>
                </div>
              )}
              <div>
                <span className="block text-xs text-gray-400 uppercase mb-1">
                  {t("maintenance.stats.estimatedCost")}
                </span>
                <p className="text-white text-lg font-semibold">
                  {formatCurrency(batch.totalEstimatedCost)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("maintenance.batchEstimatedCostDesc")}
                </p>
              </div>
              <div>
                <span className="block text-xs text-gray-400 uppercase mb-1">
                  {t("maintenance.stats.actualCost")}
                </span>
                <p className="text-white text-lg font-semibold">
                  {formatCurrency(batch.totalActualCost)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{t("maintenance.batchActualCostDesc")}</p>
              </div>
              {batch.notes && (
                <div className="col-span-2">
                  <span className="block text-xs text-gray-400 uppercase mb-1">
                    {t("maintenance.notes")}
                  </span>
                  <p className="text-white">{batch.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3" data-help-id="maintenance-batch-detail-actions">
            {isDraft && (
              <button
                onClick={onAddItems}
                className="btn-primary flex items-center gap-2"
                data-help-id="maintenance-add-items-btn"
              >
                <Plus size={16} />
                {t("maintenance.action.addItems")}
              </button>
            )}
            {canStart && (
              <button
                onClick={() => onStart(batch._id)}
                className="btn-success flex items-center gap-2"
              >
                <Play size={16} />
                {t("maintenance.action.startBatch")}
              </button>
            )}
            {(isDraft || isInProgress) && (
              <button
                onClick={() => onCancel(batch._id)}
                className="btn-danger flex items-center gap-2"
              >
                <XCircle size={16} />
                {t("maintenance.action.cancelBatch")}
              </button>
            )}
          </div>

          {/* Items table */}
          <div>
            <h3 className="text-xs font-semibold text-[#FFD700] uppercase tracking-widest mb-4">
              {t("maintenance.items")} ({batch.items.length})
            </h3>

            {batch.items.length === 0 ? (
              <p className="text-gray-400 text-sm">{t("maintenance.noItems")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#333] text-left text-xs text-gray-400 uppercase">
                      <th className="p-3">{t("maintenance.itemSerialNumber")}</th>
                      <th className="p-3">{t("maintenance.entryReason")}</th>
                      <th className="p-3">{t("maintenance.itemStatus")}</th>
                      <th className="p-3">{t("maintenance.sourceType")}</th>
                      <th className="p-3">{t("maintenance.estimatedCost")}</th>
                      <th className="p-3">{t("maintenance.actualCost")}</th>
                      <th className="p-3">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batch.items.map((item) => {
                      const instanceId = getInstanceId(item);
                      return (
                        <tr key={item._id} className="border-b border-[#222] hover:bg-[#1a1a1a]">
                          <td className="p-3 text-white font-mono text-xs">
                            {getSerialNumber(item)}
                          </td>
                          <td className="p-3 text-gray-300">
                            {t(`maintenance.entryReasons.${item.entryReason}`)}
                          </td>
                          <td className="p-3">
                            <StatusBadge status={item.itemStatus as MaintenanceItemStatus} />
                          </td>
                          <td className="p-3 text-gray-300">
                            {t(`maintenance.sourceTypes.${item.sourceType}`)}
                          </td>
                          <td className="p-3 text-gray-300">
                            {item.estimatedCost != null ? formatCurrency(item.estimatedCost) : "—"}
                          </td>
                          <td className="p-3 text-gray-300">
                            {item.actualCost != null ? formatCurrency(item.actualCost) : "—"}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              {isDraft && (
                                <button
                                  onClick={() => onRemoveItem(instanceId)}
                                  className="text-red-400 hover:text-red-300 p-1"
                                  title={t("maintenance.action.removeItem")}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                              {isInProgress && item.itemStatus === "in_repair" && (
                                <button
                                  onClick={() => onResolveItem(item)}
                                  className="text-[#FFD700] hover:text-yellow-300 p-1"
                                  title={t("maintenance.action.resolveItem")}
                                >
                                  <Wrench size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
