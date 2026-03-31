/**
 * FormModal — Modal wrapper that provides a standardised form layout
 * with submit/cancel footer and loading state.
 */

import React from "react";
import { Modal, type ModalSize } from "./Modal";
import { LoadingSpinner } from "./LoadingSpinner";

export interface FormModalProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Close handler. */
  onClose: () => void;
  /** Modal title. */
  title: string;
  /** Form body. */
  children: React.ReactNode;
  /** Called on submit. */
  onSubmit: (e: React.FormEvent) => void;
  /** Whether the form is currently submitting. */
  loading?: boolean;
  /** Text for the submit button. */
  submitLabel?: string;
  /** Text for the cancel button. */
  cancelLabel?: string;
  /** Modal size. */
  size?: ModalSize;
  /** Disable submit (e.g. validation not met). */
  submitDisabled?: boolean;
}

export function FormModal({
  open,
  onClose,
  title,
  children,
  onSubmit,
  loading = false,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  size = "md",
  submitDisabled = false,
}: FormModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      persistent={loading}
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            form="form-modal-form"
            className="btn-primary text-sm inline-flex items-center gap-2"
            disabled={loading || submitDisabled}
          >
            {loading && <LoadingSpinner size="xs" />}
            {submitLabel}
          </button>
        </div>
      }
    >
      <form id="form-modal-form" onSubmit={handleSubmit} className="space-y-5">
        {children}
      </form>
    </Modal>
  );
}
