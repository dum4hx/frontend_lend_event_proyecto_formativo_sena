import { useState, useMemo, useCallback } from "react";
import {
  BarChart3,
  CreditCard,
  Activity,
  Download,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  DollarSign,
} from "lucide-react";
import { useLanguage } from "../../../contexts/useLanguage";
import { SuperAdminStatCard } from "../components";
import {
  useAdminPlatformKpisDetail,
  useAdminPlatformKpisSummary,
  useAdminSubscriptionsDetail,
  useAdminSubscriptionsSummary,
  useAdminUsageDetail,
  useAdminUsageSummary,
} from "../../../hooks/queries";
import {
  getAdminExportPlatformKpisDetail,
  getAdminExportSubscriptionsDetail,
  getAdminExportUsageDetail,
} from "../../../services/adminExportService";
import { exportTableToXLSX } from "../../../utils/tableExport";
import type {
  AdminPlatformKpisMonthlyRow,
  AdminSubscriptionRow,
  AdminUsageOrgRow,
} from "../../../types/api";
import type { StatCardProps } from "../../../components/ui/StatCard";

type AdminReportTab = "platform-kpis" | "subscriptions" | "usage";

const PAGE_SIZE = 20;
const EXPORT_PAGE_SIZE = 200;

export default function AdminReports() {
  const { t, formatDate, formatNumber, formatCurrency, language } = useLanguage();
  const isEs = language === "es";

  const [activeTab, setActiveTab] = useState<AdminReportTab>("platform-kpis");
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [orgStatusFilter, setOrgStatusFilter] = useState("");
  const [exporting, setExporting] = useState(false);

  const dateParams = useMemo(
    () => ({
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    }),
    [startDate, endDate],
  );

  const subscriptionParams = useMemo(
    () => ({
      ...dateParams,
      ...(planFilter ? { plan: planFilter } : {}),
      ...(orgStatusFilter ? { orgStatus: orgStatusFilter } : {}),
      page,
      limit: PAGE_SIZE,
    }),
    [dateParams, planFilter, orgStatusFilter, page],
  );

  const usageParams = useMemo(
    () => ({
      ...dateParams,
      ...(planFilter ? { plan: planFilter } : {}),
      ...(orgStatusFilter ? { orgStatus: orgStatusFilter } : {}),
      page,
      limit: PAGE_SIZE,
    }),
    [dateParams, planFilter, orgStatusFilter, page],
  );

  // ─── Queries ───────────────────────────────────────────────────────────
  const kpisDetail = useAdminPlatformKpisDetail(dateParams, {
    enabled: activeTab === "platform-kpis",
  });
  const kpisSummary = useAdminPlatformKpisSummary(dateParams, {
    enabled: activeTab === "platform-kpis",
  });

  const subsDetail = useAdminSubscriptionsDetail(subscriptionParams, {
    enabled: activeTab === "subscriptions",
  });
  const subsSummary = useAdminSubscriptionsSummary(
    {
      ...dateParams,
      ...(planFilter ? { plan: planFilter } : {}),
      ...(orgStatusFilter ? { orgStatus: orgStatusFilter } : {}),
    },
    { enabled: activeTab === "subscriptions" },
  );

  const usageDetail = useAdminUsageDetail(usageParams, {
    enabled: activeTab === "usage",
  });
  const usageSummary = useAdminUsageSummary(
    {
      ...dateParams,
      ...(planFilter ? { plan: planFilter } : {}),
      ...(orgStatusFilter ? { orgStatus: orgStatusFilter } : {}),
    },
    { enabled: activeTab === "usage" },
  );

  // ─── Tab change ────────────────────────────────────────────────────────
  const switchTab = useCallback((tab: AdminReportTab) => {
    setActiveTab(tab);
    setPage(1);
  }, []);

  // ─── Loading / Error ───────────────────────────────────────────────────
  const isLoading = useMemo(() => {
    if (activeTab === "platform-kpis") return kpisDetail.isLoading || kpisSummary.isLoading;
    if (activeTab === "subscriptions") return subsDetail.isLoading || subsSummary.isLoading;
    return usageDetail.isLoading || usageSummary.isLoading;
  }, [
    activeTab,
    kpisDetail.isLoading,
    kpisSummary.isLoading,
    subsDetail.isLoading,
    subsSummary.isLoading,
    usageDetail.isLoading,
    usageSummary.isLoading,
  ]);

  const errorMsg = useMemo(() => {
    if (activeTab === "platform-kpis")
      return kpisDetail.error?.message ?? kpisSummary.error?.message ?? null;
    if (activeTab === "subscriptions")
      return subsDetail.error?.message ?? subsSummary.error?.message ?? null;
    return usageDetail.error?.message ?? usageSummary.error?.message ?? null;
  }, [
    activeTab,
    kpisDetail.error,
    kpisSummary.error,
    subsDetail.error,
    subsSummary.error,
    usageDetail.error,
    usageSummary.error,
  ]);

  // ─── KPI cards ─────────────────────────────────────────────────────────
  const statCards = useMemo((): StatCardProps[] => {
    if (activeTab === "platform-kpis" && kpisSummary.data?.summary) {
      const s = kpisSummary.data.summary;
      const pc = s.periodComparison;
      return [
        {
          label: t("superAdmin.reports.kpis.totalOrgs"),
          value: formatNumber(s.currentKpis.totalOrgs),
          icon: <Building2 size={20} />,
          trend: pc
            ? `${pc.changes.orgs >= 0 ? "+" : ""}${pc.changes.orgs.toFixed(1)}%`
            : undefined,
          trendUp: pc ? pc.changes.orgs >= 0 : undefined,
        },
        {
          label: t("superAdmin.reports.kpis.activeUsers"),
          value: formatNumber(s.currentKpis.activeUsers),
          icon: <Users size={20} />,
          trend: pc
            ? `${pc.changes.users >= 0 ? "+" : ""}${pc.changes.users.toFixed(1)}%`
            : undefined,
          trendUp: pc ? pc.changes.users >= 0 : undefined,
        },
        {
          label: t("superAdmin.reports.kpis.totalLoans"),
          value: formatNumber(s.currentKpis.totalLoans),
          icon: <Activity size={20} />,
          trend: pc
            ? `${pc.changes.loans >= 0 ? "+" : ""}${pc.changes.loans.toFixed(1)}%`
            : undefined,
          trendUp: pc ? pc.changes.loans >= 0 : undefined,
        },
        {
          label: t("superAdmin.reports.kpis.mrr"),
          value: formatCurrency(s.currentKpis.mrr),
          icon: <DollarSign size={20} />,
        },
      ];
    }
    if (activeTab === "subscriptions" && subsSummary.data?.summary) {
      const s = subsSummary.data.summary;
      return [
        {
          label: t("superAdmin.reports.subs.totalOrgs"),
          value: formatNumber(s.totalOrgs),
          icon: <Building2 size={20} />,
        },
        {
          label: t("superAdmin.reports.subs.upgrades"),
          value: formatNumber(s.upgrades),
          icon: <TrendingUp size={20} />,
          trendUp: true,
        },
        {
          label: t("superAdmin.reports.subs.churn"),
          value: formatNumber(s.churn),
          icon: <TrendingDown size={20} />,
          trendUp: false,
        },
        {
          label: t("superAdmin.reports.subs.paymentSuccess"),
          value: `${s.paymentAnalytics.successRate.toFixed(1)}%`,
          icon: <CreditCard size={20} />,
        },
      ];
    }
    if (activeTab === "usage" && usageSummary.data?.summary) {
      const s = usageSummary.data.summary;
      return [
        {
          label: t("superAdmin.reports.usage.totalOrgs"),
          value: formatNumber(s.platformTotals.organizations),
          icon: <Building2 size={20} />,
        },
        {
          label: t("superAdmin.reports.usage.totalUsers"),
          value: formatNumber(s.platformTotals.users),
          icon: <Users size={20} />,
        },
        {
          label: t("superAdmin.reports.usage.totalLoans"),
          value: formatNumber(s.platformTotals.loans),
          icon: <Activity size={20} />,
        },
        {
          label: t("superAdmin.reports.usage.totalInvoices"),
          value: formatNumber(s.platformTotals.invoices),
          icon: <DollarSign size={20} />,
        },
      ];
    }
    return [];
  }, [
    activeTab,
    kpisSummary.data,
    subsSummary.data,
    usageSummary.data,
    t,
    formatNumber,
    formatCurrency,
  ]);

  // ─── Table headers & rows ──────────────────────────────────────────────
  const { headers, rows, totalCount, totalPages } = useMemo(() => {
    if (activeTab === "platform-kpis") {
      const data = kpisDetail.data?.monthlyBreakdown ?? [];
      return {
        headers: [
          t("superAdmin.reports.col.year"),
          t("superAdmin.reports.col.month"),
          t("superAdmin.reports.col.newOrgs"),
          t("superAdmin.reports.col.newUsers"),
          t("superAdmin.reports.col.totalLoans"),
          t("superAdmin.reports.col.totalInvoices"),
        ],
        rows: data.map((r: AdminPlatformKpisMonthlyRow, i: number) => ({
          id: `kpi-${r.year}-${r.month}-${i}`,
          cells: [
            String(r.year),
            String(r.month),
            formatNumber(r.newOrgs),
            formatNumber(r.newUsers),
            formatNumber(r.totalLoans),
            formatNumber(r.totalInvoices),
          ],
        })),
        totalCount: data.length,
        totalPages: Math.max(1, Math.ceil(data.length / PAGE_SIZE)),
      };
    }

    if (activeTab === "subscriptions") {
      const data = subsDetail.data;
      const subRows = data?.subscriptions ?? [];
      return {
        headers: [
          t("superAdmin.reports.col.orgName"),
          t("superAdmin.reports.col.plan"),
          t("superAdmin.reports.col.orgStatus"),
          t("superAdmin.reports.col.seats"),
          t("superAdmin.reports.col.catalogItems"),
          t("superAdmin.reports.col.periodEnd"),
          t("superAdmin.reports.col.createdAt"),
        ],
        rows: subRows.map((r: AdminSubscriptionRow) => ({
          id: r.orgId,
          cells: [
            r.orgName,
            r.plan,
            r.orgStatus,
            formatNumber(r.seatCount),
            formatNumber(r.catalogItemCount),
            formatDate(r.currentPeriodEnd),
            formatDate(r.orgCreatedAt),
          ],
        })),
        totalCount: data?.total ?? 0,
        totalPages: data?.totalPages ?? 1,
      };
    }

    // usage
    const data = usageDetail.data;
    const orgRows = data?.organizations ?? [];
    return {
      headers: [
        t("superAdmin.reports.col.orgName"),
        t("superAdmin.reports.col.plan"),
        t("superAdmin.reports.col.users"),
        t("superAdmin.reports.col.loans"),
        t("superAdmin.reports.col.invoices"),
        t("superAdmin.reports.col.customers"),
        t("superAdmin.reports.col.materials"),
        t("superAdmin.reports.col.createdAt"),
      ],
      rows: orgRows.map((r: AdminUsageOrgRow) => ({
        id: r.orgId,
        cells: [
          r.orgName,
          r.plan,
          `${formatNumber(r.activeUserCount)} / ${formatNumber(r.userCount)}`,
          formatNumber(r.loanCount),
          formatNumber(r.invoiceCount),
          formatNumber(r.customerCount),
          formatNumber(r.materialInstanceCount),
          formatDate(r.createdAt),
        ],
      })),
      totalCount: data?.total ?? 0,
      totalPages: data?.totalPages ?? 1,
    };
  }, [activeTab, kpisDetail.data, subsDetail.data, usageDetail.data, t, formatNumber, formatDate]);

  // Client-side pagination for platform KPIs (non-paginated endpoint)
  const pagedRows = useMemo(() => {
    if (activeTab === "platform-kpis") {
      return rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    }
    return rows;
  }, [activeTab, rows, page]);

  // ─── Export ────────────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const date = new Date().toISOString().slice(0, 10);
      const baseParams = {
        ...dateParams,
        ...(planFilter ? { plan: planFilter } : {}),
        ...(orgStatusFilter ? { orgStatus: orgStatusFilter } : {}),
      };

      const toRecords = (h: string[], raw: string[][]): Record<string, string | number>[] =>
        raw.map((row) =>
          h.reduce<Record<string, string | number>>((acc, col, i) => {
            acc[col] = row[i] ?? "";
            return acc;
          }, {}),
        );

      if (activeTab === "platform-kpis") {
        const res = await getAdminExportPlatformKpisDetail(dateParams);
        const exportRows = res.data.monthlyBreakdown.map((r) => [
          String(r.year),
          String(r.month),
          String(r.newOrgs),
          String(r.newUsers),
          String(r.totalLoans),
          String(r.totalInvoices),
        ]);
        exportTableToXLSX(
          { headers, rows: toRecords(headers, exportRows) },
          `admin_platform_kpis_${date}.xlsx`,
        );
      } else if (activeTab === "subscriptions") {
        const allRows: string[][] = [];
        let currentPage = 1;
        let lastPage = 1;
        do {
          const res = await getAdminExportSubscriptionsDetail({
            ...baseParams,
            page: currentPage,
            limit: EXPORT_PAGE_SIZE,
          });
          lastPage = res.data.totalPages;
          for (const r of res.data.subscriptions) {
            allRows.push([
              r.orgName,
              r.plan,
              r.orgStatus,
              String(r.seatCount),
              String(r.catalogItemCount),
              r.currentPeriodEnd,
              r.orgCreatedAt,
            ]);
          }
          currentPage++;
        } while (currentPage <= lastPage);
        exportTableToXLSX(
          { headers, rows: toRecords(headers, allRows) },
          `admin_subscriptions_${date}.xlsx`,
        );
      } else {
        const allRows: string[][] = [];
        let currentPage = 1;
        let lastPage = 1;
        do {
          const res = await getAdminExportUsageDetail({
            ...baseParams,
            page: currentPage,
            limit: EXPORT_PAGE_SIZE,
          });
          lastPage = res.data.totalPages;
          for (const r of res.data.organizations) {
            allRows.push([
              r.orgName,
              r.plan,
              `${r.activeUserCount}/${r.userCount}`,
              String(r.loanCount),
              String(r.invoiceCount),
              String(r.customerCount),
              String(r.materialInstanceCount),
              r.createdAt,
            ]);
          }
          currentPage++;
        } while (currentPage <= lastPage);
        exportTableToXLSX(
          { headers, rows: toRecords(headers, allRows) },
          `admin_usage_${date}.xlsx`,
        );
      }
    } catch {
      // silently fail — user sees exporting state cleared
    } finally {
      setExporting(false);
    }
  }, [activeTab, dateParams, planFilter, orgStatusFilter, headers]);

  // ─── Tab config ────────────────────────────────────────────────────────
  const tabs: Array<{ key: AdminReportTab; label: string; icon: React.ReactNode }> = [
    {
      key: "platform-kpis",
      label: t("superAdmin.reports.tabs.platformKpis"),
      icon: <BarChart3 size={16} />,
    },
    {
      key: "subscriptions",
      label: t("superAdmin.reports.tabs.subscriptions"),
      icon: <CreditCard size={16} />,
    },
    { key: "usage", label: t("superAdmin.reports.tabs.usage"), icon: <Activity size={16} /> },
  ];

  const effectiveTotalPages = activeTab === "platform-kpis" ? totalPages : totalPages;

  return (
    <div className="space-y-6" data-help-id="admin-reports">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        data-help-id="admin-reports-header"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">{t("superAdmin.reports.title")}</h1>
          <p className="text-gray-400 text-sm mt-1">{t("superAdmin.reports.description")}</p>
        </div>
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={exporting || isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            exporting || isLoading
              ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
              : "bg-[#FFD700] text-black hover:bg-[#e6c200]"
          }`}
          data-help-id="admin-reports-export"
        >
          {exporting ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
          {exporting ? t("superAdmin.reports.exporting") : t("superAdmin.reports.export")}
        </button>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800"
        data-help-id="admin-reports-tabs"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => switchTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-[#FFD700] text-black"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end" data-help-id="admin-reports-filters">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            {t("superAdmin.reports.filters.startDate")}
          </label>
          <div className="relative">
            <Calendar
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:border-[#FFD700] focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            {t("superAdmin.reports.filters.endDate")}
          </label>
          <div className="relative">
            <Calendar
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:border-[#FFD700] focus:outline-none"
            />
          </div>
        </div>
        {activeTab !== "platform-kpis" && (
          <>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                {t("superAdmin.reports.filters.plan")}
              </label>
              <select
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:border-[#FFD700] focus:outline-none"
              >
                <option value="">{t("superAdmin.reports.filters.allPlans")}</option>
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                {t("superAdmin.reports.filters.orgStatus")}
              </label>
              <select
                value={orgStatusFilter}
                onChange={(e) => {
                  setOrgStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:border-[#FFD700] focus:outline-none"
              >
                <option value="">{t("superAdmin.reports.filters.allStatuses")}</option>
                <option value="active">{isEs ? "Activo" : "Active"}</option>
                <option value="suspended">{isEs ? "Suspendido" : "Suspended"}</option>
                <option value="cancelled">{isEs ? "Cancelado" : "Cancelled"}</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* KPI Cards */}
      {statCards.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          data-help-id="admin-reports-kpis"
        >
          {statCards.map((card) => (
            <SuperAdminStatCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              trend={card.trend}
              trendUp={card.trendUp}
            />
          ))}
        </div>
      )}

      {/* Data Table */}
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
        data-help-id="admin-reports-table"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-white font-semibold">
              {tabs.find((tb) => tb.key === activeTab)?.label} —{" "}
              {t("superAdmin.reports.table.page")} {page} {t("superAdmin.reports.table.of")}{" "}
              {effectiveTotalPages}
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">
              {isLoading
                ? t("superAdmin.reports.table.loading")
                : `${totalCount} ${t("superAdmin.reports.table.records")}`}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="m-4 p-4 bg-red-900/20 border border-red-500/40 rounded-lg text-red-300 text-sm">
            {errorMsg}
          </div>
        )}

        {isLoading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw size={32} className="animate-spin mx-auto mb-3 text-yellow-400" />
            {t("superAdmin.reports.table.loading")}
          </div>
        ) : pagedRows.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            {t("superAdmin.reports.table.noData")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800/60 border-b border-zinc-700">
                <tr>
                  {headers.map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-gray-400 font-medium whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {pagedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-800/40 transition-colors">
                    {row.cells.map((cell, ci) => (
                      <td key={ci} className="px-5 py-3 text-zinc-300 whitespace-nowrap">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {effectiveTotalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-800">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              {t("superAdmin.reports.table.previous")}
            </button>
            <span className="text-xs text-zinc-500">
              {page} / {effectiveTotalPages}
            </span>
            <button
              type="button"
              disabled={page >= effectiveTotalPages}
              onClick={() => setPage((p) => Math.min(effectiveTotalPages, p + 1))}
              className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {t("superAdmin.reports.table.next")}
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
