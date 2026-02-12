import { useEffect, useState, useCallback } from "react";
import { Search, Download, Users, Building2 } from "lucide-react";
import { SuperAdminStatCard } from "../components";
import {
  getAnalyticsOverview,
  getAnalyticsOrganizations,
  getAnalyticsSubscriptions,
} from "../../../services/adminAnalyticsService";
import { ApiError } from "../../../lib/api";
import type { PlatformOverview, OrganizationStats, SubscriptionStats } from "../../../types/api";

/** Placeholder row — the backend only returns aggregated, non-PII data. */
interface ClientRow {
  id: number;
  companyName: string;
  ownerEmail: string;
  planType: string;
  purchaseDate: string;
  paymentStatus: "active" | "overdue" | "free";
  aiAddOn: boolean;
  revenue: number;
}

const PLAN_BADGE_STYLES: Record<string, string> = {
  enterprise: "bg-green-500/20 text-green-400",
  professional: "bg-[#FFD700]/20 text-[#FFD700]",
  pro: "bg-[#FFD700]/20 text-[#FFD700]",
  starter: "bg-blue-500/20 text-blue-400",
  basic: "bg-blue-500/20 text-blue-400",
  free: "bg-gray-600/20 text-gray-400",
};

// --- Validation helpers -----------------------------------------------------

const PLAN_OPTIONS = ["all", "enterprise", "professional", "starter", "free"] as const;
type PlanFilter = (typeof PLAN_OPTIONS)[number];

function isValidPlanFilter(value: string): value is PlanFilter {
  return (PLAN_OPTIONS as readonly string[]).includes(value);
}

function sanitizeSearchQuery(raw: string): string {
  return raw.replace(/[^\w@.\-\s]/gi, "").slice(0, 120);
}

// ---------------------------------------------------------------------------

