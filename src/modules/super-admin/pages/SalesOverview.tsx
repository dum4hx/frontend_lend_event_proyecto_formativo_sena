import { useEffect, useState, useCallback, useRef } from "react";
import { DollarSign, Users, CreditCard, TrendingDown, Download } from "lucide-react";
import { SuperAdminStatCard } from "../components";
import { fetchSalesOverviewData } from "../../../services/superAdminService";
import { LoadingSpinner, ErrorDisplay, AlertContainer } from "../../../components/ui";
import { normalizeError, logError } from "../../../utils/errorHandling";
import { useAuth } from "../../../contexts/useAuth";
import { useAlerts } from "../../../hooks/useAlerts";
import { ExportSettingsModal } from "../../../components/export/ExportSettingsModal";
import { exportService, SALES_OVERVIEW_POLICY } from "../../../services/export";
import type { ExportConfig, ExportProgress, ExportSheet } from "../../../types/export";
import type {
  AdminDashboardData,
  SubscriptionType,
  RevenueStats,
  MonthlyTrend,
} from "../../../types/api";

type SubscriptionTypeApi = SubscriptionType & { basePriceMonthly?: number };

function normalizePlan(plan: SubscriptionTypeApi): SubscriptionType {
  if (plan.baseCost !== null && plan.baseCost !== undefined) return plan;
  if (plan.basePriceMonthly === null || plan.basePriceMonthly === undefined) return plan;

  return {
    ...plan,
    baseCost: Math.round(plan.basePriceMonthly * 100),
    pricePerSeat:
      plan.pricePerSeat === null || plan.pricePerSeat === undefined
        ? plan.pricePerSeat
        : Math.round(plan.pricePerSeat * 100),
  };
}

