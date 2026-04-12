import { useState } from "react";
import {
  CalendarRange,
  X,
  CheckCircle,
  ThumbsDown,
  Ban,
  RotateCcw,
  CreditCard,
} from "lucide-react";
import { Button } from "../../../../components/ui";
import { useLanguage } from "../../../../contexts/useLanguage";
import type { UnifiedLoanView } from "./types";
import { formatDate } from "./helpers";

// ─── Shared backdrop ────────────────────────────────────────────────────

interface ModalShellProps {
  children: React.ReactNode;
  onClose: () => void;
}

function ModalShell({ children, onClose }: ModalShellProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {children}
    </div>
  );
}

// ─── Reject Modal ───────────────────────────────────────────────────────

interface RejectLoanModalProps {
  show: boolean;
  onClose: () => void;
  target: UnifiedLoanView | null;
  onSubmit: (reason: string) => void;
  submitting: boolean;
}

export function RejectLoanModal({
  show,
  onClose,
  target,
  onSubmit,
  submitting,
}: RejectLoanModalProps) {
  const { t } = useLanguage();
  const [reason, setReason] = useState("");

  if (!show || !target) return null;

  return (
    <ModalShell onClose={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4"
        data-help-id="loans-reject-form"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <ThumbsDown size={20} className="text-red-400" />
            {t("loans.actions.rejectTitle")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-[#1a1a1a] rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-zinc-400 text-sm">
          {t("loans.actions.rejectMessage")}:{" "}
          <span className="text-white font-medium">
            {target.request.code ?? `#${target.request._id.slice(-8).toUpperCase()}`}
          </span>
        </p>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            {t("loans.actions.rejectReason")} <span className="text-red-400">*</span>
          </label>
          <textarea
            data-help-id="loans-reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("loans.actions.rejectReasonPlaceholder")}
            className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all resize-none"
            rows={4}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => onSubmit(reason.trim())}
            disabled={submitting || !reason.trim()}
            className="bg-red-500 hover:bg-red-600 text-white border-transparent"
          >
            {submitting ? t("common.processing") : t("loans.actions.reject")}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Cancel Modal ───────────────────────────────────────────────────────

interface CancelLoanModalProps {
  show: boolean;
  onClose: () => void;
  target: UnifiedLoanView | null;
  onSubmit: (reason: string) => void;
  submitting: boolean;
}

export function CancelLoanModal({
  show,
  onClose,
  target,
  onSubmit,
  submitting,
}: CancelLoanModalProps) {
  const { t } = useLanguage();
  const [reason, setReason] = useState("");

  if (!show || !target) return null;

  return (
    <ModalShell onClose={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4"
        data-help-id="loans-cancel-form"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Ban size={20} className="text-orange-400" />
            {t("loans.actions.cancelTitle")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-[#1a1a1a] rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-zinc-400 text-sm">
          {t("loans.actions.cancelMessage")}:{" "}
          <span className="text-white font-medium">
            {target.request.code ?? `#${target.request._id.slice(-8).toUpperCase()}`}
          </span>
        </p>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            {t("loans.actions.cancelReason")} <span className="text-red-400">*</span>
          </label>
          <textarea
            data-help-id="loans-cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("loans.actions.cancelReasonPlaceholder")}
            className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all resize-none"
            rows={4}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => onSubmit(reason.trim())}
            disabled={submitting || !reason.trim()}
            className="bg-orange-500 hover:bg-orange-600 text-white border-transparent"
          >
            {submitting ? t("common.processing") : t("loans.actions.cancelRequest")}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Reactivate Modal ───────────────────────────────────────────────────

interface ReactivateLoanModalProps {
  show: boolean;
  onClose: () => void;
  target: UnifiedLoanView | null;
  onSubmit: (reason: string) => void;
  submitting: boolean;
}

export function ReactivateLoanModal({
  show,
  onClose,
  target,
  onSubmit,
  submitting,
}: ReactivateLoanModalProps) {
  const { t } = useLanguage();
  const [reason, setReason] = useState("");

  if (!show || !target) return null;

  return (
    <ModalShell onClose={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4"
        data-help-id="loans-reactivate-form"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <RotateCcw size={20} className="text-blue-400" />
            {t("loans.actions.reactivateTitle")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-[#1a1a1a] rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-zinc-400 text-sm">
          {t("loans.actions.reactivateMessage")}:{" "}
          <span className="text-white font-medium">
            {target.request.code ?? `#${target.request._id.slice(-8).toUpperCase()}`}
          </span>
        </p>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            {t("loans.actions.reactivateReason")} <span className="text-red-400">*</span>
          </label>
          <textarea
            data-help-id="loans-reactivate-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("loans.actions.reactivateReasonPlaceholder")}
            className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all resize-none"
            rows={4}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => onSubmit(reason.trim())}
            disabled={submitting || !reason.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white border-transparent"
          >
            {submitting ? t("common.processing") : t("loans.actions.reactivate")}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Record Payment Modal ───────────────────────────────────────────────

interface RecordPaymentModalProps {
  show: boolean;
  onClose: () => void;
  target: UnifiedLoanView | null;
  onSubmit: () => void;
  submitting: boolean;
}

export function RecordPaymentModal({
  show,
  onClose,
  target,
  onSubmit,
  submitting,
}: RecordPaymentModalProps) {
  const { t } = useLanguage();

  if (!show || !target) return null;

  return (
    <ModalShell onClose={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4"
        data-help-id="loans-record-payment-form"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <CreditCard size={20} className="text-[#FFD700]" />
            {t("loans.actions.recordPaymentTitle")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-[#1a1a1a] rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-zinc-400 text-sm">
          {t("loans.actions.recordPaymentMessage")}:{" "}
          <span className="text-white font-medium">
            {target.request.code ?? `#${target.request._id.slice(-8).toUpperCase()}`}
          </span>
        </p>

        {target.request.depositAmount != null && (
          <div className="border border-[#2a2a2a] rounded-lg p-3 bg-[#171717]">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              {t("loans.actions.depositAmount")}
            </p>
            <p className="text-white font-semibold text-lg">
              ${target.request.depositAmount.toLocaleString()}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting}
            className="bg-[#FFD700] hover:bg-[#e6c200] text-black border-transparent font-semibold"
          >
            {submitting ? t("common.processing") : t("loans.actions.recordPayment")}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Record Rental Payment Modal ────────────────────────────────────────

interface RecordRentalPaymentModalProps {
  show: boolean;
  onClose: () => void;
  target: UnifiedLoanView | null;
  onSubmit: () => void;
  submitting: boolean;
}

export function RecordRentalPaymentModal({
  show,
  onClose,
  target,
  onSubmit,
  submitting,
}: RecordRentalPaymentModalProps) {
  const { t } = useLanguage();

  if (!show || !target) return null;

  return (
    <ModalShell onClose={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4"
        data-help-id="loans-rental-payment-form"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <CreditCard size={20} className="text-green-400" />
            {t("loans.actions.recordRentalPaymentTitle")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-[#1a1a1a] rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-zinc-400 text-sm">
          {t("loans.actions.recordRentalPaymentMessage")}:{" "}
          <span className="text-white font-medium">
            {target.request.code ?? `#${target.request._id.slice(-8).toUpperCase()}`}
          </span>
        </p>

        {target.request.totalAmount != null && (
          <div className="border border-[#2a2a2a] rounded-lg p-3 bg-[#171717]">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              {t("loans.actions.rentalAmount")}
            </p>
            <p className="text-white font-semibold text-lg">
              ${target.request.totalAmount.toLocaleString()}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting}
            className="bg-green-500 hover:bg-green-600 text-white border-transparent"
          >
            {submitting ? t("common.processing") : t("loans.actions.recordRentalPayment")}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Extend Loan Modal ──────────────────────────────────────────────────

interface ExtendLoanModalProps {
  show: boolean;
  onClose: () => void;
  target: UnifiedLoanView | null;
  newEndDate: string;
  onEndDateChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

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
}: ExtendLoanModalProps) {
  const { t } = useLanguage();

  if (!show || !target || !target.loan) return null;

  return (
    <ModalShell onClose={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4"
        data-help-id="loans-extend-form"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <CalendarRange size={20} className="text-blue-400" />
            {t("loans.actions.extendTitle")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-[#1a1a1a] rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-zinc-400 text-sm">
          {t("loans.actions.extendMessage")}:{" "}
          <span className="text-white font-medium">
            {target.loan.code ?? `#${target.loan._id.slice(-8).toUpperCase()}`}
          </span>
          {" — "}
          <span className="text-white font-medium">{target.customerName}</span>
        </p>

        <div className="text-xs text-gray-500">
          {t("loans.actions.currentEndDate")}: {formatDate(target.loan.endDate)}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {t("loans.actions.newEndDate")}
            </label>
            <input
              data-help-id="loans-extend-end-date"
              type="date"
              value={newEndDate}
              min={target.loan.endDate.slice(0, 10)}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700] transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {t("loans.actions.notes")}{" "}
              <span className="text-gray-600 text-xs">({t("common.optional")})</span>
            </label>
            <textarea
              data-help-id="loans-extend-notes"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
              placeholder={t("loans.actions.extendNotesPlaceholder")}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button
            leftIcon={CalendarRange}
            onClick={onSubmit}
            disabled={submitting || !newEndDate}
            className="bg-blue-500 hover:bg-blue-600 text-white border-transparent"
          >
            {submitting ? t("common.processing") : t("loans.actions.extend")}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Return Modal ───────────────────────────────────────────────────────

interface ReturnLoanModalProps {
  show: boolean;
  onClose: () => void;
  target: UnifiedLoanView | null;
  onSubmit: () => void;
  submitting: boolean;
}

export function ReturnLoanModal({
  show,
  onClose,
  target,
  onSubmit,
  submitting,
}: ReturnLoanModalProps) {
  const { t } = useLanguage();

  if (!show || !target || !target.loan) return null;

  return (
    <ModalShell onClose={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4"
        data-help-id="loans-return-form"
      >
        <h2 className="text-xl font-semibold text-white">{t("loans.modal.return.title")}</h2>
        <p className="text-zinc-400 text-sm">{t("loans.modal.return.subtitle")}</p>
        <p className="text-zinc-400 text-sm">
          {t("loans.table.code")}: {" "}
          <span className="text-white font-medium">
            {target.loan.code ?? `#${target.loan._id.slice(-8).toUpperCase()}`}
          </span>
        </p>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting}
            className="bg-green-500 hover:bg-green-600 text-white border-transparent"
          >
            {submitting ? t("loans.modal.return.submitting") : t("loans.modal.return.submit")}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Refund Deposit Modal ───────────────────────────────────────────────

interface RefundDepositModalProps {
  show: boolean;
  onClose: () => void;
  target: UnifiedLoanView | null;
  notes: string;
  onNotesChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

export function RefundDepositModal({
  show,
  onClose,
  target,
  notes,
  onNotesChange,
  onSubmit,
  submitting,
}: RefundDepositModalProps) {
  const { t } = useLanguage();

  if (!show || !target || !target.loan) return null;

  return (
    <ModalShell onClose={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4"
        data-help-id="loans-refund-form"
      >
        <h2 className="text-xl font-semibold text-white">{t("loans.actions.refundTitle")}</h2>

        <div className="text-zinc-400 text-sm space-y-2">
          <p>
            {t("loans.actions.refundMessage", {
              amount: `$${target.loan.deposit?.amount?.toLocaleString() ?? "0"}`,
            })}
          </p>
          <p className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-200/80">
            {t("loans.actions.refundWarning")}
          </p>
        </div>

        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            {t("loans.actions.refundNotes")}
          </label>
          <textarea
            data-help-id="loans-refund-notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
            placeholder={t("loans.actions.refundNotesPlaceholder")}
            className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all resize-none"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting}
            className="bg-yellow-500 hover:bg-yellow-600 text-black border-transparent font-semibold"
          >
            {submitting ? t("common.processing") : t("loans.actions.confirmRefund")}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Complete Loan Modal ────────────────────────────────────────────────

interface CompleteLoanModalProps {
  show: boolean;
  onClose: () => void;
  target: UnifiedLoanView | null;
  onSubmit: () => void;
  submitting: boolean;
}

export function CompleteLoanModal({
  show,
  onClose,
  target,
  onSubmit,
  submitting,
}: CompleteLoanModalProps) {
  const { t } = useLanguage();

  if (!show || !target || !target.loan) return null;

  const depositResolved =
    !target.loan.deposit ||
    target.loan.deposit.amount === 0 ||
    target.loan.deposit.status === "applied" ||
    target.loan.deposit.status === "refunded" ||
    target.loan.deposit.status === "not_required";

  return (
    <ModalShell onClose={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4"
        data-help-id="loans-complete-form"
      >
        <h2 className="text-xl font-semibold text-white">{t("loans.actions.completeTitle")}</h2>
        <p className="text-zinc-400 text-sm">
          {t("loans.actions.completeMessage")}:{" "}
          <span className="text-white font-medium">
            {target.loan.code ?? `#${target.loan._id.slice(-8).toUpperCase()}`}
          </span>
          {" — "}
          <span className="text-white font-medium">{target.customerName}</span>
        </p>

        {!depositResolved && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200/80 text-sm">
            {t("loans.actions.depositNotResolved")}
          </div>
        )}

        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-200/80 text-sm">
          {t("loans.actions.completeWarning")}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button
            leftIcon={CheckCircle}
            onClick={onSubmit}
            disabled={submitting || !depositResolved}
            className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
          >
            {submitting ? t("common.processing") : t("loans.actions.completeLoan")}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
