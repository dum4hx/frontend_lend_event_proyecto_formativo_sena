import { FileText, DollarSign, Eye, Download, Trash2 } from "lucide-react";
import { EmptyState } from "../../../../components/ui";
import type { Invoice } from "./types";
import {
  getStatusColor,
  getStatusLabel,
  getTypeLabel,
  getRowBorderColor,
  getCustomerName,
} from "./helpers";

// ─── Props ──────────────────────────────────────────────────────────────

interface InvoicesTableProps {
  /** Filtered invoices to display. */
  invoices: Invoice[];
  /** Whether an action is currently in progress. */
  actionLoading: boolean;
  /** Whether data is loading. */
  loading: boolean;
  /** View detail callback. */
  onViewDetail: (invoiceId: string) => void;
  /** Record payment callback. */
  onRecordPayment: (invoice: Invoice) => void;
  /** Void invoice callback. */
  onVoidInvoice: (invoice: Invoice) => void;
  /** Locale string for formatting. */
  locale: string;
  /** Whether Spanish locale is active. */
  isEs: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────

export function InvoicesTable({
  invoices,
  actionLoading,
  loading,
  onViewDetail,
  onRecordPayment,
  onVoidInvoice,
  locale,
  isEs,
}: InvoicesTableProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);

  if (invoices.length === 0) {
    return (
      <div className="bg-[#121212] border border-[#222] rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-20 text-center border-t border-[#222]">
          <EmptyState
            title={isEs ? "No se encontraron facturas" : "No invoices found"}
            description={
              isEs
                ? "Prueba ajustando tus filtros de búsqueda o crea una nueva factura."
                : "Try adjusting your search filters or create a new invoice."
            }
            icon={FileText}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121212] border border-[#222] rounded-2xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0d0d0d] border-b border-[#222]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                {isEs ? "# Factura" : "Invoice #"}
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                {isEs ? "Tipo" : "Type"}
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                {isEs ? "Monto" : "Amount"}
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                {isEs ? "Estado" : "Status"}
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                {isEs ? "Acciones" : "Actions"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222]">
            {invoices.map((invoice) => (
              <tr
                key={invoice._id}
                className={`${getRowBorderColor(invoice)} hover:bg-[#1a1a1a] transition-all`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-[#FFD700]" />
                    <div>
                      <span className="text-white font-mono text-xs block">
                        {invoice.invoiceNumber}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {getCustomerName(invoice.customerId)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-[#1a1a1a] text-gray-300 text-xs rounded">
                    {getTypeLabel(invoice.type, isEs)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-white font-semibold">
                    {formatCurrency(invoice.totalAmount)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}
                  >
                    {getStatusLabel(invoice.status, isEs)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onViewDetail(invoice._id)}
                      className="p-2 hover:bg-[#1a1a1a] rounded-lg text-gray-400 hover:text-[#FFD700] transition-all"
                      title={isEs ? "Ver detalles" : "View details"}
                    >
                      <Eye size={16} />
                    </button>

                    {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                      <button
                        onClick={() => onRecordPayment(invoice)}
                        disabled={loading || actionLoading}
                        className="p-2 hover:bg-[#1a1a1a] rounded-lg text-gray-400 hover:text-[#FFD700] transition-all disabled:opacity-50"
                        title={isEs ? "Registrar pago" : "Record payment"}
                      >
                        <DollarSign size={16} />
                      </button>
                    )}

                    {invoice.status !== "cancelled" && (
                      <button
                        onClick={() => onVoidInvoice(invoice)}
                        disabled={loading || actionLoading}
                        className="p-2 hover:bg-[#1a1a1a] rounded-lg text-gray-400 hover:text-red-500 transition-all disabled:opacity-50"
                        title={isEs ? "Anular factura" : "Void invoice"}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    <button
                      className="p-2 hover:bg-[#1a1a1a] rounded-lg text-gray-400 hover:text-[#FFD700] transition-all disabled:opacity-50"
                      title={isEs ? "Descargar PDF" : "Download PDF"}
                      disabled
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
