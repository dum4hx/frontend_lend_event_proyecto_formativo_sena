import { useEffect, useState, useCallback, useRef } from "react";
import { Users, ShieldCheck, TrendingUp, Download, UserCheck } from "lucide-react";
import { SuperAdminStatCard } from "../components";
import { fetchUserStats } from "../../../services/superAdminService";
import { LoadingSpinner, ErrorDisplay, AlertContainer } from "../../../components/ui";
import { normalizeError, logError } from "../../../utils/errorHandling";
import { useAuth } from "../../../contexts/useAuth";
import { useLanguage } from "../../../contexts/useLanguage";
import { useAlerts } from "../../../hooks/useAlerts";
import { ExportSettingsModal } from "../../../components/export/ExportSettingsModal";
import { exportService, USER_MANAGEMENT_POLICY } from "../../../services/export";
import type { ExportConfig, ExportProgress } from "../../../types/export";
import type { UserStats } from "../../../types/api";

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-[#FFD700]",
  manager: "bg-green-500",
  commercial_advisor: "bg-blue-500",
  warehouse_operator: "bg-purple-500",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500",
  pending_activation: "bg-yellow-500",
  invited: "bg-yellow-500",
  inactive: "bg-red-500",
  suspended: "bg-red-500",
};

const ROLE_LABEL_KEYS = {
  owner: "superAdmin.userManagement.role.owner",
  manager: "superAdmin.userManagement.role.manager",
  commercial_advisor: "superAdmin.userManagement.role.commercialAdvisor",
  warehouse_operator: "superAdmin.userManagement.role.warehouseOperator",
} as const;

const STATUS_LABEL_KEYS = {
  active: "superAdmin.userManagement.status.active",
  pending_activation: "superAdmin.userManagement.status.pendingActivation",
  invited: "superAdmin.userManagement.status.invited",
  inactive: "superAdmin.userManagement.status.inactive",
  suspended: "superAdmin.userManagement.status.suspended",
} as const;

