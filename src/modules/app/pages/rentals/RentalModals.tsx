import { CalendarRange } from "lucide-react";
import { Button } from "../../../../components/ui";
import type { LoanView } from "./types";
import { customerFullName } from "./helpers";

// ─── Props ──────────────────────────────────────────────────────────────

interface LoanDetailModalProps {
  /** Whether the modal is visible. */
  show: boolean;
  /** Close callback. */
  onClose: () => void;
  /** Loan view to display. */
  target: LoanView | null;
  /** Locale for date formatting. */
  locale: string;
  /** Whether Spanish locale is active. */
  isEs: boolean;
}

interface ExtendLoanModalProps {
  /** Whether the modal is visible. */
  show: boolean;
  /** Close callback. */
  onClose: () => void;
  /** Target loan view. */
  target: LoanView | null;
  /** New end date (YYYY-MM-DD). */
  newEndDate: string;
  /** New end date setter. */
  onEndDateChange: (value: string) => void;
  /** Extension notes. */
  notes: string;
  /** Notes setter. */
  onNotesChange: (value: string) => void;
  /** Submit callback. */
  onSubmit: () => void;
  /** Whether submitting. */
  submitting: boolean;
  /** Whether Spanish locale is active. */
  isEs: boolean;
}

interface ReturnLoanModalProps {
  /** Whether the modal is visible. */
  show: boolean;
  /** Close callback. */
  onClose: () => void;
  /** Target loan view. */
  target: LoanView | null;
  /** Submit callback. */
  onSubmit: () => void;
  /** Whether submitting. */
  submitting: boolean;
  /** Whether Spanish locale is active. */
  isEs: boolean;
}

interface RefundDepositModalProps {
  /** Whether the modal is visible. */
  show: boolean;
  /** Close callback. */
  onClose: () => void;
  /** Target loan view. */
  target: LoanView | null;
  /** Refund notes. */
  notes: string;
  /** Notes setter. */
  onNotesChange: (value: string) => void;
  /** Submit callback. */
  onSubmit: () => void;
  /** Whether submitting. */
  submitting: boolean;
  /** Whether Spanish locale is active. */
  isEs: boolean;
}

// ─── Detail Modal ─────────────────────────────────────────────────────────

