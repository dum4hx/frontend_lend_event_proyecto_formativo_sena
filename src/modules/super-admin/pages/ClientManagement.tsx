import { useEffect, useState, useCallback } from "react";
import { Users, Building2, Activity, TrendingUp } from "lucide-react";
import { SuperAdminStatCard } from "../components";
import { fetchClientManagementData } from "../../../services/superAdminService";
import { LoadingSpinner, ErrorDisplay } from "../../../components/ui";
import { normalizeError, logError } from "../../../utils/errorHandling";
import type {
  PlatformOverview,
  OrganizationStats,
  SubscriptionStats,
  ActivityEvent,
} from "../../../types/api";

const PLAN_COLORS: Record<string, string> = {
  enterprise: "bg-green-500",
  professional: "bg-[#FFD700]",
  pro: "bg-[#FFD700]",
  starter: "bg-blue-500",
  basic: "bg-blue-500",
  free: "bg-gray-500",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500",
  suspended: "bg-red-500",
  trial: "bg-yellow-500",
};

export default function ClientManagement() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [orgStats, setOrgStats] = useState<OrganizationStats | null>(null);
  const [subStats, setSubStats] = useState<SubscriptionStats | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await fetchClientManagementData();

      setOverview(result.overview);
      setOrgStats(result.orgStats);
      setSubStats(result.subStats);
      setActivity(result.activity);
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      setError(normalized.message);
      logError(err, 'ClientManagement.fetchData');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading client data…" />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchData} fullScreen />;
  }

  if (!overview || !orgStats || !subStats) return null;

  const totalOrgs = overview.totalOrganizations;
  const activeOrgs = orgStats.byStatus.find((s) => s.status === "active")?.count ?? 0;
  const suspendedOrgs = orgStats.byStatus.find((s) => s.status === "suspended")?.count ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Client Management</h1>
        <p className="text-gray-400 mt-1">Platform organization analytics &amp; activity</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SuperAdminStatCard
          label="Total Organizations"
          value={totalOrgs}
          icon={<Users size={20} className="text-black" />}
        />
        <SuperAdminStatCard
          label="Active"
          value={activeOrgs}
          icon={<Building2 size={20} className="text-black" />}
        />
        <SuperAdminStatCard
          label="Suspended"
          value={suspendedOrgs}
          icon={<Building2 size={20} className="text-black" />}
        />
        <SuperAdminStatCard
          label="Avg Seats / Org"
          value={orgStats.averageSeatCount.toFixed(1)}
          icon={<TrendingUp size={20} className="text-black" />}
        />
      </div>

      {/* Plan Distribution & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Subscriptions by Plan */}
        <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Subscriptions by Plan</h2>
          <div className="space-y-3">
            {subStats.subscriptionsByPlan.map((entry) => {
              const pct = totalOrgs > 0 ? Math.round((entry.count / totalOrgs) * 100) : 0;
              return (
                <div key={entry.plan}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-300 capitalize">{entry.plan}</span>
                    <span className="text-white font-medium">{entry.count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${PLAN_COLORS[entry.plan] ?? "bg-gray-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Organizations by Status */}
        <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Organizations by Status</h2>
          <div className="space-y-3">
            {orgStats.byStatus.map((entry) => {
              const pct = totalOrgs > 0 ? Math.round((entry.count / totalOrgs) * 100) : 0;
              return (
                <div key={entry.status}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-300 capitalize">{entry.status}</span>
                    <span className="text-white font-medium">{entry.count} ({pct}%)</span>
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
          <div className="mt-6 pt-4 border-t border-[#333] text-sm text-gray-400 space-y-1">
            <p>Avg catalog items per org: <span className="text-white font-medium">{orgStats.averageCatalogItemCount.toFixed(1)}</span></p>
            <p>Avg seats per org: <span className="text-white font-medium">{orgStats.averageSeatCount.toFixed(1)}</span></p>
          </div>
        </div>
      </div>

      {/* Growth Trend */}
      {orgStats.growthTrend.length > 0 && (
        <div className="bg-[#121212] border border-[#333] rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Organization Growth</h2>
          <div className="flex items-end gap-1 h-32">
            {orgStats.growthTrend.map((point) => {
              const newOrgs = point.newOrganizations ?? 0;
              const maxNew = Math.max(...orgStats.growthTrend.map((p) => p.newOrganizations ?? 0), 1);
              const heightPct = Math.round((newOrgs / maxNew) * 100);
              return (
                <div key={point.period} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-400">{newOrgs}</span>
                  <div
                    className="w-full bg-[#FFD700] rounded-t"
                    style={{ height: `${heightPct}%`, minHeight: newOrgs > 0 ? "4px" : "0" }}
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

      {/* Recent Activity Feed (from GET /admin/analytics/activity) */}
      {activity.length > 0 && (
        <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-[#FFD700]" />
            <h2 className="text-lg font-bold text-white">Recent Platform Activity</h2>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activity.slice(0, 20).map((event, idx) => (
              <div
                key={`${event.timestamp}-${idx}`}
                className="flex items-center justify-between py-2 border-b border-[#222] last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      event.eventType.includes("succeeded") || event.eventType.includes("upgraded")
                        ? "bg-green-500"
                        : event.eventType.includes("failed") || event.eventType.includes("cancelled")
                          ? "bg-red-500"
                          : "bg-[#FFD700]"
                    }`}
                  />
                  <span className="text-sm text-gray-300 capitalize">
                    {event.eventType.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {event.amount !== undefined && (
                    <span className="text-sm text-white font-medium">
                      ${event.amount.toLocaleString()}
                    </span>
                  )}
                  {event.plan && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFD700]/20 text-[#FFD700] capitalize">
                      {event.plan}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
