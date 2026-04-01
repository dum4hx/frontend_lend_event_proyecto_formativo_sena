import { Eye, CalendarRange, RotateCcw, AlertCircle, HandCoins, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../../../components/ui";
import type { LoanView } from "./types";
import {
  getLoanStatusBadgeStyle,
  getStatusLabel,
  formatDate,
  daysRemaining,
  customerFullName,
} from "./helpers";

// ─── Props ──────────────────────────────────────────────────────────────

interface RentalsTableProps {
  /** Filtered loan views. */
  loans: LoanView[];
  /** Whether data is loading. */
  loading: boolean;
  /** Whether an action is submitting. */
  submitting: boolean;
  /** Whether user can extend loans. */
  canExtend: boolean;
  /** Whether user can return loans. */
  canReturn: boolean;
  /** Open detail callback. */
  onViewDetail: (lv: LoanView) => void;
  /** Open extend callback. */
  onExtend: (lv: LoanView) => void;
  /** Open return callback. */
  onReturn: (lv: LoanView) => void;
  /** Open refund callback. */
  onRefund: (lv: LoanView) => void;
  /** Locale string for date formatting. */
  locale: string;
  /** Whether Spanish locale is active. */
  isEs: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────

export function RentalsTable({
  loans,
  loading,
  submitting,
  canExtend,
  canReturn,
  onViewDetail,
  onExtend,
  onReturn,
  onRefund,
  locale,
  isEs,
}: RentalsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-[#FFD700]" size={32} />
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        {isEs ? "No se encontraron prestamos" : "No loans found"}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#333]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#1a1a1a] text-gray-400 border-b border-[#333]">
            <th className="text-left px-4 py-3 font-semibold">
              {isEs ? "ID Prestamo" : "Loan ID"}
            </th>
            <th className="text-left px-4 py-3 font-semibold">{isEs ? "Cliente" : "Customer"}</th>
            <th className="text-left px-4 py-3 font-semibold">
              {isEs ? "Fecha inicio" : "Start Date"}
            </th>
            <th className="text-left px-4 py-3 font-semibold">{isEs ? "Fecha fin" : "End Date"}</th>
            <th className="text-left px-4 py-3 font-semibold">{isEs ? "Dias" : "Days"}</th>
            <th className="text-left px-4 py-3 font-semibold">{isEs ? "Estado" : "Status"}</th>
            <th className="text-left px-4 py-3 font-semibold">{isEs ? "Acciones" : "Actions"}</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((lv) => {
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
                <td className="px-4 py-3">
                  <Link to="/app/customers" className="entity-link font-medium">
                    {customerFullName(lv.customer)}
                  </Link>
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
                      onClick={() => onViewDetail(lv)}
                    >
                      {isEs ? "Detalle" : "Details"}
                    </Button>
                    {isActive && canExtend && (
                      <Button
                        size="sm"
                        leftIcon={CalendarRange}
                        onClick={() => onExtend(lv)}
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
                        onClick={() => onReturn(lv)}
                        disabled={submitting}
                        className="bg-green-500/15 text-green-300 border-green-500/40 hover:bg-green-500/25"
                      >
                        {isEs ? "Devolver" : "Return"}
                      </Button>
                    )}
                    {(lv.loan.deposit?.status === "refund_pending" ||
                      lv.loan.deposit?.status === "partially_applied") && (
                      <Button
                        size="sm"
                        leftIcon={HandCoins}
                        onClick={() => onRefund(lv)}
                        disabled={submitting}
                        className="bg-yellow-500/15 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/25"
                      >
                        {isEs ? "Reembolsar" : "Refund"}
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
  );
}
