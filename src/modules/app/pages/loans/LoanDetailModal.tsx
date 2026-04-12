import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "use-debounce";
import { X, Package, DollarSign, FileText, Copy } from "lucide-react";
import { IconButton, EntityLink, Pagination } from "../../../../components/ui";
import { useLanguage } from "../../../../contexts/useLanguage";
import { useCopyToClipboard } from "../../../../hooks/useCopyToClipboard";
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
  LoanMaterialListItem,
  LoanMaterialsQueryParams,
  MaterialInstanceStatus,
  DepositStatus,
  PopulatedUserRef,
  Invoice,
} from "../../../../types/api";
import { ApiError } from "../../../../lib/api";
import { getLoanDetailGrouped, getLoanMaterials } from "../../../../services/loanService";
import { getInspections } from "../../../../services/inspectionService";
import { getInvoices } from "../../../../services/invoiceService";
import InvoiceDetailModal from "../../components/InvoiceDetailModal";
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

function getInvoiceLoanId(invoice: Invoice): string | null {
  if (!invoice.loanId) return null;
  return typeof invoice.loanId === "string" ? invoice.loanId : invoice.loanId._id;
}

function pickLoanInvoice(invoices: Invoice[], loanId: string): Invoice | null {
  const relatedInvoices = invoices.filter((invoice) => getInvoiceLoanId(invoice) === loanId);

  if (relatedInvoices.length === 0) return null;

  const prioritizedInvoice = relatedInvoices.find((invoice) => invoice.type === "rental");
  return prioritizedInvoice ?? relatedInvoices[0];
}

// ─── Component ──────────────────────────────────────────────────────────

