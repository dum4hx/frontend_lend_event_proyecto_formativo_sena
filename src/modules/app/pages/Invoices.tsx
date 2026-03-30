import React, { useState, useEffect } from "react";
import {
  Search,
  RefreshCcw,
  FileText,
  DollarSign,
  Eye,
  Download,
  Trash2,
  Filter,
} from "lucide-react";
import { useLanguage } from "../../../contexts/useLanguage";
import { useToast } from "../../../hooks/useToast";
import { LoadingSpinner, ErrorDisplay, EmptyState, StatCard } from "../../../components/ui";
import PaymentRecordingModal from "../components/PaymentRecordingModal";
import VoidInvoiceModal from "../components/VoidInvoiceModal";
import InvoiceDetailModal from "../components/InvoiceDetailModal";
import { useInvoices } from "../hooks/useInvoices";
import { getPaymentMethods } from "../../../services/paymentMethodService";
import type {
  Invoice,
  InvoiceStatus,
  InvoiceType,
  PaymentMethod,
  InvoiceCustomer,
} from "../../../types/api";

/**
 * Invoices — Main dashboard for managing organization invoices.
 * Features:
 * - Real-time data fetching with summary stats
 * - Tab-based view: All Invoices | Pending | Overdue
 * - Advanced filtering: status, type, overdue
 * - Search by invoice ID / customer
 * - Payment recording modal with method selection
 * - Void invoice modal with reason tracking
 * - Invoice detail modal with payment history (placeholders for backend)
 * - Neon design matching other modules (gold accents, dark backgrounds)
 */
