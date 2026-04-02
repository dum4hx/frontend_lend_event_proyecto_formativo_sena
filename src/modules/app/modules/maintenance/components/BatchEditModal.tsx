/**
 * BatchEditModal — Form modal for editing a draft maintenance batch.
 */

import React, { useEffect, useState } from "react";
import { FormModal } from "../../../../../components/ui";
import { useLanguage } from "../../../../../contexts/useLanguage";
import type { MaintenanceBatch, UpdateMaintenanceBatchPayload } from "../../../../../types/api";

interface BatchEditModalProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Close handler. */
  onClose: () => void;
  /** The batch to edit (must be in draft status). */
  batch: MaintenanceBatch | null;
  /** Submit handler — receives the typed payload. */
  onSubmit: (id: string, payload: UpdateMaintenanceBatchPayload) => Promise<void>;
}

export function BatchEditModal({ open, onClose, batch, onSubmit }: BatchEditModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledStartDate, setScheduledStartDate] = useState("");
  const [scheduledEndDate, setScheduledEndDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (batch) {
      setName(batch.name);
      setDescription(batch.description ?? "");
      setScheduledStartDate(batch.scheduledStartDate?.slice(0, 10) ?? "");
      setScheduledEndDate(batch.scheduledEndDate?.slice(0, 10) ?? "");
      setNotes(batch.notes ?? "");
    }
  }, [batch]);

  const handleSubmit = async () => {
    if (!batch) return;
    setLoading(true);
    try {
      const payload: UpdateMaintenanceBatchPayload = {
        ...(name !== batch.name && { name }),
        ...(description !== (batch.description ?? "") && { description }),
        ...(scheduledStartDate !== (batch.scheduledStartDate?.slice(0, 10) ?? "") && {
          scheduledStartDate,
        }),
        ...(scheduledEndDate !== (batch.scheduledEndDate?.slice(0, 10) ?? "") && {
          scheduledEndDate,
        }),
        ...(notes !== (batch.notes ?? "") && { notes }),
      };
      await onSubmit(batch._id, payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={t("maintenance.action.editBatch")}
      onSubmit={handleSubmit}
      loading={loading}
      submitLabel={t("common.save")}
      cancelLabel={t("common.cancel")}
      submitDisabled={!name.trim()}
    >
      <div className="space-y-4" data-help-id="maintenance-batch-form-edit">
        {/* Name */}
        <div>
          <label className="form-label" htmlFor="edit-batch-name">
            {t("maintenance.batchName")} *
          </label>
          <input
            id="edit-batch-name"
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            required
            data-help-id="maintenance-batch-form-name"
          />
        </div>

        {/* Description */}
        <div>
          <label className="form-label" htmlFor="edit-batch-description">
            {t("maintenance.batchDescription")}
          </label>
          <textarea
            id="edit-batch-description"
            className="form-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={3}
            data-help-id="maintenance-batch-form-description"
          />
        </div>

        {/* Scheduled dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label" htmlFor="edit-batch-start-date">
              {t("maintenance.scheduledStartDate")}
            </label>
            <input
              id="edit-batch-start-date"
              type="date"
              className="form-input"
              value={scheduledStartDate}
              onChange={(e) => setScheduledStartDate(e.target.value)}
              data-help-id="maintenance-batch-form-start-date"
            />
          </div>
          <div>
            <label className="form-label" htmlFor="edit-batch-end-date">
              {t("maintenance.scheduledEndDate")}
            </label>
            <input
              id="edit-batch-end-date"
              type="date"
              className="form-input"
              value={scheduledEndDate}
              onChange={(e) => setScheduledEndDate(e.target.value)}
              data-help-id="maintenance-batch-form-end-date"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="form-label" htmlFor="edit-batch-notes">
            {t("maintenance.notes")}
          </label>
          <textarea
            id="edit-batch-notes"
            className="form-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
            rows={2}
            data-help-id="maintenance-batch-form-notes"
          />
        </div>
      </div>
    </FormModal>
  );
}
