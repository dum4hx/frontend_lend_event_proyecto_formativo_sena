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
} from "../../../services/billingService";
import { getOrganizationUsage } from "../../../services/organizationService";
import { LoadingSpinner, ErrorDisplay, AlertContainer, ConfirmDialog } from "../../../components/ui";
import { normalizeError, logError } from "../../../utils/errorHandling";
import { useAlerts } from "../../../hooks/useAlerts";
import { useAuth } from "../../../contexts/useAuth";
import { ExportSettingsModal } from "../../../components/export/ExportSettingsModal";
import { exportService, BILLING_HISTORY_POLICY } from "../../../services/export";
import type { ExportConfig, ExportProgress } from "../../../types/export";
import type { BillingHistoryEntry } from "../../../types/api";

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
  const [usage, setUsage] = useState<{
    currentSeats: number;
    maxSeats: number;
    canAddSeat: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      const [historyRes, usageRes] = await Promise.all([
        getBillingHistory(50),
        getOrganizationUsage(),
      ]);
      setHistory(historyRes.data.history ?? []);
      const u = usageRes.data.usage;
      setUsage({
        currentSeats: u.currentSeats ?? 0,
        maxSeats: u.maxSeats ?? 0,
        canAddSeat: u.canAddSeat,
      });
      setSeatCount(u.currentSeats ?? 1);
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

  const currentPlan = history.find((e) => e.newPlan)?.newPlan;

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading subscription data…" />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchData} fullScreen />;
  }

  const isOwner = user?.role === "owner";

  return (
    <div>
      {/* Alerts */}
      <AlertContainer alerts={alerts} onDismiss={dismissAlert} position="top-right" />

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
