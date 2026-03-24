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

// ─── Types ─────────────────────────────────────────────────────────────────

type LoanFilter = "all" | LoanStatus;

interface LoanView {
  loan: Loan;
  customer?: Customer;
}

const STATUS_OPTIONS: Array<{ value: LoanFilter; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "overdue", label: "Overdue" },
  { value: "returned", label: "Returned" },
  { value: "closed", label: "Closed" },
];

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
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
      const message = error instanceof Error ? error.message : "Failed to load loans";
      showError(message, "Load Error");
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
      showSuccess("Loan extended successfully.", "Loan Extended");
      setShowExtendModal(false);
      setExtendTarget(null);
      await fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to extend loan";
      showError(message, "Extend Error");
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
      showSuccess("Loan marked as returned.", "Loan Returned");
      setShowReturnModal(false);
      setReturnTarget(null);
      await fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to return loan";
      showError(message, "Return Error");
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
          <h1 className="text-3xl font-bold text-white">Loans</h1>
          <p className="text-gray-400 mt-1">Track active loans and manage returns</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search by loan ID or customer..."
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
              <option key={opt.value} value={opt.value}>
                {opt.label}
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
        <div className="text-center py-12 text-gray-400">No loans found</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#333]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1a1a1a] text-gray-400 border-b border-[#333]">
                <th className="text-left px-4 py-3 font-semibold">Loan ID</th>
                <th className="text-left px-4 py-3 font-semibold">Customer</th>
                <th className="text-left px-4 py-3 font-semibold">Start Date</th>
                <th className="text-left px-4 py-3 font-semibold">End Date</th>
                <th className="text-left px-4 py-3 font-semibold">Days</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
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
                    <td className="px-4 py-3 text-gray-300">{formatDate(lv.loan.startDate)}</td>
                    <td className="px-4 py-3 text-gray-300">{formatDate(lv.loan.endDate)}</td>
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
                            ? `${Math.abs(remaining)}d overdue`
                            : remaining === 0
                              ? "Due today"
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
                          {lv.loan.status}
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
                          Details
                        </Button>
                        {isActive && canExtend && (
                          <Button
                            size="sm"
                            leftIcon={CalendarRange}
                            onClick={() => handleOpenExtend(lv)}
                            disabled={submitting}
                            className="bg-blue-500/15 text-blue-300 border-blue-500/40 hover:bg-blue-500/25"
                          >
                            Extend
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
                            Return
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
            <h2 className="text-xl font-semibold text-white">Loan Details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-1">Loan ID</p>
                <p className="text-white font-mono">
                  #{detailTarget.loan._id.slice(-8).toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Status</p>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize inline-block ${getLoanStatusBadgeStyle(detailTarget.loan.status)}`}
                >
                  {detailTarget.loan.status}
                </span>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Customer</p>
                <p className="text-white">{customerFullName(detailTarget.customer)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Request ID</p>
                <p className="text-white font-mono text-xs">
                  #{detailTarget.loan.requestId.slice(-8).toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Start Date</p>
                <p className="text-white">{formatDate(detailTarget.loan.startDate)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">End Date</p>
                <p className="text-white">{formatDate(detailTarget.loan.endDate)}</p>
              </div>
              {detailTarget.loan.notes && (
                <div className="col-span-2">
                  <p className="text-gray-400 text-xs mb-1">Notes</p>
                  <p className="text-gray-200 text-sm">{detailTarget.loan.notes}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Close
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
            <h2 className="text-xl font-semibold text-white">Extend Loan</h2>
            <p className="text-zinc-400 text-sm">
              Extending loan{" "}
              <span className="text-white font-medium">
                #{extendTarget.loan._id.slice(-8).toUpperCase()}
              </span>{" "}
              for{" "}
              <span className="text-white font-medium">
                {customerFullName(extendTarget.customer)}
              </span>
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">New End Date</label>
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
                  Notes <span className="text-gray-600 text-xs">(optional)</span>
                </label>
                <textarea
                  value={extendNotes}
                  onChange={(e) => setExtendNotes(e.target.value)}
                  rows={3}
                  placeholder="Reason for extension..."
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
                Cancel
              </Button>
              <Button
                leftIcon={CalendarRange}
                onClick={handleExtendLoan}
                disabled={submitting || !newEndDate}
                className="bg-blue-500 hover:bg-blue-600 text-white border-transparent"
              >
                {submitting ? "Extending..." : "Extend Loan"}
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
            <h2 className="text-xl font-semibold text-white">Confirm Return</h2>
            <p className="text-zinc-400 text-sm">
              Mark loan{" "}
              <span className="text-white font-medium">
                #{returnTarget.loan._id.slice(-8).toUpperCase()}
              </span>{" "}
              as returned?
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
                Cancel
              </Button>
              <Button
                leftIcon={RotateCcw}
                onClick={handleReturnLoan}
                disabled={submitting}
                className="bg-green-500 hover:bg-green-600 text-white border-transparent"
              >
                {submitting ? "Processing..." : "Mark as Returned"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertModal />
    </div>
  );
}
