import React, { useState, useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import { useLanguage } from "../../../contexts/useLanguage";
import type { Invoice } from "../../../types/api";

/**
 * VoidInvoiceModal — Confirmation dialog to void an invoice.
 *
 * Features:
 * - Required reason field (text input)
 * - Shows invoice details for context
 * - Confirm/Cancel buttons
 * - Loading state during submission
 */

export interface VoidInvoiceModalProps {
  isOpen: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

export function VoidInvoiceModal({
  isOpen,
  invoice,
  onClose,
  onSubmit,
  isLoading = false,
}: VoidInvoiceModalProps) {
  const { language, locale } = useLanguage();
  const isEs = language === "es";

  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError(isEs ? "La razón es requerida" : "Reason is required");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(reason);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to void invoice";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-[#121212] border border-[#333] rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200"
        data-help-id="invoice-void-form"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle size={20} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {isEs ? "Anular Factura" : "Void Invoice"}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 hover:bg-[#1a1a1a] rounded-lg text-gray-400 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Warning */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 text-sm leading-relaxed">
              {isEs
                ? "Esta acción es irreversible. La factura se marcará como anulada y no se podrá procesar más."
                : "This action is irreversible. The invoice will be marked as voided and cannot be processed further."}
            </p>
          </div>

          {/* Invoice Info */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">{isEs ? "ID Factura" : "Invoice ID"}</span>
              <span className="text-white font-mono text-sm">{invoice._id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">{isEs ? "Tipo" : "Type"}</span>
              <span className="text-white capitalize text-sm">
                {invoice.type === "rental"
                  ? isEs
                    ? "Alquiler"
                    : "Rental"
                  : invoice.type === "damage"
                    ? isEs
                      ? "Daño"
                      : "Damage"
                    : isEs
                      ? "Depósito"
                      : "Deposit"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">{isEs ? "Monto" : "Amount"}</span>
              <span className="text-white font-semibold">
                {new Intl.NumberFormat(locale, {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 0,
                }).format(invoice.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">{isEs ? "Estado" : "Status"}</span>
              <span
                className={`text-xs font-semibold capitalize ${
                  invoice.status === "paid"
                    ? "text-green-400"
                    : invoice.status === "pending"
                      ? "text-yellow-400"
                      : "text-gray-400"
                }`}
              >
                {invoice.status === "paid"
                  ? isEs
                    ? "Pagado"
                    : "Paid"
                  : invoice.status === "pending"
                    ? isEs
                      ? "Pendiente"
                      : "Pending"
                    : isEs
                      ? "Cancelado"
                      : "Cancelled"}
              </span>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              {isEs ? "Razón de Anulación" : "Void Reason"} *
            </label>
            <textarea
              data-help-id="invoice-void-reason"
              placeholder={
                isEs
                  ? "Ej: Factura duplicada, error administrativo..."
                  : "e.g., Duplicate invoice, administrative error..."
              }
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              disabled={submitting || isLoading}
              rows={3}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all disabled:opacity-50 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {reason.length} / 500 {isEs ? "caracteres" : "characters"}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || isLoading}
              data-help-id="invoice-void-cancel"
              className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all bg-[#1a1a1a] border border-[#333] text-gray-300 hover:bg-[#252525] disabled:opacity-50"
            >
              {isEs ? "Cancelar" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || submitting || isLoading}
              data-help-id="invoice-void-submit"
              className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting || isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                  {isEs ? "Anulando..." : "Voiding..."}
                </>
              ) : (
                <>{isEs ? "Anular Factura" : "Void Invoice"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VoidInvoiceModal;
