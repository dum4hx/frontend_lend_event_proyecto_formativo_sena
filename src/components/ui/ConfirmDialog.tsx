/**
 * Reusable confirmation dialog for destructive actions.
 * Provides clear visual hierarchy and accessibility features.
 */

import { AlertCircle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'text-red-400',
      button: 'bg-red-500 hover:bg-red-600 text-white',
    },
    warning: {
      icon: 'text-yellow-400',
      button: 'bg-yellow-500 hover:bg-yellow-600 text-black',
    },
    info: {
      icon: 'text-blue-400',
      button: 'bg-blue-500 hover:bg-blue-600 text-white',
    },
  };

  const styles = variantStyles[variant];

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error is handled by the caller
      console.error('[ConfirmDialog] Confirmation failed:', error);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
          <p id="dialog-message" className="text-gray-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-[#333] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-lg border border-[#333] text-gray-300 hover:bg-[#1a1a1a] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${styles.button}`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