export default function Invoices() {
  const { language, locale } = useLanguage();
  const isEs = language === "es";
  const { showToast } = useToast();

  // Data & API
  const {
    invoices,
    summary,
    loading,
    error,
    actionLoading,
    recordPaymentForInvoice,
    voidInvoiceAction,
    refetch,
  } = useInvoices();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "overdue">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<InvoiceType | "all">("all");
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Modals
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [selectedInvoiceForVoid, setSelectedInvoiceForVoid] = useState<Invoice | null>(null);
  const [selectedInvoiceIdForDetail, setSelectedInvoiceIdForDetail] = useState<string | null>(null);

  // Load payment methods on mount
  useEffect(() => {
    const loadMethods = async () => {
      try {
        const res = await getPaymentMethods();
        setPaymentMethods(res.data.paymentMethods);
      } catch (err) {
        console.error("Failed to load payment methods", err);
      }
    };
    loadMethods();
  }, []);

  // Apply tab-based preset filters
  const handleTabChange = (tab: "all" | "pending" | "overdue") => {
    setActiveTab(tab);
    if (tab === "pending") {
      setStatusFilter("pending");
      setTypeFilter("all");
      setOverdueOnly(false);
    } else if (tab === "overdue") {
      setStatusFilter("all");
      setTypeFilter("all");
      setOverdueOnly(true);
    } else {
      setStatusFilter("all");
      setTypeFilter("all");
      setOverdueOnly(false);
    }
  };

  const getCustomerName = (customerId: InvoiceCustomer | string): string => {
    if (typeof customerId === "object" && customerId !== null) {
      const { firstName, firstSurname } = customerId.name;
      return `${firstName} ${firstSurname}`.trim();
    }
    return typeof customerId === "string" ? customerId : "";
  };

  // Filter invoices based on search
  const filteredInvoices = invoices.filter((inv) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (inv.invoiceNumber?.toLowerCase().includes(searchLower) ?? false) ||
      getCustomerName(inv.customerId).toLowerCase().includes(searchLower)
    );
  });

  // Payment flow
  const handleRecordPayment = async (payload: {
    amount: number;
    paymentMethodId: string;
    reference?: string;
  }) => {
    if (!selectedInvoiceForPayment) return;
    try {
      await recordPaymentForInvoice(selectedInvoiceForPayment._id, payload);
      showToast(
        "success",
        isEs ? "El pago ha sido registrado exitosamente" : "Payment has been recorded successfully",
        isEs ? "Pago Registrado" : "Payment Recorded",
        { duration: 4000 },
      );
      setSelectedInvoiceForPayment(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isEs
            ? "Error al registrar el pago"
            : "Failed to record payment";
      showToast("error", message, isEs ? "Error" : "Error", { duration: 5000 });
      throw err;
    }
  };

  // Void flow
  const handleVoidInvoice = async (reason: string) => {
    if (!selectedInvoiceForVoid) return;
    try {
      await voidInvoiceAction(selectedInvoiceForVoid._id, reason);
      showToast(
        "success",
        isEs ? "La factura ha sido anulada exitosamente" : "Invoice has been voided successfully",
        isEs ? "Factura Anulada" : "Invoice Voided",
        { duration: 4000 },
      );
      setSelectedInvoiceForVoid(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isEs
            ? "Error al anular la factura"
            : "Failed to void invoice";
      showToast("error", message, isEs ? "Error" : "Error", { duration: 5000 });
      throw err;
    }
  };

  // Detail view
  const handleOpenDetail = (invoiceId: string) => {
    setSelectedInvoiceIdForDetail(invoiceId);
  };

  // Get status color
  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case "paid":
        return "text-green-400 bg-green-500/10";
      case "pending":
        return "text-yellow-400 bg-yellow-500/10";
      case "cancelled":
        return "text-gray-400 bg-gray-500/10";
      default:
        return "text-gray-400 bg-gray-500/10";
    }
  };

  // Get status label
  const getStatusLabel = (status: InvoiceStatus) => {
    switch (status) {
      case "paid":
        return isEs ? "Pagado" : "Paid";
      case "pending":
        return isEs ? "Pendiente" : "Pending";
      case "cancelled":
        return isEs ? "Cancelado" : "Cancelled";
      default:
        return status;
    }
  };

  // Get type label
  const getTypeLabel = (type: InvoiceType) => {
    switch (type) {
      case "rental":
        return isEs ? "Alquiler" : "Rental";
      case "damage":
        return isEs ? "Daño" : "Damage";
      case "deposit":
        return isEs ? "Depósito" : "Deposit";
      default:
        return type;
    }
  };

  // Get row border color based on status
  const getRowBorderColor = (invoice: Invoice) => {
    if (invoice.status === "paid") return "border-l-4 border-green-500";
    if (invoice.status === "cancelled") return "border-l-4 border-gray-500";
    return "border-l-4 border-yellow-500"; // pending
  };

  // Loading state
  if (loading && invoices.length === 0) {
    return (
      <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-500">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && invoices.length === 0) {
    return (
      <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-500">
        <ErrorDisplay error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Invoices <span className="text-[#FFD700]">Dashboard</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm max-w-lg">
            {isEs
              ? "Gestiona, rastrea y procesa pagos de facturas. Genera reportes de ingresos."
              : "Manage, track, and process invoice payments. Generate income reports."}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="p-3 bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white hover:border-[#444] rounded-xl transition-all disabled:opacity-50"
          title={isEs ? "Actualizar" : "Refresh"}
        >
          <RefreshCcw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label={isEs ? "Facturas Pendientes" : "Pending Invoices"}
            value={summary.pending.count}
            icon={<FileText size={18} />}
            trend={new Intl.NumberFormat(locale, {
              style: "currency",
              currency: "COP",
              minimumFractionDigits: 0,
            }).format(summary.pending.total)}
          />
          <StatCard
            label={isEs ? "Facturas Pagadas" : "Paid Invoices"}
            value={summary.paid.count}
            icon={<DollarSign size={18} />}
            trend={new Intl.NumberFormat(locale, {
              style: "currency",
              currency: "COP",
              minimumFractionDigits: 0,
            }).format(summary.paid.total)}
            trendUp
          />
          <StatCard
            label={isEs ? "Facturas Vencidas" : "Overdue Invoices"}
            value={summary.overdueCount}
            icon={<Filter size={18} />}
          />
        </div>
      )}

      {/* Tabs & Filters */}
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-1">
          <div className="flex space-x-6 md:space-x-10 overflow-x-auto">
            {(["all", "pending", "overdue"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`pb-4 text-sm font-bold tracking-wide transition-all relative whitespace-nowrap ${
                  activeTab === tab ? "text-[#FFD700]" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab === "all" && (isEs ? "Todas" : "All")}
                {tab === "pending" && (isEs ? "Pendientes" : "Pending")}
                {tab === "overdue" && (isEs ? "Vencidas" : "Overdue")}

                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FFD700] rounded-t-full shadow-[0_-2px_6px_rgba(255,215,0,0.4)]" />
                )}
              </button>
            ))}
          </div>

          {/* Filters Row */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | "all")}
              className="bg-[#121212] border border-[#222] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFD700] transition-all"
            >
              <option value="all">{isEs ? "Todos los estados" : "All Statuses"}</option>
              <option value="pending">{isEs ? "Pendiente" : "Pending"}</option>
              <option value="paid">{isEs ? "Pagado" : "Paid"}</option>
              <option value="cancelled">{isEs ? "Cancelado" : "Cancelled"}</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as InvoiceType | "all")}
              className="bg-[#121212] border border-[#222] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFD700] transition-all"
            >
              <option value="all">{isEs ? "Todos los tipos" : "All Types"}</option>
              <option value="rental">{isEs ? "Alquiler" : "Rental"}</option>
              <option value="damage">{isEs ? "Daño" : "Damage"}</option>
              <option value="deposit">{isEs ? "Depósito" : "Deposit"}</option>
            </select>

            {/* Overdue Checkbox */}
            <label className="flex items-center gap-2 px-3 py-2 bg-[#121212] border border-[#222] rounded-lg text-xs cursor-pointer hover:border-[#333] transition-all">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="accent-[#FFD700] w-4 h-4"
              />
              <span className="text-gray-300">{isEs ? "Solo vencidas" : "Overdue Only"}</span>
            </label>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative w-full group mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#FFD700] transition-colors" />
          <input
            type="text"
            placeholder={
              isEs ? "Buscar por ID de factura o cliente..." : "Search by invoice ID or customer..."
            }
            className="w-full bg-[#121212] border border-[#222] rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Invoices Table */}
        <div className="bg-[#121212] border border-[#222] rounded-2xl overflow-hidden shadow-2xl">
          {filteredInvoices.length > 0 ? (
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
                  {filteredInvoices.map((invoice) => (
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
                          {getTypeLabel(invoice.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-white font-semibold">
                          {new Intl.NumberFormat(locale, {
                            style: "currency",
                            currency: "COP",
                            minimumFractionDigits: 0,
                          }).format(invoice.totalAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            invoice.status,
                          )}`}
                        >
                          {getStatusLabel(invoice.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetail(invoice._id)}
                            className="p-2 hover:bg-[#1a1a1a] rounded-lg text-gray-400 hover:text-[#FFD700] transition-all"
                            title={isEs ? "Ver detalles" : "View details"}
                          >
                            <Eye size={16} />
                          </button>

                          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                            <button
                              onClick={() => setSelectedInvoiceForPayment(invoice)}
                              disabled={loading || actionLoading}
                              className="p-2 hover:bg-[#1a1a1a] rounded-lg text-gray-400 hover:text-[#FFD700] transition-all disabled:opacity-50"
                              title={isEs ? "Registrar pago" : "Record payment"}
                            >
                              <DollarSign size={16} />
                            </button>
                          )}

                          {invoice.status !== "cancelled" && (
                            <button
                              onClick={() => setSelectedInvoiceForVoid(invoice)}
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
          ) : (
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
          )}
        </div>
      </div>

      {/* Modals */}
      <PaymentRecordingModal
        isOpen={selectedInvoiceForPayment !== null}
        invoice={selectedInvoiceForPayment}
        paymentMethods={paymentMethods}
        onClose={() => setSelectedInvoiceForPayment(null)}
        onSubmit={handleRecordPayment}
        isLoading={actionLoading}
      />

      <VoidInvoiceModal
        isOpen={selectedInvoiceForVoid !== null}
        invoice={selectedInvoiceForVoid}
        onClose={() => setSelectedInvoiceForVoid(null)}
        onSubmit={handleVoidInvoice}
        isLoading={actionLoading}
      />

      <InvoiceDetailModal
        isOpen={selectedInvoiceIdForDetail !== null}
        invoiceId={selectedInvoiceIdForDetail}
        onClose={() => setSelectedInvoiceIdForDetail(null)}
        onRecordPayment={(id: string) => {
          const inv = invoices.find((i) => i._id === id);
          if (inv) setSelectedInvoiceForPayment(inv);
        }}
        onVoid={(id: string) => {
          const inv = invoices.find((i) => i._id === id);
          if (inv) setSelectedInvoiceForVoid(inv);
        }}
      />
    </div>
  );
}
