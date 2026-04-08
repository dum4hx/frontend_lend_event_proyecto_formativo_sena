import { useState, useEffect, useCallback } from "react";
import { CreditCard, Users, XCircle, ExternalLink, Download } from "lucide-react";
import { StatCard } from "../../components";
import { PageHeader } from "../../../../components/ui";
import {
  getBillingHistory,
  createPortalSession,
  cancelSubscription,
  updateSeats,
  createCheckoutSession,
  changePlan,
  getPendingChanges,
  cancelPendingChange,
} from "../../../../services/billingService";
import {
  getOrganizationUsage,
  getAvailablePlans,
  getOrganization,
} from "../../../../services/organizationService";
import {
  getSubscriptionTypesPublic,
  getSubscriptionTypes,
  calculatePlanCost,
} from "../../../../services/subscriptionTypeService";
import { ErrorDisplay, AlertContainer, ConfirmDialog } from "../../../../components/ui";
import { normalizeError, logError } from "../../../../utils/errorHandling";
import { ApiError } from "../../../../lib/api";
import { useAlerts } from "../../../../hooks/useAlerts";
import { useLanguage } from "../../../../contexts/useLanguage";
import { usePermissions } from "../../../../contexts/usePermissions";
import Unauthorized from "../../../../pages/Unauthorized";
import { getExportBillingHistory } from "../../../../services/reportExportService";
import { exportTableToXLSX } from "../../../../utils/tableExport";
import { buildBillingSummaryEntries } from "../reports/summaryBuilders";
import { fetchAllPages } from "../reports/helpers";
import { formatEventType, formatCurrency } from "./helpers";
import BillingHistorySection from "./BillingHistorySection";
import AvailablePlansGrid from "./AvailablePlansGrid";
import type {
  BillingHistoryEntry,
  AvailablePlan,
  Organization,
  PublicPlan,
  SubscriptionType,
  PlanCostResult,
  PendingChange,
  ExportBillingHistoryData,
  ExportBillingHistoryRow,
  ExportBillingHistoryParams,
  ExportBillingHistorySummary,
} from "../../../../types/api";

