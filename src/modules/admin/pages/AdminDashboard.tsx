import { useState, useEffect } from 'react';
import { Users, Calendar, TrendingUp, DollarSign } from "lucide-react";
import { StatCard } from "../components";
import { getUsers, getLoans, getInvoicesSummary } from '../../../services/adminService';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEvents: 0,
    attendance: '0%',
    monthlySpend: '$0',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all required data in parallel
        const [usersResponse, loansResponse, invoicesResponse] = await Promise.all([
          getUsers(1, 100),
          getLoans(1, 100),
          getInvoicesSummary(),
        ]);

        let totalEmployees = 0;
        if (usersResponse.status === 'success' && usersResponse.data?.users) {
          totalEmployees = usersResponse.data.users.length;
        }

        let activeEvents = 0;
        let totalAttendees = 0;
        let totalCapacity = 0;
        if (loansResponse.status === 'success' && loansResponse.data?.loans) {
          const now = new Date();
          activeEvents = loansResponse.data.loans.filter((loan: any) => {
            const startDate = new Date(loan.start_date);
            const endDate = new Date(loan.end_date);
            return startDate <= now && now <= endDate;
          }).length;

          totalAttendees = loansResponse.data.loans.reduce((sum: number, loan: any) => sum + (loan.borrowed_items?.length || 0), 0);
          totalCapacity = loansResponse.data.loans.reduce((sum: number, loan: any) => sum + (loan.items?.length || 0), 0);
        }

        const attendance = totalCapacity > 0 ? Math.round((totalAttendees / totalCapacity) * 100) : 0;

        let monthlySpend = '$0';
        if (invoicesResponse.status === 'success' && invoicesResponse.data?.summary?.total_amount) {
          monthlySpend = `$${invoicesResponse.data.summary.total_amount.toLocaleString()}`;
        }

        setStats({
          totalEmployees,
          activeEvents,
          attendance: `${attendance}%`,
          monthlySpend,
        });
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
        console.error('Dashboard error:', err);
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
        <div className="text-center text-gray-400 py-8">Loading dashboard data...</div>
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
        <p className="text-gray-400">
          Welcome back! Here's your overview
        </p>
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
