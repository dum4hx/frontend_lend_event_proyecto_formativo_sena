/**
 * QuickCreateModal — Lightweight overlay for creating dependent entities
 * without leaving the current form/page.
 *
 * Example: The user is creating a Material Type but no categories exist.
 * A QuickCreateModal pops up to create the category, then returns focus
 * to the original form with the newly-created option pre-selected.
 */

import React from "react";
import { Modal } from "./Modal";
import { LoadingSpinner } from "./LoadingSpinner";
import { AlertTriangle } from "lucide-react";

export interface QuickCreateModalProps {
  /** Whether the modal is visible. */
  open: boolean;
  /** Close handler. */
  onClose: () => void;
  /** Modal title. */
  title: string;
  /** Short explanation shown above the form. */
  hint?: string;
  /** Form body. */
  children: React.ReactNode;
  /** Submit handler. */
  onSubmit: (e: React.FormEvent) => void;
  /** Loading state. */
  loading?: boolean;
  /** Submit button label. */
  submitLabel?: string;
}

export function QuickCreateModal({
  open,
  onClose,
  title,
  hint,
  children,
  onSubmit,
  loading = false,
  submitLabel = "Create & Continue",
}: QuickCreateModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      persistent={loading}
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="quick-create-form"
            className="btn-primary text-sm inline-flex items-center gap-2"
            disabled={loading}
          >
            {loading && <LoadingSpinner size="xs" />}
            {submitLabel}
          </button>
        </div>
      }
    >
      {hint && (
        <div className="flex items-start gap-3 p-3 mb-4 rounded-lg bg-[#FFD700]/5 border border-[#FFD700]/20">
          <AlertTriangle className="w-4 h-4 text-[#FFD700] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-300 leading-relaxed">{hint}</p>
        </div>
      )}
      <form id="quick-create-form" onSubmit={handleSubmit} className="space-y-4">
        {children}
      </form>
    </Modal>
  );
}
