import React, { useState, useEffect } from "react";
import { FileText, X, DollarSign } from "lucide-react";
import { useLanguage } from "../../../contexts/useLanguage";
import { LoadingSpinner, ErrorDisplay } from "../../../components/ui";
import Button from "../../../components/ui/Button";
import { getInvoiceById } from "../../../services/invoiceService";
import type { Invoice, InvoiceCustomer } from "../../../types/api";

function getCustomerName(customerId: InvoiceCustomer | string): string {
  if (typeof customerId === "object") {
    return `${customerId.name.firstName} ${customerId.name.firstSurname}`;
  }
  return customerId;
}

function formatCOP(locale: string, amount: number): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * InvoiceDetailModal — Full invoice details with line items and payment history.
 *
 * Features:
 * - Fetches full invoice data from GET /invoices/:id
 * - Displays: header info, line items table, payment history table
 * - Financial summary: subtotal, tax, total, paid, remaining
 * - Action buttons: Record Payment, Void, Close
 * - Loading and error handling
 */

export interface InvoiceDetailModalProps {
  isOpen: boolean;
  invoiceId: string | null;
  onClose: () => void;
  onRecordPayment: (invoiceId: string) => void;
  onVoid: (invoiceId: string) => void;
}

export function InvoiceDetailModal({
  isOpen,
  invoiceId,
  onClose,
  onRecordPayment,
  onVoid,
}: InvoiceDetailModalProps) {
  const { language, locale } = useLanguage();
  const isEs = language === "es";

  const [detail, setDetail] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !invoiceId) {
      setDetail(null);
      setError(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getInvoiceById(invoiceId);
        setDetail(response.data.invoice);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch invoice details";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, invoiceId]);

  if (!isOpen) return null;

  const getTypeLabel = (type: string) => {
    if (type === "rental") return isEs ? "Alquiler" : "Rental";
    if (type === "damage") return isEs ? "Daño" : "Damage";
    if (type === "deposit") return isEs ? "Depósito" : "Deposit";
    return type;
  };

  const getStatusLabel = (status: string) => {
    if (status === "paid") return isEs ? "Pagado" : "Paid";
    if (status === "pending") return isEs ? "Pendiente" : "Pending";
    if (status === "cancelled") return isEs ? "Cancelado" : "Cancelled";
    return status;
  };

  const getStatusColor = (status: string) => {
    if (status === "paid") return "text-green-400";
    if (status === "pending") return "text-yellow-400";
    return "text-gray-400";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] border border-[#333] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFD700]/10 flex items-center justify-center">
              <FileText size={20} className="text-[#FFD700]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEs ? "Detalles de Factura" : "Invoice Details"}
              </h2>
              {detail && (
                <p className="text-xs text-gray-500 font-mono mt-0.5">{detail.invoiceNumber}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-[#1a1a1a] rounded-lg text-gray-400 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-[300px]">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6">
            <ErrorDisplay error={error} />
          </div>
        )}

        {/* Content */}
        {detail && !loading && !error && (
          <div className="overflow-y-auto flex-1">
            <div className="p-6 space-y-6">
              {/* Invoice Header Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">{isEs ? "# Factura" : "Invoice #"}</p>
                  <p className="text-white font-mono text-sm">{detail.invoiceNumber}</p>
                </div>
                <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">{isEs ? "Tipo" : "Type"}</p>
                  <p className="text-white capitalize text-sm">{getTypeLabel(detail.type)}</p>
                </div>
                <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">{isEs ? "Estado" : "Status"}</p>
                  <p className={`capitalize font-semibold text-sm ${getStatusColor(detail.status)}`}>
                    {getStatusLabel(detail.status)}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">{isEs ? "Cliente" : "Customer"}</p>
                  <p className="text-white text-sm">{getCustomerName(detail.customerId)}</p>
                </div>
                {detail.dueDate && (
                  <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4">
                    <p className="text-gray-400 text-xs mb-1">
                      {isEs ? "Fecha Límite" : "Due Date"}
                    </p>
                    <p className="text-white text-sm">{formatDate(detail.dueDate)}</p>
                  </div>
                )}
                {detail.createdAt && (
                  <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4">
                    <p className="text-gray-400 text-xs mb-1">{isEs ? "Emitida" : "Issued"}</p>
                    <p className="text-white text-sm">{formatDate(detail.createdAt)}</p>
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div className="border-t border-[#333] pt-6">
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">
                  {isEs ? "Artículos" : "Line Items"}
                </h3>
                {detail.lineItems && detail.lineItems.length > 0 ? (
                  <div className="bg-[#1a1a1a] border border-[#222] rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-[#0d0d0d] border-b border-[#222]">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                            {isEs ? "Descripción" : "Description"}
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">
                            {isEs ? "Cant." : "Qty"}
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">
                            {isEs ? "P. Unit." : "Unit Price"}
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">
                            {isEs ? "Total" : "Total"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#222]">
                        {detail.lineItems.map((item) => (
                          <tr key={item._id} className="hover:bg-[#222]/30">
                            <td className="px-4 py-3 text-gray-300 text-xs">{item.description}</td>
                            <td className="px-4 py-3 text-center text-gray-300 text-xs">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-300 text-xs">
                              {formatCOP(locale, item.unitPrice)}
                            </td>
                            <td className="px-4 py-3 text-right text-white font-semibold text-xs">
                              {formatCOP(locale, item.totalPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4 text-center">
                    <p className="text-gray-500 text-sm">
                      {isEs ? "Sin artículos" : "No line items"}
                    </p>
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div className="border-t border-[#333] pt-6">
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">
                  {isEs ? "Historial de Pagos" : "Payment History"}
                </h3>
                {detail.payments && detail.payments.length > 0 ? (
                  <div className="bg-[#1a1a1a] border border-[#222] rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-[#0d0d0d] border-b border-[#222]">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                            {isEs ? "Fecha" : "Date"}
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">
                            {isEs ? "Monto" : "Amount"}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                            {isEs ? "Referencia" : "Reference"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#222]">
                        {detail.payments.map((payment) => (
                          <tr key={payment._id} className="hover:bg-[#222]/30">
                            <td className="px-4 py-3 text-gray-300 text-xs">
                              {formatDate(payment.recordedAt)}
                            </td>
                            <td className="px-4 py-3 text-right text-green-400 font-semibold text-xs">
                              {formatCOP(locale, payment.amount)}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">
                              {payment.reference || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4 text-center">
                    <p className="text-gray-500 text-sm">
                      {isEs ? "Sin pagos registrados" : "No payments recorded"}
                    </p>
                  </div>
                )}
              </div>

              {/* Financial Summary */}
              <div className="border-t border-[#333] pt-6">
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">
                  {isEs ? "Resumen Financiero" : "Financial Summary"}
                </h3>
                <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{isEs ? "Subtotal" : "Subtotal"}</span>
                    <span className="text-white">{formatCOP(locale, detail.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      {isEs ? "IVA" : "Tax"} ({(detail.taxRate * 100).toFixed(0)}%)
                    </span>
                    <span className="text-white">{formatCOP(locale, detail.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-[#333] pt-2 mt-2">
                    <span className="text-white">{isEs ? "Total" : "Total"}</span>
                    <span className="text-white">{formatCOP(locale, detail.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1">
                    <span className="text-gray-400">{isEs ? "Pagado" : "Paid"}</span>
                    <span className="text-green-400 font-semibold">
                      {formatCOP(locale, detail.amountPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-[#FFD700]">{isEs ? "Pendiente" : "Remaining"}</span>
                    <span className="text-[#FFD700]">{formatCOP(locale, detail.amountDue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {detail && !loading && !error && (
          <div className="flex gap-3 p-6 border-t border-[#333] bg-[#0d0d0d] shrink-0">
            <Button onClick={onClose} variant="secondary" size="md" className="flex-1">
              {isEs ? "Cerrar" : "Close"}
            </Button>
            {detail.status !== "paid" && detail.status !== "cancelled" && (
              <Button
                onClick={() => {
                  onRecordPayment(detail._id);
                  onClose();
                }}
                variant="primary"
                size="md"
                className="flex-1"
              >
                <DollarSign size={16} className="mr-2" />
                {isEs ? "Registrar Pago" : "Record Payment"}
              </Button>
            )}
            {detail.status !== "cancelled" && (
              <Button
                onClick={() => {
                  onVoid(detail._id);
                  onClose();
                }}
                variant="danger"
                size="md"
                className="flex-1"
              >
                <X size={16} className="mr-2" />
                {isEs ? "Anular" : "Void"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default InvoiceDetailModal;
