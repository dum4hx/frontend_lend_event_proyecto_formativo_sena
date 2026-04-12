import {
  Eye,
  RotateCcw,
  HandCoins,
  CheckCircle,
  Package,
  Truck,
  AlertCircle,
  Zap,
  CalendarRange,
  Copy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PermissionGuardedButton } from "../../../../components/ui/PermissionGuardedButton";
import { useLanguage } from "../../../../contexts/useLanguage";
import { useCopyToClipboard } from "../../../../hooks/useCopyToClipboard";
import type { UnifiedLoanView, UnifiedLoanStatus } from "./types";
import {
  getUnifiedStatusBadgeStyle,
  getUnifiedStatusLabel,
  formatDate,
} from "./helpers";

interface LoansGroupedViewProps {
  loans: UnifiedLoanView[];
  totalCount: number;
  loading: boolean;
  onViewDetail: (v: UnifiedLoanView) => void;
  onCancel: (v: UnifiedLoanView) => void;
  onPrepare: (v: UnifiedLoanView) => void;
  onRecordPayment: (v: UnifiedLoanView) => void;
  onRecordRentalPayment: (v: UnifiedLoanView) => void;
  onStartLoan: (v: UnifiedLoanView) => void;
  onExtend: (v: UnifiedLoanView) => void;
  onReturn: (v: UnifiedLoanView) => void;
  onRefund: (v: UnifiedLoanView) => void;
  onComplete: (v: UnifiedLoanView) => void;
}

type TranslationFn = (key: string, params?: Record<string, string | number>) => string;

/** Group loans by date (last 24h, last 7d, older) */
function groupByDate(loans: UnifiedLoanView[]) {
  const now = Date.now();
  const h24 = 24 * 60 * 60 * 1000;
  const d7 = 7 * 24 * 60 * 60 * 1000;

  const last24h: UnifiedLoanView[] = [];
  const last7d: UnifiedLoanView[] = [];
  const older: UnifiedLoanView[] = [];

  loans.forEach((loan) => {
    const createdAt = loan.request?.createdAt ? new Date(loan.request.createdAt).getTime() : 0;
    const diff = createdAt ? now - createdAt : Infinity;

    if (diff < h24) {
      last24h.push(loan);
    } else if (diff < d7) {
      last7d.push(loan);
    } else {
      older.push(loan);
    }
  });

  // Sort each group by date (newest first)
  const sort = (a: UnifiedLoanView, b: UnifiedLoanView) => {
    const aTime = a.request?.createdAt ? new Date(a.request.createdAt).getTime() : 0;
    const bTime = b.request?.createdAt ? new Date(b.request.createdAt).getTime() : 0;
    return bTime - aTime;
  };

  last24h.sort(sort);
  last7d.sort(sort);
  older.sort(sort);

  return { last24h, last7d, older };
}

/** Group loans by status */
function groupByStatus(loans: UnifiedLoanView[]) {
  const grouped: Record<UnifiedLoanStatus, UnifiedLoanView[]> = {
    pending: [],
    approved: [],
    assigned: [],
    ready: [],
    active: [],
    overdue: [],
    returned: [],
    inspected: [],
    closed: [],
    rejected: [],
    cancelled: [],
    expired: [],
  };

  loans.forEach((loan) => {
    grouped[loan.status].push(loan);
  });

  return grouped;
}

/** Status order for display */
const STATUS_ORDER: UnifiedLoanStatus[] = [
  "pending",
  "approved",
  "assigned",
  "ready",
  "active",
  "overdue",
  "returned",
  "inspected",
  "closed",
  "rejected",
  "cancelled",
  "expired",
];

/** Get action icon and color for status */
function getStatusActionIcon(status: UnifiedLoanStatus) {
  const iconMap: Record<UnifiedLoanStatus, { Icon: LucideIcon; color: string }> = {
    pending: { Icon: AlertCircle, color: "text-amber-500" },
    approved: { Icon: CheckCircle, color: "text-blue-500" },
    assigned: { Icon: Package, color: "text-purple-500" },
    ready: { Icon: Zap, color: "text-cyan-500" },
    active: { Icon: Truck, color: "text-green-500" },
    overdue: { Icon: AlertCircle, color: "text-red-500" },
    returned: { Icon: CheckCircle, color: "text-emerald-500" },
    inspected: { Icon: Eye, color: "text-indigo-500" },
    closed: { Icon: CheckCircle, color: "text-gray-500" },
    rejected: { Icon: RotateCcw, color: "text-red-600" },
    cancelled: { Icon: AlertCircle, color: "text-gray-600" },
    expired: { Icon: AlertCircle, color: "text-orange-600" },
  };
  return iconMap[status];
}

