import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button, PageHeader, IconButton } from "../../../../components/ui";
import type {
  Customer,
  CreateLoanRequestPayload,
  LoanRequest,
  Loan,
  MaterialCategory,
  MaterialInstance,
  MaterialType,
  Package,
  PackageMaterialEntry,
} from "../../../../types/api";
import {
  createRequest,
  getRequests,
  getLoans,
  cancelRequest,
  updateRequest,
  createLoanFromRequest,
  extendLoan,
  returnLoan,
  refundDeposit,
  completeLoan,
  recordPayment,
  recordRentalPayment,
} from "../../../../services/loanService";
import { getCustomers } from "../../../../services/customerService";
import { getOrganizationSettings } from "../../../../services/organizationService";
import {
  getMaterialCategories,
  getMaterialInstances,
  getMaterialTypes,
  getPackages,
} from "../../../../services/materialService";
import { useAlertModal } from "../../../../hooks/useAlertModal";
import { useActionPermission } from "../../../../hooks/useActionPermission";
import { usePermissions } from "../../../../contexts/usePermissions";
import { useLanguage } from "../../../../contexts/useLanguage";
import PrepareOrderModal from "../PrepareOrderModal";
import Unauthorized from "../../../../pages/Unauthorized";

import type { UnifiedLoanView, LoanFilterTab, LoanSubFilter } from "./types";
import { buildUnifiedLoanViews, filterByTabAndSubFilter, filterBySearch, filterByStates, filterByDateRange } from "./helpers";
import { LoansFilters } from "./LoansFilters";
import { LoansTable } from "./LoansTable";
import { LoanDetailModal } from "./LoanDetailModal";
import { CreateOrderModal } from "../orders/CreateOrderModal";
import {
  CancelLoanModal,
  ReactivateLoanModal,
  RecordPaymentModal,
  RecordRentalPaymentModal,
  ExtendLoanModal,
  ReturnLoanModal,
  RefundDepositModal,
  CompleteLoanModal,
} from "./LoanActionModals";

// ─── Helper to extract materialTypeId from package entry ────────────────

function extractMaterialTypeIdFromPackageEntry(entry: PackageMaterialEntry): string | undefined {
  return entry.materialTypeId || undefined;
}

// ─── Component ──────────────────────────────────────────────────────────

