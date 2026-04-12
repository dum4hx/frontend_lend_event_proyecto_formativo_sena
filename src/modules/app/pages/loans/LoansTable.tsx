import {
  Eye,
  RotateCcw,
  HandCoins,
  CheckCircle,
  Loader2,
  Ban,
  Banknote,
  Package,
  CreditCard,
  Truck,
  AlertCircle,
  FileX,
  Copy,
} from "lucide-react";
import { Button, EntityLink } from "../../../../components/ui";
import { PermissionGuardedButton } from "../../../../components/ui/PermissionGuardedButton";
import { useLanguage } from "../../../../contexts/useLanguage";
import { useCopyToClipboard } from "../../../../hooks/useCopyToClipboard";
import type { UnifiedLoanView } from "./types";
import {
  getUnifiedStatusBadgeStyle,
  getUnifiedStatusLabel,
  formatDate,
  daysRemaining,
} from "./helpers";

// ─── Props ──────────────────────────────────────────────────────────────

interface LoansTableProps {
  /** Filtered unified loan views. */
  loans: UnifiedLoanView[];
  /** Total unfiltered count — used to differentiate empty-data vs filtered-to-zero. */
  totalCount: number;
  /** Whether data is loading. */
  loading: boolean;
  /** Whether an action is submitting. */
  submitting: boolean;
  /** Detail view callback. */
  onViewDetail: (v: UnifiedLoanView) => void;
  /** Pre-checkout action callbacks. */
  onCancel: (v: UnifiedLoanView) => void;
  onPrepare: (v: UnifiedLoanView) => void;
  onRecordPayment: (v: UnifiedLoanView) => void;
  onRecordRentalPayment: (v: UnifiedLoanView) => void;
  onStartLoan: (v: UnifiedLoanView) => void;
  /** Post-checkout action callbacks. */
  // onExtend temporarily disabled
  onReturn: (v: UnifiedLoanView) => void;
  onRefund: (v: UnifiedLoanView) => void;
  onComplete: (v: UnifiedLoanView) => void;
}

// ─── Component ──────────────────────────────────────────────────────────