function DateGroup({
  title,
  loans,
  lang,
  t,
  onViewDetail,
  onCancel,
  onPrepare,
  onRecordPayment,
  onRecordRentalPayment,
  onStartLoan,
  onExtend,
  onReturn,
  onRefund,
  onComplete,
}: {
  title: string;
  loans: UnifiedLoanView[];
  lang: "en" | "es";
  t: TranslationFn;
  onViewDetail: (v: UnifiedLoanView) => void;
  onCancel: (v: UnifiedLoanView) => void;
  onPrepare: (v: UnifiedLoanView) => void;
  onRecordPayment: (v: UnifiedLoanView) => void;
  onRecordRentalPayment: (v: UnifiedLoanView) => void;
  onStartLoan: (v: UnifiedLoanView) => void;
  onExtend: (v: UnifiedLoanView) => void;
  onReturn: (v: UnifiedLoanView) => void;
  onRefund: (v: UnifiedLoanView) => void;
  onComplete: (v: UnifiedLoanView) => void;
}) {
  if (loans.length === 0) return null;

  const statusGroups = groupByStatus(loans);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 px-1">
        <h3 className="text-sm font-semibold text-[#FFD700] uppercase tracking-wider">
          {title}
        </h3>
        <span className="px-2 py-1 rounded-full bg-[#FFD700]/10 text-[#FFD700] text-xs font-medium">
          {loans.length}
        </span>
      </div>

      {STATUS_ORDER.map((status) => {
        const statusLoans = statusGroups[status];
        if (statusLoans.length === 0) return null;

        const { Icon: StatusIcon, color } = getStatusActionIcon(status);
        const statusLabel = getUnifiedStatusLabel(status, lang);

        return (
          <div key={status} className="space-y-2 pl-2 border-l-3 border-[#FFD700]/30">
            <div className="flex items-center gap-2">
              <StatusIcon size={16} className={color} />
              <span className="text-xs font-medium text-gray-300 uppercase tracking-wider">
                {statusLabel}
              </span>
              <span className="ml-auto text-xs text-gray-500">{statusLoans.length}</span>
            </div>

            <div className="space-y-2">
              {statusLoans.map((loan) => (
                <LoanCard
                  key={`${loan.request._id}-${loan.loan?._id}`}
                  loan={loan}
                  t={t}
                  onViewDetail={onViewDetail}
                  onCancel={onCancel}
                  onPrepare={onPrepare}
                  onRecordPayment={onRecordPayment}
                  onRecordRentalPayment={onRecordRentalPayment}
                  onStartLoan={onStartLoan}
                  onExtend={onExtend}
                  onReturn={onReturn}
                  onRefund={onRefund}
                  onComplete={onComplete}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LoanCard({
  loan,
  t,
  onViewDetail,
  onCancel,
  onPrepare,
  onRecordPayment,
  onRecordRentalPayment,
  onStartLoan,
  onExtend,
  onReturn,
  onRefund,
  onComplete,
}: {
  loan: UnifiedLoanView;
  t: TranslationFn;
  onViewDetail: (v: UnifiedLoanView) => void;
  onCancel: (v: UnifiedLoanView) => void;
  onPrepare: (v: UnifiedLoanView) => void;
  onRecordPayment: (v: UnifiedLoanView) => void;
  onRecordRentalPayment: (v: UnifiedLoanView) => void;
  onStartLoan: (v: UnifiedLoanView) => void;
  onExtend: (v: UnifiedLoanView) => void;
  onReturn: (v: UnifiedLoanView) => void;
  onRefund: (v: UnifiedLoanView) => void;
  onComplete: (v: UnifiedLoanView) => void;
}) {
  const badgeClass = getUnifiedStatusBadgeStyle(loan.status);
  const { copy } = useCopyToClipboard();

  return (
    <div
      className={`p-4 rounded-lg border ${badgeClass} hover:border-[#FFD700] transition-all cursor-pointer group`}
      onClick={() => onViewDetail(loan)}
      data-help-id="loan-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-baseline gap-3 mb-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                copy(loan.request.code || loan.request._id);
              }}
              className="font-semibold text-white hover:text-[#FFD700] hover:underline transition-colors cursor-pointer flex items-center gap-1 group/copy"
              title="Haz click para copiar"
            >
              {loan.request.code}
              <Copy size={14} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" />
            </button>
            <span className="text-xs text-gray-400">{loan.customerName}</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>{loan.itemCount} items</span>
            <span>•</span>
            <span>{loan.request.createdAt ? formatDate(loan.request.createdAt) : ""}</span>
            {loan.request.startDate && (
              <>
                <span>•</span>
                <span>{t("loans.table.start")}: {formatDate(loan.request.startDate)}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <PermissionGuardedButton
            icon={Eye}
            intent="view"
            ariaLabel="View detail"
            requiredPermission="loans:read"
            onClick={() => {
              onViewDetail(loan);
            }}
          />

          {loan.status === "pending" && (
            <>
              <PermissionGuardedButton
                icon={HandCoins}
                intent="approve"
                ariaLabel="Record payment"
                requiredPermission="requests:update"
                onClick={() => {
                  onRecordPayment(loan);
                }}
              />
              <PermissionGuardedButton
                icon={RotateCcw}
                intent="delete"
                ariaLabel="Cancel"
                requiredPermission="requests:delete"
                onClick={() => {
                  onCancel(loan);
                }}
              />
            </>
          )}

          {loan.status === "approved" && (
            <PermissionGuardedButton
              icon={Package}
              intent="edit"
              ariaLabel="Prepare materials"
              requiredPermission="requests:update"
              onClick={() => {
                onPrepare(loan);
              }}
            />
          )}

          {loan.status === "assigned" && (
            <PermissionGuardedButton
              icon={Truck}
              intent="approve"
              ariaLabel="Start loan"
              requiredPermission="loans:checkout"
              onClick={() => {
                onStartLoan(loan);
              }}
            />
          )}

          {loan.status === "ready" && (
            <PermissionGuardedButton
              icon={HandCoins}
              intent="approve"
              ariaLabel="Record rental payment"
              requiredPermission="requests:update"
              onClick={() => {
                onRecordRentalPayment(loan);
              }}
            />
          )}

          {loan.status === "active" && (
            <>
              <PermissionGuardedButton
                icon={CalendarRange}
                intent="approve"
                ariaLabel="Extend"
                requiredPermission="loans:update"
                onClick={() => {
                  onExtend(loan);
                }}
              />
              <PermissionGuardedButton
                icon={Truck}
                intent="edit"
                ariaLabel="Return"
                requiredPermission="loans:return"
                onClick={() => {
                  onReturn(loan);
                }}
              />
            </>
          )}

          {loan.status === "returned" && (
            <>
              <PermissionGuardedButton
                icon={Eye}
                intent="view"
                ariaLabel="Refund"
                requiredPermission="loans:update"
                onClick={() => {
                  onRefund(loan);
                }}
              />
              <PermissionGuardedButton
                icon={CheckCircle}
                intent="approve"
                ariaLabel="Complete"
                requiredPermission="loans:update"
                onClick={() => {
                  onComplete(loan);
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function LoansGroupedView({
  loans,
  totalCount,
  loading,
  onViewDetail,
  onCancel,
  onPrepare,
  onRecordPayment,
  onRecordRentalPayment,
  onStartLoan,
  onExtend,
  onReturn,
  onRefund,
  onComplete,
}: LoansGroupedViewProps) {
  const { language, t } = useLanguage();
  const lang = language === "es" ? "es" : "en";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border border-[#FFD700] border-t-transparent" />
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
        <Package size={40} className="opacity-40" />
        <p className="text-sm font-medium">
          {totalCount === 0 ? t("loans.table.empty") : t("loans.table.noResults")}
        </p>
      </div>
    );
  }

  const { last24h, last7d, older } = groupByDate(loans);

  return (
    <div className="space-y-8" data-help-id="loans-grouped-view">
      {last24h.length > 0 && (
        <DateGroup
          title={lang === "es" ? "Últimas 24 Horas" : "Last 24 Hours"}
          loans={last24h}
          lang={lang}
          t={t}
          onViewDetail={onViewDetail}
          onCancel={onCancel}
          onPrepare={onPrepare}
          onRecordPayment={onRecordPayment}
          onRecordRentalPayment={onRecordRentalPayment}
          onStartLoan={onStartLoan}
          onExtend={onExtend}
          onReturn={onReturn}
          onRefund={onRefund}
          onComplete={onComplete}
        />
      )}

      {last7d.length > 0 && (
        <DateGroup
          title={lang === "es" ? "Últimos 7 Días" : "Last 7 Days"}
          loans={last7d}
          lang={lang}
          t={t}
          onViewDetail={onViewDetail}
          onCancel={onCancel}
          onPrepare={onPrepare}
          onRecordPayment={onRecordPayment}
          onRecordRentalPayment={onRecordRentalPayment}
          onStartLoan={onStartLoan}
          onExtend={onExtend}
          onReturn={onReturn}
          onRefund={onRefund}
          onComplete={onComplete}
        />
      )}

      {older.length > 0 && (
        <DateGroup
          title={lang === "es" ? "Más Antiguo" : "Older"}
          loans={older}
          lang={lang}
          t={t}
          onViewDetail={onViewDetail}
          onCancel={onCancel}
          onPrepare={onPrepare}
          onRecordPayment={onRecordPayment}
          onRecordRentalPayment={onRecordRentalPayment}
          onStartLoan={onStartLoan}
          onExtend={onExtend}
          onReturn={onReturn}
          onRefund={onRefund}
          onComplete={onComplete}
        />
      )}
    </div>
  );
}