export function Loans() {
  const { showError, showSuccess, AlertModal } = useAlertModal();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const { language, t } = useLanguage();
  const isEs = language === "es";
  const { guard } = useActionPermission(isEs ? "es" : "en");

  // ── Data state ─────────────────────────────────────────────────────────
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [materialCategories, setMaterialCategories] = useState<MaterialCategory[]>([]);
  const [materialInstances, setMaterialInstances] = useState<MaterialInstance[]>([]);
  const [inventoryDataAvailable, setInventoryDataAvailable] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadWarning, setLoadWarning] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [_requireFullPayment, setRequireFullPayment] = useState(false);

  // ── Filters ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<LoanFilterTab>("all");
  const [subFilter, setSubFilter] = useState<LoanSubFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);

  // ── Modal state ────────────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeView, setActiveView] = useState<UnifiedLoanView | null>(null);

  // Pre-checkout modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<UnifiedLoanView | null>(null);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [reactivateTarget, setReactivateTarget] = useState<UnifiedLoanView | null>(null);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<UnifiedLoanView | null>(null);
  const [showRentalPaymentModal, setShowRentalPaymentModal] = useState(false);
  const [rentalPaymentTarget, setRentalPaymentTarget] = useState<UnifiedLoanView | null>(null);
  const [showPrepareModal, setShowPrepareModal] = useState(false);
  const [prepareTargetOrder, setPrepareTargetOrder] = useState<UnifiedLoanView | null>(null);
  const [prepareRequiredTypes, setPrepareRequiredTypes] = useState<
    Array<{ materialTypeId: string; materialTypeName: string; quantity: number }>
  >([]);

  // Post-checkout modals
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendTarget, setExtendTarget] = useState<UnifiedLoanView | null>(null);
  const [newEndDate, setNewEndDate] = useState("");
  const [extendNotes, setExtendNotes] = useState("");
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnTarget, setReturnTarget] = useState<UnifiedLoanView | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundTarget, setRefundTarget] = useState<UnifiedLoanView | null>(null);
  const [refundNotes, setRefundNotes] = useState("");
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<UnifiedLoanView | null>(null);

  // ── Permissions ────────────────────────────────────────────────────────
  const canCreateRequest = hasPermission("requests:create");

  // ── Fetch data ─────────────────────────────────────────────────────────
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        requestsRes,
        loansRes,
        customersRes,
        categoriesRes,
        instancesRes,
        packagesRes,
        materialTypesRes,
        orgSettingsRes,
      ] = await Promise.allSettled([
        getRequests({ page: 1, limit: 100 }),
        getLoans(),
        getCustomers({ page: 1, limit: 100 }),
        getMaterialCategories(),
        getMaterialInstances(),
        getPackages({ page: 1, limit: 100 }),
        getMaterialTypes(),
        getOrganizationSettings(),
      ]);

      if (requestsRes.status === "fulfilled") {
        setRequests(requestsRes.value.data.requests ?? []);
      }
      if (loansRes.status === "fulfilled") {
        setLoans(loansRes.value.data.loans ?? []);
      }
      if (customersRes.status === "fulfilled") {
        setCustomers(customersRes.value.data.customers ?? []);
      }
      if (categoriesRes.status === "fulfilled") {
        setMaterialCategories(categoriesRes.value.data.categories ?? []);
      }
      if (instancesRes.status === "fulfilled") {
        setMaterialInstances(instancesRes.value.data.instances ?? []);
        setInventoryDataAvailable(true);
      } else {
        setInventoryDataAvailable(false);
      }
      if (packagesRes.status === "fulfilled") {
        setPackages(packagesRes.value.data.packages ?? []);
      }
      if (materialTypesRes.status === "fulfilled") {
        setMaterialTypes(materialTypesRes.value.data.materialTypes ?? []);
      }
      if (orgSettingsRes.status === "fulfilled") {
        setRequireFullPayment(
          orgSettingsRes.value.data.settings.requireFullPaymentBeforeCheckout ?? false,
        );
      }

      const failures: string[] = [];
      if (requestsRes.status === "rejected") failures.push("requests");
      if (loansRes.status === "rejected") failures.push("loans");
      if (customersRes.status === "rejected") failures.push("customers");

      if (failures.length > 0) {
        setLoadWarning(t("loans.loadWarning", { sources: failures.join(", ") }));
      } else {
        setLoadWarning("");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t("loans.loadError");
      setLoadWarning(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ── Build unified views ────────────────────────────────────────────────
  const unifiedViews = useMemo(
    () =>
      buildUnifiedLoanViews(
        requests,
        loans,
        customers,
        packages,
        materialTypes,
        language === "es" ? "es" : "en",
      ),
    [requests, loans, customers, packages, materialTypes, language],
  );

  const filteredViews = useMemo(() => {
    let result = filterByTabAndSubFilter(unifiedViews, activeTab, subFilter);
    result = filterBySearch(result, searchTerm);
    result = filterByStates(result, selectedStates as any);
    result = filterByDateRange(result, dateFrom, dateTo);
    
    // Sort by creation date (newest first)
    result = result.sort((a, b) => {
      const dateA = a.request.createdAt ? new Date(a.request.createdAt).getTime() : 0;
      const dateB = b.request.createdAt ? new Date(b.request.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    return result;
  }, [unifiedViews, activeTab, subFilter, searchTerm, selectedStates, dateFrom, dateTo]);

  // ── Action handlers ────────────────────────────────────────────────────

  const handleViewDetail = (v: UnifiedLoanView) => {
    setActiveView(v);
    setShowDetailsModal(true);
  };

  const handleCreateOrder = async (payload: CreateLoanRequestPayload) => {
    setSubmitting(true);
    try {
      await createRequest(payload);
      showSuccess(t("loans.createSuccess"), t("loans.createSuccessTitle"));
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("loans.createError");
      showError(message, t("loans.createErrorTitle"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCancel = (v: UnifiedLoanView) => {
    setCancelTarget(v);
    setShowCancelModal(true);
  };

  const handleCancel = async (reason: string) => {
    if (!cancelTarget || !reason) {
      showError(t("loans.cancelReasonRequired"), t("loans.validationError"));
      return;
    }
    setSubmitting(true);
    try {
      await cancelRequest(cancelTarget.request._id);
      showSuccess(t("loans.cancelSuccess"), t("loans.updated"));
      setShowCancelModal(false);
      setCancelTarget(null);
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("loans.cancelError");
      showError(message, t("loans.cancelErrorTitle"));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrepare = (v: UnifiedLoanView) => {
    const requiredByMaterialType = new Map<string, number>();

    v.request.items.forEach((item) => {
      const itemQty = Math.max(1, Number(item.quantity) || 1);
      const directMaterialId =
        item.materialTypeId ?? (item.type === "material" ? item.referenceId : undefined);

      if (directMaterialId) {
        requiredByMaterialType.set(
          directMaterialId,
          (requiredByMaterialType.get(directMaterialId) ?? 0) + itemQty,
        );
        return;
      }

      const packageId = item.packageId ?? (item.type === "package" ? item.referenceId : undefined);
      if (!packageId) return;

      const pkg = packages.find((entry) => entry._id === packageId);
      const entries = (pkg?.items?.length ? pkg.items : pkg?.materialTypes) ?? [];
      entries.forEach((entry) => {
        const mtId = extractMaterialTypeIdFromPackageEntry(entry);
        if (!mtId) return;
        const requiredQty = itemQty * Math.max(1, Number(entry.quantity) || 1);
        requiredByMaterialType.set(mtId, (requiredByMaterialType.get(mtId) ?? 0) + requiredQty);
      });
    });

    const types = Array.from(requiredByMaterialType.entries()).map(
      ([materialTypeId, quantity]) => ({
        materialTypeId,
        materialTypeName:
          materialTypes.find((mt) => mt._id === materialTypeId)?.name ?? materialTypeId,
        quantity,
      }),
    );

    setPrepareRequiredTypes(types);
    setPrepareTargetOrder(v);
    setShowPrepareModal(true);
  };

  const handleRecordPayment = (v: UnifiedLoanView) => {
    setPaymentTarget(v);
    setShowRecordPaymentModal(true);
  };

  const handleSubmitRecordPayment = async () => {
    if (!paymentTarget) return;
    setSubmitting(true);
    try {
      await recordPayment(paymentTarget.request._id);
      showSuccess(t("loans.depositRecordedSuccess"), t("loans.paymentRecordedTitle"));
      setShowRecordPaymentModal(false);
      setPaymentTarget(null);
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("loans.paymentRecordError");
      showError(message, t("loans.paymentErrorTitle"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordRentalPayment = (v: UnifiedLoanView) => {
    setRentalPaymentTarget(v);
    setShowRentalPaymentModal(true);
  };

  const handleSubmitRentalPayment = async () => {
    if (!rentalPaymentTarget) return;
    setSubmitting(true);
    try {
      await recordRentalPayment(rentalPaymentTarget.request._id);
      showSuccess(t("loans.rentalRecordedSuccess"), t("loans.paymentRecordedTitle"));
      setShowRentalPaymentModal(false);
      setRentalPaymentTarget(null);
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("loans.rentalRecordError");
      showError(message, t("loans.paymentErrorTitle"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartLoan = async (v: UnifiedLoanView) => {
    setSubmitting(true);
    try {
      await createLoanFromRequest(v.request._id);
      showSuccess(t("loans.loanStartSuccess"), t("loans.loanStartSuccessTitle"));
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("loans.loanStartError");
      showError(message, t("loans.loanStartErrorTitle"));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Post-checkout handlers ─────────────────────────────────────────────

  const handleOpenExtend = (v: UnifiedLoanView) => {
    setExtendTarget(v);
    setNewEndDate(v.loan?.endDate.slice(0, 10) ?? "");
    setExtendNotes("");
    setShowExtendModal(true);
  };

  const handleExtendLoan = async () => {
    if (!extendTarget?.loan || !newEndDate) return;
    setSubmitting(true);
    try {
      await extendLoan(extendTarget.loan._id, {
        newEndDate: `${newEndDate}T00:00:00.000Z`,
        ...(extendNotes.trim() ? { notes: extendNotes.trim() } : {}),
      });
      showSuccess(t("loans.extendSuccess"), t("loans.extendSuccessTitle"));
      setShowExtendModal(false);
      setExtendTarget(null);
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("loans.extendError");
      showError(message, t("loans.extendErrorTitle"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReturn = (v: UnifiedLoanView) => {
    setReturnTarget(v);
    setShowReturnModal(true);
  };

  const handleReturnLoan = async () => {
    if (!returnTarget?.loan) return;
    setSubmitting(true);
    try {
      await returnLoan(returnTarget.loan._id);
      showSuccess(t("loans.returnSuccess"), t("loans.returnSuccessTitle"));
      setShowReturnModal(false);
      setReturnTarget(null);
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("loans.returnError");
      showError(message, t("loans.returnErrorTitle"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRefund = (v: UnifiedLoanView) => {
    setRefundTarget(v);
    setRefundNotes("");
    setShowRefundModal(true);
  };

  const handleRefundDeposit = async () => {
    if (!refundTarget?.loan) return;
    setSubmitting(true);
    try {
      await refundDeposit(refundTarget.loan._id, refundNotes.trim() || undefined);
      showSuccess(t("loans.refundSuccess"), t("loans.refundSuccessTitle"));
      setShowRefundModal(false);
      setRefundTarget(null);
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("loans.refundError");
      showError(message, t("loans.refundErrorTitle"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenComplete = (v: UnifiedLoanView) => {
    setCompleteTarget(v);
    setShowCompleteModal(true);
  };

  const handleCompleteLoan = async () => {
    if (!completeTarget?.loan) return;
    setSubmitting(true);
    try {
      await completeLoan(completeTarget.loan._id);
      showSuccess(t("loans.completeSuccess"), t("loans.completeSuccessTitle"));
      setShowCompleteModal(false);
      setCompleteTarget(null);
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("loans.completeError");
      showError(message, t("loans.completeErrorTitle"));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Permission gate ────────────────────────────────────────────────────
  if (!hasAnyPermission(["requests:read", "loans:read"])) return <Unauthorized />;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div data-help-id="loans-header">
        <PageHeader
          title={t("loans.title")}
          subtitle={t("loans.subtitle")}
          actions={
            <div data-help-id="loans-create-action" className="flex items-center gap-2">
              <IconButton
                icon={RefreshCw}
                onClick={() => refreshData()}
                disabled={loading}
                ariaLabel={t("common.refresh")}
                className={loading ? "animate-spin" : ""}
                title={t("common.refresh")}
              />
              {canCreateRequest && (
                <Button
                  leftIcon={Plus}
                  onClick={guard("requests:create", () => setShowCreateModal(true))}
                  variant="outline"
                  title={t("loans.actions.newRequest")}
                  className="w-full sm:w-auto border-[#FFD700]/40 text-[#FFD700] bg-[#FFD700]/8 hover:bg-[#FFD700]/16"
                >
                  {t("loans.newRequest")}
                </Button>
              )}
            </div>
          }
        />
      </div>

      {loadWarning && (
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
          {loadWarning}
        </div>
      )}

      <div data-help-id="loans-filters">
        <LoansFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedStates={selectedStates}
          onSelectedStatesChange={setSelectedStates}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          onClearFilters={() => {
            setSelectedStates([]);
            setDateFrom(null);
            setDateTo(null);
          }}
        />
      </div>

      {/* Results summary */}
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="text-sm text-gray-400">
          {searchTerm && (
            <span>
              {t("loans.table.searchResults", { count: filteredViews.length })} •{" "}
            </span>
          )}
          <span>
            {filteredViews.length} {filteredViews.length === 1 ? t("loans.table.resultSingular") : t("loans.table.resultPlural")}
          </span>
          {unifiedViews.length > filteredViews.length && (
            <span className="text-gray-500"> (de {unifiedViews.length} totales)</span>
          )}
        </div>
        {(selectedStates.length > 0 || dateFrom || dateTo) && (
          <div className="text-xs text-gray-500">
            {selectedStates.length > 0 && <span>{selectedStates.length} estado(s)</span>}
            {selectedStates.length > 0 && (dateFrom || dateTo) && <span className="mx-1">•</span>}
            {(dateFrom || dateTo) && (
              <span>
                {dateFrom} {dateTo && `→ ${dateTo}`}
              </span>
            )}
          </div>
        )}
      </div>

      <div data-help-id="loans-content">
        <LoansTable
            loans={filteredViews}
            totalCount={unifiedViews.length}
            loading={loading}
            submitting={submitting}
            onViewDetail={handleViewDetail}
            onCancel={handleOpenCancel}
            onPrepare={handlePrepare}
            onRecordPayment={handleRecordPayment}
            onRecordRentalPayment={handleRecordRentalPayment}
            onStartLoan={handleStartLoan}
            onExtend={handleOpenExtend}
            onReturn={handleOpenReturn}
            onRefund={handleOpenRefund}
            onComplete={handleOpenComplete}
          />
      </div>

      {/* ── Modals ── */}

      {showCreateModal && (
        <CreateOrderModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          customers={customers}
          materialCategories={materialCategories}
          materialInstances={materialInstances}
          materialTypes={materialTypes}
          packages={packages}
          inventoryDataAvailable={inventoryDataAvailable}
          onSubmit={handleCreateOrder}
          submitting={submitting}
        />
      )}

      {showDetailsModal && activeView && (
        <LoanDetailModal
          open={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setActiveView(null);
          }}
          view={activeView}
        />
      )}

      <CancelLoanModal
        show={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setCancelTarget(null);
        }}
        target={cancelTarget}
        onSubmit={handleCancel}
        submitting={submitting}
      />

      <ReactivateLoanModal
        show={showReactivateModal}
        onClose={() => {
          setShowReactivateModal(false);
          setReactivateTarget(null);
        }}
        target={reactivateTarget}
        onSubmit={async (reason) => {
          if (!reactivateTarget) return;
          setSubmitting(true);
          try {
            await updateRequest(reactivateTarget.request._id, {
              status: "pending",
              notes: `Reactivated. Reason: ${reason}`,
            });
            showSuccess(t("loans.reactivateSuccess"), t("loans.reactivateSuccessTitle"));
            setShowReactivateModal(false);
            setReactivateTarget(null);
            await refreshData();
          } catch (error) {
            const message = error instanceof Error ? error.message : t("loans.reactivateError");
            showError(message, t("loans.reactivateErrorTitle"));
          } finally {
            setSubmitting(false);
          }
        }}
        submitting={submitting}
      />

      <RecordPaymentModal
        show={showRecordPaymentModal}
        onClose={() => {
          setShowRecordPaymentModal(false);
          setPaymentTarget(null);
        }}
        target={paymentTarget}
        onSubmit={() => void handleSubmitRecordPayment()}
        submitting={submitting}
      />

      <RecordRentalPaymentModal
        show={showRentalPaymentModal}
        onClose={() => {
          setShowRentalPaymentModal(false);
          setRentalPaymentTarget(null);
        }}
        target={rentalPaymentTarget}
        onSubmit={() => void handleSubmitRentalPayment()}
        submitting={submitting}
      />

      <ExtendLoanModal
        show={showExtendModal}
        onClose={() => {
          setShowExtendModal(false);
          setExtendTarget(null);
        }}
        target={extendTarget}
        newEndDate={newEndDate}
        onEndDateChange={setNewEndDate}
        notes={extendNotes}
        onNotesChange={setExtendNotes}
        onSubmit={() => void handleExtendLoan()}
        submitting={submitting}
      />

      <ReturnLoanModal
        show={showReturnModal}
        onClose={() => {
          setShowReturnModal(false);
          setReturnTarget(null);
        }}
        target={returnTarget}
        onSubmit={() => void handleReturnLoan()}
        submitting={submitting}
      />

      <RefundDepositModal
        show={showRefundModal}
        onClose={() => {
          setShowRefundModal(false);
          setRefundTarget(null);
        }}
        target={refundTarget}
        notes={refundNotes}
        onNotesChange={setRefundNotes}
        onSubmit={() => void handleRefundDeposit()}
        submitting={submitting}
      />

      <CompleteLoanModal
        show={showCompleteModal}
        onClose={() => {
          setShowCompleteModal(false);
          setCompleteTarget(null);
        }}
        target={completeTarget}
        onSubmit={() => void handleCompleteLoan()}
        submitting={submitting}
      />

      {showPrepareModal && prepareTargetOrder && (
        <PrepareOrderModal
          isOpen={showPrepareModal}
          onClose={() => {
            setShowPrepareModal(false);
            setPrepareTargetOrder(null);
          }}
          requestId={prepareTargetOrder.request._id}
          customerName={prepareTargetOrder.customerName}
          requiredMaterialTypes={prepareRequiredTypes}
          onSuccess={async () => {
            setShowPrepareModal(false);
            setPrepareTargetOrder(null);
            await refreshData();
          }}
        />
      )}

      <AlertModal />
    </div>
  );
}
