/**
 * Reusable confirmation dialog for destructive actions.
 * Provides clear visual hierarchy and accessibility features.
 */

import React from "react";
import { AlertCircle } from "lucide-react";
import { useLanguage } from "../../contexts/useLanguage";
import Button, { type ButtonVariant } from "./Button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** Optional secondary action rendered between Cancel and Confirm */
  secondaryText?: string;
  onSecondaryAction?: () => void;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  secondaryText,
  onSecondaryAction,
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const variantStyles: Record<string, { icon: string; btnVariant: ButtonVariant }> = {
    danger: {
      icon: "text-red-400",
      btnVariant: "danger",
    },
    warning: {
      icon: "text-yellow-400",
      btnVariant: "primary",
    },
    info: {
      icon: "text-blue-400",
      btnVariant: "primary",
    },
  };

  const styles = variantStyles[variant];
  const resolvedCancelText = cancelText ?? t("common.cancel");
  const resolvedConfirmText = confirmText ?? t("common.confirm");

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error is handled by the caller
      console.error("[ConfirmDialog] Confirmation failed:", error);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-[#121212] border border-[#333] rounded-xl max-w-md w-full shadow-2xl"
        role="dialog"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
      >
        {/* Header with icon */}
        <div className="px-6 py-5 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className={`${styles.icon}`}>
              <AlertCircle size={24} />
            </div>
            <h2 id="dialog-title" className="text-xl font-bold text-white">
              {title}
            </h2>
          </div>
        </div>

        {/* Message */}
        <div className="px-6 py-5">
          <div id="dialog-message" className="text-gray-300 leading-relaxed">
            {message}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-[#333] flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {resolvedCancelText}
          </Button>
          {secondaryText && onSecondaryAction && (
            <Button
              variant="secondary"
              onClick={() => {
                onSecondaryAction();
                onClose();
              }}
              disabled={isLoading}
            >
              {secondaryText}
            </Button>
          )}
          <Button variant={styles.btnVariant} onClick={handleConfirm} loading={isLoading}>
            {resolvedConfirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