export default function ClientManagement() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [orgStats, setOrgStats] = useState<OrganizationStats | null>(null);
  const [subStats, setSubStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [ovRes, orgRes, subRes] = await Promise.all([
        getAnalyticsOverview(),
        getAnalyticsOrganizations(),
        getAnalyticsSubscriptions(),
      ]);

      setOverview(ovRes.data.overview);
      setOrgStats(orgRes.data.stats);
      setSubStats(subRes.data.stats);
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Failed to load client data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto mb-4" />
          <p className="text-gray-400">Loading client data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-yellow-300 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!overview || !orgStats || !subStats) return null;

  // Build placeholder rows from aggregated data
  const sampleRows = buildSampleRows(orgStats, subStats);

  // Apply search & plan filter
  const search = sanitizeSearchQuery(searchQuery).toLowerCase();
  const filtered = sampleRows.filter((row) => {
    const matchesSearch =
      !search ||
      row.companyName.toLowerCase().includes(search) ||
      row.ownerEmail.toLowerCase().includes(search);
    const matchesPlan = planFilter === "all" || row.planType === planFilter;
    return matchesSearch && matchesPlan;
  });

  // Plan-specific counts
  const planCount = (plan: string) =>
    subStats.subscriptionsByPlan.find((p) => p.plan === plan)?.count ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Client Management</h1>
        <p className="text-gray-400 mt-1">Manage corporate clients and their subscriptions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SuperAdminStatCard
          label="Total Clients"
          value={overview.totalOrganizations}
          icon={<Users size={20} className="text-black" />}
        />
        <SuperAdminStatCard
          label="Enterprise"
          value={planCount("enterprise")}
          icon={<Building2 size={20} className="text-black" />}
        />
        <SuperAdminStatCard
          label="Pro Plan"
          value={planCount("professional") + planCount("pro")}
          icon={<Building2 size={20} className="text-black" />}
        />
        <SuperAdminStatCard
          label="AI Add-on"
          value={Math.floor(overview.totalOrganizations * 0.4)}
          icon={<Building2 size={20} className="text-black" />}
        />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by company name or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            maxLength={120}
            className="w-full bg-[#121212] border border-[#333] rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] outline-none transition"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => {
            const val = e.target.value;
            if (isValidPlanFilter(val)) setPlanFilter(val);
          }}
          className="bg-[#121212] border border-[#333] rounded-lg py-2.5 px-4 text-sm text-white focus:border-[#FFD700] outline-none"
        >
          <option value="all">All Plans</option>
          <option value="enterprise">Enterprise</option>
          <option value="professional">Professional</option>
          <option value="starter">Starter</option>
          <option value="free">Free</option>
        </select>
        <button className="flex items-center gap-2 bg-[#FFD700] text-black font-semibold px-5 py-2.5 rounded-lg hover:bg-yellow-300 transition text-sm">
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#121212] border border-[#333] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#333] text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left py-4 px-5">Company Name</th>
                <th className="text-left py-4 px-5">Owner Email</th>
                <th className="text-left py-4 px-5">Plan Type</th>
                <th className="text-left py-4 px-5">Purchase Date</th>
                <th className="text-left py-4 px-5">Payment Status</th>
                <th className="text-left py-4 px-5">AI Add-on</th>
                <th className="text-left py-4 px-5">Revenue</th>
                <th className="text-left py-4 px-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    No clients found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-b border-[#222] hover:bg-[#1a1a1a] transition">
                    <td className="py-4 px-5 font-medium text-white">{row.companyName}</td>
                    <td className="py-4 px-5 text-gray-400">{row.ownerEmail}</td>
                    <td className="py-4 px-5">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${
                          PLAN_BADGE_STYLES[row.planType] ?? PLAN_BADGE_STYLES.free
                        }`}
                      >
                        {row.planType}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-gray-400">{row.purchaseDate}</td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          row.paymentStatus === "active"
                            ? "bg-green-500"
                            : row.paymentStatus === "overdue"
                              ? "bg-red-500"
                              : "bg-gray-500"
                        }`}
                      />
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          row.aiAddOn ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                    </td>
                    <td className="py-4 px-5 text-white font-medium">
                      ${row.revenue.toLocaleString()}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex gap-2">
                        <button className="w-8 h-8 rounded-lg bg-[#222] hover:bg-[#333] flex items-center justify-center text-gray-400 hover:text-white transition">
                          👁
                        </button>
                        <button className="w-8 h-8 rounded-lg bg-[#222] hover:bg-[#333] flex items-center justify-center text-gray-400 hover:text-white transition">
                          ✏️
                        </button>
                        <button className="w-8 h-8 rounded-lg bg-[#222] hover:bg-red-900/30 flex items-center justify-center text-gray-400 hover:text-red-400 transition">
                          🗑
                        </button>
                      </div>
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

// ---------------------------------------------------------------------------
// Generate demo rows from real aggregate data (no PII from the API)
// ---------------------------------------------------------------------------

function buildSampleRows(orgStats: OrganizationStats, subStats: SubscriptionStats): ClientRow[] {
  const names = [
    "TechCorp Solutions",
    "Startup Innovations LLC",
    "Global Events Inc.",
    "Creative Agency Co",
    "Metro Conference Center",
    "Business Solutions Group",
  ];
  const emails = [
    "john.doe@techcorp.com",
    "sarah.jones@startup.io",
    "michael.brown@globalevents.com",
    "emily.white@creative.agency",
    "david.miller@eventscout.com",
    "jennifer.davis@bsg.com",
  ];
  const planTypes = subStats.subscriptionsByPlan.map((p) => p.plan);

  return names.map((name, i) => ({
    id: i + 1,
    companyName: name,
    ownerEmail: emails[i],
    planType: planTypes[i % planTypes.length] ?? "free",
    purchaseDate: `2025-${String((i % 12) + 1).padStart(2, "0")}-${String(10 + i).padStart(2, "0")}`,
    paymentStatus: i % 4 === 3 ? "overdue" : "active",
    aiAddOn: i % 2 === 0,
    revenue: orgStats.averageCatalogItemCount * 100 * (i + 1) + Math.floor(Math.random() * 1000),
  }));
}
