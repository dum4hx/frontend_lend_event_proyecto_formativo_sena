import { useState, useEffect } from "react";
import { RefreshCw, FileText, DollarSign, Filter } from "lucide-react";
import {
  AnimatedPage,
  LoadingSpinner,
  ErrorDisplay,
  StatCard,
  PageHeader,
  IconButton,
} from "../../../../components/ui";
import PaymentRecordingModal from "../../components/PaymentRecordingModal";
import VoidInvoiceModal from "../../components/VoidInvoiceModal";
import InvoiceDetailModal from "../../components/InvoiceDetailModal";
import { useInvoices } from "../../hooks/useInvoices";
import { getPaymentMethods } from "../../../../services/paymentMethodService";
import { useLanguage } from "../../../../contexts/useLanguage";
import { usePermissions } from "../../../../contexts/usePermissions";
import Unauthorized from "../../../../pages/Unauthorized";
import { useToast } from "../../../../hooks/useToast";
import { InvoicesFilters } from "./InvoicesFilters";
import { InvoicesTable } from "./InvoicesTable";
import { getCustomerName } from "./helpers";
import type { Invoice, InvoiceStatus, InvoiceType, InvoiceTab, PaymentMethod } from "./types";

// ─── Component ──────────────────────────────────────────────────────────

export function Invoices() {
  const { t, language, locale } = useLanguage();
  const isEs = language === "es";
  const { hasPermission } = usePermissions();
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
  const [activeTab, setActiveTab] = useState<InvoiceTab>("all");
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
      } catch {
        // Payment methods are non-critical; swallow error
      }
    };
    void loadMethods();
  }, []);

  // ── Tab-based preset filters ────────────────────────────────────────────

  const handleTabChange = (tab: InvoiceTab) => {
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

  // ── Filtering ───────────────────────────────────────────────────────────

  const filteredInvoices = invoices.filter((inv) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (inv.invoiceNumber?.toLowerCase().includes(searchLower) ?? false) ||
      getCustomerName(inv.customerId).toLowerCase().includes(searchLower);
    if (!matchesSearch) return false;

    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (typeFilter !== "all" && inv.type !== typeFilter) return false;

    if (overdueOnly) {
      const now = new Date();
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
      const isOverdue =
        dueDate && now > dueDate && inv.status !== "paid" && inv.status !== "cancelled";
      if (!isOverdue) return false;
    }

    return true;
  });

  // ── Payment flow ────────────────────────────────────────────────────────

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

  // ── Void flow ───────────────────────────────────────────────────────────

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

  // ── Currency formatter ──────────────────────────────────────────────────

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);

  // ── Loading / Error states ──────────────────────────────────────────────

  if (loading && invoices.length === 0) {
    return (
      <AnimatedPage>
        <div className="p-6 md:p-10 flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </AnimatedPage>
    );
  }

  if (error && invoices.length === 0) {
    return (
      <AnimatedPage>
        <div className="p-6 md:p-10">
          <ErrorDisplay error={error} onRetry={refetch} />
        </div>
      </AnimatedPage>
    );
  }

  if (!hasPermission("invoices:read")) return <Unauthorized />;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <AnimatedPage>
      <div className="page-container">
        <div data-help-id="invoices-header">
          <PageHeader
            title={t("invoices.title")}
            titleAccent={t("invoices.titleAccent")}
            subtitle={
              isEs
                ? "Gestiona, rastrea y procesa pagos de facturas. Genera reportes de ingresos."
                : "Manage, track, and process invoice payments. Generate income reports."
            }
            actions={
              <IconButton
                icon={RefreshCw}
                onClick={() => refetch()}
                disabled={loading}
                ariaLabel={isEs ? "Actualizar" : "Refresh"}
                className={loading ? "animate-spin" : ""}
                title={isEs ? "Actualizar" : "Refresh"}
              />
            }
          />
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-help-id="invoices-stats">
            <StatCard
              label={t("invoices.stats.pending")}
              value={summary.pending.count}
              icon={<FileText size={18} />}
              trend={formatCurrency(summary.pending.total)}
            />
            <StatCard
              label={t("invoices.stats.paid")}
              value={summary.paid.count}
              icon={<DollarSign size={18} />}
              trend={formatCurrency(summary.paid.total)}
              trendUp
            />
            <StatCard
              label={t("invoices.stats.overdue")}
              value={summary.overdueCount}
              icon={<Filter size={18} />}
            />
          </div>
        )}

        {/* Filters & Table */}
        <div data-help-id="invoices-filters">
          <InvoicesFilters
            activeTab={activeTab}
            onTabChange={handleTabChange}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            overdueOnly={overdueOnly}
            onOverdueChange={setOverdueOnly}
          />
        </div>

        <div data-help-id="invoices-table">
          <InvoicesTable
            invoices={filteredInvoices}
            actionLoading={actionLoading}
            loading={loading}
            onViewDetail={(id) => setSelectedInvoiceIdForDetail(id)}
            onRecordPayment={(inv) => setSelectedInvoiceForPayment(inv)}
            onVoidInvoice={(inv) => setSelectedInvoiceForVoid(inv)}
            locale={locale}
            isEs={isEs}
          />
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
    </AnimatedPage>
  );
}

export default Invoices;
