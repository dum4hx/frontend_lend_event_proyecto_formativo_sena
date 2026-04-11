import { useState, useEffect } from "react";
import { X, Package, ChevronDown, ChevronUp, DollarSign } from "lucide-react";
import { IconButton, EntityLink } from "../../../../components/ui";
import { useLanguage } from "../../../../contexts/useLanguage";
import type { UnifiedLoanView } from "./types";
import { UNIFIED_WORKFLOW_STEPS, TERMINAL_STATUSES } from "./types";
import {
  getUnifiedStatusLabel,
  getUnifiedStatusBadgeStyle,
  getStepIndex,
  formatDate,
} from "./helpers";
import type {
  LoanDetailGrouped,
  LoanMaterialInstanceEntry,
  MaterialInstanceStatus,
  DepositStatus,
  PopulatedUserRef,
  PricingSnapshotItem,
  PricingStrategyType,
} from "../../../../types/api";
import { getLoanDetailGrouped } from "../../../../services/loanService";
import { getInspections } from "../../../../services/inspectionService";
import {
  getDepositStatusLabel,
  getMaterialInstanceStatusLabel,
} from "../../../../utils/statusLabels";

// ─── Props ──────────────────────────────────────────────────────────────

interface LoanDetailModalProps {
  open: boolean;
  onClose: () => void;
  view: UnifiedLoanView;
}

// ─── Component ──────────────────────────────────────────────────────────

