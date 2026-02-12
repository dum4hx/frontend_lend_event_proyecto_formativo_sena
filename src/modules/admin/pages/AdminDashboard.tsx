import { useState, useEffect } from "react";
import { Users, Calendar, TrendingUp, DollarSign } from "lucide-react";
import { StatCard } from "../components";
import {
  getUsers,
  getLoans,
  getInvoicesSummary,
} from "../../../services/adminService";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEvents: 0,
    attendance: "0%",
    monthlySpend: "$0",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all required data in parallel
        const [usersRes, loansRes, invoicesRes] = await Promise.all([
          getUsers({ page: 1, limit: 100 }),
          getLoans({ page: 1, limit: 100 }),
          getInvoicesSummary(),
        ]);

        const totalEmployees = usersRes.data.users?.length ?? 0;

        let activeEvents = 0;
        let totalAttendees = 0;
        let totalCapacity = 0;
        const loans = loansRes.data.loans ?? [];
        const now = new Date();
        activeEvents = loans.filter((loan: Record<string, unknown>) => {
          const startDate = new Date(loan.start_date as string);
          const endDate = new Date(loan.end_date as string);
          return startDate <= now && now <= endDate;
        }).length;

        totalAttendees = loans.reduce(
          (sum: number, loan: Record<string, unknown>) =>
            sum + ((loan.borrowed_items as unknown[])?.length || 0),
          0,
        );
        totalCapacity = loans.reduce(
          (sum: number, loan: Record<string, unknown>) =>
            sum + ((loan.items as unknown[])?.length || 0),
          0,
        );

        const attendance =
          totalCapacity > 0
            ? Math.round((totalAttendees / totalCapacity) * 100)
            : 0;

        let monthlySpend = "$0";
        const summary = invoicesRes.data as Record<string, unknown>;
        const totalAmount = (summary?.summary as Record<string, unknown>)
          ?.total_amount;
        if (typeof totalAmount === "number") {
          monthlySpend = `$${totalAmount.toLocaleString()}`;
        }

        setStats({
          totalEmployees,
          activeEvents,
          attendance: `${attendance}%`,
          monthlySpend,
        });
        setError(null);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load dashboard data";
        setError(message);
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Loading your overview...</p>
        </div>
        <div className="text-center text-gray-400 py-8">
          Loading dashboard data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Error loading dashboard</p>
        </div>
        <div className="text-center text-red-400 py-8">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">Welcome back! Here's your overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Total Employees"
          value={stats.totalEmployees}
          icon={<Users size={28} />}
          trend="+12%"
          trendUp
        />

        <StatCard
          label="Active Events"
          value={stats.activeEvents}
          icon={<Calendar size={28} />}
          trend="+24%"
          trendUp
        />

        <StatCard
          label="Event Attendance"
          value={stats.attendance}
          icon={<TrendingUp size={28} />}
          trend="+5%"
          trendUp
        />

        <StatCard
          label="Monthly Spend"
          value={stats.monthlySpend}
          icon={<DollarSign size={28} />}
          trend="-8%"
          trendUp={false}
        />
      </div>
    </div>
  );
}
