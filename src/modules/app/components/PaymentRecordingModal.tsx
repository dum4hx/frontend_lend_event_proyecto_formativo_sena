import React, { useState, useEffect } from "react";
import { DollarSign, X } from "lucide-react";
import { useLanguage } from "../../../contexts/useLanguage";
import type { Invoice, RecordPaymentPayload, PaymentMethod } from "../../../types/api";

function getCustomerName(invoice: Invoice): string {
  const c = invoice.customerId;
  if (typeof c === "object") return `${c.name.firstName} ${c.name.firstSurname}`;
  return c;
}

/**
 * PaymentRecordingModal — Form to record a payment against an invoice.
 *
 * Features:
 * - Amount validation (must be > 0 and ≤ remaining balance)
 * - Payment method selection (dropdown)
 * - Optional reference field
 * - Shows payment breakdown: previous + this = new total
 * - Loading state during submission
 */

export interface PaymentRecordingModalProps {
  isOpen: boolean;
  invoice: Invoice | null;
  paymentMethods: PaymentMethod[];
  onClose: () => void;
  onSubmit: (payload: RecordPaymentPayload) => Promise<void>;
  isLoading?: boolean;
}

export function PaymentRecordingModal({
  isOpen,
  invoice,
  paymentMethods,
  onClose,
  onSubmit,
  isLoading = false,
}: PaymentRecordingModalProps) {
  const { language, locale } = useLanguage();
  const isEs = language === "es";

  const [amount, setAmount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const estimatedRemaining = invoice?.amountDue ?? 0;
  const parsedAmount = amount ? parseInt(amount, 10) : 0;
  const isValidAmount = parsedAmount > 0 && paymentMethodId && parsedAmount <= estimatedRemaining;

  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setPaymentMethodId("");
      setReference("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidAmount) {
      setError(
        isEs
          ? "La cantidad debe ser mayor que 0 y no exceder el saldo pendiente"
          : "Amount must be greater than 0 and not exceed remaining balance",
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: RecordPaymentPayload = {
        amount: parsedAmount,
        paymentMethodId,
        reference: reference || undefined,
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to record payment";
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
        data-help-id="invoice-payment-form"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFD700]/10 flex items-center justify-center">
              <DollarSign size={20} className="text-[#FFD700]" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {isEs ? "Registrar Pago" : "Record Payment"}
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
          {/* Invoice Info */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">{isEs ? "# Factura" : "Invoice #"}</span>
              <span className="text-white font-mono text-sm">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">{isEs ? "Cliente" : "Customer"}</span>
              <span className="text-white text-sm">{getCustomerName(invoice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">{isEs ? "Monto Total" : "Total Amount"}</span>
              <span className="text-white font-semibold">
                {new Intl.NumberFormat(locale, {
                  style: "currency",
                  currency: "COP",
                  minimumFractionDigits: 0,
                }).format(invoice.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">{isEs ? "Ya Pagado" : "Already Paid"}</span>
              <span className="text-green-400 font-semibold">
                {new Intl.NumberFormat(locale, {
                  style: "currency",
                  currency: "COP",
                  minimumFractionDigits: 0,
                }).format(invoice.amountPaid)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#333]">
              <span className="text-gray-400 text-sm">
                {isEs ? "Saldo Pendiente" : "Remaining Balance"}
              </span>
              <span className="text-[#FFD700] font-bold">
                {new Intl.NumberFormat(locale, {
                  style: "currency",
                  currency: "COP",
                  minimumFractionDigits: 0,
                }).format(estimatedRemaining)}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              {isEs ? "Cantidad a Pagar" : "Payment Amount"} *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">$</span>
              <input
                data-help-id="invoice-payment-amount"
                type="number"
                inputMode="decimal"
                step="1"
                min="1"
                max={estimatedRemaining}
                placeholder="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                disabled={submitting}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg pl-8 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all disabled:opacity-50"
              />
            </div>
            {parsedAmount > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {isEs ? "Saldo después del pago:" : "Balance after payment:"}{" "}
                <span className="text-green-400 font-semibold">
                  {new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                  }).format(estimatedRemaining - parsedAmount)}
                </span>
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              {isEs ? "Método de Pago" : "Payment Method"} *
            </label>
            <select
              data-help-id="invoice-payment-method"
              value={paymentMethodId}
              onChange={(e) => {
                setPaymentMethodId(e.target.value);
                setError(null);
              }}
              disabled={submitting}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all disabled:opacity-50"
            >
              <option value="">{isEs ? "Selecciona un método" : "Select a method"}</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reference (Optional) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              {isEs ? "Referencia" : "Reference"}{" "}
              <span className="text-gray-700">({isEs ? "Opcional" : "Optional"})</span>
            </label>
            <input
              type="text"
              placeholder={isEs ? "Ej: Transferencia #12345" : "e.g., Transfer #12345"}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              disabled={submitting}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all disabled:opacity-50"
            />
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
              disabled={submitting}
              data-help-id="invoice-payment-cancel"
              className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all bg-[#1a1a1a] border border-[#333] text-gray-300 hover:bg-[#252525] disabled:opacity-50"
            >
              {isEs ? "Cancelar" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={!isValidAmount || submitting || isLoading}
              data-help-id="invoice-payment-submit"
              className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all bg-[#FFD700] text-black hover:bg-[#FFC107] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting || isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  {isEs ? "Procesando..." : "Processing..."}
                </>
              ) : (
                <>{isEs ? "Registrar Pago" : "Record Payment"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PaymentRecordingModal;
