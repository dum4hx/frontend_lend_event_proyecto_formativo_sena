import { useEffect, useState, useCallback } from "react";
import { Cpu, MessageSquare, Clock, DollarSign } from "lucide-react";
import { SuperAdminStatCard } from "../components";
import { getAnalyticsDashboard } from "../../../services/adminAnalyticsService";
import { ApiError } from "../../../lib/api";
import type { AdminDashboardData } from "../../../types/api";

// --- Types for display-only mock AI data -----------------------------------

interface TokenUsagePoint {
  date: string;
  tokens: number;
}

interface ResponseTimePoint {
  hour: string;
  avgMs: number;
}

interface ClientUsageRow {
  client: string;
  tokensUsed: number;
  totalQueries: number;
  avgTokensPerQuery: number;
  cost: number;
  utilization: number; // 0-100
}

// ---------------------------------------------------------------------------

function generateTokenTrend(): TokenUsagePoint[] {
  const points: TokenUsagePoint[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    points.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      tokens: 100000 + Math.floor(Math.random() * 300000) + i * 15000,
    });
  }
  return points;
}

function generateResponseTimeTrend(): ResponseTimePoint[] {
  const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
  return hours.map((hour) => ({
    hour,
    avgMs: 800 + Math.floor(Math.random() * 900),
  }));
}

function generateClientUsage(): ClientUsageRow[] {
  return [
    {
      client: "TechCorp",
      tokensUsed: 89000,
      totalQueries: 1234,
      avgTokensPerQuery: 72,
      cost: 44.5,
      utilization: 92,
    },
    {
      client: "Global Events",
      tokensUsed: 67000,
      totalQueries: 892,
      avgTokensPerQuery: 75,
      cost: 33.5,
      utilization: 78,
    },
    {
      client: "Premium Venues",
      tokensUsed: 54000,
      totalQueries: 743,
      avgTokensPerQuery: 73,
      cost: 27.0,
      utilization: 65,
    },
    {
      client: "Startup Innovations",
      tokensUsed: 41000,
      totalQueries: 567,
      avgTokensPerQuery: 72,
      cost: 20.5,
      utilization: 52,
    },
    {
      client: "Metro Conference",
      tokensUsed: 32000,
      totalQueries: 423,
      avgTokensPerQuery: 76,
      cost: 16.0,
      utilization: 41,
    },
  ];
}

// ---------------------------------------------------------------------------

