/**
 * AddItemsModal — Form modal for adding material instances to a draft maintenance batch.
 */

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { FormModal } from "../../../../../components/ui";
import { useLanguage } from "../../../../../contexts/useLanguage";
import type {
  AddMaintenanceBatchItemInput,
  AddMaintenanceBatchItemsPayload,
  MaintenanceEntryReason,
  MaintenanceSourceType,
} from "../../../../../types/api";

interface AddItemsModalProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Close handler. */
  onClose: () => void;
  /** Submit handler — receives the typed payload. */
  onSubmit: (payload: AddMaintenanceBatchItemsPayload) => Promise<void>;
}

interface ItemFormRow {
  materialInstanceId: string;
  entryReason: MaintenanceEntryReason;
  sourceType: MaintenanceSourceType;
  sourceId: string;
  estimatedCost: string;
  repairNotes: string;
}

const EMPTY_ROW: ItemFormRow = {
  materialInstanceId: "",
  entryReason: "damaged",
  sourceType: "manual",
  sourceId: "",
  estimatedCost: "",
  repairNotes: "",
};

const ENTRY_REASONS: MaintenanceEntryReason[] = ["damaged", "lost", "other"];
const SOURCE_TYPES: MaintenanceSourceType[] = ["inspection", "incident", "manual"];

export function AddItemsModal({ open, onClose, onSubmit }: AddItemsModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ItemFormRow[]>([{ ...EMPTY_ROW }]);

  const resetForm = () => {
    setRows([{ ...EMPTY_ROW }]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const updateRow = (index: number, field: keyof ItemFormRow, value: string) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const isValid = rows.length > 0 && rows.every((r) => r.materialInstanceId.trim());

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const items: AddMaintenanceBatchItemInput[] = rows.map((r) => ({
        materialInstanceId: r.materialInstanceId.trim(),
        entryReason: r.entryReason,
        sourceType: r.sourceType,
        ...(r.sourceId.trim() && { sourceId: r.sourceId.trim() }),
        ...(r.estimatedCost && { estimatedCost: Number(r.estimatedCost) }),
        ...(r.repairNotes.trim() && { repairNotes: r.repairNotes.trim() }),
      }));
      const payload: AddMaintenanceBatchItemsPayload = { items };
      await onSubmit(payload);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title={t("maintenance.action.addItems")}
      onSubmit={handleSubmit}
      loading={loading}
      submitLabel={t("maintenance.action.addItems")}
      cancelLabel={t("common.cancel")}
      submitDisabled={!isValid}
      size="lg"
    >
      <div className="space-y-4" data-help-id="maintenance-add-items-form">
        {rows.map((row, index) => (
          <div key={index} className="p-4 border border-[#333] rounded-lg bg-[#1a1a1a] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 font-medium">
                {t("maintenance.items")} #{index + 1}
              </span>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Material Instance ID */}
              <div>
                <label className="form-label">{t("maintenance.itemSerialNumber")} *</label>
                <input
                  type="text"
                  className="form-input"
                  value={row.materialInstanceId}
                  onChange={(e) => updateRow(index, "materialInstanceId", e.target.value)}
                  required
                  data-help-id="maintenance-add-items-instance-id"
                />
              </div>

              {/* Entry Reason */}
              <div>
                <label className="form-label">{t("maintenance.entryReason")}</label>
                <select
                  className="form-input"
                  value={row.entryReason}
                  onChange={(e) => updateRow(index, "entryReason", e.target.value)}
                  data-help-id="maintenance-add-items-entry-reason"
                >
                  {ENTRY_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {t(`maintenance.entryReasons.${reason}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Type */}
              <div>
                <label className="form-label">{t("maintenance.sourceType")}</label>
                <select
                  className="form-input"
                  value={row.sourceType}
                  onChange={(e) => updateRow(index, "sourceType", e.target.value)}
                  data-help-id="maintenance-add-items-source-type"
                >
                  {SOURCE_TYPES.map((src) => (
                    <option key={src} value={src}>
                      {t(`maintenance.sourceTypes.${src}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estimated Cost */}
              <div>
                <label className="form-label">{t("maintenance.estimatedCost")}</label>
                <input
                  type="number"
                  className="form-input"
                  value={row.estimatedCost}
                  onChange={(e) => updateRow(index, "estimatedCost", e.target.value)}
                  min={0}
                  step="0.01"
                  data-help-id="maintenance-add-items-estimated-cost"
                />
              </div>
            </div>

            {/* Repair Notes */}
            <div>
              <label className="form-label">{t("maintenance.repairNotes")}</label>
              <textarea
                className="form-input"
                value={row.repairNotes}
                onChange={(e) => updateRow(index, "repairNotes", e.target.value)}
                rows={2}
                data-help-id="maintenance-add-items-repair-notes"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addRow}
          className="btn-secondary flex items-center gap-2 w-full justify-center"
        >
          <Plus size={16} />
          {t("maintenance.action.addItem")}
        </button>
      </div>
    </FormModal>
  );
}
