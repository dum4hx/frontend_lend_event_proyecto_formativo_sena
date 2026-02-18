import { useState, useEffect, useCallback, useRef } from "react";
import {
  CreditCard,
  Users,
  XCircle,
  ExternalLink,
  Download,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { StatCard } from "../components";
import {
  getBillingHistory,
  createPortalSession,
  cancelSubscription,
  updateSeats,
  createCheckoutSession,
} from "../../../services/billingService";
import { getOrganizationUsage, getAvailablePlans, getOrganization } from "../../../services/organizationService";
import { getSubscriptionTypesPublic, getSubscriptionTypes } from "../../../services/subscriptionTypeService";
import { LoadingSpinner, ErrorDisplay, AlertContainer, ConfirmDialog } from "../../../components/ui";
import { normalizeError, logError } from "../../../utils/errorHandling";
import { ApiError } from "../../../lib/api";
import { useAlerts } from "../../../hooks/useAlerts";
import { useAuth } from "../../../contexts/useAuth";
import { ExportSettingsModal } from "../../../components/export/ExportSettingsModal";
import { exportService, BILLING_HISTORY_POLICY } from "../../../services/export";
import type { ExportConfig, ExportProgress } from "../../../types/export";
import type { BillingHistoryEntry, AvailablePlan, Organization } from "../../../types/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EVENT_TYPE_BADGE: Record<string, string> = {
  payment_succeeded: "bg-green-900/50 text-green-400 border border-green-700",
  subscription_created: "bg-blue-900/50 text-blue-400 border border-blue-700",
  subscription_updated: "bg-yellow-900/50 text-yellow-400 border border-yellow-700",
  subscription_cancelled: "bg-red-900/50 text-red-400 border border-red-700",
};

const EVENT_TYPE_ICON: Record<string, React.ReactNode> = {
  payment_succeeded: <CheckCircle size={14} />,
  subscription_created: <CreditCard size={14} />,
  subscription_updated: <RefreshCw size={14} />,
  subscription_cancelled: <XCircle size={14} />,
};