export function LoanDetailModal({ open, onClose, view }: LoanDetailModalProps) {
  const { language, t } = useLanguage();
  const lang = language === "es" ? "es" : "en";
  const isEs = lang === "es";

  const [loanDetail, setLoanDetail] = useState<LoanDetailGrouped | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [inspectionNumber, setInspectionNumber] = useState<string | null>(null);

  // Fetch grouped detail when a loan exists
  useEffect(() => {
    if (!open || !view.loan) return;
    let cancelled = false;
    async function fetchDetail() {
      setLoadingDetail(true);
      try {
        const res = await getLoanDetailGrouped(view.loan!._id);
        if (!cancelled) setLoanDetail(res.data.loan);
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
  }, [open, view.loan]);

  // Fetch inspection number when status is "inspected" or beyond
  useEffect(() => {
    if (!open || !view.loan) return;
    if (view.status !== "inspected" && view.status !== "closed") return;
    let cancelled = false;
    async function fetchInspection() {
      try {
        const res = await getInspections({ loanId: view.loan!._id, limit: 1 });
        if (!cancelled && res.data.inspections.length > 0) {
          setInspectionNumber(res.data.inspections[0].inspectionNumber ?? null);
        }
      } catch {
        if (!cancelled) setInspectionNumber(null);
      }
    }
    fetchInspection();
    return () => {
      cancelled = true;
    };
  }, [open, view.loan, view.status]);

  if (!open) return null;

  const req = view.request;
  const loan = view.loan;
  const code = req.code ?? `#${req._id.slice(-8).toUpperCase()}`;
  const activeStepIndex = getStepIndex(view.status);
  const isTerminal = TERMINAL_STATUSES.map((s) => s.status).includes(view.status);

  // Material instances grouped by type (from loan detail)
  const typeEntries = Object.entries(loanDetail?.materialInstancesByType ?? {});

  function toggleCollapse(typeId: string) {
    setCollapsed((prev) => ({ ...prev, [typeId]: !prev[typeId] }));
  }

  const formatUserName = (ref: PopulatedUserRef | undefined): string => {
    if (!ref) return t("loans.detail.notSet");
    if (ref.name) {
      const { firstName, secondName, firstSurname, secondSurname } = ref.name;
      const full = [firstName, secondName, firstSurname, secondSurname]
        .filter(Boolean)
        .join(" ")
        .trim();
      return full || ref.email || t("loans.detail.notSet");
    }
    return ref.email || t("loans.detail.notSet");
  };

  const strategyLabels: Record<PricingStrategyType, string> = {
    per_day: isEs ? "Por día" : "Per day",
    weekly_monthly: isEs ? "Semanal/Mensual" : "Weekly-Monthly",
    fixed: isEs ? "Fijo" : "Fixed",
  };

  const pricingSnapshot: PricingSnapshotItem[] = loanDetail?.pricingSnapshot ?? [];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-[#121212] border border-[#333] rounded-xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl"
        data-help-id="loans-detail-modal"
      >
        {/* Header */}
        <div className="border-b border-[#333] p-6 flex items-center justify-between bg-[#121212]">
          <div>
            <h2 className="text-2xl font-bold text-white">{t("loans.detail.title")}</h2>
            <p className="text-sm text-gray-400 mt-1">{t("loans.detail.subtitle")}</p>
          </div>
          <IconButton icon={X} onClick={onClose} ariaLabel={t("common.close")} intent="secondary" />
        </div>

        {/* Body: left panel + right sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
          {/* ── Left Panel ── */}
          <div className="p-6 md:p-7 space-y-5 max-h-[calc(92vh-84px)] overflow-y-auto">
            {/* Basic info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-500 text-sm">{t("loans.detail.loanCode")}</p>
                <p className="text-white font-semibold break-all font-mono">{code}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">{t("loans.detail.customer")}</p>
                <EntityLink
                  entityType="customer"
                  entityId={req.customerId?._id ?? ""}
                  label={view.customerName}
                  className="font-semibold"
                />
              </div>
              <div>
                <p className="text-gray-500 text-sm">{t("loans.detail.startDate")}</p>
                <p className="text-gray-300">{formatDate(req.startDate)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">{t("loans.detail.endDate")}</p>
                <p className="text-gray-300">{formatDate(req.endDate)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">{t("loans.detail.requestCreatedAt")}</p>
                <p className="text-gray-300">
                  {req.createdAt ? (
                    formatDate(req.createdAt)
                  ) : (
                    <span className="text-gray-600 italic text-xs">{t("loans.detail.notSet")}</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">{t("loans.detail.createdBy")}</p>
                <p className="text-gray-300">
                  {req.createdBy ? (
                    formatUserName(req.createdBy)
                  ) : (
                    <span className="text-gray-600 italic text-xs">{t("loans.detail.notSet")}</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">{t("loans.detail.approvedAt")}</p>
                <p className="text-gray-300">
                  {req.approvedAt ? (
                    formatDate(req.approvedAt)
                  ) : (
                    <span className="text-gray-600 italic text-xs">{t("loans.detail.notSet")}</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">{t("loans.detail.approvedBy")}</p>
                <p className="text-gray-300">
                  {req.approvedBy ? (
                    formatUserName(req.approvedBy)
                  ) : (
                    <span className="text-gray-600 italic text-xs">{t("loans.detail.notSet")}</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">{t("loans.detail.loanCreatedAt")}</p>
                <p className="text-gray-300">
                  {loanDetail?.createdAt ? (
                    formatDate(loanDetail.createdAt)
                  ) : (
                    <span className="text-gray-600 italic text-xs">{t("loans.detail.notSet")}</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">{t("loans.detail.checkedOutAt")}</p>
                <p className="text-gray-300">
                  {loanDetail?.checkedOutAt ? (
                    formatDate(loanDetail.checkedOutAt)
                  ) : (
                    <span className="text-gray-600 italic text-xs">{t("loans.detail.notSet")}</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">{t("loans.detail.checkedOutBy")}</p>
                <p className="text-gray-300">
                  {loanDetail?.checkedOutBy ? (
                    formatUserName(loanDetail.checkedOutBy)
                  ) : (
                    <span className="text-gray-600 italic text-xs">{t("loans.detail.notSet")}</span>
                  )}
                </p>
              </div>
              {inspectionNumber && (
                <div>
                  <p className="text-gray-500 text-sm">{t("loans.detail.inspectionNumber")}</p>
                  <p className="text-white font-semibold font-mono">{inspectionNumber}</p>
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <p className="text-gray-500 text-sm mb-2">{t("loans.detail.items")}</p>
              <div className="space-y-2">
                {view.displayItems.map((label) => (
                  <div
                    key={label}
                    className="text-gray-200 text-sm border border-[#333] rounded-lg px-3 py-2 bg-[#1a1a1a]"
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial summary — unified */}
            {(req.totalAmount != null ||
              req.subtotal != null ||
              req.depositAmount != null ||
              loan?.totalAmount != null ||
              loan?.deposit?.amount != null) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#FFD700] uppercase tracking-wider">
                  <DollarSign size={14} />
                  <span>{t("loans.detail.loanFinancials")}</span>
                </div>
                <div className="border border-[#2a2a2a] rounded-xl p-4 bg-[#171717]">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {req.totalDays != null && (
                      <div>
                        <p className="text-gray-500 text-xs">{t("loans.detail.totalDays")}</p>
                        <p className="text-white font-semibold">{req.totalDays}</p>
                      </div>
                    )}
                    {req.subtotal != null && (
                      <div>
                        <p className="text-gray-500 text-xs">{t("loans.detail.subtotal")}</p>
                        <p className="text-white font-semibold">${req.subtotal.toLocaleString()}</p>
                      </div>
                    )}
                    {(req.discountAmount ?? 0) > 0 && (
                      <div>
                        <p className="text-gray-500 text-xs">{t("loans.detail.discount")}</p>
                        <p className="text-green-400 font-semibold">
                          -${req.discountAmount!.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {(loan?.totalAmount ?? req.totalAmount) != null && (
                      <div>
                        <p className="text-gray-500 text-xs">{t("loans.detail.totalAmount")}</p>
                        <p className="text-white font-bold text-base">
                          ${(loan?.totalAmount ?? req.totalAmount!).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {(loan?.deposit?.amount ?? req.depositAmount) != null && (
                      <div>
                        <p className="text-gray-500 text-xs">{t("loans.detail.depositAmount")}</p>
                        <p className="text-white font-semibold">
                          ${(loan?.deposit?.amount ?? req.depositAmount!).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {loan?.deposit?.status && (
                      <div>
                        <p className="text-gray-500 text-xs">{t("loans.detail.depositStatus")}</p>
                        <p className="text-gray-300">
                          {getDepositStatusLabel(loan.deposit.status as DepositStatus, lang)}
                        </p>
                      </div>
                    )}
                    {req.depositDueDate != null && (
                      <div>
                        <p className="text-gray-500 text-xs">{t("loans.detail.depositDueDate")}</p>
                        <p className="text-yellow-400 font-semibold">
                          {formatDate(req.depositDueDate)}
                        </p>
                      </div>
                    )}
                    {req.depositPaidAt != null && (
                      <div>
                        <p className="text-gray-500 text-xs">{t("loans.detail.depositPaidAt")}</p>
                        <p className="text-green-400 font-semibold">
                          {formatDate(req.depositPaidAt)}
                        </p>
                      </div>
                    )}
                    {loan?.deposit?.refundAvailable && (
                      <div>
                        <p className="text-gray-500 text-xs">
                          {t("loans.detail.refundableDeposit")}
                        </p>
                        <p className="text-green-400 font-semibold">
                          ${(loan.deposit.refundableAmount ?? 0).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {loan && (
                      <div>
                        <p className="text-gray-500 text-xs">{t("loans.detail.damageFees")}</p>
                        <p
                          className={`font-semibold ${(loan.damageFees ?? 0) > 0 ? "text-red-400" : "text-gray-400"}`}
                        >
                          ${(loan.damageFees ?? 0).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {loan && (
                      <div>
                        <p className="text-gray-500 text-xs">{t("loans.detail.lateFees")}</p>
                        <p
                          className={`font-semibold ${(loan.lateFees ?? 0) > 0 ? "text-red-400" : "text-gray-400"}`}
                        >
                          ${(loan.lateFees ?? 0).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Breakdown (collapsable) */}
            {loan && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => toggleCollapse("__pricing__")}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#FFD700] uppercase tracking-wider">
                    <DollarSign size={14} />
                    <span>{t("loans.detail.pricingBreakdown")}</span>
                    <span className="text-xs text-gray-500 font-normal normal-case">
                      ({pricingSnapshot.length})
                    </span>
                  </div>
                  {collapsed["__pricing__"] ? (
                    <ChevronDown size={14} className="text-gray-500 shrink-0" />
                  ) : (
                    <ChevronUp size={14} className="text-gray-500 shrink-0" />
                  )}
                </button>

                {!collapsed["__pricing__"] && (
                  <div className="border border-[#2a2a2a] rounded-xl p-4 bg-[#171717]">
                    {pricingSnapshot.length === 0 ? (
                      <p className="text-gray-500 text-sm">{t("loans.detail.noBreakdown")}</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead>
                            <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-[#333]">
                              <th className="pb-2 pr-3 font-medium">Type</th>
                              <th className="pb-2 pr-3 font-medium">
                                {t("loans.detail.pricingStrategy")}
                              </th>
                              <th className="pb-2 pr-3 font-medium text-center">
                                {t("loans.detail.pricingQuantity")}
                              </th>
                              <th className="pb-2 pr-3 font-medium text-center">
                                {t("loans.detail.pricingDuration")}
                              </th>
                              <th className="pb-2 pr-3 font-medium text-right">
                                {t("loans.detail.pricingBasePricePerDay")}
                              </th>
                              <th className="pb-2 pr-3 font-medium text-right">
                                {t("loans.detail.pricingUnitPrice")}
                              </th>
                              <th className="pb-2 font-medium text-right">
                                {t("loans.detail.pricingTotal")}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#2a2a2a]">
                            {pricingSnapshot.map((item, idx) => (
                              <tr key={idx} className="text-gray-300">
                                <td className="py-2 pr-3 capitalize">{item.itemType}</td>
                                <td className="py-2 pr-3">
                                  {strategyLabels[item.strategyType as PricingStrategyType] ??
                                    item.strategyType}
                                </td>
                                <td className="py-2 pr-3 text-center">{item.quantity}</td>
                                <td className="py-2 pr-3 text-center">{item.durationInDays}</td>
                                <td className="py-2 pr-3 text-right">
                                  ${item.basePricePerDay.toLocaleString()}
                                </td>
                                <td className="py-2 pr-3 text-right">
                                  ${item.unitPrice.toLocaleString()}
                                </td>
                                <td className="py-2 text-right text-white font-semibold">
                                  ${item.totalPrice.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Material instances grouped by type (loan detail) */}
            {loan && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#FFD700] uppercase tracking-wider">
                  <Package size={16} />
                  <span>{t("loans.detail.assignedMaterials")}</span>
                </div>

                {loadingDetail && (
                  <p className="text-xs text-gray-500 animate-pulse">{t("common.loading")}</p>
                )}

                {!loadingDetail && typeEntries.length === 0 && (
                  <p className="text-gray-500 text-sm">{t("loans.detail.noMaterials")}</p>
                )}

                {typeEntries.map(([typeId, group]) => {
                  const instances: LoanMaterialInstanceEntry[] = group.instances;
                  const typeName =
                    instances[0]?.materialType?.name ?? typeId.slice(-8).toUpperCase();
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
                              className="flex items-center gap-3 px-4 py-3"
                            >
                              <span className="text-white font-mono text-sm flex-1">
                                {entry.materialInstanceId.serialNumber}
                              </span>
                              {entry.conditionAtCheckout && (
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    entry.conditionAtCheckout === "good"
                                      ? "bg-green-500/20 text-green-400"
                                      : entry.conditionAtCheckout === "damaged"
                                        ? "bg-amber-500/20 text-amber-400"
                                        : entry.conditionAtCheckout === "lost"
                                          ? "bg-red-500/20 text-red-400"
                                          : "bg-gray-500/20 text-gray-400"
                                  }`}
                                >
                                  {entry.conditionAtCheckout.charAt(0).toUpperCase() +
                                    entry.conditionAtCheckout.slice(1)}
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                {getMaterialInstanceStatusLabel(
                                  entry.materialInstanceId.status as MaterialInstanceStatus,
                                  lang,
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Notes */}
            {req.notes && (
              <div>
                <p className="text-gray-500 text-sm">{t("loans.detail.notes")}</p>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{req.notes}</p>
              </div>
            )}
          </div>

          {/* ── Right Sidebar — Workflow Timeline ── */}
          <aside className="border-t lg:border-t-0 lg:border-l border-[#333] bg-[#151515] p-6 space-y-4 max-h-[calc(92vh-84px)] overflow-y-auto">
            <div>
              <p className="text-gray-500 text-sm mb-2">{t("loans.detail.workflow")}</p>
              <div className="space-y-2">
                {UNIFIED_WORKFLOW_STEPS.map((step, idx) => {
                  const reached = !isTerminal && idx <= activeStepIndex;
                  return (
                    <div
                      key={step.status}
                      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                        reached
                          ? "border-[#FFD700]/50 bg-[#FFD700]/10 text-[#FFD700]"
                          : "border-[#333] text-gray-500"
                      }`}
                    >
                      {isEs ? step.labelEs : step.labelEn}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current status badge */}
            <div className="border border-[#333] rounded-lg p-3 bg-[#1a1a1a]">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {t("loans.detail.currentStatus")}
              </p>
              <span
                className={`inline-flex mt-2 px-3 py-1 rounded-full text-xs font-semibold ${getUnifiedStatusBadgeStyle(view.status)}`}
              >
                {getUnifiedStatusLabel(view.status, lang)}
              </span>
            </div>

            {/* Terminal state warning */}
            {isTerminal && (
              <p className="text-red-300 text-sm">
                {isEs
                  ? `Este préstamo está en estado terminal: ${getUnifiedStatusLabel(view.status, "es")}`
                  : `This loan is in a terminal state: ${getUnifiedStatusLabel(view.status, "en")}`}
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
