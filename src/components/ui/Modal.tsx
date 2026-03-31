/**
 * Modal — Accessible, animated base modal.
 *
 * Built on Framer Motion with escape-to-close and click-outside-close.
 * All other modal variants (FormModal, DetailModal, QuickCreateModal) wrap this.
 */

import React, { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { overlayVariants, modalVariants, modalTransition } from "../../lib/animations";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps {
  /** Whether the modal is visible. */
  open: boolean;
  /** Called when the user requests closing (Escape, backdrop click, X button). */
  onClose: () => void;
  /** Optional title rendered in the header. */
  title?: string;
  /** Modal width preset. */
  size?: ModalSize;
  /** Content. */
  children: React.ReactNode;
  /** Footer content (buttons, etc.). */
  footer?: React.ReactNode;
  /** When true, clicking the backdrop will NOT close the modal. */
  persistent?: boolean;
  /** Extra CSS class on the content container. */
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  full: "max-w-[95vw]",
};

export function Modal({
  open,
  onClose,
  title,
  size = "md",
  children,
  footer,
  persistent = false,
  className = "",
}: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (!persistent && contentRef.current && !contentRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          variants={overlayVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={handleBackdropClick}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            ref={contentRef}
            className={`bg-[#121212] border border-[#333] rounded-xl ${sizeClasses[size]} w-full max-h-[90vh] flex flex-col shadow-2xl ${className}`}
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={modalTransition}
          >
            {/* Header */}
            {title && (
              <div className="modal-header flex-shrink-0">
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="modal-body overflow-y-auto custom-scrollbar flex-1">{children}</div>

            {/* Footer */}
            {footer && <div className="modal-footer flex-shrink-0">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
