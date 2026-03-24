import { useEffect, useState, useCallback, useRef } from "react";
import { Building2, CheckCircle, XCircle, TrendingUp, Download } from "lucide-react";
import { SuperAdminStatCard } from "../components";
import { fetchOrganizationsPii, fetchOrganizationStats } from "../../../services/superAdminService";
import { LoadingSpinner, ErrorDisplay, AlertContainer } from "../../../components/ui";
import { normalizeError, logError } from "../../../utils/errorHandling";
import { useAuth } from "../../../contexts/useAuth";
import { useLanguage } from "../../../contexts/useLanguage";
import { useAlerts } from "../../../hooks/useAlerts";
import { AdminPagination, AdminTable } from "../../app/components";
import { ExportSettingsModal } from "../../../components/export/ExportSettingsModal";
import { exportService, ORGANIZATION_MANAGEMENT_POLICY } from "../../../services/export";
import type { ExportConfig, ExportProgress } from "../../../types/export";
import type { OrganizationPii, OrganizationStats } from "../../../types/api";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500",
  suspended: "bg-red-500",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-900/50 text-green-400 border border-green-700",
  suspended: "bg-red-900/50 text-red-400 border border-red-700",
};

export default function OrganizationManagement() {
  const { language, locale } = useLanguage();
  const isEs = language === "es";
  // Page data
  const [organizations, setOrganizations] = useState<OrganizationPii[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [orgStats, setOrgStats] = useState<OrganizationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Export state
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | undefined>();
  const exportAbort = useRef<AbortController | null>(null);

  const { user } = useAuth();
  const { alerts, showAlert, dismissAlert } = useAlerts();

  const fetchData = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      setError("");
      const [piiResult, statsResult] = await Promise.all([
        fetchOrganizationsPii(p, limit),
        fetchOrganizationStats({ periodMonths: 1 }),
      ]);
      setOrganizations(piiResult.data.organizations);
      setTotal(piiResult.data.total);
      setTotalPages(piiResult.data.totalPages);
      setPage(piiResult.data.page);
      setOrgStats(statsResult.data.stats);
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      setError(normalized.message);
      logError(err, "OrganizationManagement.fetchData");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      void fetchData(newPage);
    },
    [fetchData],
  );

  // Derived plans list for filter dropdown
  const availablePlans = Array.from(new Set(organizations.map((o) => o.subscription.plan))).sort();

  // Client-side filtering on the current page slice
  const filtered = organizations.filter((org) => {
    if (statusFilter !== "all" && org.status !== statusFilter) return false;
    if (planFilter !== "all" && org.subscription.plan !== planFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !org.name.toLowerCase().includes(q) &&
        !org.email.toLowerCase().includes(q) &&
        !(org.legalName ?? "").toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  // Stat card derivations
  const activeCount = orgStats?.byStatus.find((s) => s.status === "active")?.count ?? 0;
  const suspendedCount = orgStats?.byStatus.find((s) => s.status === "suspended")?.count ?? 0;
  const avgSeats = orgStats?.averageSeatCount ?? 0;

  // ─── Export ────────────────────────────────────────────────────────────────

  /** Fetch all pages and build flat rows for export. */
  const buildAllExportRows = useCallback(async (): Promise<Record<string, unknown>[]> => {
    const rows: Record<string, unknown>[] = [];
    let currentPage = 1;
    let fetchedPages = 0;

    do {
      const result = await fetchOrganizationsPii(currentPage, 100);
      const { organizations: orgs, totalPages: tp } = result.data;
      fetchedPages = tp;

      for (const org of orgs) {
        rows.push({
          _id: org._id,
          name: org.name,
          legalName: org.legalName,
          email: org.email,
          phone: org.phone ?? "",
          status: org.status,
          plan: org.subscription.plan,
          seatCount: org.subscription.seatCount,
          country: org.address?.department ?? "",
          city: org.address?.city ?? "",
          createdAt: org.createdAt,
        });
      }
      currentPage++;
    } while (currentPage <= fetchedPages);

    return rows;
  }, []);

  const handleExport = useCallback(
    async (config: ExportConfig) => {
      const abort = new AbortController();
      exportAbort.current = abort;
      setExporting(true);
      setExportProgress(undefined);

      try {
        const rawData = await buildAllExportRows();

        if (rawData.length === 0) {
          showAlert("warning", isEs ? "No hay datos disponibles para exportar." : "No data available to export.");
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
    [buildAllExportRows, user?.id, showAlert],
  );

  const handleExportPreview = useCallback(
    async (config: ExportConfig) => {
      const rawData = await buildAllExportRows();
      if (rawData.length === 0) return undefined;
      return exportService.preview(rawData, config, user?.id ?? "anonymous");
    },
    [buildAllExportRows, user?.id],
  );

  const handleCancelExport = useCallback(() => {
    exportAbort.current?.abort();
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return <LoadingSpinner fullScreen message={isEs ? "Cargando organizaciones..." : "Loading organizations..."} />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={() => void fetchData(1)} fullScreen />;
  }

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
        module="organization-management"
        policy={ORGANIZATION_MANAGEMENT_POLICY}
        allowedFormats={["xlsx"]}
        exporting={exporting}
        progress={exportProgress}
        onCancel={handleCancelExport}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Organization Management</h1>
          <p className="text-gray-400 mt-1">{isEs ? "Analitica y directorio de organizaciones" : "Platform organization analytics & directory"}</p>
        </div>
        <button onClick={() => setExportOpen(true)} className="export-btn flex items-center gap-2">
          <Download size={18} />
          {isEs ? "Exportar" : "Export"}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SuperAdminStatCard
          label={isEs ? "Organizaciones totales" : "Total Organizations"}
          value={total}
          icon={<Building2 size={20} className="text-black" />}
        />
        <SuperAdminStatCard
          label={isEs ? "Activas" : "Active"}
          value={activeCount}
          icon={<CheckCircle size={20} className="text-black" />}
        />
        <SuperAdminStatCard
          label={isEs ? "Suspendidas" : "Suspended"}
          value={suspendedCount}
          icon={<XCircle size={20} className="text-black" />}
        />
        <SuperAdminStatCard
          label={isEs ? "Promedio asientos / org" : "Avg Seats / Org"}
          value={avgSeats.toFixed(1)}
          icon={<TrendingUp size={20} className="text-black" />}
        />
      </div>

      {/* Growth Chart + Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Organization Growth (last 30 days) */}
        {orgStats && orgStats.growthTrend.length > 0 && (
          <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              {isEs ? "Crecimiento de organizaciones (ultimos 30 dias)" : "Organization Growth (Last 30 Days)"}
            </h2>
            <div className="flex items-end gap-1 h-32">
              {orgStats.growthTrend.map((point) => {
                const newOrgs = point.newOrganizations ?? 0;
                const maxNew = Math.max(
                  ...orgStats.growthTrend.map((p) => p.newOrganizations ?? 0),
                  1,
                );
                const heightPct = Math.round((newOrgs / maxNew) * 100);
                return (
                  <div key={point.period} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-400">{newOrgs}</span>
                    <div
                      className="w-full bg-[#FFD700] rounded-t"
                      style={{
                        height: `${heightPct}%`,
                        minHeight: newOrgs > 0 ? "4px" : "0",
                      }}
                    />
                    <span className="text-[10px] text-gray-500 truncate w-full text-center">
                      {point.period.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Organizations by Status */}
        {orgStats && (
          <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">{isEs ? "Organizaciones por estado" : "Organizations by Status"}</h2>
            <div className="space-y-3">
              {orgStats.byStatus.map((entry) => {
                const pct = total > 0 ? Math.round((entry.count / total) * 100) : 0;
                return (
                  <div key={entry.status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-300 capitalize">
                        {entry.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-white font-medium">
                        {entry.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${STATUS_COLORS[entry.status] ?? "bg-gray-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Plans breakdown */}
            {orgStats.byPlan.length > 0 && (
              <div className="mt-6 pt-4 border-t border-[#333]">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">{isEs ? "Por plan" : "By Plan"}</h3>
                <div className="space-y-2">
                  {orgStats.byPlan.map((entry) => (
                    <div key={entry.plan} className="flex justify-between text-sm">
                      <span className="text-gray-300 capitalize">{entry.plan}</span>
                      <span className="text-white font-medium">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-[#121212] border border-[#333] rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder={isEs ? "Buscar por nombre o correo..." : "Search by name or email..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-[#1a1a1a] border border-[#444] text-white text-sm rounded-lg px-3 py-2 w-56 focus:outline-none focus:border-[#FFD700]"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "suspended")}
          className="bg-[#1a1a1a] border border-[#444] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#FFD700]"
        >
          <option value="all">{isEs ? "Todos los estados" : "All Statuses"}</option>
          <option value="active">{isEs ? "Activas" : "Active"}</option>
          <option value="suspended">{isEs ? "Suspendidas" : "Suspended"}</option>
        </select>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="bg-[#1a1a1a] border border-[#444] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#FFD700]"
        >
          <option value="all">{isEs ? "Todos los planes" : "All Plans"}</option>
          {availablePlans.map((plan) => (
            <option key={plan} value={plan}>
              {plan}
            </option>
          ))}
        </select>

        {(statusFilter !== "all" || planFilter !== "all" || searchQuery.trim()) && (
          <button
            onClick={() => {
              setStatusFilter("all");
              setPlanFilter("all");
              setSearchQuery("");
            }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {isEs ? "Limpiar filtros" : "Clear filters"}
          </button>
        )}

        <span className="ml-auto text-xs text-gray-500">
          {isEs
            ? `${filtered.length} de ${organizations.length} en esta pagina`
            : `${filtered.length} of ${organizations.length} on this page`}
        </span>
      </div>

      {/* Table */}
      <div className="mb-6">
        <AdminTable>
          <thead className="bg-[#0f0f0f] border-b border-[#333]">
            <tr>
              <th className="px-4 py-3 text-gray-400 font-medium">{isEs ? "Nombre" : "Name"}</th>
              <th className="px-4 py-3 text-gray-400 font-medium">{isEs ? "Razon social" : "Legal Name"}</th>
              <th className="px-4 py-3 text-gray-400 font-medium">Email</th>
              <th className="px-4 py-3 text-gray-400 font-medium">Plan</th>
              <th className="px-4 py-3 text-gray-400 font-medium text-center">{isEs ? "Asientos" : "Seats"}</th>
              <th className="px-4 py-3 text-gray-400 font-medium">{isEs ? "Estado" : "Status"}</th>
              <th className="px-4 py-3 text-gray-400 font-medium">{isEs ? "Ubicacion" : "Location"}</th>
              <th className="px-4 py-3 text-gray-400 font-medium">{isEs ? "Creado" : "Created"}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  {isEs ? "Ninguna organizacion coincide con los filtros actuales." : "No organizations match the current filters."}
                </td>
              </tr>
            ) : (
              filtered.map((org) => (
                <tr
                  key={org._id}
                  className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors"
                >
                  <td className="px-4 py-3 text-white font-medium">{org.name}</td>
                  <td className="px-4 py-3 text-gray-300">{org.legalName}</td>
                  <td className="px-4 py-3 text-gray-300">
                    {org.email.replace(/(?<=.).(?=[^@]*@)/g, "*")}
                  </td>
                  <td className="px-4 py-3 text-gray-300 capitalize">{org.subscription.plan}</td>
                  <td className="px-4 py-3 text-gray-300 text-center">
                    {org.subscription.seatCount}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[org.status] ?? "bg-gray-800 text-gray-400"}`}
                    >
                      {org.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {[org.address?.city, org.address?.department].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {new Date(org.createdAt).toLocaleDateString(locale)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </AdminTable>

        <AdminPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={limit}
          itemLabel={isEs ? "organizaciones" : "organizations"}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