function formatCurrency(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "$0";
  const dollars = cents / 100;
  return `$${dollars.toLocaleString("en-US", {
    minimumFractionDigits: dollars < 1 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export default function SalesOverview() {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [plans, setPlans] = useState<SubscriptionType[]>([]);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Export state
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | undefined>();
  const exportAbort = useRef<AbortController | null>(null);
  const { user } = useAuth();
  const { alerts, showAlert, dismissAlert } = useAlerts();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await fetchSalesOverviewData();

      const normalizedPlans = result.plans.map((plan) =>
        normalizePlan(plan as SubscriptionTypeApi),
      );

      setDashboard(result.dashboard);
      setPlans(normalizedPlans);
      setRevenue(result.revenue);
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      setError(normalized.message);
      logError(err, 'SalesOverview.fetchData');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  /** Build flat export rows for the "Data" sheet (per-plan + trend). */
  const buildExportRows = useCallback((): Record<string, unknown>[] => {
    const rows: Record<string, unknown>[] = [];

    // Plan-level rows enriched with subscription counts
    for (const plan of plans) {
      const sub = dashboard?.subscriptionStats.subscriptionsByPlan.find((s) => s.plan === plan.plan);
      rows.push({
        plan: plan.plan,
        displayName: plan.displayName,
        billingModel: plan.billingModel,
        baseCost: plan.baseCost,
        pricePerSeat: plan.pricePerSeat,
        maxSeats: plan.maxSeats,
        maxCatalogItems: plan.maxCatalogItems,
        count: sub?.count ?? 0,
        percentage: sub?.percentage ?? 0,
      });
    }

    // Monthly trend rows
    if (revenue?.monthlyTrend) {
      for (const t of revenue.monthlyTrend) {
        rows.push({
          period: t.period,
          revenue: t.revenue,
        });
      }
    }

    return rows;
  }, [plans, dashboard, revenue]);

  /** Build the "Totals" additional sheet with aggregate metrics. */
  const buildTotalsSheet = useCallback((): ExportSheet => ({
    name: 'Totals',
    columns: [
      { key: 'totalRevenue', label: 'Total Revenue' },
      { key: 'churnRate', label: 'Churn Rate (%)' },
      { key: 'totalActiveSubscriptions', label: 'Active Subscriptions' },
      { key: 'monthlyRecurringRevenue', label: 'MRR' },
    ],
    rows: [{
      totalRevenue: revenue?.totalRevenue ?? 0,
      churnRate: dashboard?.subscriptionStats.churnRate ?? 0,
      totalActiveSubscriptions: dashboard?.subscriptionStats.totalActiveSubscriptions ?? 0,
      monthlyRecurringRevenue: dashboard?.overview.monthlyRecurringRevenue ?? 0,
    }],
  }), [revenue, dashboard]);

  const handleExport = useCallback(async (config: ExportConfig) => {
    const rawData = buildExportRows();

    if (rawData.length === 0) {
      showAlert('warning', 'No data available to export.');
      return;
    }

    // Attach the Totals sheet to the config
    const configWithTotals: ExportConfig = {
      ...config,
      additionalSheets: [buildTotalsSheet()],
    };

    const abort = new AbortController();
    exportAbort.current = abort;
    setExporting(true);
    setExportProgress(undefined);

    const result = await exportService.export(
      rawData,
      configWithTotals,
      user?.id ?? 'anonymous',
      (p) => setExportProgress(p),
      abort.signal,
    );

    setExporting(false);
    setExportProgress(undefined);
    exportAbort.current = null;

    if (result.status === 'success') {
      showAlert('success', `Exported ${result.metadata.recordCount} records as ${result.filename}`);
      setExportOpen(false);
    } else if (result.status === 'cancelled') {
      showAlert('info', result.reason);
    } else {
      showAlert('error', result.error);
    }
  }, [buildExportRows, buildTotalsSheet, user?.id, showAlert]);

  const handleExportPreview = useCallback(async (config: ExportConfig) => {
    const rawData = buildExportRows();
    if (rawData.length === 0) return undefined;
    const configWithTotals: ExportConfig = {
      ...config,
      additionalSheets: [buildTotalsSheet()],
    };
    return exportService.preview(rawData, configWithTotals, user?.id ?? 'anonymous');
  }, [buildExportRows, buildTotalsSheet, user?.id]);

  const handleCancelExport = useCallback(() => {
    exportAbort.current?.abort();
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading analytics…" />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchData} fullScreen />;
  }

  if (!dashboard) return null;

  const { overview, subscriptionStats } = dashboard;

  // Find the most popular plan
  const sortedByCount = [...subscriptionStats.subscriptionsByPlan].sort(
    (a, b) => b.count - a.count,
  );

  // Revenue by plan for the bar chart
  const planDisplayNames: Record<string, string> = {};
  for (const p of plans) {
    planDisplayNames[p.plan] = p.displayName;
  }

  // Calculate max bar height for plan comparison
  const maxPlanRevenue = plans.length ? Math.max(...plans.map((p) => p.baseCost)) : 1;

  return (
    <div>
      {/* Alerts */}
      <AlertContainer alerts={alerts} onDismiss={dismissAlert} position="top-right" />

      {/* Export Modal */}
      <ExportSettingsModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={(config) => void handleExport(config)}
        onPreview={handleExportPreview}
        module="sales-overview"
        policy={SALES_OVERVIEW_POLICY}
        allowedFormats={['xlsx']}
        exporting={exporting}
        progress={exportProgress}
        onCancel={handleCancelExport}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Sales Overview</h1>
          <p className="text-gray-400 mt-1">
            Complete analytics and performance metrics for Lend Event
          </p>
        </div>
        <button
          onClick={() => setExportOpen(true)}
          className="export-btn flex items-center gap-2"
        >
          <Download size={18} />
          Export
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SuperAdminStatCard
          label="Total Revenue"
          value={formatCurrency(overview.monthlyRecurringRevenue * 12)}
          icon={<DollarSign size={20} className="text-black" />}
          trend="Last 7 days"
          trendUp
        />
        <SuperAdminStatCard
          label="Total Corporate Clients"
          value={overview.totalOrganizations.toLocaleString()}
          icon={<Users size={20} className="text-black" />}
          trend="Monthly"
          trendUp
        />
        <SuperAdminStatCard
          label="Active Subscriptions"
          value={subscriptionStats.totalActiveSubscriptions.toLocaleString()}
          icon={<CreditCard size={20} className="text-black" />}
          trend="Monthly"
          trendUp
        />
        <SuperAdminStatCard
          label="Churn Rate"
          value={`${subscriptionStats.churnRate.toFixed(1)}%`}
          icon={<TrendingDown size={20} className="text-black" />}
          trend="Quarterly"
          trendUp={false}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Plan Comparison Bar Chart */}
        <div className="lg:col-span-2 bg-[#121212] border border-[#333] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Plan Comparison</h2>
              <p className="text-xs text-gray-500">Subscription distribution across plans</p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-around h-48 gap-4 mb-4">
            {plans.map((plan) => {
              const height = Math.max(20, (plan.baseCost / maxPlanRevenue) * 100);
              return (
                <div key={plan.plan} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full max-w-[80px] bg-[#FFD700] rounded-t-lg transition-all hover:bg-yellow-300"
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Labels under bars */}
          <div className="flex justify-around border-t border-[#333] pt-3">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-3 h-3 bg-[#FFD700] rounded" />
              Subscriptions
            </div>
          </div>

          {/* Plan labels + prices */}
          <div className="flex justify-around mt-4">
            {plans.map((plan) => (
              <div key={plan.plan} className="text-center">
                <p className="text-xs text-gray-400">{plan.displayName}</p>
                <p className="text-white font-bold text-sm">{formatCurrency(plan.baseCost)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Most Sold Plan - Donut Chart */}
        <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-1">Most Sold Plan</h2>
          <p className="text-xs text-gray-500 mb-6">Current distribution</p>

          {/* Simple Donut Visualization */}
          <div className="flex justify-center mb-6">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                {(() => {
                  const colors = ["#FFD700", "#FF8C00", "#FF6347"];
                  let offset = 0;
                  return sortedByCount.map((item, i) => {
                    const dash = item.percentage;
                    const el = (
                      <circle
                        key={item.plan}
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke={colors[i % colors.length]}
                        strokeWidth="3.8"
                        strokeDasharray={`${dash} ${100 - dash}`}
                        strokeDashoffset={-offset}
                        className="transition-all"
                      />
                    );
                    offset += dash;
                    return el;
                  });
                })()}
              </svg>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            {sortedByCount.map((item, i) => {
              const colors = ["#FFD700", "#FF8C00", "#FF6347"];
              return (
                <div key={item.plan} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[i % colors.length] }}
                    />
                    <span className="text-sm text-gray-300 capitalize">
                      {planDisplayNames[item.plan] ?? item.plan}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-white">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Revenue Analytics - Line Chart */}
      <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Revenue Analytics</h2>
            <p className="text-xs text-gray-500">
              {revenue ? `$${revenue.totalRevenue.toLocaleString()} total • ` : ""}
              Monthly revenue trend
            </p>
          </div>
          {revenue && (
            <span className="text-xs text-gray-500">
              Avg per org: ${revenue.averageRevenuePerOrganization.toLocaleString()}
            </span>
          )}
        </div>

        {/* Simple SVG line chart */}
        <RevenueLineChart
          trend={revenue?.monthlyTrend ?? []}
          fallbackData={dashboard}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revenue line chart (SVG)
// ---------------------------------------------------------------------------

function RevenueLineChart({
  trend,
  fallbackData,
}: {
  trend: MonthlyTrend[];
  fallbackData: AdminDashboardData;
}) {
  // Prefer real revenue trend; fall back to org growth trend
  const useRevenueTrend = trend.length >= 2;
  const displayTrend = useRevenueTrend
    ? trend.slice(-8)
    : fallbackData.organizationStats.growthTrend.slice(-8);

  if (displayTrend.length < 2) {
    return <p className="text-gray-500 text-center py-8">Not enough data to render chart.</p>;
  }

  const values = displayTrend.map((t) =>
    "revenue" in t ? (t as MonthlyTrend).revenue : ((t as { newOrganizations?: number }).newOrganizations ?? 0),
  );
  const max = Math.max(...values, 1);
  const min = 0;

  const width = 800;
  const height = 200;
  const padX = 60;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * chartW;
    const y = padY + chartH - ((v - min) / (max - min || 1)) * chartH;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = padY + chartH * (1 - frac);
        const label = Math.round(min + (max - min) * frac);
        return (
          <g key={frac}>
            <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#333" strokeWidth="0.5" />
            <text x={padX - 10} y={y + 3} fill="#888" fontSize="10" textAnchor="end">
              {label}
            </text>
          </g>
        );
      })}

      {/* Line */}
      <path d={linePath} fill="none" stroke="#FFD700" strokeWidth="2.5" />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#FFD700" />
      ))}

      {/* X labels */}
      {displayTrend.map((t, i) => {
        const x = padX + (i / (displayTrend.length - 1)) * chartW;
        return (
          <text key={i} x={x} y={height - 2} fill="#888" fontSize="9" textAnchor="middle">
            {t.period}
          </text>
        );
      })}
    </svg>
  );
}
