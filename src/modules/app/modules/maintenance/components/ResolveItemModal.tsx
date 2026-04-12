/**
 * ResolveItemModal — Form modal for resolving a maintenance batch item.
 */

import React, { useState } from "react";
import { Copy } from "lucide-react";
import { FormModal } from "../../../../../components/ui";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { useCopyToClipboard } from "../../../../../hooks/useCopyToClipboard";
import type {
  MaintenanceBatchItem,
  MaintenanceResolution,
  ResolveMaintenanceBatchItemPayload,
} from "../../../../../types/api";

interface ResolveItemModalProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Close handler. */
  onClose: () => void;
  /** The item being resolved. */
  item: MaintenanceBatchItem | null;
  /** Submit handler — receives instanceId and payload. */
  onSubmit: (instanceId: string, payload: ResolveMaintenanceBatchItemPayload) => Promise<void>;
}

const RESOLUTIONS: MaintenanceResolution[] = ["repaired", "unrecoverable"];

export function ResolveItemModal({ open, onClose, item, onSubmit }: ResolveItemModalProps) {
  const { t } = useLanguage();
  const { copy } = useCopyToClipboard();
  const [loading, setLoading] = useState(false);
  const [resolution, setResolution] = useState<MaintenanceResolution>("repaired");
  const [actualCost, setActualCost] = useState("");
  const [repairNotes, setRepairNotes] = useState("");

  const resetForm = () => {
    setResolution("repaired");
    setActualCost("");
    setRepairNotes("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!item) return;
    setLoading(true);
    try {
      const instanceId =
        typeof item.materialInstanceId === "string"
          ? item.materialInstanceId
          : item.materialInstanceId._id;

      const payload: ResolveMaintenanceBatchItemPayload = {
        resolution,
        ...(actualCost && { actualCost: Number(actualCost) }),
        ...(repairNotes.trim() && { repairNotes: repairNotes.trim() }),
      };
      await onSubmit(instanceId, payload);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const serialNumber = item
    ? typeof item.materialInstanceId === "string"
      ? item.materialInstanceId
      : item.materialInstanceId.serialNumber
    : "";

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title={t("maintenance.action.resolve")}
      onSubmit={handleSubmit}
      loading={loading}
      submitLabel={t("maintenance.action.resolve")}
      cancelLabel={t("common.cancel")}
    >
      <div className="space-y-4" data-help-id="maintenance-resolve-item-form">
        {/* Item info */}
        {serialNumber && (
          <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#333]">
            <span className="text-xs text-gray-400 uppercase">{t("maintenance.serialNumber")}</span>
            <button
              type="button"
              onClick={() => copy(serialNumber)}
              className="text-white font-mono hover:text-[#FFD700] hover:underline transition-colors flex items-center gap-1 group/copy w-fit"
              title="Haz click para copiar"
            >
              {serialNumber}
              <Copy size={12} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" />
            </button>
          </div>
        )}

        {/* Resolution */}
        <div>
          <label className="form-label" htmlFor="resolve-resolution">
            {t("maintenance.form.resolution")} *
          </label>
          <select
            id="resolve-resolution"
            className="form-input"
            value={resolution}
            onChange={(e) => setResolution(e.target.value as MaintenanceResolution)}
            data-help-id="maintenance-resolve-item-resolution"
          >
            {RESOLUTIONS.map((r) => (
              <option key={r} value={r}>
                {t(`maintenance.resolution.${r}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Actual Cost */}
        <div>
          <label className="form-label" htmlFor="resolve-actual-cost">
            {t("maintenance.form.actualCost")}
          </label>
          <input
            id="resolve-actual-cost"
            type="number"
            className="form-input"
            value={actualCost}
            onChange={(e) => setActualCost(e.target.value)}
            min={0}
            step="0.01"
            data-help-id="maintenance-resolve-item-actual-cost"
          />
        </div>

        {/* Repair Notes */}
        <div>
          <label className="form-label" htmlFor="resolve-repair-notes">
            {t("maintenance.form.repairNotes")}
          </label>
          <textarea
            id="resolve-repair-notes"
            className="form-input"
            value={repairNotes}
            onChange={(e) => setRepairNotes(e.target.value)}
            rows={3}
            data-help-id="maintenance-resolve-item-repair-notes"
          />
        </div>
      </div>
    </FormModal>
  );
}
