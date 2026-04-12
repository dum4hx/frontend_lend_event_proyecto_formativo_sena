import React, { useState, useEffect } from "react";
import { CalendarRange, X, Package, ChevronDown, ChevronUp, CheckCircle, Copy } from "lucide-react";
import { Button } from "../../../../components/ui";
import { useCopyToClipboard } from "../../../../hooks/useCopyToClipboard";
import type { LoanView } from "./types";
import type { LoanDetailGrouped, LoanMaterialInstanceEntry } from "../../../../types/api";
import { getLoanDetailGrouped } from "../../../../services/loanService";
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

interface CompleteLoanModalProps {
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
  const { copy } = useCopyToClipboard();
  const [loanDetail, setLoanDetail] = useState<LoanDetailGrouped | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!show || !target) return;
    const loanId = target.loan._id;
    let cancelled = false;
    async function fetchDetail() {
      setLoadingDetail(true);
      try {
        const detailRes = await getLoanDetailGrouped(loanId);
        if (cancelled) return;
        setLoanDetail(detailRes.data.loan);
      } catch {
        if (!cancelled) setLoanDetail(null);
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    }
    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [show, target]);

  if (!show || !target) return null;

  const rawByType = loanDetail?.materialInstancesByType ?? {};
  const typeEntries = Object.entries(rawByType);

  function toggleCollapse(typeId: string) {
    setCollapsed((prev) => ({ ...prev, [typeId]: !prev[typeId] }));
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#121212] border border-[#333] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#121212] border-b border-[#333] p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {isEs ? "Detalle del préstamo" : "Loan Details"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#1a1a1a] rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic info grid */}
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">
                {isEs ? "Código préstamo" : "Loan Code"}
              </label>
              <button
                onClick={() => copy(target.loan.code ?? `#${target.loan._id.slice(-8).toUpperCase()}`)}
                className="text-white font-mono font-semibold hover:text-[#FFD700] transition-colors flex items-center gap-1 group/copy"
                title="Haz click para copiar"
              >
                {target.loan.code ?? `#${target.loan._id.slice(-8).toUpperCase()}`}
                <Copy size={14} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">
                {isEs ? "Estado" : "Status"}
              </label>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize inline-block ${getLoanStatusBadgeStyle(target.loan.status)}`}
              >
                {target.loan.status}
              </span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">
                {isEs ? "Cliente" : "Customer"}
              </label>
              <p className="text-white">{customerFullName(target.customer)}</p>
            </div>
            {target.loan.requestId && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">
                  {isEs ? "Código solicitud" : "Request Code"}
                </label>
                <button
                  onClick={() => copy(target.loan.requestCode ?? `#${String(target.loan.requestId).slice(-8).toUpperCase()}`)}
                  className="text-white font-mono text-xs hover:text-[#FFD700] transition-colors flex items-center gap-1 group/copy"
                  title="Haz click para copiar"
                >
                  {target.loan.requestCode ??
                    `#${String(target.loan.requestId).slice(-8).toUpperCase()}`}
                  <Copy size={12} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                </button>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">
                {isEs ? "Fecha inicio" : "Start Date"}
              </label>
              <p className="text-white">{formatDateLocal(target.loan.startDate, locale)}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">
                {isEs ? "Fecha fin" : "End Date"}
              </label>
              <p className="text-white">{formatDateLocal(target.loan.endDate, locale)}</p>
            </div>
            {target.loan.notes && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">
                  {isEs ? "Notas" : "Notes"}
                </label>
                <p className="text-gray-200">{target.loan.notes}</p>
              </div>
            )}
          </div>

          {/* Financial summary */}
          {(target.loan.totalAmount != null ||
            target.loan.deposit?.amount != null ||
            (target.loan.damageFees ?? 0) > 0 ||
            (target.loan.lateFees ?? 0) > 0) && (
            <div className="border border-[#2a2a2a] rounded-xl p-4 bg-[#171717] space-y-3">
              <p className="text-xs font-semibold text-[#FFD700] uppercase tracking-wider">
                {isEs ? "Resumen Financiero" : "Financial Summary"}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {target.loan.totalAmount != null && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-0.5 uppercase tracking-wide">
                      {isEs ? "Total" : "Total Amount"}
                    </label>
                    <p className="text-white font-semibold">
                      ${target.loan.totalAmount.toLocaleString()}
                    </p>
                  </div>
                )}
                {target.loan.deposit?.amount != null && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-0.5 uppercase tracking-wide">
                      {isEs ? "Depósito" : "Deposit"}
                    </label>
                    <p className="text-white font-semibold">
                      ${target.loan.deposit.amount.toLocaleString()}
                    </p>
                  </div>
                )}
                {target.loan.deposit?.status && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-0.5 uppercase tracking-wide">
                      {isEs ? "Estado depósito" : "Deposit Status"}
                    </label>
                    <p className="text-gray-300 capitalize">
                      {target.loan.deposit.status.replace(/_/g, " ")}
                    </p>
                  </div>
                )}
                {target.loan.deposit?.refundAvailable && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-0.5 uppercase tracking-wide">
                      {isEs ? "Devolución disponible" : "Refundable Amount"}
                    </label>
                    <p className="text-green-400 font-semibold">
                      ${(target.loan.deposit.refundableAmount ?? 0).toLocaleString()}
                    </p>
                  </div>
                )}
                {(target.loan.damageFees ?? 0) > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-0.5 uppercase tracking-wide">
                      {isEs ? "Cargos por daño" : "Damage Fees"}
                    </label>
                    <p className="text-red-400 font-semibold">
                      ${target.loan.damageFees!.toLocaleString()}
                    </p>
                  </div>
                )}
                {(target.loan.lateFees ?? 0) > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-0.5 uppercase tracking-wide">
                      {isEs ? "Cargos por mora" : "Late Fees"}
                    </label>
                    <p className="text-red-400 font-semibold">
                      ${target.loan.lateFees!.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Material instances grouped by type */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#FFD700] uppercase tracking-wider">
              <Package size={16} />
              <span>{isEs ? "Materiales prestados" : "Loaned Materials"}</span>
            </div>

            {loadingDetail && (
              <p className="text-xs text-gray-500 animate-pulse">
                {isEs ? "Cargando materiales..." : "Loading materials..."}
              </p>
            )}

            {!loadingDetail && typeEntries.length === 0 && (
              <p className="text-gray-500 text-sm">
                {isEs ? "Sin materiales registrados." : "No materials recorded."}
              </p>
            )}

            {typeEntries.map(([typeId, group]) => {
              const instances: LoanMaterialInstanceEntry[] = group.instances;
              const typeName = instances[0]?.materialType?.name ?? typeId.slice(-8).toUpperCase();
              const isCollapsed = collapsed[typeId] === true;
              return (
                <div
                  key={typeId}
                  className="rounded-xl border border-[#333] bg-[#171717] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleCollapse(typeId)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border-b border-[#333] hover:bg-[#222] transition-colors"
                  >
                    <p className="text-xs font-bold text-gray-300 uppercase tracking-wide text-left">
                      {typeName}
                      <span className="ml-2 text-gray-500 font-normal normal-case">
                        ({instances.length})
                      </span>
                    </p>
                    {isCollapsed ? (
                      <ChevronDown size={14} className="text-gray-500 shrink-0" />
                    ) : (
                      <ChevronUp size={14} className="text-gray-500 shrink-0" />
                    )}
                  </button>
                  {!isCollapsed && (
                    <div className="divide-y divide-[#2a2a2a]">
                      {instances.map((entry) => (
                        <div
                          key={entry.materialInstanceId._id}
                          className="flex items-center justify-between px-4 py-3"
                        >
                          <button
                            onClick={() => copy(entry.materialInstanceId.serialNumber)}
                            className="text-white font-mono text-sm hover:text-[#FFD700] hover:underline transition-colors flex items-center gap-1 group/copy"
                            title="Haz click para copiar"
                          >
                            {entry.materialInstanceId.serialNumber}
                            <Copy size={13} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                          </button>
                          <span className="text-xs text-gray-400 capitalize">
                            {entry.materialInstanceId.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#333] p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-[#1a1a1a] text-white font-semibold rounded-lg hover:bg-[#222] transition-colors border border-[#333]"
          >
            {isEs ? "Cerrar" : "Close"}
          </button>
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
  const { copy } = useCopyToClipboard();
  if (!show || !target) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4"
        data-help-id="rentals-extend-form"
      >
        <h2 className="text-xl font-semibold text-white">
          {isEs ? "Extender prestamo" : "Extend Loan"}
        </h2>
        <p className="text-zinc-400 text-sm">
          {isEs ? "Extendiendo prestamo" : "Extending loan"}{" "}
          <button
            onClick={() => copy(target.loan.code ?? `#${target.loan._id.slice(-8).toUpperCase()}`)}
            className="text-white font-medium hover:text-[#FFD700] transition-colors inline-flex items-center gap-1 group/copy"
            title="Haz click para copiar"
          >
            {target.loan.code ?? `#${target.loan._id.slice(-8).toUpperCase()}`}
            <Copy size={14} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" />
          </button>{" "}
          {isEs ? "para" : "for"}{" "}
          <span className="text-white font-medium">{customerFullName(target.customer)}</span>
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {isEs ? "Nueva fecha fin" : "New End Date"}
            </label>
            <input
              data-help-id="rentals-extend-end-date"
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
              data-help-id="rentals-extend-notes"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
              placeholder={isEs ? "Motivo de la extension..." : "Reason for extension..."}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            data-help-id="rentals-extend-cancel"
          >
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            leftIcon={CalendarRange}
            onClick={onSubmit}
            disabled={submitting || !newEndDate}
            className="bg-blue-500 hover:bg-blue-600 text-white border-transparent"
            data-help-id="rentals-extend-submit"
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
  const { copy } = useCopyToClipboard();
  if (!show || !target) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4"
        data-help-id="rentals-return-form"
      >
        <h2 className="text-xl font-semibold text-white">
          {isEs ? "Confirmar devolucion" : "Confirm Return"}
        </h2>
        <p className="text-zinc-400 text-sm">
          {isEs ? "Marcar prestamo" : "Mark loan"}{" "}
          <button
            onClick={() => copy(target.loan.code ?? `#${target.loan._id.slice(-8).toUpperCase()}`)}
            className="text-white font-medium hover:text-[#FFD700] transition-colors inline-flex items-center gap-1 group/copy"
            title="Haz click para copiar"
          >
            {target.loan.code ?? `#${target.loan._id.slice(-8).toUpperCase()}`}
            <Copy size={14} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" />
          </button>{" "}
          {isEs ? "como devuelto?" : "as returned?"}
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            data-help-id="rentals-return-cancel"
          >
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting}
            className="bg-green-500 hover:bg-green-600 text-white border-transparent"
            data-help-id="rentals-return-submit"
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
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4"
        data-help-id="rentals-refund-form"
      >
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
            data-help-id="rentals-refund-notes"
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
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            data-help-id="rentals-refund-cancel"
          >
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting}
            className="bg-yellow-500 hover:bg-yellow-600 text-black border-transparent font-semibold"
            data-help-id="rentals-refund-submit"
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

// ─── Complete Loan Modal ──────────────────────────────────────────────────

export function CompleteLoanModal({
  show,
  onClose,
  target,
  onSubmit,
  submitting,
  isEs,
}: CompleteLoanModalProps) {
  if (!show || !target) return null;

  const depositResolved =
    !target.loan.deposit ||
    target.loan.deposit.amount === 0 ||
    target.loan.deposit.status === "applied" ||
    target.loan.deposit.status === "refunded" ||
    target.loan.deposit.status === "not_required";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4"
        data-help-id="rentals-complete-form"
      >
        <h2 className="text-xl font-semibold text-white">
          {isEs ? "Completar préstamo" : "Complete Loan"}
        </h2>
        <p className="text-zinc-400 text-sm">
          {isEs ? "Completar préstamo" : "Complete loan"}{" "}
          <span className="text-white font-medium">
            {target.loan.code ?? `#${target.loan._id.slice(-8).toUpperCase()}`}
          </span>{" "}
          {isEs ? "para" : "for"}{" "}
          <span className="text-white font-medium">{customerFullName(target.customer)}</span>
        </p>

        {!depositResolved && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200/80 text-sm">
            {isEs
              ? "El depósito de este préstamo no ha sido resuelto. Debe estar en estado 'aplicado' o 'reembolsado' antes de completar."
              : "The deposit for this loan has not been resolved. It must be 'applied' or 'refunded' before completing."}
          </div>
        )}

        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-200/80 text-sm">
          {isEs
            ? "Esta acción cerrará el préstamo definitivamente. Asegúrese de que la inspección esté completa y el depósito resuelto."
            : "This action will permanently close the loan. Ensure the inspection is complete and the deposit is resolved."}
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            data-help-id="rentals-complete-cancel"
          >
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            leftIcon={CheckCircle}
            onClick={onSubmit}
            disabled={submitting || !depositResolved}
            className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
            data-help-id="rentals-complete-submit"
          >
            {submitting
              ? isEs
                ? "Completando..."
                : "Completing..."
              : isEs
                ? "Completar préstamo"
                : "Complete Loan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
