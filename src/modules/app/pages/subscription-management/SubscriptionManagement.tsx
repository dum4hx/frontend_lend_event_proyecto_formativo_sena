import { useState, useEffect, useCallback, useRef } from "react";
import {
  CreditCard,
  Users,
  XCircle,
  ExternalLink,
  Download,
} from "lucide-react";
import { StatCard } from "../../components";
import {
  getBillingHistory,
  createPortalSession,
  cancelSubscription,
  updateSeats,
  createCheckoutSession,
} from "../../../../services/billingService";
import {
  getOrganizationUsage,
  getAvailablePlans,
  getOrganization,
} from "../../../../services/organizationService";
import {
  getSubscriptionTypesPublic,
  getSubscriptionTypes,
} from "../../../../services/subscriptionTypeService";
import {
  ErrorDisplay,
  AlertContainer,
  ConfirmDialog,
} from "../../../../components/ui";
import { normalizeError, logError } from "../../../../utils/errorHandling";
import { ApiError } from "../../../../lib/api";
import { useAlerts } from "../../../../hooks/useAlerts";
import { useAuth } from "../../../../contexts/useAuth";
import { useLanguage } from "../../../../contexts/useLanguage";
import { ExportSettingsModal } from "../../../../components/export/ExportSettingsModal";
import { exportService, BILLING_HISTORY_POLICY } from "../../../../services/export";
import { formatEventType, formatCurrency } from "./helpers";
import BillingHistorySection from "./BillingHistorySection";
import AvailablePlansGrid from "./AvailablePlansGrid";
import type { ExportConfig, ExportProgress } from "../../../../types/export";
import type {
  BillingHistoryEntry,
  AvailablePlan,
  Organization,
  PublicPlan,
  SubscriptionType,
} from "../../../../types/api";