export function LoanDetailModal({ open, onClose, view }: LoanDetailModalProps) {
  const { language, t } = useLanguage();
  const { copy } = useCopyToClipboard();
  const [searchParams, setSearchParams] = useSearchParams();
  const lang = language === "es" ? "es" : "en";
  const isEs = lang === "es";

  const [loanDetail, setLoanDetail] = useState<LoanDetailGrouped | null>(null);
  const [materials, setMaterials] = useState<LoanMaterialListItem[]>([]);
  const [materialsTotal, setMaterialsTotal] = useState(0);
  const [materialsPage, setMaterialsPage] = useState(1);
  const [materialsLimit, setMaterialsLimit] = useState(20);
  const [materialsTotalPages, setMaterialsTotalPages] = useState(1);
  const [materialsSearch, setMaterialsSearch] = useState("");
  const [materialsTypeId, setMaterialsTypeId] = useState("");
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsLoadedOnce, setMaterialsLoadedOnce] = useState(false);
  const [materialsError, setMaterialsError] = useState<string | null>(null);
  const [materialsReloadNonce, setMaterialsReloadNonce] = useState(0);
  const [inspectionSummary, setInspectionSummary] = useState<{
    inspectionNumber: string | null;
    inspectionDate: string | null;
  } | null>(null);
  const [relatedInvoiceId, setRelatedInvoiceId] = useState<string | null>(null);
  const [invoiceLookupLoading, setInvoiceLookupLoading] = useState(false);
  const [invoiceLookupError, setInvoiceLookupError] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [debouncedMaterialsSearch] = useDebounce(materialsSearch, 400);

  const requestSignatureRef = useRef<string>("");
  const requestControllerRef = useRef<AbortController | null>(null);
  const initializedFiltersLoanRef = useRef<string | null>(null);

  // Fetch grouped detail when a loan exists
  useEffect(() => {
    if (!open || !view.loan) return;
    let cancelled = false;
    async function fetchDetail() {
      try {
        const res = await getLoanDetailGrouped(view.loan!._id);
        if (!cancelled) setLoanDetail(res.data.loan);
      } catch {
        if (!cancelled) setLoanDetail(null);
      }
    }
    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [open, view.loan]);

  // Fetch latest inspection metadata when status is "returned", "inspected", or "closed"
  useEffect(() => {
    if (!open || !view.loan) return;
    if (view.status !== "returned" && view.status !== "inspected" && view.status !== "closed")
      return;
    let cancelled = false;
    async function fetchInspection() {
      try {
        const res = await getInspections({ loanId: view.loan!._id, limit: 1 });
        if (!cancelled && res.data.inspections.length > 0) {
          const latestInspection = [...res.data.inspections].sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })[0];

          setInspectionSummary({
            inspectionNumber: latestInspection.inspectionNumber ?? null,
            inspectionDate: latestInspection.createdAt ?? null,
          });
        } else if (!cancelled) {
          setInspectionSummary(null);
        }
      } catch {
        if (!cancelled) setInspectionSummary(null);
      }
    }
    fetchInspection();
    return () => {
      cancelled = true;
    };
  }, [open, view.loan, view.status]);

  useEffect(() => {
    setRelatedInvoiceId(null);
    setInvoiceLookupError(null);
    setInvoiceLookupLoading(false);
    setShowInvoiceModal(false);
  }, [open, view.loan?._id]);

  useEffect(() => {
    if (!open || !view.loan) return;

    if (initializedFiltersLoanRef.current === view.loan._id) return;

    const pageParam = Number(searchParams.get("loanMaterialsPage") ?? "1");
    const limitParam = Number(searchParams.get("loanMaterialsLimit") ?? "20");

    setMaterialsSearch(searchParams.get("loanMaterialsSearch") ?? "");
    setMaterialsTypeId(searchParams.get("loanMaterialsType") ?? "");
    setMaterialsPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
    setMaterialsLimit(Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 20);

    initializedFiltersLoanRef.current = view.loan._id;
  }, [open, view.loan, searchParams]);

  useEffect(() => {
    if (!open || !view.loan) return;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);

        const updateParam = (key: string, value: string | number, defaultValue: string) => {
          if (String(value) === defaultValue) {
            next.delete(key);
            return;
          }
          next.set(key, String(value));
        };

        updateParam("loanMaterialsSearch", materialsSearch.trim(), "");
        next.delete("loanMaterialsStatus");
        updateParam("loanMaterialsType", materialsTypeId, "");
        updateParam("loanMaterialsPage", materialsPage, "1");
        updateParam("loanMaterialsLimit", materialsLimit, "20");

        return next;
      },
      { replace: true },
    );
  }, [
    open,
    view.loan,
    materialsSearch,
    materialsTypeId,
    materialsPage,
    materialsLimit,
    setSearchParams,
  ]);

  useEffect(() => {
    if (!open || !view.loan) return;

    const params: LoanMaterialsQueryParams = {
      page: materialsPage,
      limit: materialsLimit,
      search: debouncedMaterialsSearch.trim() || undefined,
      materialTypeId: materialsTypeId || undefined,
    };

    const signature = JSON.stringify({ loanId: view.loan._id, params, reload: materialsReloadNonce });
    if (signature === requestSignatureRef.current) return;
    requestSignatureRef.current = signature;

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;

    setMaterialsLoading(true);
    setMaterialsError(null);

    getLoanMaterials(view.loan._id, params, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;

        setMaterials(res.data.materials ?? []);
        setMaterialsTotal(res.data.total ?? 0);
        setMaterialsPage(res.data.page ?? 1);
        setMaterialsTotalPages(Math.max(res.data.totalPages ?? 1, 1));
        setMaterialsLoadedOnce(true);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        if (error instanceof ApiError) {
          if (error.statusCode === 400) {
            setMaterialsError(t("loans.detail.materials.error400"));
          } else if (error.statusCode === 403) {
            setMaterialsError(t("loans.detail.materials.error403"));
          } else if (error.statusCode === 404) {
            setMaterialsError(t("loans.detail.materials.error404"));
          } else if (error.statusCode === 0) {
            setMaterialsError(t("loans.detail.materials.errorNetwork"));
          } else {
            setMaterialsError(t("loans.detail.materials.errorGeneric"));
          }
        } else {
          setMaterialsError(t("loans.detail.materials.errorNetwork"));
        }

        setMaterialsLoadedOnce(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setMaterialsLoading(false);
        }
      });

    return () => {
      requestSignatureRef.current = "";
      controller.abort();
    };
  }, [
    open,
    view.loan,
    materialsPage,
    materialsLimit,
    debouncedMaterialsSearch,
    materialsTypeId,
    materialsReloadNonce,
    t,
  ]);

  useEffect(() => {
    if (!open) {
      initializedFiltersLoanRef.current = null;
      requestSignatureRef.current = "";
      requestControllerRef.current?.abort();
    }
  }, [open]);

  const materialTypeOptions = useMemo(() => {
    const byType = loanDetail?.materialInstancesByType ?? {};
    const options = Object.entries(byType)
      .map(([fallbackId, group]) => ({
        id: group.instances[0]?.materialType?._id ?? fallbackId,
        name: group.instances[0]?.materialType?.name ?? fallbackId,
      }))
      .filter((option) => option.id.trim().length > 0);

    const deduped = Array.from(new Map(options.map((option) => [option.id, option])).values());
    return deduped.sort((a, b) => a.name.localeCompare(b.name));
  }, [loanDetail]);

  useEffect(() => {
    if (!materialsTypeId) return;
    const isValidType = materialTypeOptions.some((option) => option.id === materialsTypeId);
    if (!isValidType) {
      setMaterialsTypeId("");
      setMaterialsPage(1);
    }
  }, [materialsTypeId, materialTypeOptions]);

  const formatCondition = (condition?: string) => {
    if (!condition) return t("loans.detail.materials.condition.notSet");

    const normalized = condition.toLowerCase();
    if (normalized === "good") return t("loans.detail.materials.condition.good");
    if (normalized === "damaged") return t("loans.detail.materials.condition.damaged");
    if (normalized === "lost") return t("loans.detail.materials.condition.lost");
    return condition;
  };

  const getMaterialDisplayName = (entry: LoanMaterialListItem): string => {
    const instanceName = entry.materialInstanceId.name?.trim();
    if (instanceName) return instanceName;

    const typeName = entry.materialType?.name?.trim();
    if (typeName) return typeName;

    const modelId = entry.materialInstanceId.modelId?.trim();
    if (modelId) return modelId;

    return t("loans.detail.notSet");
  };

  const handleCopyValue = async (value: string) => {
    const copied = await copy(value);
    if (copied) return;

    // Last-resort fallback for restrictive browser contexts.
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // no-op: useCopyToClipboard already reports failure to the user.
    }
  };

  const resetMaterialsPage = () => {
    setMaterialsPage(1);
  };

  if (!open) return null;

  const req = view.request;
  const loan = view.loan;
  const code = req.code ?? `#${req._id.slice(-8).toUpperCase()}`;
  const activeStepIndex = getStepIndex(view.status);
  const isTerminal = TERMINAL_STATUSES.map((s) => s.status).includes(view.status);

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

  const handleOpenInvoiceDetail = async () => {
    if (!loan || invoiceLookupLoading) return;

    if (relatedInvoiceId) {
      setInvoiceLookupError(null);
      setShowInvoiceModal(true);
      return;
    }

    try {
      setInvoiceLookupLoading(true);
      setInvoiceLookupError(null);

      let page = 1;
      let totalPages = 1;
      let matchedInvoiceId: string | null = null;

      while (page <= totalPages && !matchedInvoiceId) {
        const res = await getInvoices({ page, limit: 100 });
        totalPages = Math.max(res.data.totalPages ?? 1, 1);
        const matchedInvoice = pickLoanInvoice(res.data.invoices, loan._id);

        if (matchedInvoice) {
          matchedInvoiceId = matchedInvoice._id;
          break;
        }

        page += 1;
      }

      if (!matchedInvoiceId) {
        setInvoiceLookupError(t("loans.detail.invoiceUnavailable"));
        return;
      }

      setRelatedInvoiceId(matchedInvoiceId);
      setShowInvoiceModal(true);
    } catch {
      setInvoiceLookupError(t("loans.detail.invoiceLookupError"));
    } finally {
      setInvoiceLookupLoading(false);
    }
  };

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
              <div>
                <p className="text-gray-500 text-sm">{t("loans.detail.preparedAt")}</p>
                <p className="text-gray-300">
                  {loanDetail?.preparedAt ? (
                    formatDate(loanDetail.preparedAt)
                  ) : (
                    <span className="text-gray-600 italic text-xs">{t("loans.detail.notSet")}</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">{t("loans.detail.preparedBy")}</p>
                <p className="text-gray-300">
                  {loanDetail?.preparedBy ? (
                    formatUserName(loanDetail.preparedBy)
                  ) : (
                    <span className="text-gray-600 italic text-xs">{t("loans.detail.notSet")}</span>
                  )}
                </p>
              </div>
              {(view.status === "returned" ||
                view.status === "inspected" ||
                view.status === "closed") && (
                <div>
                  <p className="text-gray-500 text-sm">{t("loans.detail.inspectionDone")}</p>
                  {inspectionSummary?.inspectionNumber ? (
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-green-400 font-semibold">
                        {isEs ? "S\u00ed" : "Yes"}
                      </span>
                      <span className="text-white font-semibold font-mono text-xs">
                        {inspectionSummary.inspectionNumber}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-600 italic text-xs">{t("loans.detail.notSet")}</span>
                  )}
                </div>
              )}
              {(view.status === "returned" ||
                view.status === "inspected" ||
                view.status === "closed") && (
                <div>
                  <p className="text-gray-500 text-sm">{t("loans.detail.inspectionDate")}</p>
                  <p className="text-gray-300">
                    {inspectionSummary?.inspectionDate ? (
                      formatDate(inspectionSummary.inspectionDate)
                    ) : (
                      <span className="text-gray-600 italic text-xs">
                        {t("loans.detail.notSet")}
                      </span>
                    )}
                  </p>
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
              <div className="space-y-3" data-help-id="loans-detail-financial-summary">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#FFD700] uppercase tracking-wider">
                    <DollarSign size={14} />
                    <span>{t("loans.detail.loanFinancials")}</span>
                  </div>
                  {loan && (
                    <button
                      type="button"
                      onClick={handleOpenInvoiceDetail}
                      disabled={invoiceLookupLoading}
                      data-help-id="loans-detail-view-invoice"
                      className="inline-flex items-center gap-2 rounded-lg border border-[#7a6510] bg-[#1f1a08] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#FFD700] transition-colors hover:bg-[#2a220a] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FileText size={14} />
                      <span>
                        {invoiceLookupLoading
                          ? t("loans.detail.loadingInvoice")
                          : t("loans.detail.viewInvoice")}
                      </span>
                    </button>
                  )}
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
                    {/* extensionFees temporarily hidden */}
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
                {invoiceLookupError && loan && (
                  <p className="text-xs text-red-400">{invoiceLookupError}</p>
                )}
              </div>
            )}

            {/* Material instances list with server-side search/filter/pagination */}
            {loan && (
              <div className="space-y-4" data-help-id="loans-detail-materials-section">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#FFD700] uppercase tracking-wider">
                  <Package size={16} />
                  <span>{t("loans.detail.assignedMaterials")}</span>
                </div>

                <div
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
                  data-help-id="loans-detail-materials-filters"
                >
                  <div className="xl:col-span-2">
                    <label
                      htmlFor="loan-materials-search"
                      className="text-xs font-semibold uppercase tracking-wide text-gray-400"
                    >
                      {t("loans.detail.materials.searchLabel")}
                    </label>
                    <input
                      id="loan-materials-search"
                      type="search"
                      value={materialsSearch}
                      onChange={(event) => {
                        setMaterialsSearch(event.target.value);
                        resetMaterialsPage();
                      }}
                      className="mt-1 w-full rounded-lg border border-[#333] bg-[#171717] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#FFD700]/60"
                      placeholder={t("loans.detail.materials.searchPlaceholder")}
                      data-help-id="loans-detail-materials-search"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="loan-materials-type"
                      className="text-xs font-semibold uppercase tracking-wide text-gray-400"
                    >
                      {t("loans.detail.materials.typeLabel")}
                    </label>
                    <select
                      id="loan-materials-type"
                      value={materialsTypeId}
                      onChange={(event) => {
                        setMaterialsTypeId(event.target.value);
                        resetMaterialsPage();
                      }}
                      className="mt-1 w-full rounded-lg border border-[#333] bg-[#171717] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#FFD700]/60"
                      data-help-id="loans-detail-materials-type"
                    >
                      <option value="">{t("loans.detail.materials.typeAll")}</option>
                      {materialTypeOptions.map((typeOption) => (
                        <option key={typeOption.id} value={typeOption.id}>
                          {typeOption.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="loan-materials-limit"
                      className="text-xs font-semibold uppercase tracking-wide text-gray-400"
                    >
                      {t("loans.detail.materials.limitLabel")}
                    </label>
                    <select
                      id="loan-materials-limit"
                      value={materialsLimit}
                      onChange={(event) => {
                        const nextLimit = Number(event.target.value);
                        setMaterialsLimit(nextLimit);
                        setMaterialsPage(1);
                      }}
                      className="mt-1 w-full rounded-lg border border-[#333] bg-[#171717] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#FFD700]/60"
                    >
                      {[10, 20, 50].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3" data-help-id="loans-detail-materials-meta">
                  <p className="text-xs text-gray-400">
                    {t("loans.detail.materials.totalResults", { count: materialsTotal })}
                  </p>
                  {materialsLoading && materialsLoadedOnce && (
                    <p className="text-xs text-gray-500 animate-pulse">
                      {t("loans.detail.materials.updating")}
                    </p>
                  )}
                </div>

                {materialsError && (
                  <div
                    className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3"
                    role="alert"
                  >
                    <p className="text-sm text-red-300">{materialsError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        requestSignatureRef.current = "";
                        setMaterialsReloadNonce((prev) => prev + 1);
                      }}
                      className="mt-2 rounded-md border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-200 hover:bg-red-500/20 transition-colors"
                    >
                      {t("loans.detail.materials.retry")}
                    </button>
                  </div>
                )}

                {!materialsError && materialsLoading && !materialsLoadedOnce && (
                  <p className="text-xs text-gray-500 animate-pulse">
                    {t("loans.detail.materials.loading")}
                  </p>
                )}

                {!materialsError && !materialsLoading && materials.length === 0 && (
                  <div className="rounded-lg border border-[#333] bg-[#171717] px-4 py-6 text-center">
                    <p className="text-sm text-gray-300">{t("loans.detail.materials.emptyTitle")}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {t("loans.detail.materials.emptyDescription")}
                    </p>
                  </div>
                )}

                {!materialsError && materials.length > 0 && (
                  <div
                    className="rounded-xl border border-[#333] bg-[#171717] overflow-hidden"
                    data-help-id="loans-detail-materials-table"
                  >
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-[#1b1b1b] border-b border-[#333]">
                          <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                            <th className="px-3 py-2">{t("loans.detail.materials.table.serial")}</th>
                            <th className="px-3 py-2">{t("loans.detail.materials.table.barcode")}</th>
                            <th className="px-3 py-2">{t("loans.detail.materials.table.name")}</th>
                            <th className="px-3 py-2">{t("loans.detail.materials.table.type")}</th>
                            <th className="px-3 py-2">{t("loans.detail.materials.table.status")}</th>
                            <th className="px-3 py-2">
                              {t("loans.detail.materials.table.conditionAtCheckout")}
                            </th>
                            <th className="px-3 py-2">
                              {t("loans.detail.materials.table.conditionAtReturn")}
                            </th>
                            <th className="px-3 py-2">{t("loans.detail.materials.table.notes")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2a2a]">
                          {materials.map((entry) => (
                            <tr key={entry.materialInstanceId._id} className="text-gray-200">
                              <td className="px-3 py-2 font-mono text-xs">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    void handleCopyValue(entry.materialInstanceId.serialNumber);
                                  }}
                                  className="text-[#E8E8E8] hover:text-[#FFD700] underline decoration-dotted underline-offset-2 transition-colors inline-flex items-center gap-1 group/copy cursor-pointer"
                                  title={t("loans.detail.materials.copySerial")}
                                  aria-label={t("loans.detail.materials.copySerial")}
                                >
                                  {entry.materialInstanceId.serialNumber}
                                  <Copy
                                    size={12}
                                    className="opacity-80 group-hover/copy:opacity-100 transition-opacity"
                                  />
                                </button>
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">
                                {entry.materialInstanceId.barcode ? (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      void handleCopyValue(entry.materialInstanceId.barcode as string);
                                    }}
                                    className="text-[#E8E8E8] hover:text-[#FFD700] underline decoration-dotted underline-offset-2 transition-colors inline-flex items-center gap-1 group/copy cursor-pointer"
                                    title={t("loans.detail.materials.copyBarcode")}
                                    aria-label={t("loans.detail.materials.copyBarcode")}
                                  >
                                    {entry.materialInstanceId.barcode}
                                    <Copy
                                      size={12}
                                      className="opacity-80 group-hover/copy:opacity-100 transition-opacity"
                                    />
                                  </button>
                                ) : (
                                  t("loans.detail.notSet")
                                )}
                              </td>
                              <td className="px-3 py-2">{getMaterialDisplayName(entry)}</td>
                              <td className="px-3 py-2">{entry.materialType?.name ?? t("loans.detail.notSet")}</td>
                              <td className="px-3 py-2">
                                {getMaterialInstanceStatusLabel(
                                  entry.materialInstanceId.status as MaterialInstanceStatus,
                                  lang,
                                )}
                              </td>
                              <td className="px-3 py-2">{formatCondition(entry.conditionAtCheckout)}</td>
                              <td className="px-3 py-2">{formatCondition(entry.conditionAtReturn)}</td>
                              <td className="px-3 py-2">{entry.notes || t("loans.detail.notSet")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="border-t border-[#333] px-3 py-3">
                      <Pagination
                        page={materialsPage}
                        totalPages={materialsTotalPages}
                        onPageChange={(nextPage) => {
                          if (nextPage < 1 || nextPage > materialsTotalPages) return;
                          setMaterialsPage(nextPage);
                        }}
                      />
                    </div>
                  </div>
                )}
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
                className={`inline-flex mt-2 px-3 py-1 rounded-full text-xs font-semibold ${getUnifiedStatusBadgeStyle(view.status, view.loan)}`}
              >
                {getUnifiedStatusLabel(view.status, lang, view.loan)}
              </span>
            </div>

            {/* Terminal state warning */}
            {isTerminal && (
              <p className="text-red-300 text-sm">
                {isEs
                  ? `Este préstamo está en estado terminal: ${getUnifiedStatusLabel(view.status, "es", view.loan)}`
                  : `This loan is in a terminal state: ${getUnifiedStatusLabel(view.status, "en", view.loan)}`}
              </p>
            )}
          </aside>
        </div>
      </div>

      <InvoiceDetailModal
        isOpen={showInvoiceModal && relatedInvoiceId !== null}
        invoiceId={relatedInvoiceId}
        onClose={() => setShowInvoiceModal(false)}
        showActions={false}
      />
    </div>
  );
}
