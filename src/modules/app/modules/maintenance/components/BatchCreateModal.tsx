/**
 * BatchCreateModal — Form modal for creating a new maintenance batch.
 */

import React, { useState } from "react";
import { FormModal } from "../../../../../components/ui";
import { useLanguage } from "../../../../../contexts/useLanguage";
import styles from "./BatchCreateModal.module.css";
import type { CreateMaintenanceBatchPayload } from "../../../../../types/api";

interface BatchCreateModalProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Close handler. */
  onClose: () => void;
  /** Submit handler — receives the typed payload. */
  onSubmit: (payload: CreateMaintenanceBatchPayload) => Promise<void>;
}

export function BatchCreateModal({ open, onClose, onSubmit }: BatchCreateModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledStartDate, setScheduledStartDate] = useState("");
  const [scheduledEndDate, setScheduledEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setScheduledStartDate("");
    setScheduledEndDate("");
    setNotes("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload: CreateMaintenanceBatchPayload = {
        name,
        ...(description && { description }),
        ...(scheduledStartDate && { scheduledStartDate }),
        ...(scheduledEndDate && { scheduledEndDate }),
        ...(notes && { notes }),
      };
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
      title={t("maintenance.action.createBatch")}
      onSubmit={handleSubmit}
      loading={loading}
      submitLabel={t("maintenance.action.createBatch")}
      cancelLabel={t("common.cancel")}
      submitDisabled={!name.trim()}
    >
      <div className="space-y-4" data-help-id="maintenance-batch-form-create">
        {/* Name */}
        <div>
          <label className="form-label" htmlFor="batch-name">
            {t("maintenance.batchName")} *
          </label>
          <input
            id="batch-name"
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
          <label className="form-label" htmlFor="batch-description">
            {t("maintenance.batchDescription")}
          </label>
          <textarea
            id="batch-description"
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
            <label className="form-label" htmlFor="batch-start-date">
              {t("maintenance.scheduledStartDate")}
            </label>
            <input
              id="batch-start-date"
              type="date"
              className={`form-input ${styles.dateInput}`}
              value={scheduledStartDate}
              onChange={(e) => setScheduledStartDate(e.target.value)}
              data-help-id="maintenance-batch-form-start-date"
            />
          </div>
          <div>
            <label className="form-label" htmlFor="batch-end-date">
              {t("maintenance.scheduledEndDate")}
            </label>
            <input
              id="batch-end-date"
              type="date"
              className={`form-input ${styles.dateInput}`}
              value={scheduledEndDate}
              onChange={(e) => setScheduledEndDate(e.target.value)}
              data-help-id="maintenance-batch-form-end-date"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="form-label" htmlFor="batch-notes">
            {t("maintenance.notes")}
          </label>
          <textarea
            id="batch-notes"
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