export default function SubscriptionManagement() {
  const { language, locale, t } = useLanguage();
  const isEs = language === "es";

  // Data
  const [history, setHistory] = useState<BillingHistoryEntry[]>([]);
  const [plans, setPlans] = useState<AvailablePlan[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [usage, setUsage] = useState<{
    currentSeats: number;
    maxSeats: number;
    canAddSeat: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);

  // Seat update
  const [seatCount, setSeatCount] = useState(1);
  const [updatingSeats, setUpdatingSeats] = useState(false);

  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Pending plan change
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [cancellingPendingChange, setCancellingPendingChange] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);

  const { alerts, showAlert, dismissAlert } = useAlerts();
  const { hasPermission } = usePermissions();

  // ─── Data Fetching ─────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setSessionExpired(false);
      // Always try to fetch public plans first (does not require auth)
      try {
        // 1) Prefer public subscription types (commonly implemented)
        const typesRes = await getSubscriptionTypesPublic();
        const pubPlans = (typesRes.data.subscriptionTypes ?? []) as Array<
          PublicPlan | SubscriptionType
        >;
        if (pubPlans.length > 0) {
          const mappedPublicPlans: AvailablePlan[] = pubPlans.map((p) => ({
            name: "name" in p ? p.name : p.plan,
            displayName: p.displayName,
            billingModel: p.billingModel,
            maxCatalogItems: p.maxCatalogItems,
            maxSeats: p.maxSeats,
            features: p.features ?? [],
            basePriceMonthly: "basePriceMonthly" in p ? p.basePriceMonthly : p.baseCost,
            pricePerSeat: p.pricePerSeat,
          }));

          setPlans(mappedPublicPlans);
        } else {
          // 2) Try organization plans endpoint
          try {
            const plansRes = await getAvailablePlans();
            const orgPlans = plansRes.data.plans ?? [];
            if (orgPlans.length > 0) {
              setPlans(orgPlans);
            } else {
              // 3) Authenticated subscription types
              try {
                const authTypesRes = await getSubscriptionTypes();
                const authTypes = authTypesRes.data.subscriptionTypes ?? [];
                const mapped = authTypes.map((p) => ({
                  name: p.plan,
                  displayName: p.displayName,
                  billingModel: p.billingModel,
                  maxCatalogItems: p.maxCatalogItems,
                  maxSeats: p.maxSeats,
                  features: p.features ?? [],
                  basePriceMonthly: p.baseCost,
                  pricePerSeat: p.pricePerSeat,
                }));
                setPlans(mapped);
              } catch (e3) {
                logError(e3, "SubscriptionManagement.fetchAuthTypes");
                setPlans([]);
              }
            }
          } catch (e2) {
            logError(e2, "SubscriptionManagement.fetchOrgPlans");
            setPlans([]);
          }
        }
      } catch (e) {
        logError(e, "SubscriptionManagement.fetchPlansOrder");
        setPlans([]);
      }

      // Fetch protected endpoints individually; tolerate 401 to keep the view
      const results = await Promise.allSettled([
        getBillingHistory(50),
        getOrganizationUsage(),
        getOrganization(),
        getPendingChanges(),
      ]);

      const [histRes, usageRes, orgRes, pendingRes] = results;

      if (histRes.status === "fulfilled") {
        setHistory(histRes.value.data.history ?? []);
      } else if (histRes.status === "rejected") {
        const err = histRes.reason;
        if (err instanceof ApiError && err.statusCode === 401) {
          setSessionExpired(true);
        } else {
          setError(normalizeError(err).message);
        }
      }

      if (usageRes.status === "fulfilled") {
        const u = usageRes.value.data.usage;
        setUsage({
          currentSeats: u.currentSeats ?? 0,
          maxSeats: u.maxSeats ?? 0,
          canAddSeat: u.canAddSeat,
        });
        setSeatCount(u.currentSeats ?? 1);
      } else if (usageRes.status === "rejected") {
        const err = usageRes.reason;
        if (err instanceof ApiError && err.statusCode === 401) {
          setSessionExpired(true);
        } else {
          setError(normalizeError(err).message);
        }
      }

      if (orgRes.status === "fulfilled") {
        setOrganization(orgRes.value.data.organization ?? null);
      } else if (orgRes.status === "rejected") {
        const err = orgRes.reason;
        if (err instanceof ApiError && err.statusCode === 401) {
          setSessionExpired(true);
        } else {
          setError(normalizeError(err).message);
        }
      }

      if (pendingRes.status === "fulfilled") {
        setPendingChange(pendingRes.value.data.pendingChange ?? null);
      } else if (pendingRes.status === "rejected") {
        const err = pendingRes.reason;
        if (!(err instanceof ApiError && err.statusCode === 401)) {
          // Non-auth errors are non-critical; just clear pending state
          setPendingChange(null);
        }
      }
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      setError(normalized.message);
      logError(err, "SubscriptionManagement.fetchData");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleOpenPortal = useCallback(async () => {
    try {
      const result = await createPortalSession({
        returnUrl: window.location.href,
      });
      window.location.href = result.data.url;
    } catch (err: unknown) {
      showAlert("error", normalizeError(err).message);
    }
  }, [showAlert]);

  const handleUpdateSeats = useCallback(async () => {
    if (!usage) return;
    try {
      setUpdatingSeats(true);
      await updateSeats({ seatCount });
      showAlert("success", t("subscription.seats.updateSuccess", { count: seatCount }));
      await fetchData();
    } catch (err: unknown) {
      showAlert("error", normalizeError(err).message);
    } finally {
      setUpdatingSeats(false);
    }
  }, [seatCount, usage, showAlert, fetchData, t]);

  const handleCancelSubscription = useCallback(async () => {
    try {
      setCancelling(true);
      await cancelSubscription({ cancelImmediately: false });
      setCancelDialogOpen(false);
      showAlert("success", t("subscription.cancelSuccess"));
      await fetchData();
    } catch (err: unknown) {
      showAlert("error", normalizeError(err).message);
    } finally {
      setCancelling(false);
    }
  }, [showAlert, fetchData, t]);

  // ─── Plan Upgrade / Change ───────────────────────────────────────────────

  const handleChangePlan = useCallback(
    async (planName: string) => {
      const hasActiveSub = Boolean(organization?.subscription?.plan);

      if (hasActiveSub) {
        // Use the change-plan endpoint for existing subscribers
        try {
          const result = await changePlan({
            plan: planName,
            seatCount: usage?.currentSeats,
          });

          const displayName =
            plans.find(
              (p) =>
                p.name === result.data.newPlan ||
                p.name.toLowerCase() === result.data.newPlan.toLowerCase(),
            )?.displayName ?? result.data.newPlan;

          if (result.data.type === "upgrade") {
            showAlert(
              "success",
              t("subscription.changePlan.upgradeSuccess", { plan: displayName }),
            );
          } else {
            showAlert(
              "info",
              t("subscription.changePlan.downgradeScheduled", {
                plan: displayName,
                date: result.data.effectiveDate,
              }),
            );
          }

          await fetchData();
        } catch (err: unknown) {
          if (err instanceof ApiError && err.statusCode === 400) {
            showAlert("warning", t("subscription.changePlan.samePlanError"));
          } else {
            showAlert("error", normalizeError(err).message);
          }
        }
      } else {
        // No active subscription — create checkout session
        try {
          const successUrl = `${window.location.origin}/app/subscription`;
          const cancelUrl = successUrl;
          const result = await createCheckoutSession({
            plan: planName,
            seatCount: usage?.currentSeats ?? 1,
            successUrl,
            cancelUrl,
          });
          window.location.href = result.data.checkoutUrl;
        } catch (err: unknown) {
          showAlert("error", normalizeError(err).message);
        }
      }
    },
    [organization?.subscription?.plan, usage?.currentSeats, plans, showAlert, fetchData, t],
  );

  // ─── Cancel Pending Change ──────────────────────────────────────────────

  const handleCancelPendingChange = useCallback(async () => {
    try {
      setCancellingPendingChange(true);
      await cancelPendingChange();
      setPendingChange(null);
      showAlert("success", t("subscription.pendingChange.cancelSuccess"));
      await fetchData();
    } catch (err: unknown) {
      showAlert("error", normalizeError(err).message);
    } finally {
      setCancellingPendingChange(false);
    }
  }, [showAlert, fetchData, t]);

  // ─── Plan Cost Preview ─────────────────────────────────────────────────────

  const handleCalculateCost = useCallback(
    async (plan: string, seatCount: number): Promise<PlanCostResult> => {
      const res = await calculatePlanCost(plan, seatCount);
      return res.data;
    },
    [],
  );

  // ─── Export ────────────────────────────────────────────────────────────────

  const handleExportXLSX = useCallback(async () => {
    setExporting(true);
    try {
      const { rows: allRows, summary } = await fetchAllPages<
        ExportBillingHistoryData,
        ExportBillingHistoryRow,
        ExportBillingHistoryParams,
        ExportBillingHistorySummary
      >(
        getExportBillingHistory,
        {},
        (d) => d.rows,
        (d) => d.summary,
      );

      if (allRows.length === 0) {
        showAlert("warning", t("subscription.export.noHistory"));
        return;
      }

      const headers = [
        t("subscription.export.col.eventType"),
        t("subscription.export.col.amount"),
        t("subscription.export.col.currency"),
        t("subscription.export.col.previousPlan"),
        t("subscription.export.col.newPlan"),
        t("subscription.export.col.seatChange"),
        t("subscription.export.col.processed"),
        t("subscription.export.col.date"),
      ];

      const rows = allRows.map((r) => ({
        [headers[0]]: formatEventType(r.eventType),
        [headers[1]]: r.amount != null ? r.amount / 100 : "",
        [headers[2]]: r.currency.toUpperCase(),
        [headers[3]]: r.previousPlan ?? "",
        [headers[4]]: r.newPlan ?? "",
        [headers[5]]: r.seatChange ?? "",
        [headers[6]]: r.processed
          ? t("subscription.export.processedYes")
          : t("subscription.export.processedNo"),
        [headers[7]]: r.createdAt,
      }));

      const fmtCur = (cents: number, cur: string) =>
        formatCurrency(cents, cur, locale);

      const summaryEntries = summary
        ? buildBillingSummaryEntries(summary, t, fmtCur, language as "en" | "es")
        : undefined;

      const date = new Date().toISOString().slice(0, 10);
      exportTableToXLSX({ headers, rows }, `billing_history_${date}.xlsx`, summaryEntries);

      showAlert("success", t("subscription.export.success", { count: allRows.length, filename: `billing_history_${date}.xlsx` }));
    } catch (err: unknown) {
      showAlert("error", normalizeError(err).message);
    } finally {
      setExporting(false);
    }
  }, [showAlert, t, locale, language]);

  // ─── Derived stats ─────────────────────────────────────────────────────────

  const totalSpend = history
    .filter((e) => e.eventType === "payment_succeeded" && (e.amount ?? 0) > 0)
    .reduce((sum, e) => sum + (e.amount ?? 0), 0);

  const currency = history[0]?.currency ?? "usd";

  const currentPlan = organization?.subscription?.plan ?? history.find((e) => e.newPlan)?.newPlan;

  const currentPlanDetails = currentPlan
    ? plans.find((p) => p.name === currentPlan || p.name === currentPlan.toLowerCase())
    : null;

  // ─── Render ────────────────────────────────────────────────────────────────

  if (error && !sessionExpired && !loading) {
    return <ErrorDisplay error={error} onRetry={fetchData} fullScreen />;
  }

  const isOwner = hasPermission("billing:manage");

  if (!hasPermission("subscription:manage")) return <Unauthorized />;

  return (
    <div className="page-container">
      {/* Alerts */}
      <AlertContainer alerts={alerts} onDismiss={dismissAlert} position="top-right" />

      {/* Session expired banner (non-blocking) */}
      {sessionExpired && (
        <div className="mb-4 bg-red-900/30 border border-red-700 text-red-300 rounded-xl px-4 py-3">
          {t("subscription.sessionExpired")}
          <button
            onClick={() => (window.location.href = "/login")}
            className="ml-3 inline-flex items-center px-3 py-1 rounded-lg bg-red-700/50 hover:bg-red-700 text-white text-xs"
          >
            {t("subscription.loginAgain")}
          </button>
        </div>
      )}

      {/* Cancel confirm dialog */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        title={t("subscription.cancelDialog.title")}
        message={t("subscription.cancelDialog.message")}
        confirmText={
          cancelling
            ? t("subscription.cancelDialog.confirming")
            : t("subscription.cancelDialog.confirm")
        }
        cancelText={t("subscription.cancelDialog.cancel")}
        variant="danger"
        onConfirm={() => void handleCancelSubscription()}
        onClose={() => setCancelDialogOpen(false)}
        isLoading={cancelling}
      />

      <div data-help-id="subscription-title">
        <PageHeader
          title={t("subscription.title")}
          subtitle={t("subscription.subtitle")}
          actions={
            <button
              onClick={() => void handleExportXLSX()}
              className="export-btn w-full sm:w-auto flex items-center justify-center gap-2"
              disabled={history.length === 0 || exporting}
            >
              <Download size={18} />
              {t("subscription.exportHistory")}
            </button>
          }
        />
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="card h-[96px] animate-pulse">
                <div className="h-4 bg-[#1a1a1a] rounded w-1/2 mb-3" />
                <div className="h-7 bg-[#1a1a1a] rounded w-1/3" />
              </div>
            ))}
          </div>
          <div className="card space-y-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-12 bg-[#1a1a1a] rounded animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div
            data-help-id="subscription-stats"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
          >
            <StatCard
              label={t("subscription.stats.currentPlan")}
              value={currentPlanDetails?.displayName ?? currentPlan ?? "—"}
              icon={<CreditCard size={20} />}
            />
            <StatCard
              label={t("subscription.stats.seats")}
              value={
                usage ? `${usage.currentSeats} / ${usage.maxSeats < 0 ? "∞" : usage.maxSeats}` : "—"
              }
              icon={<Users size={20} />}
            />
            <StatCard
              label={t("subscription.stats.totalPaid")}
              value={totalSpend > 0 ? formatCurrency(totalSpend, currency, locale) : "$0.00"}
              icon={<CreditCard size={20} />}
            />
          </div>

          {/* Actions — owner only */}
          {isOwner && (
            <div
              data-help-id="subscription-actions"
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
            >
              {/* Manage via Stripe Portal */}
              <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-2">
                  {t("subscription.billing.title")}
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                  {t("subscription.billing.description")}
                </p>
                <button
                  onClick={() => void handleOpenPortal()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-semibold gold-action-btn"
                >
                  <ExternalLink size={16} />
                  {t("subscription.billing.openPortal")}
                </button>
              </div>

              {/* Seat Management */}
              <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-2">
                  {t("subscription.seats.title")}
                </h2>
                <p className="text-gray-400 text-sm mb-4">{t("subscription.seats.description")}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={usage?.maxSeats && usage.maxSeats > 0 ? usage.maxSeats : undefined}
                    value={seatCount}
                    onChange={(e) => setSeatCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full sm:w-24 bg-[#1a1a1a] border border-[#444] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#FFD700]"
                  />
                  <button
                    onClick={() => void handleUpdateSeats()}
                    disabled={updatingSeats || seatCount === (usage?.currentSeats ?? 0)}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg transition-colors text-sm font-semibold gold-action-btn disabled:opacity-40"
                  >
                    {updatingSeats
                      ? t("subscription.seats.updating")
                      : t("subscription.seats.updateButton")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Available Plans — owner only */}
          {isOwner && (
            <div
              data-help-id="subscription-plans"
              className="bg-[#121212] border border-[#333] rounded-xl p-6 mb-8"
            >
              <h2 className="text-lg font-bold text-white mb-4">{t("subscription.plans.title")}</h2>
              <AvailablePlansGrid
                plans={plans}
                currentPlan={currentPlan}
                isEs={isEs}
                locale={locale}
                onChangePlan={(p) => void handleChangePlan(p)}
                currentSeats={usage?.currentSeats}
                onCalculateCost={handleCalculateCost}
                hasActiveSubscription={Boolean(organization?.subscription?.plan)}
                pendingPlan={pendingChange?.pendingPlan}
              />
            </div>
          )}

          {/* Pending Plan Change — owner only */}
          {isOwner && pendingChange && (
            <div
              data-help-id="subscription-pending-change"
              className="bg-[#121212] border border-amber-700/50 rounded-xl p-6 mb-8"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-amber-400 mb-1">
                    {t("subscription.pendingChange.title")}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {t("subscription.pendingChange.description", {
                      plan:
                        plans.find(
                          (p) =>
                            p.name === pendingChange.pendingPlan ||
                            p.name.toLowerCase() === pendingChange.pendingPlan.toLowerCase(),
                        )?.displayName ?? pendingChange.pendingPlan,
                      date: pendingChange.effectiveDate,
                    })}
                  </p>
                </div>
                <button
                  onClick={() => void handleCancelPendingChange()}
                  disabled={cancellingPendingChange}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium shrink-0 danger-action-btn disabled:opacity-40"
                >
                  <XCircle size={16} />
                  {cancellingPendingChange
                    ? t("subscription.pendingChange.cancelling")
                    : t("subscription.pendingChange.cancelButton")}
                </button>
              </div>
            </div>
          )}

          {/* Cancel Subscription — owner only */}
          {isOwner && (
            <div
              data-help-id="subscription-danger"
              className="bg-[#121212] border border-red-900/40 rounded-xl p-6 mb-8"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">
                    {t("subscription.danger.title")}
                  </h2>
                  <p className="text-gray-400 text-sm">{t("subscription.danger.description")}</p>
                </div>
                <button
                  onClick={() => setCancelDialogOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium shrink-0 danger-action-btn"
                >
                  <XCircle size={16} />
                  {t("subscription.danger.cancelButton")}
                </button>
              </div>
            </div>
          )}

          {/* Billing History */}
          <div data-help-id="subscription-history">
            <BillingHistorySection history={history} isEs={isEs} locale={locale} />
          </div>
        </>
      )}
    </div>
  );
}