export function LoansTable({
  loans,
  totalCount,
  loading,
  submitting: _submitting,
  onViewDetail,
  onCancel,
  onPrepare,
  onRecordPayment,
  onRecordRentalPayment,
  onStartLoan,
  onReturn,
  onRefund,
  onComplete,
}: LoansTableProps) {
  const { language, t } = useLanguage();
  const lang = language === "es" ? "es" : "en";
  const { copy } = useCopyToClipboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-[#FFD700]" size={32} />
      </div>
    );
  }

  if (loans.length === 0) {
    const isEmpty = totalCount === 0;
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
        <FileX size={40} className="opacity-40" />
        <p className="text-sm font-medium">
          {isEmpty ? t("loans.table.empty") : t("loans.table.noResults")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#333]" data-help-id="loans-table">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#1a1a1a] text-gray-400 border-b border-[#333]">
            <th className="text-left px-4 py-3 font-semibold">{t("loans.table.code")}</th>
            <th className="text-left px-4 py-3 font-semibold text-xs">Creado</th>
            <th className="text-left px-4 py-3 font-semibold">{t("loans.table.customer")}</th>
            <th className="text-left px-4 py-3 font-semibold">{t("loans.table.dateRange")}</th>
            <th className="text-left px-4 py-3 font-semibold">{t("loans.table.items")}</th>
            <th className="text-left px-4 py-3 font-semibold">{t("loans.table.status")}</th>
            <th className="text-left px-4 py-3 font-semibold">{t("loans.table.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((v) => {
            const code = v.request.code ?? `#${v.request._id.slice(-8).toUpperCase()}`;
            const remaining = daysRemaining(v.request.endDate);
            const isLive = v.status === "active" || v.status === "overdue";

            return (
              <tr
                key={v.request._id}
                className="border-b border-[#333] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                onClick={() => onViewDetail(v)}
              >
                {/* Code */}
                <td className="px-4 py-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copy(code);
                    }}
                    className="font-mono text-xs text-gray-300 hover:text-[#FFD700] hover:underline transition-colors cursor-pointer flex items-center gap-1 group/copy"
                    title="Haz click para copiar"
                  >
                    {code}
                    <Copy size={12} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                  </button>
                </td>

                {/* Created date */}
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {v.request.createdAt ? formatDate(v.request.createdAt) : "—"}
                </td>

                {/* Customer */}
                <td className="px-4 py-3">
                  <EntityLink
                    entityType="customer"
                    entityId={v.request.customerId?._id ?? ""}
                    label={v.customerName}
                    className="font-medium"
                  />
                </td>

                {/* Date range */}
                <td className="px-4 py-3 text-gray-300 text-xs">
                  <div>{formatDate(v.request.startDate)}</div>
                  <div className="text-gray-500">{formatDate(v.request.endDate)}</div>
                  {isLive && (
                    <span
                      className={`text-xs ${
                        remaining < 0
                          ? "text-red-400 font-semibold"
                          : remaining <= 2
                            ? "text-yellow-400"
                            : "text-gray-500"
                      }`}
                    >
                      {remaining < 0
                        ? lang === "es"
                          ? `${Math.abs(remaining)}d vencido`
                          : `${Math.abs(remaining)}d overdue`
                        : remaining === 0
                          ? lang === "es"
                            ? "Vence hoy"
                            : "Due today"
                          : lang === "es"
                            ? `${remaining}d restantes`
                            : `${remaining}d left`}
                    </span>
                  )}
                </td>

                {/* Items */}
                <td className="px-4 py-3 text-gray-300">{v.itemCount}</td>

                {/* Status */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getUnifiedStatusBadgeStyle(v.status, v.loan)}`}
                    >
                      {getUnifiedStatusLabel(v.status, lang, v.loan)}
                    </span>
                    {v.status === "overdue" && <AlertCircle size={14} className="text-red-400" />}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1 flex-wrap">
                    {/* Always show details */}
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={Eye}
                      onClick={() => onViewDetail(v)}
                      title={t("loans.actions.viewDetails")}
                    >
                      {t("common.details")}
                    </Button>

                    {/* Pre-checkout actions */}
                    {v.status === "pending" && (
                      <>
                        <PermissionGuardedButton
                          icon={Ban}
                          intent="delete"
                          ariaLabel={t("loans.actions.cancel")}
                          requiredPermission="requests:cancel"
                          onClick={() => onCancel(v)}
                        />
                      </>
                    )}

                    {v.status === "approved" && (
                      <PermissionGuardedButton
                        icon={Package}
                        intent="edit"
                        ariaLabel={t("loans.actions.prepare")}
                        requiredPermission="requests:assign"
                        onClick={() => onPrepare(v)}
                      />
                    )}

                    {/* Payment actions — only shown when status is pending */}
                    {v.status === "pending" && !v.request.depositPaidAt && (
                      <PermissionGuardedButton
                        icon={CreditCard}
                        intent="edit"
                        ariaLabel={t("loans.actions.recordPayment")}
                        requiredPermission="requests:update"
                        onClick={() => onRecordPayment(v)}
                      />
                    )}
                    {v.status === "pending" && !v.request.rentalFeePaidAt && (
                      <PermissionGuardedButton
                        icon={Banknote}
                        intent="approve"
                        ariaLabel={t("loans.actions.recordRentalPayment")}
                        requiredPermission="requests:update"
                        onClick={() => onRecordRentalPayment(v)}
                      />
                    )}

                    {v.status === "ready" && (
                      <>
                        <PermissionGuardedButton
                          icon={Truck}
                          intent="approve"
                          ariaLabel={t("loans.actions.dispatch")}
                          requiredPermission="loans:create"
                          onClick={() => onStartLoan(v)}
                        />
                      </>
                    )}

                    {/* Post-checkout actions */}
                    {(v.status === "active" || v.status === "overdue") && v.loan && (
                      <>
                        <PermissionGuardedButton
                          icon={RotateCcw}
                          intent="edit"
                          ariaLabel={t("loans.actions.return")}
                          requiredPermission="loans:return"
                          onClick={() => onReturn(v)}
                        />
                      </>
                    )}

                    {(v.status === "returned" || v.status === "inspected") && v.loan && (
                      <>
                        {v.loan.deposit?.refundAvailable && (
                          <PermissionGuardedButton
                            icon={HandCoins}
                            intent="edit"
                            ariaLabel={t("loans.actions.refund")}
                            requiredPermission="loans:update"
                            onClick={() => onRefund(v)}
                          />
                        )}
                        <PermissionGuardedButton
                          icon={CheckCircle}
                          intent="approve"
                          ariaLabel={t("loans.actions.complete")}
                          requiredPermission="loans:update"
                          onClick={() => onComplete(v)}
                        />
                      </>
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
