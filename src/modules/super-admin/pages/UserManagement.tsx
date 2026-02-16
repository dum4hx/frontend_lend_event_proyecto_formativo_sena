import { useEffect, useState, useCallback, useRef } from "react";
import { Users, ShieldCheck, TrendingUp, Download, UserCheck } from "lucide-react";
import { SuperAdminStatCard } from "../components";
import { fetchUserStats } from "../../../services/superAdminService";
import { LoadingSpinner, ErrorDisplay, AlertContainer } from "../../../components/ui";
import { normalizeError, logError } from "../../../utils/errorHandling";
import { useAuth } from "../../../contexts/useAuth";
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
  inactive: "bg-red-500",
};

export default function UserManagement() {
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
          showAlert("warning", "No data available to export.");
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
            `Exported ${result.metadata.recordCount} records as ${result.filename}`,
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
    [buildExportRows, user?.id, showAlert],
  );

  const handleExportPreview = useCallback(
    async (config: ExportConfig) => {
      const freshResult = await fetchUserStats();
      const freshStats = freshResult.data.stats;
      const rawData = buildExportRows(freshStats);
      if (rawData.length === 0) return undefined;
      return exportService.preview(rawData, config, user?.id ?? "anonymous");
    },
    [buildExportRows, user?.id],
  );

  const handleCancelExport = useCallback(() => {
    exportAbort.current?.abort();
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading user data…" />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchData} fullScreen />;
  }

  if (!userStats) return null;

  const totalUsers = userStats.byRole.reduce((sum, r) => sum + r.count, 0);
  const activeUsers =
    userStats.byStatus.find((s) => s.status === "active")?.count ?? 0;
  const pendingUsers =
    userStats.byStatus.find((s) => s.status === "pending_activation")?.count ??
    0;

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
        exporting={exporting}
        progress={exportProgress}
        onCancel={handleCancelExport}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-1">
            Platform user analytics &amp; distribution
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SuperAdminStatCard
          label="Total Users"
          value={totalUsers}
          icon={<Users size={20} className="text-black" />}
        />
        <SuperAdminStatCard
          label="Active"
          value={activeUsers}
          icon={<UserCheck size={20} className="text-black" />}
        />
        <SuperAdminStatCard
          label="Pending Activation"
          value={pendingUsers}
          icon={<ShieldCheck size={20} className="text-black" />}
        />
        <SuperAdminStatCard
          label="Avg Users / Org"
          value={userStats.averageUsersPerOrganization.toFixed(1)}
          icon={<TrendingUp size={20} className="text-black" />}
        />
      </div>

      {/* Role Distribution & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Users by Role */}
        <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Users by Role</h2>
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
                      {entry.role.replace(/_/g, " ")}
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
            Users by Status
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
          <div className="mt-6 pt-4 border-t border-[#333] text-sm text-gray-400">
            <p>
              Avg users per organization:{" "}
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
          <h2 className="text-lg font-bold text-white mb-4">User Growth</h2>
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
