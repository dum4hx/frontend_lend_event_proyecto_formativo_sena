/**
 * DetailModal — Read-only info modal that renders key-value pairs.
 *
 * Automatically hides `_id`, `__v`, `organizationId`, and other internal
 * fields unless explicitly included.  Shows everything else in a clean,
 * two-column layout.
 */

import React from "react";
import { Modal, type ModalSize } from "./Modal";
import { StatusBadge } from "./StatusBadge";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface DetailField {
  /** Label shown to the user. */
  label: string;
  /** Value — can be a string, number, or any React node (badges, links …). */
  value: React.ReactNode;
}

export interface DetailModalProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Close handler. */
  onClose: () => void;
  /** Modal title. */
  title: string;
  /** Fields to display. */
  fields: DetailField[];
  /** Modal size. */
  size?: ModalSize;
  /** Optional footer (e.g. edit / delete buttons). */
  footer?: React.ReactNode;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const STATUS_KEYS = new Set([
  "status",
  "condition",
  "invoiceStatus",
  "loanStatus",
  "paymentStatus",
]);

function isStatusValue(label: string, value: unknown): value is string {
  return (
    typeof value === "string" &&
    STATUS_KEYS.has(label.toLowerCase().replace(/\s/g, ""))
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

export function DetailModal({
  open,
  onClose,
  title,
  fields,
  size = "md",
  footer,
}: DetailModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size={size} footer={footer}>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
        {fields.map((f) => (
          <div key={f.label}>
            <dt className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              {f.label}
            </dt>
            <dd className="text-sm text-gray-200 break-words">
              {isStatusValue(f.label, f.value) ? (
                <StatusBadge status={f.value} />
              ) : (
                f.value ?? <span className="text-gray-600">—</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