function formatEventType(eventType: string): string {
  return eventType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SubscriptionManagement() {
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

  // Export
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | undefined>();
  const exportAbort = useRef<AbortController | null>(null);

  const { user } = useAuth();
  const { alerts, showAlert, dismissAlert } = useAlerts();

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
        const pubPlans = typesRes.data.subscriptionTypes ?? [];
        if (pubPlans.length > 0) {
          setPlans(pubPlans as unknown as AvailablePlan[]);
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
      ]);

      const [histRes, usageRes, orgRes] = results;

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
      showAlert("success", `Seat count updated to ${seatCount}.`);
      await fetchData();
    } catch (err: unknown) {
      showAlert("error", normalizeError(err).message);
    } finally {
      setUpdatingSeats(false);
    }
  }, [seatCount, usage, showAlert, fetchData]);

  const handleCancelSubscription = useCallback(async () => {
    try {
      setCancelling(true);
      await cancelSubscription({ cancelImmediately: false });
      setCancelDialogOpen(false);
      showAlert("success", "Subscription will be cancelled at the end of the current billing period.");
      await fetchData();
    } catch (err: unknown) {
      showAlert("error", normalizeError(err).message);
    } finally {
      setCancelling(false);
    }
  }, [showAlert, fetchData]);

  // ─── Plan Upgrade / Change ───────────────────────────────────────────────

  const handleChangePlan = useCallback(
    async (planName: string) => {
      try {
        const successUrl = `${window.location.origin}/admin/subscription`;
        const cancelUrl = successUrl;
        const result = await createCheckoutSession({
          plan: planName,
          seatCount: usage?.currentSeats ?? 1,
          successUrl,
          cancelUrl,
        });
        // Redirect to Stripe Checkout
        window.location.href = result.data.checkoutUrl;
      } catch (err: unknown) {
        showAlert("error", normalizeError(err).message);
      }
    },
    [usage?.currentSeats, showAlert],
  );

  // ─── Export ────────────────────────────────────────────────────────────────

  const buildExportRows = useCallback(
    (entries: BillingHistoryEntry[]): Record<string, unknown>[] =>
      entries.map((e) => ({
        id: e._id,
        eventType: formatEventType(e.eventType),
        newPlan: e.newPlan ?? "",
        seatChange: e.seatChange ?? "",
        amount: e.amount != null ? e.amount / 100 : "",
        currency: e.currency.toUpperCase(),
        processed: e.processed ? "Yes" : "No",
        createdAt: e.createdAt,
      })),
    [],
  );

  const handleExport = useCallback(
    async (config: ExportConfig) => {
      const abort = new AbortController();
      exportAbort.current = abort;
      setExporting(true);
      setExportProgress(undefined);

      try {
        const freshRes = await getBillingHistory(500);
        const rawData = buildExportRows(freshRes.data.history ?? []);

        if (rawData.length === 0) {
          showAlert("warning", "No billing history to export.");
          return;
        }

        const result = await exportService.export(
          rawData,
          config,
          user?.id ?? "anonymous",
          (p) => setExportProgress(p),
          abort.signal,
        );

        if (result.status === "success") {
          showAlert("success", `Exported ${result.metadata.recordCount} records as ${result.filename}`);
          setExportOpen(false);
        } else if (result.status === "cancelled") {
          showAlert("info", result.reason);
        } else {
          showAlert("error", result.error);
        }
      } catch (err: unknown) {
        showAlert("error", normalizeError(err).message);
      } finally {
        setExporting(false);
        setExportProgress(undefined);
        exportAbort.current = null;
      }
    },
    [buildExportRows, user?.id, showAlert],
  );

  const handleExportPreview = useCallback(
    async (config: ExportConfig) => {
      const freshRes = await getBillingHistory(500);
      const rawData = buildExportRows(freshRes.data.history ?? []);
      if (rawData.length === 0) return undefined;
      return exportService.preview(rawData, config, user?.id ?? "anonymous");
    },
    [buildExportRows, user?.id],
  );

  const handleCancelExport = useCallback(() => {
    exportAbort.current?.abort();
  }, []);

  // ─── Derived stats ─────────────────────────────────────────────────────────

  const totalSpend = history
    .filter((e) => e.eventType === "payment_succeeded" && (e.amount ?? 0) > 0)
    .reduce((sum, e) => sum + (e.amount ?? 0), 0);

  const currency = history[0]?.currency ?? "usd";

  const currentPlan = organization?.subscription?.plan ?? history.find((e) => e.newPlan)?.newPlan;

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading subscription data…" />;
  }

  // For non-auth fatal errors, show the full-screen error. For 401, we keep the view.
  if (error && !sessionExpired) {
    return <ErrorDisplay error={error} onRetry={fetchData} fullScreen />;
  }

  const isOwner = user?.role === "owner";

  return (
    <div>
      {/* Alerts */}
      <AlertContainer alerts={alerts} onDismiss={dismissAlert} position="top-right" />

      {/* Session expired banner (non-blocking) */}
      {sessionExpired && (
        <div className="mb-4 bg-red-900/30 border border-red-700 text-red-300 rounded-xl px-4 py-3">
          Your session appears to have expired. Some data could not be loaded.
          <button
            onClick={() => (window.location.href = "/login")}
            className="ml-3 inline-flex items-center px-3 py-1 rounded-lg bg-red-700/50 hover:bg-red-700 text-white text-xs"
          >
            Log in again
          </button>
        </div>
      )}

      {/* Cancel confirm dialog */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        title="Cancel Subscription"
        message="Your subscription will remain active until the end of the current billing period. After that, access to premium features will be revoked. Are you sure you want to cancel?"
        confirmText={cancelling ? "Cancelling…" : "Yes, Cancel"}
        cancelText="Keep Subscription"
        variant="danger"
        onConfirm={() => void handleCancelSubscription()}
        onClose={() => setCancelDialogOpen(false)}
        isLoading={cancelling}
      />

      {/* Export Modal */}
      <ExportSettingsModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={(config) => void handleExport(config)}
        onPreview={handleExportPreview}
        module="billing-history"
        policy={BILLING_HISTORY_POLICY}
        allowedFormats={["xlsx"]}
        exporting={exporting}
        progress={exportProgress}
        onCancel={handleCancelExport}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Subscription Management</h1>
          <p className="text-gray-400 mt-1">
            Manage your plan, seats, and billing history
          </p>
        </div>
        <button
          onClick={() => setExportOpen(true)}
          className="export-btn flex items-center gap-2"
          disabled={history.length === 0}
        >
          <Download size={18} />
          Export History
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Current Plan"
          value={currentPlan ? currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1) : "—"}
          icon={<CreditCard size={20} />}
        />
        <StatCard
          label="Seats"
          value={usage ? `${usage.currentSeats} / ${usage.maxSeats < 0 ? "∞" : usage.maxSeats}` : "—"}
          icon={<Users size={20} />}
        />
        <StatCard
          label="Total Paid"
          value={totalSpend > 0 ? formatCurrency(totalSpend, currency) : "$0.00"}
          icon={<CreditCard size={20} />}
        />
      </div>

      {/* Actions — owner only */}
      {isOwner && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Manage via Stripe Portal */}
          <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">Billing Portal</h2>
            <p className="text-gray-400 text-sm mb-4">
              Update your payment method, download invoices, and manage billing details through Stripe.
            </p>
            <button
              onClick={() => void handleOpenPortal()}
              className="flex items-center gap-2 bg-[#FFD700] hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <ExternalLink size={16} />
              Open Billing Portal
            </button>
          </div>

          {/* Seat Management */}
          <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">Seat Management</h2>
            <p className="text-gray-400 text-sm mb-4">
              Adjust the number of seats on your current plan.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={usage?.maxSeats && usage.maxSeats > 0 ? usage.maxSeats : undefined}
                value={seatCount}
                onChange={(e) => setSeatCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 bg-[#1a1a1a] border border-[#444] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#FFD700]"
              />
              <button
                onClick={() => void handleUpdateSeats()}
                disabled={updatingSeats || seatCount === (usage?.currentSeats ?? 0)}
                className="bg-[#FFD700] hover:bg-yellow-400 disabled:opacity-40 text-black font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              >
                {updatingSeats ? "Updating…" : "Update Seats"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Available Plans — owner only */}
      {isOwner && (
        <div className="bg-[#121212] border border-[#333] rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Available Plans</h2>
          {plans.length === 0 ? (
            <div className="text-gray-400 text-sm">No available plans found. Please contact support or try again later.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((p) => {
                const planKey = (p as any).name ?? (p as any).plan ?? p.displayName;
                const targetPlanName = (p as any).name ?? (p as any).plan ?? p.displayName;
                const isActive = currentPlan && (targetPlanName === currentPlan || p.displayName.toLowerCase() === currentPlan?.toLowerCase());
                return (
                  <div key={planKey} className={`rounded-xl border ${isActive ? "border-yellow-500" : "border-[#333]"} bg-[#0f0f0f] p-5 flex flex-col`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-white font-semibold text-lg">{p.displayName}</div>
                        <div className="text-xs text-gray-500 capitalize">{p.billingModel === "fixed" ? "Fixed monthly" : "Per-seat"}</div>
                      </div>
                      {isActive && (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-700/30 text-yellow-400 border border-yellow-700">Active</span>
                      )}
                    </div>
                    <div className="text-white text-2xl font-bold mb-2">${p.basePriceMonthly.toLocaleString()}</div>
                    {p.pricePerSeat > 0 && (
                      <div className="text-gray-400 text-sm mb-2">+ ${p.pricePerSeat.toLocaleString()} per seat</div>
                    )}
                    <div className="text-gray-400 text-sm mb-3">
                      Limits: {p.maxSeats < 0 ? "Unlimited" : `${p.maxSeats} seats`} · {p.maxCatalogItems < 0 ? "Unlimited" : `${p.maxCatalogItems} items`}
                    </div>
                    <ul className="text-gray-300 text-sm space-y-1 mb-4">
                      {p.features.slice(0, 6).map((f, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle size={14} className="text-yellow-400" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => void handleChangePlan(targetPlanName)}
                      disabled={Boolean(isActive)}
                      className={`mt-auto px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        isActive ? "border border-[#333] text-gray-500 cursor-not-allowed" : "bg-[#FFD700] hover:bg-yellow-400 text-black"
                      }`}
                    >
                      {isActive ? "Current Plan" : (currentPlan ? (p.basePriceMonthly > 0 ? "Upgrade / Change" : "Change Plan") : "Choose Plan")}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-3">Plan changes use the existing payment gateway and require valid authentication.</p>
        </div>
      )}

      {/* Cancel Subscription — owner only */}
      {isOwner && (
        <div className="bg-[#121212] border border-red-900/40 rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Danger Zone</h2>
              <p className="text-gray-400 text-sm">
                Cancelling your subscription will revoke access to premium features at the end of your billing period.
              </p>
            </div>
            <button
              onClick={() => setCancelDialogOpen(true)}
              className="flex items-center gap-2 border border-red-600 text-red-400 hover:bg-red-900/30 px-4 py-2 rounded-lg transition-colors text-sm font-medium shrink-0"
            >
              <XCircle size={16} />
              Cancel Subscription
            </button>
          </div>
        </div>
      )}

      {/* Billing History */}
      <div className="bg-[#121212] border border-[#333] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#333] flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Billing History</h2>
          <span className="text-xs text-gray-500">{history.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[#333]">
                <th className="px-6 py-3 text-gray-400 font-medium">Date</th>
                <th className="px-6 py-3 text-gray-400 font-medium">Event</th>
                <th className="px-6 py-3 text-gray-400 font-medium">Plan / Seats</th>
                <th className="px-6 py-3 text-gray-400 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    No billing history available.
                  </td>
                </tr>
              ) : (
                history.map((entry) => (
                  <tr
                    key={entry._id}
                    className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors"
                  >
                    <td className="px-6 py-3 text-gray-400 whitespace-nowrap">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          EVENT_TYPE_BADGE[entry.eventType] ?? "bg-gray-800 text-gray-400 border border-gray-600"
                        }`}
                      >
                        {EVENT_TYPE_ICON[entry.eventType] ?? <CreditCard size={14} />}
                        {formatEventType(entry.eventType)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-300">
                      {entry.newPlan ? (
                        <span className="capitalize">{entry.newPlan}</span>
                      ) : null}
                      {entry.newPlan && entry.seatChange != null ? " · " : null}
                      {entry.seatChange != null ? (
                        <span className="text-gray-400">{entry.seatChange} seat{entry.seatChange !== 1 ? "s" : ""}</span>
                      ) : null}
                      {!entry.newPlan && entry.seatChange == null ? (
                        <span className="text-gray-600">—</span>
                      ) : null}
                    </td>
                    <td className="px-6 py-3 text-white font-medium text-right whitespace-nowrap">
                      {entry.amount != null && entry.amount > 0
                        ? formatCurrency(entry.amount, entry.currency)
                        : <span className="text-gray-500">—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