export default function UserManagement() {
  const { t } = useLanguage();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
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
      const result = await fetchUserStats();
      setUserStats(result.data.stats);
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      setError(normalized.message);
      logError(err, "UserManagement.fetchData");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const getRoleLabel = useCallback(
    (role: string) => {
      const key = ROLE_LABEL_KEYS[role as keyof typeof ROLE_LABEL_KEYS];
      return key ? t(key) : role.replace(/_/g, " ");
    },
    [t],
  );

  const getStatusLabel = useCallback(
    (status: string) => {
      const key = STATUS_LABEL_KEYS[status as keyof typeof STATUS_LABEL_KEYS];
      return key ? t(key) : status.replace(/_/g, " ");
    },
    [t],
  );

  /** Build flat export rows from user analytics data (fetched fresh). */
  const buildExportRows = useCallback(
    (stats: UserStats): Record<string, unknown>[] => {
      const rows: Record<string, unknown>[] = [];
      for (const entry of stats.byRole) {
        rows.push({ category: "role", role: entry.role, count: entry.count });
      }
      for (const entry of stats.byStatus) {
        rows.push({
          category: "status",
          status: entry.status,
          count: entry.count,
        });
      }
      for (const entry of stats.growthTrend) {
        rows.push({
          category: "growth",
          period: entry.period,
          newUsers: entry.newUsers ?? 0,
        });
      }
      rows.push({
        category: "metric",
        averageUsersPerOrganization: stats.averageUsersPerOrganization,
      });
      return rows;
    },
    [],
  );

  const handleExport = useCallback(
    async (config: ExportConfig) => {
      const abort = new AbortController();
      exportAbort.current = abort;
      setExporting(true);
      setExportProgress(undefined);

      try {
        const freshResult = await fetchUserStats();
        const freshStats = freshResult.data.stats;
        const rawData = buildExportRows(freshStats);

        if (rawData.length === 0) {
          showAlert("warning", t("superAdmin.userManagement.noDataExport"));
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
            t("superAdmin.userManagement.exportSuccess", {
              count: result.metadata.recordCount,
              filename: result.filename,
            }),
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
      [buildExportRows, showAlert, t, user?._id],
  );

  const handleExportPreview = useCallback(
    async (config: ExportConfig) => {
      const freshResult = await fetchUserStats();
      const freshStats = freshResult.data.stats;
      const rawData = buildExportRows(freshStats);
      if (rawData.length === 0) return undefined;
      return exportService.preview(rawData, config, user?._id ?? "anonymous");
    },
    [buildExportRows, user?._id],
  );

  const handleCancelExport = useCallback(() => {
    exportAbort.current?.abort();
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen message={t("superAdmin.userManagement.loading")} />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchData} fullScreen />;
  }

  if (!userStats) return null;

  const totalUsers = userStats.byRole.reduce((sum, r) => sum + r.count, 0);
  const activeUsers =
    userStats.byStatus.find((s) => s.status === "active")?.count ?? 0;
  const pendingUsers =
    (userStats.byStatus.find((s) => s.status === "pending_activation")?.count ?? 0) +
    (userStats.byStatus.find((s) => s.status === "invited")?.count ?? 0);

  return (
    <div>
      {/* Alerts */}
      <AlertContainer
        alerts={alerts}
        onDismiss={dismissAlert}
        position="top-right"
      />

      {/* Export Modal */}
      <ExportSettingsModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={(config) => void handleExport(config)}
        onPreview={handleExportPreview}
        module="user-management"
        policy={USER_MANAGEMENT_POLICY}
        allowedFormats={['xlsx']}
        exporting={exporting}
        progress={exportProgress}
        onCancel={handleCancelExport}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{t("superAdmin.userManagement.title")}</h1>
          <p className="text-gray-400 mt-1">{t("superAdmin.userManagement.description")}</p>
        </div>
        <button
          onClick={() => setExportOpen(true)}
          className="export-btn flex items-center gap-2"
        >
          <Download size={18} />
          {t("superAdmin.userManagement.export")}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SuperAdminStatCard
          label={t("superAdmin.userManagement.stats.totalUsers")}
          value={totalUsers}
          icon={<Users size={20} className="text-black" />}
        />
        <SuperAdminStatCard
          label={t("superAdmin.userManagement.stats.activeUsers")}
          value={activeUsers}
          icon={<UserCheck size={20} className="text-black" />}
        />
        <SuperAdminStatCard
          label={t("superAdmin.userManagement.stats.pendingUsers")}
          value={pendingUsers}
          icon={<ShieldCheck size={20} className="text-black" />}
        />
        <SuperAdminStatCard
          label={t("superAdmin.userManagement.stats.avgUsersPerOrganization")}
          value={userStats.averageUsersPerOrganization.toFixed(1)}
          icon={<TrendingUp size={20} className="text-black" />}
        />
      </div>

      {/* Role Distribution & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Users by Role */}
        <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">{t("superAdmin.userManagement.sections.usersByRole")}</h2>
          <div className="space-y-3">
            {userStats.byRole.map((entry) => {
              const pct =
                totalUsers > 0
                  ? Math.round((entry.count / totalUsers) * 100)
                  : 0;
              return (
                <div key={entry.role}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-300 capitalize">
                      {getRoleLabel(entry.role)}
                    </span>
                    <span className="text-white font-medium">
                      {entry.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${ROLE_COLORS[entry.role] ?? "bg-gray-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Users by Status */}
        <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">
            {t("superAdmin.userManagement.sections.usersByStatus")}
          </h2>
          <div className="space-y-3">
            {userStats.byStatus.map((entry) => {
              const pct =
                totalUsers > 0
                  ? Math.round((entry.count / totalUsers) * 100)
                  : 0;
              return (
                <div key={entry.status}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-300 capitalize">
                      {getStatusLabel(entry.status)}
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
          <div className="mt-6 pt-4 border-t border-[#333] text-sm text-gray-400">
            <p>
              {t("superAdmin.userManagement.sections.averageUsersPerOrganization")}{" "}
              <span className="text-white font-medium">
                {userStats.averageUsersPerOrganization.toFixed(1)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* User Growth Trend */}
      {userStats.growthTrend.length > 0 && (
        <div className="bg-[#121212] border border-[#333] rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">{t("superAdmin.userManagement.sections.userGrowth")}</h2>
          <div className="flex items-end gap-1 h-32">
            {userStats.growthTrend.map((point) => {
              const newUsers = point.newUsers ?? 0;
              const maxNew = Math.max(
                ...userStats.growthTrend.map((p) => p.newUsers ?? 0),
                1,
              );
              const heightPct = Math.round((newUsers / maxNew) * 100);
              return (
                <div
                  key={point.period}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span className="text-xs text-gray-400">{newUsers}</span>
                  <div
                    className="w-full bg-[#FFD700] rounded-t"
                    style={{
                      height: `${heightPct}%`,
                      minHeight: newUsers > 0 ? "4px" : "0",
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
    </div>
  );
}