export default function AIChatbotMonitor() {
  const [, setDashboard] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Display-only data generated client-side
  const [tokenTrend] = useState(generateTokenTrend);
  const [responseTrend] = useState(generateResponseTimeTrend);
  const [clientUsage] = useState(generateClientUsage);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAnalyticsDashboard();
      setDashboard(res.data);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Failed to load AI analytics.");
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
          <p className="text-gray-400">Loading AI metrics…</p>
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

  const totalTokens = clientUsage.reduce((s, c) => s + c.tokensUsed, 0);
  const totalQueries = clientUsage.reduce((s, c) => s + c.totalQueries, 0);
  const totalCost = clientUsage.reduce((s, c) => s + c.cost, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">AI Chatbot Monitor</h1>
        <p className="text-gray-400 mt-1">
          Track AI token usage, performance metrics, and chatbot analytics
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SuperAdminStatCard
          label="Total Tokens Used"
          value={`${(totalTokens / 1_000_000).toFixed(2)}M`}
          icon={<Cpu size={20} className="text-black" />}
          trend="Last 7 days"
          trendUp
        />
        <SuperAdminStatCard
          label="Total Queries"
          value={totalQueries.toLocaleString()}
          icon={<MessageSquare size={20} className="text-black" />}
          trend="Across all clients"
          trendUp
        />
        <SuperAdminStatCard
          label="Avg Response Time"
          value="1.5s"
          icon={<Clock size={20} className="text-black" />}
          trend="Below Threshold"
          trendUp
        />
        <SuperAdminStatCard
          label="Total API Cost"
          value={`$${totalCost.toFixed(2)}`}
          icon={<DollarSign size={20} className="text-black" />}
          trend="Last 7 days"
          trendUp={false}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Token Usage Trend */}
        <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Token Usage Trend</h2>
              <p className="text-xs text-gray-500">Daily token consumption</p>
            </div>
          </div>
          <AreaChart data={tokenTrend} />
        </div>

        {/* Response Time Analysis */}
        <div className="bg-[#121212] border border-[#333] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Response Time Analysis</h2>
              <p className="text-xs text-gray-500">Average response time by hour</p>
            </div>
          </div>
          <ResponseTimeChart data={responseTrend} />
        </div>
      </div>

      {/* Top Clients by Token Usage */}
      <div className="bg-[#121212] border border-[#333] rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-1">Top Clients by Token Usage</h2>
        <p className="text-xs text-gray-500 mb-6">Breakdown of AI usage by corporate client</p>

        <div className="flex items-end justify-around h-40 gap-3 mb-4">
          {clientUsage.map((c) => {
            const maxTokens = Math.max(...clientUsage.map((r) => r.tokensUsed));
            const height = Math.max(10, (c.tokensUsed / maxTokens) * 100);
            return (
              <div key={c.client} className="flex flex-col items-center flex-1">
                <p className="text-xs text-gray-400 mb-1">{(c.tokensUsed / 1000).toFixed(0)}k</p>
                <div
                  className="w-full max-w-[60px] bg-[#FFD700] rounded-t-lg hover:bg-yellow-300 transition"
                  style={{ height: `${height}%` }}
                />
                <p className="text-xs text-gray-400 mt-2 text-center truncate w-full">{c.client}</p>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 justify-center text-xs text-gray-500 mt-4">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#FFD700] rounded" /> Tokens Used
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#FF8C00] rounded" /> Expenses
          </div>
        </div>
      </div>

      {/* Client Usage Details Table */}
      <div className="bg-[#121212] border border-[#333] rounded-xl overflow-hidden">
        <div className="p-6 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            📊 Client Usage Details
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#333] text-gray-400 text-xs uppercase">
                <th className="text-left py-3 px-6">Client</th>
                <th className="text-left py-3 px-6">Tokens Used</th>
                <th className="text-left py-3 px-6">Total Queries</th>
                <th className="text-left py-3 px-6">Avg Tokens/Query</th>
                <th className="text-left py-3 px-6">Cost</th>
                <th className="text-left py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {clientUsage.map((row) => (
                <tr
                  key={row.client}
                  className="border-b border-[#222] hover:bg-[#1a1a1a] transition"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FFD700]/20 flex items-center justify-center">
                        <span className="text-[#FFD700] font-bold text-xs">
                          {row.client.charAt(0)}
                        </span>
                      </div>
                      <span className="text-white font-medium">{row.client}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-white">{row.tokensUsed.toLocaleString()}</td>
                  <td className="py-4 px-6 text-gray-400">{row.totalQueries.toLocaleString()}</td>
                  <td className="py-4 px-6 text-gray-400">{row.avgTokensPerQuery}</td>
                  <td className="py-4 px-6 text-white font-medium">${row.cost.toFixed(2)}</td>
                  <td className="py-4 px-6">
                    <div className="w-20 h-2 bg-[#333] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${row.utilization}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart components
// ---------------------------------------------------------------------------

function AreaChart({ data }: { data: TokenUsagePoint[] }) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.tokens);
  const max = Math.max(...values) * 1.1;
  const min = 0;

  const width = 700;
  const height = 180;
  const padX = 50;
  const padY = 10;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * chartW;
    const y = padY + chartH - ((v - min) / (max - min)) * chartH;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${padY + chartH} L${points[0].x},${padY + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = padY + chartH * (1 - f);
        const label = Math.round(min + (max - min) * f);
        return (
          <g key={f}>
            <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#333" strokeWidth="0.5" />
            <text x={padX - 8} y={y + 3} fill="#666" fontSize="8" textAnchor="end">
              {(label / 1000).toFixed(0)}k
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#goldGrad)" opacity="0.3" />
      <path d={linePath} fill="none" stroke="#FFD700" strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#FFD700" />
      ))}

      {/* X labels */}
      {data
        .filter((_, i) => i % 2 === 0)
        .map((d, i) => {
          const idx = i * 2;
          const x = padX + (idx / (data.length - 1)) * chartW;
          return (
            <text key={i} x={x} y={height - 1} fill="#666" fontSize="8" textAnchor="middle">
              {d.date}
            </text>
          );
        })}

      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ResponseTimeChart({ data }: { data: ResponseTimePoint[] }) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.avgMs);
  const max = Math.max(...values) * 1.15;
  const min = Math.min(...values) * 0.85;

  const width = 700;
  const height = 180;
  const padX = 50;
  const padY = 10;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * chartW;
    const y = padY + chartH - ((v - min) / (max - min)) * chartH;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = padY + chartH * (1 - f);
        const label = Math.round(min + (max - min) * f);
        return (
          <g key={f}>
            <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#333" strokeWidth="0.5" />
            <text x={padX - 8} y={y + 3} fill="#666" fontSize="8" textAnchor="end">
              {(label / 1000).toFixed(1)}s
            </text>
          </g>
        );
      })}

      <path d={linePath} fill="none" stroke="#FFD700" strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#FFD700" />
      ))}

      {data.map((d, i) => {
        const x = padX + (i / (data.length - 1)) * chartW;
        return (
          <text key={i} x={x} y={height - 1} fill="#666" fontSize="8" textAnchor="middle">
            {d.hour}
          </text>
        );
      })}
    </svg>
  );
}
