import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatedPage } from "../../../../components/ui";
import { getLoans, extendLoan, returnLoan, refundDeposit } from "../../../../services/loanService";
import { getCustomers } from "../../../../services/customerService";
import { useAlertModal } from "../../../../hooks/useAlertModal";
import { usePermissions } from "../../../../contexts/usePermissions";
import { useLanguage } from "../../../../contexts/useLanguage";
import { RentalsFilters } from "./RentalsFilters";
import { RentalsTable } from "./RentalsTable";
import {
  LoanDetailModal,
  ExtendLoanModal,
  ReturnLoanModal,
  RefundDepositModal,
} from "./RentalModals";
import { customerFullName } from "./helpers";
import type { LoanView, LoanFilter, Loan, Customer, ExtendLoanPayload } from "./types";

// ─── Component ──────────────────────────────────────────────────────────

export function Rentals() {
  const { hasPermission } = usePermissions();
  const { showError, showSuccess, AlertModal } = useAlertModal();
  const { language, locale } = useLanguage();
  const isEs = language === "es";

  // ── Data state ──────────────────────────────────────────────────────────
  const [loans, setLoans] = useState<LoanView[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Filters ─────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<LoanFilter>("all");

  // ── Modal state ─────────────────────────────────────────────────────────
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTarget, setDetailTarget] = useState<LoanView | null>(null);

  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendTarget, setExtendTarget] = useState<LoanView | null>(null);
  const [newEndDate, setNewEndDate] = useState("");
  const [extendNotes, setExtendNotes] = useState("");

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnTarget, setReturnTarget] = useState<LoanView | null>(null);

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundTarget, setRefundTarget] = useState<LoanView | null>(null);
  const [refundNotes, setRefundNotes] = useState("");

  // ── Permissions ──────────────────────────────────────────────────────────
  const canExtend = hasPermission("loans:extend");
  const canReturn = hasPermission("loans:return");

  // ── Fetch data ───────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [loansRes, customersRes] = await Promise.all([
        getLoans(),
        getCustomers({ limit: 100 }),
      ]);
      const customerMap = new Map<string, Customer>();
      (customersRes.data.customers as Customer[]).forEach((c) => customerMap.set(c._id, c));

      const views: LoanView[] = (loansRes.data.loans as Loan[]).map((loan) => {
        const customerId =
          typeof loan.customerId === "string" ? loan.customerId : loan.customerId._id;
        return {
          loan,
          customer:
            typeof loan.customerId !== "string"
              ? (loan.customerId as Customer)
              : customerMap.get(customerId),
        };
      });
      setLoans(views);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isEs
            ? "No se pudieron cargar los prestamos"
            : "Failed to load loans";
      showError(message, isEs ? "Error de carga" : "Load Error");
    } finally {
      setLoading(false);
    }
  }, [showError, isEs]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return loans.filter((lv) => {
      const matchesStatus = selectedStatus === "all" || lv.loan.status === selectedStatus;
      const matchesSearch =
        !term ||
        lv.loan._id.toLowerCase().includes(term) ||
        customerFullName(lv.customer).toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [loans, searchTerm, selectedStatus]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleOpenDetail = (lv: LoanView) => {
    setDetailTarget(lv);
    setShowDetailModal(true);
  };

  const handleOpenExtend = (lv: LoanView) => {
    setExtendTarget(lv);
    setNewEndDate(lv.loan.endDate.slice(0, 10));
    setExtendNotes("");
    setShowExtendModal(true);
  };

  const handleExtendLoan = async () => {
    if (!extendTarget || !newEndDate) return;
    setSubmitting(true);
    try {
      const payload: ExtendLoanPayload = {
        newEndDate,
        ...(extendNotes.trim() ? { notes: extendNotes.trim() } : {}),
      };
      await extendLoan(extendTarget.loan._id, payload);
      showSuccess(
        isEs ? "Prestamo extendido correctamente." : "Loan extended successfully.",
        isEs ? "Prestamo extendido" : "Loan Extended",
      );
      setShowExtendModal(false);
      setExtendTarget(null);
      await fetchData();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isEs
            ? "No se pudo extender el prestamo"
            : "Failed to extend loan";
      showError(message, isEs ? "Error al extender" : "Extend Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReturn = (lv: LoanView) => {
    setReturnTarget(lv);
    setShowReturnModal(true);
  };

  const handleReturnLoan = async () => {
    if (!returnTarget) return;
    setSubmitting(true);
    try {
      await returnLoan(returnTarget.loan._id);
      showSuccess(
        isEs ? "Prestamo marcado como devuelto." : "Loan marked as returned.",
        isEs ? "Prestamo devuelto" : "Loan Returned",
      );
      setShowReturnModal(false);
      setReturnTarget(null);
      await fetchData();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isEs
            ? "No se pudo registrar la devolucion"
            : "Failed to return loan";
      showError(message, isEs ? "Error de devolucion" : "Return Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRefund = (lv: LoanView) => {
    setRefundTarget(lv);
    setRefundNotes("");
    setShowRefundModal(true);
  };

  const handleRefundDeposit = async () => {
    if (!refundTarget) return;
    setSubmitting(true);
    try {
      await refundDeposit(refundTarget.loan._id, refundNotes.trim() || undefined);
      showSuccess(
        isEs ? "Depósito reembolsado correctamente." : "Deposit refunded successfully.",
        isEs ? "Depósito reembolsado" : "Deposit Refunded",
      );
      setShowRefundModal(false);
      setRefundTarget(null);
      await fetchData();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isEs
            ? "No se pudo reembolsar el depósito"
            : "Failed to refund deposit";
      showError(message, isEs ? "Error al reembolsar" : "Refund Error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AnimatedPage>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{isEs ? "Prestamos" : "Loans"}</h1>
            <p className="text-gray-400 mt-1">
              {isEs
                ? "Haz seguimiento de prestamos activos y devoluciones"
                : "Track active loans and manage returns"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <RentalsFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          isEs={isEs}
        />

        {/* Table */}
        <RentalsTable
          loans={filtered}
          loading={loading}
          submitting={submitting}
          canExtend={canExtend}
          canReturn={canReturn}
          onViewDetail={handleOpenDetail}
          onExtend={handleOpenExtend}
          onReturn={handleOpenReturn}
          onRefund={handleOpenRefund}
          locale={locale}
          isEs={isEs}
        />

        {/* Modals */}
        <LoanDetailModal
          show={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          target={detailTarget}
          locale={locale}
          isEs={isEs}
        />

        <ExtendLoanModal
          show={showExtendModal}
          onClose={() => {
            setShowExtendModal(false);
            setExtendTarget(null);
          }}
          target={extendTarget}
          newEndDate={newEndDate}
          onEndDateChange={setNewEndDate}
          notes={extendNotes}
          onNotesChange={setExtendNotes}
          onSubmit={() => void handleExtendLoan()}
          submitting={submitting}
          isEs={isEs}
        />

        <ReturnLoanModal
          show={showReturnModal}
          onClose={() => {
            setShowReturnModal(false);
            setReturnTarget(null);
          }}
          target={returnTarget}
          onSubmit={() => void handleReturnLoan()}
          submitting={submitting}
          isEs={isEs}
        />

        <RefundDepositModal
          show={showRefundModal}
          onClose={() => {
            setShowRefundModal(false);
            setRefundNotes("");
          }}
          target={refundTarget}
          notes={refundNotes}
          onNotesChange={setRefundNotes}
          onSubmit={() => void handleRefundDeposit()}
          submitting={submitting}
          isEs={isEs}
        />

        <AlertModal />
      </div>
    </AnimatedPage>
  );
}

export default Rentals;