export default function SubscriptionManagement() {
  const { language, locale } = useLanguage();
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
      showAlert(
        "success",
        isEs
          ? `Cantidad de asientos actualizada a ${seatCount}.`
          : `Seat count updated to ${seatCount}.`,
      );
      await fetchData();
    } catch (err: unknown) {
      showAlert("error", normalizeError(err).message);
    } finally {
      setUpdatingSeats(false);
    }
  }, [seatCount, usage, showAlert, fetchData, isEs]);

  const handleCancelSubscription = useCallback(async () => {
    try {
      setCancelling(true);
      await cancelSubscription({ cancelImmediately: false });
      setCancelDialogOpen(false);
      showAlert(
        "success",
        isEs
          ? "La suscripcion se cancelara al final del periodo de facturacion actual."
          : "Subscription will be cancelled at the end of the current billing period.",
      );
      await fetchData();
    } catch (err: unknown) {
      showAlert("error", normalizeError(err).message);
    } finally {
      setCancelling(false);
    }
  }, [showAlert, fetchData, isEs]);

  // ─── Plan Upgrade / Change ───────────────────────────────────────────────

  const handleChangePlan = useCallback(
    async (planName: string) => {
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
        processed: e.processed ? (isEs ? "Si" : "Yes") : isEs ? "No" : "No",
        createdAt: e.createdAt,
      })),
    [isEs],
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
          showAlert(
            "warning",
            isEs
              ? "No hay historial de facturacion para exportar."
              : "No billing history to export.",
          );
          return;
        }

        const result = await exportService.export(
          rawData,
          config,
          user?._id ?? "anonymous",
          (p) => setExportProgress(p),
          abort.signal,
        );

        if (result.status === "success") {
          showAlert(
            "success",
            isEs
              ? `Se exportaron ${result.metadata.recordCount} registros como ${result.filename}`
              : `Exported ${result.metadata.recordCount} records as ${result.filename}`,
          );
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
    [buildExportRows, user?._id, showAlert, isEs],
  );

  const handleExportPreview = useCallback(
    async (config: ExportConfig) => {
      const freshRes = await getBillingHistory(500);
      const rawData = buildExportRows(freshRes.data.history ?? []);
      if (rawData.length === 0) return undefined;
      return exportService.preview(rawData, config, user?._id ?? "anonymous");
    },
    [buildExportRows, user?._id],
  );

  const handleCancelExport = useCallback(() => {
    exportAbort.current?.abort();
  }, []);

  // ─── Derived stats ─────────────────────────────────────────────────────────

  const totalSpend = history
    .filter((e) => e.eventType === "payment_succeeded" && (e.amount ?? 0) > 0)
    .reduce((sum, e) => sum + (e.amount ?? 0), 0);

  const currency = history[0]?.currency ?? "usd";

  const currentPlan =
    organization?.subscription?.plan ?? history.find((e) => e.newPlan)?.newPlan;

  // ─── Render ────────────────────────────────────────────────────────────────

  if (error && !sessionExpired && !loading) {
    return <ErrorDisplay error={error} onRetry={fetchData} fullScreen />;
  }

  const isOwner = user?.roleName === "owner";

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Alerts */}
      <AlertContainer alerts={alerts} onDismiss={dismissAlert} position="top-right" />

      {/* Session expired banner (non-blocking) */}
      {sessionExpired && (
        <div className="mb-4 bg-red-900/30 border border-red-700 text-red-300 rounded-xl px-4 py-3">
          {isEs
            ? "Tu sesion parece haber expirado. Algunos datos no pudieron cargarse."
            : "Your session appears to have expired. Some data could not be loaded."}
          <button
            onClick={() => (window.location.href = "/login")}
            className="ml-3 inline-flex items-center px-3 py-1 rounded-lg bg-red-700/50 hover:bg-red-700 text-white text-xs"
          >
            {isEs ? "Iniciar sesion de nuevo" : "Log in again"}
          </button>
        </div>
      )}

      {/* Cancel confirm dialog */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        title={isEs ? "Cancelar suscripcion" : "Cancel Subscription"}
        message={
          isEs
            ? "Tu suscripcion seguira activa hasta el final del periodo de facturacion actual. Luego, se revocara el acceso a funciones premium. Seguro que deseas cancelar?"
            : "Your subscription will remain active until the end of the current billing period. After that, access to premium features will be revoked. Are you sure you want to cancel?"
        }
        confirmText={
          cancelling
            ? isEs
              ? "Cancelando..."
              : "Cancelling..."
            : isEs
              ? "Si, cancelar"
              : "Yes, Cancel"
        }
        cancelText={isEs ? "Mantener suscripcion" : "Keep Subscription"}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {isEs ? "Gestion de suscripcion" : "Subscription Management"}
          </h1>
          <p className="text-gray-400 mt-1">
            {isEs
              ? "Gestiona tu plan, asientos e historial de facturacion"
              : "Manage your plan, seats, and billing history"}
          </p>
        </div>
        <button
          onClick={() => setExportOpen(true)}
          className="export-btn w-full sm:w-auto flex items-center justify-center gap-2"
          disabled={history.length === 0}
        >
          <Download size={18} />
          {isEs ? "Exportar historial" : "Export History"}
        </button>
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
              <div
                key={idx}
                className="h-12 bg-[#1a1a1a] rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard
              label={isEs ? "Plan actual" : "Current Plan"}
              value={
                currentPlan
                  ? currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)
                  : "—"
              }
              icon={<CreditCard size={20} />}
            />
            <StatCard
              label={isEs ? "Asientos" : "Seats"}
              value={
                usage
                  ? `${usage.currentSeats} / ${usage.maxSeats < 0 ? "∞" : usage.maxSeats}`
                  : "—"
              }
              icon={<Users size={20} />}
            />
            <StatCard
              label={isEs ? "Total pagado" : "Total Paid"}
              value={
                totalSpend > 0
                  ? formatCurrency(totalSpend, currency, locale)
                  : "$0.00"
              }
              icon={<CreditCard size={20} />}
            />
          </div>

          {/* Actions — owner only */}
          {isOwner && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Manage via Stripe Portal */}
              <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-2">
                  {isEs ? "Portal de facturacion" : "Billing Portal"}
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                  {isEs
                    ? "Actualiza tu metodo de pago, descarga facturas y gestiona el cobro desde Stripe."
                    : "Update your payment method, download invoices, and manage billing details through Stripe."}
                </p>
                <button
                  onClick={() => void handleOpenPortal()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-semibold gold-action-btn"
                >
                  <ExternalLink size={16} />
                  {isEs ? "Abrir portal de facturacion" : "Open Billing Portal"}
                </button>
              </div>

              {/* Seat Management */}
              <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-2">
                  {isEs ? "Gestion de asientos" : "Seat Management"}
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                  {isEs
                    ? "Ajusta el numero de asientos de tu plan actual."
                    : "Adjust the number of seats on your current plan."}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={
                      usage?.maxSeats && usage.maxSeats > 0
                        ? usage.maxSeats
                        : undefined
                    }
                    value={seatCount}
                    onChange={(e) =>
                      setSeatCount(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-full sm:w-24 bg-[#1a1a1a] border border-[#444] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#FFD700]"
                  />
                  <button
                    onClick={() => void handleUpdateSeats()}
                    disabled={
                      updatingSeats ||
                      seatCount === (usage?.currentSeats ?? 0)
                    }
                    className="w-full sm:w-auto px-4 py-2 rounded-lg transition-colors text-sm font-semibold gold-action-btn disabled:opacity-40"
                  >
                    {updatingSeats
                      ? isEs
                        ? "Actualizando..."
                        : "Updating..."
                      : isEs
                        ? "Actualizar asientos"
                        : "Update Seats"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Available Plans — owner only */}
          {isOwner && (
            <div className="bg-[#121212] border border-[#333] rounded-xl p-6 mb-8">
              <h2 className="text-lg font-bold text-white mb-4">
                {isEs ? "Planes disponibles" : "Available Plans"}
              </h2>
              <AvailablePlansGrid
                plans={plans}
                currentPlan={currentPlan}
                isEs={isEs}
                locale={locale}
                onChangePlan={(p) => void handleChangePlan(p)}
              />
            </div>
          )}

          {/* Cancel Subscription — owner only */}
          {isOwner && (
            <div className="bg-[#121212] border border-red-900/40 rounded-xl p-6 mb-8">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">
                    {isEs ? "Zona de riesgo" : "Danger Zone"}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {isEs
                      ? "Cancelar tu suscripcion revocara el acceso a funciones premium al final del periodo de facturacion."
                      : "Cancelling your subscription will revoke access to premium features at the end of your billing period."}
                  </p>
                </div>
                <button
                  onClick={() => setCancelDialogOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium shrink-0 danger-action-btn"
                >
                  <XCircle size={16} />
                  {isEs ? "Cancelar suscripcion" : "Cancel Subscription"}
                </button>
              </div>
            </div>
          )}

          {/* Billing History */}
          <BillingHistorySection
            history={history}
            isEs={isEs}
            locale={locale}
          />
        </>
      )}
    </div>
  );
}