function getLoanStatusBadgeStyle(status: string): string {
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

function formatDateLocal(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function LoanDetailModal({ show, onClose, target, locale, isEs }: LoanDetailModalProps) {
  if (!show || !target) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4">
        <h2 className="text-xl font-semibold text-white">
          {isEs ? "Detalle del prestamo" : "Loan Details"}
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-1">{isEs ? "ID prestamo" : "Loan ID"}</p>
            <p className="text-white font-mono">#{target.loan._id.slice(-8).toUpperCase()}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">{isEs ? "Estado" : "Status"}</p>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize inline-block ${getLoanStatusBadgeStyle(target.loan.status)}`}
            >
              {target.loan.status}
            </span>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">{isEs ? "Cliente" : "Customer"}</p>
            <p className="text-white">{customerFullName(target.customer)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">{isEs ? "ID solicitud" : "Request ID"}</p>
            <p className="text-white font-mono text-xs">
              #{target.loan.requestId.slice(-8).toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">{isEs ? "Fecha inicio" : "Start Date"}</p>
            <p className="text-white">{formatDateLocal(target.loan.startDate, locale)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">{isEs ? "Fecha fin" : "End Date"}</p>
            <p className="text-white">{formatDateLocal(target.loan.endDate, locale)}</p>
          </div>
          {target.loan.notes && (
            <div className="col-span-2">
              <p className="text-gray-400 text-xs mb-1">{isEs ? "Notas" : "Notes"}</p>
              <p className="text-gray-200 text-sm">{target.loan.notes}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            {isEs ? "Cerrar" : "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Extend Modal ─────────────────────────────────────────────────────────

export function ExtendLoanModal({
  show,
  onClose,
  target,
  newEndDate,
  onEndDateChange,
  notes,
  onNotesChange,
  onSubmit,
  submitting,
  isEs,
}: ExtendLoanModalProps) {
  if (!show || !target) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <h2 className="text-xl font-semibold text-white">
          {isEs ? "Extender prestamo" : "Extend Loan"}
        </h2>
        <p className="text-zinc-400 text-sm">
          {isEs ? "Extendiendo prestamo" : "Extending loan"}{" "}
          <span className="text-white font-medium">#{target.loan._id.slice(-8).toUpperCase()}</span>{" "}
          {isEs ? "para" : "for"}{" "}
          <span className="text-white font-medium">{customerFullName(target.customer)}</span>
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {isEs ? "Nueva fecha fin" : "New End Date"}
            </label>
            <input
              type="date"
              value={newEndDate}
              min={target.loan.endDate.slice(0, 10)}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700] transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {isEs ? "Notas" : "Notes"}{" "}
              <span className="text-gray-600 text-xs">{isEs ? "(opcional)" : "(optional)"}</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
              placeholder={isEs ? "Motivo de la extension..." : "Reason for extension..."}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            leftIcon={CalendarRange}
            onClick={onSubmit}
            disabled={submitting || !newEndDate}
            className="bg-blue-500 hover:bg-blue-600 text-white border-transparent"
          >
            {submitting
              ? isEs
                ? "Extendiendo..."
                : "Extending..."
              : isEs
                ? "Extender prestamo"
                : "Extend Loan"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Return Modal ─────────────────────────────────────────────────────────

export function ReturnLoanModal({
  show,
  onClose,
  target,
  onSubmit,
  submitting,
  isEs,
}: ReturnLoanModalProps) {
  if (!show || !target) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <h2 className="text-xl font-semibold text-white">
          {isEs ? "Confirmar devolucion" : "Confirm Return"}
        </h2>
        <p className="text-zinc-400 text-sm">
          {isEs ? "Marcar prestamo" : "Mark loan"}{" "}
          <span className="text-white font-medium">#{target.loan._id.slice(-8).toUpperCase()}</span>{" "}
          {isEs ? "como devuelto?" : "as returned?"}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting}
            className="bg-green-500 hover:bg-green-600 text-white border-transparent"
          >
            {submitting
              ? isEs
                ? "Procesando..."
                : "Processing..."
              : isEs
                ? "Marcar como devuelto"
                : "Mark as Returned"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Refund Deposit Modal ─────────────────────────────────────────────────

export function RefundDepositModal({
  show,
  onClose,
  target,
  notes,
  onNotesChange,
  onSubmit,
  submitting,
  isEs,
}: RefundDepositModalProps) {
  if (!show || !target) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <h2 className="text-xl font-semibold text-white">
          {isEs ? "Reembolsar depósito" : "Refund Deposit"}
        </h2>
        <div className="text-zinc-400 text-sm space-y-2">
          <p>
            {isEs
              ? `El cliente tiene un depósito de $${target.loan.deposit.amount.toLocaleString()} COP para reembolsar.`
              : `The customer has a deposit of $${target.loan.deposit.amount.toLocaleString()} COP to be refunded.`}
          </p>
          <p className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-200/80">
            {isEs
              ? "Esta acción registrará el reembolso manual y permitirá cerrar el préstamo."
              : "This action will record the manual refund and allow the loan to be completed."}
          </p>
        </div>
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            {isEs ? "Notas de reembolso" : "Refund Notes"}
          </label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
            placeholder={
              isEs ? "Notas opcionales sobre el reembolso..." : "Optional notes about the refund..."
            }
            className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all resize-none"
          />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting}
            className="bg-yellow-500 hover:bg-yellow-600 text-black border-transparent font-semibold"
          >
            {submitting
              ? isEs
                ? "Procesando..."
                : "Processing..."
              : isEs
                ? "Confirmar reembolso"
                : "Confirm Refund"}
          </Button>
        </div>
      </div>
    </div>
  );
}
