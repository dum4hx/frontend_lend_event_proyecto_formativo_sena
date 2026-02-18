/**
 * AlertModal — Centered modal dialog for alerts/notifications.
 * 
 * Replaces browser alert() with a stylized modal that supports:
 * - success, info, warning, error variants
 * - Themed colors from index.css (alert-*-neon, alert-*-bg, etc.)
 * - Icon per type
 * - Keyboard navigation (Escape to close, Enter to confirm)
 * - Backdrop click to dismiss
 */

import { useEffect, type ReactNode } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export type AlertModalType = 'success' | 'info' | 'warning' | 'error';

export interface AlertModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Modal type/severity */
  type: AlertModalType;
  /** Optional title (defaults to type-based title) */
  title?: string;
  /** Message content */
  message: ReactNode;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Optional confirm button text (default: "OK") */
  confirmText?: string;
}

const ICONS: Record<AlertModalType, typeof CheckCircle2> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

const DEFAULT_TITLES: Record<AlertModalType, string> = {
  success: 'Success',
  info: 'Information',
  warning: 'Warning',
  error: 'Error',
};

export function AlertModal({
  open,
  type,
  title,
  message,
  onClose,
  confirmText = 'OK',
}: AlertModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Close on Enter key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const Icon = ICONS[type];
  const displayTitle = title ?? DEFAULT_TITLES[type];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`
            relative w-full max-w-md pointer-events-auto
            bg-[#121212] border rounded-xl shadow-2xl
            animate-[slideDown_300ms_ease-out]
            alert-modal alert-modal--${type}
          `}
          style={{
            borderColor: `var(--alert-${type}-border)`,
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="alert-modal-title"
          aria-describedby="alert-modal-message"
        >
          {/* Colored overlay */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none opacity-20"
            style={{
              background: `var(--alert-${type}-bg)`,
            }}
            aria-hidden="true"
          />

          {/* Content */}
          <div className="relative p-6">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div
                className="flex-shrink-0 mt-1"
                style={{ color: `var(--alert-${type}-icon)` }}
                aria-hidden="true"
              >
                <Icon size={28} />
              </div>
              <div className="flex-1">
                <h2
                  id="alert-modal-title"
                  className="text-lg font-bold"
                  style={{ color: `var(--alert-${type}-text)` }}
                >
                  {displayTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex-shrink-0 text-gray-500 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Message */}
            <div
              id="alert-modal-message"
              className="text-gray-300 text-sm mb-6 pl-12"
            >
              {message}
            </div>

            {/* Footer */}
            <div className="flex justify-end pl-12">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-lg font-semibold transition-colors"
                style={{
                  background: `var(--alert-${type}-bg)`,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: `var(--alert-${type}-border)`,
                  color: `var(--alert-${type}-text)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `var(--alert-${type}-overlay)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `var(--alert-${type}-bg)`;
                }}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
