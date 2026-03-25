import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  RotateCcw,
  CalendarRange,
  AlertCircle,
  Eye,
  Loader2,
} from "lucide-react";
import { Button } from "../../../components/ui";
import type { Loan, LoanStatus, Customer, ExtendLoanPayload } from "../../../types/api";
import { getLoans, extendLoan, returnLoan } from "../../../services/loanService";
import { getCustomers } from "../../../services/customerService";
import { useAlertModal } from "../../../hooks/useAlertModal";
import { usePermissions } from "../../../contexts/usePermissions";
import { useLanguage } from "../../../contexts/useLanguage";

// ─── Types ─────────────────────────────────────────────────────────────────

type LoanFilter = "all" | LoanStatus;

interface LoanView {
  loan: Loan;
  customer?: Customer;
}

const STATUS_OPTIONS: LoanFilter[] = ["all", "active", "overdue", "returned", "closed"];

function getStatusLabel(status: LoanFilter, isEs: boolean): string {
  switch (status) {
    case "all":
      return isEs ? "Todos los estados" : "All Status";
    case "active":
      return isEs ? "Activo" : "Active";
    case "overdue":
      return isEs ? "Vencido" : "Overdue";
    case "returned":
      return isEs ? "Devuelto" : "Returned";
    case "closed":
      return isEs ? "Cerrado" : "Closed";
    default:
      return status;
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getLoanStatusBadgeStyle(status: LoanStatus): string {
  switch (status) {
    case "active":
      return "bg-green-500/20 text-green-400 border border-green-500/30";
    case "overdue":
      return "bg-red-500/20 text-red-400 border border-red-500/30";
    case "returned":
      return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    case "closed":
      return "bg-zinc-500/20 text-zinc-300 border border-zinc-500/30";
    default:
      return "bg-gray-500/20 text-gray-300 border border-gray-500/30";
  }
}

function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysRemaining(endDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function customerFullName(customer?: Customer): string {
  if (!customer) return "—";
  const { firstName, firstSurname, secondSurname } = customer.name;
  return [firstName, firstSurname, secondSurname].filter(Boolean).join(" ");
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function Rentals() {
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

  // ── Extend loan modal ────────────────────────────────────────────────────
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendTarget, setExtendTarget] = useState<LoanView | null>(null);
  const [newEndDate, setNewEndDate] = useState("");
  const [extendNotes, setExtendNotes] = useState("");

  // ── Return loan modal ────────────────────────────────────────────────────
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnTarget, setReturnTarget] = useState<LoanView | null>(null);

  // ── Detail modal ─────────────────────────────────────────────────────────
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTarget, setDetailTarget] = useState<LoanView | null>(null);

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

      const views: LoanView[] = (loansRes.data.loans as Loan[]).map((loan) => ({
        loan,
        customer: customerMap.get(loan.customerId),
      }));
      setLoans(views);
    } catch (error) {
      const message = error instanceof Error ? error.message : isEs ? "No se pudieron cargar los prestamos" : "Failed to load loans";
      showError(message, isEs ? "Error de carga" : "Load Error");
    } finally {
      setLoading(false);
    }
  }, [showError]);

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
        isEs ? "Prestamo extendido" : "Loan Extended"
      );
      setShowExtendModal(false);
      setExtendTarget(null);
      await fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : isEs ? "No se pudo extender el prestamo" : "Failed to extend loan";
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
        isEs ? "Prestamo devuelto" : "Loan Returned"
      );
      setShowReturnModal(false);
      setReturnTarget(null);
      await fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : isEs ? "No se pudo registrar la devolucion" : "Failed to return loan";
      showError(message, isEs ? "Error de devolucion" : "Return Error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{isEs ? "Prestamos" : "Loans"}</h1>
          <p className="text-gray-400 mt-1">
            {isEs ? "Haz seguimiento de prestamos activos y devoluciones" : "Track active loans and manage returns"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder={isEs ? "Buscar por ID de prestamo o cliente..." : "Search by loan ID or customer..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as LoanFilter)}
            className="appearance-none px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white focus:outline-none focus:border-[#FFD700] transition-all cursor-pointer pr-10"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {getStatusLabel(opt, isEs)}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            size={20}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-[#FFD700]" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{isEs ? "No se encontraron prestamos" : "No loans found"}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#333]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1a1a1a] text-gray-400 border-b border-[#333]">
                <th className="text-left px-4 py-3 font-semibold">{isEs ? "ID Prestamo" : "Loan ID"}</th>
                <th className="text-left px-4 py-3 font-semibold">{isEs ? "Cliente" : "Customer"}</th>
                <th className="text-left px-4 py-3 font-semibold">{isEs ? "Fecha inicio" : "Start Date"}</th>
                <th className="text-left px-4 py-3 font-semibold">{isEs ? "Fecha fin" : "End Date"}</th>
                <th className="text-left px-4 py-3 font-semibold">{isEs ? "Dias" : "Days"}</th>
                <th className="text-left px-4 py-3 font-semibold">{isEs ? "Estado" : "Status"}</th>
                <th className="text-left px-4 py-3 font-semibold">{isEs ? "Acciones" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lv) => {
                const remaining = daysRemaining(lv.loan.endDate);
                const isActive = lv.loan.status === "active" || lv.loan.status === "overdue";
                return (
                  <tr
                    key={lv.loan._id}
                    className="border-b border-[#333] hover:bg-[#1a1a1a] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-300">
                        #{lv.loan._id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">
                      {customerFullName(lv.customer)}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{formatDate(lv.loan.startDate, locale)}</td>
                    <td className="px-4 py-3 text-gray-300">{formatDate(lv.loan.endDate, locale)}</td>
                    <td className="px-4 py-3">
                      {isActive ? (
                        <span
                          className={
                            remaining < 0
                              ? "text-red-400 font-semibold"
                              : remaining <= 2
                                ? "text-yellow-400 font-semibold"
                                : "text-gray-300"
                          }
                        >
                          {remaining < 0
                            ? isEs
                              ? `${Math.abs(remaining)}d vencido`
                              : `${Math.abs(remaining)}d overdue`
                            : remaining === 0
                              ? isEs
                                ? "Vence hoy"
                                : "Due today"
                              : isEs
                                ? `${remaining}d restantes`
                                : `${remaining}d left`}
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${getLoanStatusBadgeStyle(lv.loan.status)}`}
                        >
                          {getStatusLabel(lv.loan.status, isEs)}
                        </span>
                        {lv.loan.status === "overdue" && (
                          <AlertCircle size={14} className="text-red-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={Eye}
                          onClick={() => {
                            setDetailTarget(lv);
                            setShowDetailModal(true);
                          }}
                        >
                          {isEs ? "Detalle" : "Details"}
                        </Button>
                        {isActive && canExtend && (
                          <Button
                            size="sm"
                            leftIcon={CalendarRange}
                            onClick={() => handleOpenExtend(lv)}
                            disabled={submitting}
                            className="bg-blue-500/15 text-blue-300 border-blue-500/40 hover:bg-blue-500/25"
                          >
                            {isEs ? "Extender" : "Extend"}
                          </Button>
                        )}
                        {isActive && canReturn && (
                          <Button
                            size="sm"
                            leftIcon={RotateCcw}
                            onClick={() => handleOpenReturn(lv)}
                            disabled={submitting}
                            className="bg-green-500/15 text-green-300 border-green-500/40 hover:bg-green-500/25"
                          >
                            {isEs ? "Devolver" : "Return"}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Detail Modal ──────────────────────────────────────────────── */}
      {showDetailModal && detailTarget && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowDetailModal(false)}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h2 className="text-xl font-semibold text-white">{isEs ? "Detalle del prestamo" : "Loan Details"}</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-1">{isEs ? "ID prestamo" : "Loan ID"}</p>
                <p className="text-white font-mono">
                  #{detailTarget.loan._id.slice(-8).toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">{isEs ? "Estado" : "Status"}</p>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize inline-block ${getLoanStatusBadgeStyle(detailTarget.loan.status)}`}
                >
                  {detailTarget.loan.status}
                </span>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">{isEs ? "Cliente" : "Customer"}</p>
                <p className="text-white">{customerFullName(detailTarget.customer)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">{isEs ? "ID solicitud" : "Request ID"}</p>
                <p className="text-white font-mono text-xs">
                  #{detailTarget.loan.requestId.slice(-8).toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">{isEs ? "Fecha inicio" : "Start Date"}</p>
                <p className="text-white">{formatDate(detailTarget.loan.startDate, locale)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">{isEs ? "Fecha fin" : "End Date"}</p>
                <p className="text-white">{formatDate(detailTarget.loan.endDate, locale)}</p>
              </div>
              {detailTarget.loan.notes && (
                <div className="col-span-2">
                  <p className="text-gray-400 text-xs mb-1">{isEs ? "Notas" : "Notes"}</p>
                  <p className="text-gray-200 text-sm">{detailTarget.loan.notes}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                {isEs ? "Cerrar" : "Close"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Extend Loan Modal ─────────────────────────────────────────── */}
      {showExtendModal && extendTarget && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowExtendModal(false)}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-xl font-semibold text-white">{isEs ? "Extender prestamo" : "Extend Loan"}</h2>
            <p className="text-zinc-400 text-sm">
              {isEs ? "Extendiendo prestamo" : "Extending loan"}{" "}
              <span className="text-white font-medium">
                #{extendTarget.loan._id.slice(-8).toUpperCase()}
              </span>{" "}
              {isEs ? "para" : "for"}{" "}
              <span className="text-white font-medium">
                {customerFullName(extendTarget.customer)}
              </span>
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">{isEs ? "Nueva fecha fin" : "New End Date"}</label>
                <input
                  type="date"
                  value={newEndDate}
                  min={extendTarget.loan.endDate.slice(0, 10)}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {isEs ? "Notas" : "Notes"} <span className="text-gray-600 text-xs">{isEs ? "(opcional)" : "(optional)"}</span>
                </label>
                <textarea
                  value={extendNotes}
                  onChange={(e) => setExtendNotes(e.target.value)}
                  rows={3}
                  placeholder={isEs ? "Motivo de la extension..." : "Reason for extension..."}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExtendModal(false);
                  setExtendTarget(null);
                }}
                disabled={submitting}
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                leftIcon={CalendarRange}
                onClick={handleExtendLoan}
                disabled={submitting || !newEndDate}
                className="bg-blue-500 hover:bg-blue-600 text-white border-transparent"
              >
                {submitting ? (isEs ? "Extendiendo..." : "Extending...") : isEs ? "Extender prestamo" : "Extend Loan"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Return Loan Modal ─────────────────────────────────────────── */}
      {showReturnModal && returnTarget && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowReturnModal(false)}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-xl font-semibold text-white">{isEs ? "Confirmar devolucion" : "Confirm Return"}</h2>
            <p className="text-zinc-400 text-sm">
              {isEs ? "Marcar prestamo" : "Mark loan"}{" "}
              <span className="text-white font-medium">
                #{returnTarget.loan._id.slice(-8).toUpperCase()}
              </span>{" "}
              {isEs ? "como devuelto?" : "as returned?"}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnTarget(null);
                }}
                disabled={submitting}
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                leftIcon={RotateCcw}
                onClick={handleReturnLoan}
                disabled={submitting}
                className="bg-green-500 hover:bg-green-600 text-white border-transparent"
              >
                {submitting ? (isEs ? "Procesando..." : "Processing...") : isEs ? "Marcar como devuelto" : "Mark as Returned"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertModal />
    </div>
  );
}
