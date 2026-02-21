import { useState, useEffect } from "react";
import { Package, AlertCircle, TrendingUp, MapPin } from "lucide-react";
import { StatCard } from "../components/StatCard";

export default function WarehouseOperatorDashboard() {
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockAlerts: 0,
    activeLocations: 0,
    stockMovementsToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // TODO: Replace with actual API calls when available
        // For now, using placeholder data
        setStats({
          totalItems: 1250,
          lowStockAlerts: 5,
          activeLocations: 8,
          stockMovementsToday: 32,
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
          <h1 className="text-3xl font-bold text-white">Warehouse Dashboard</h1>
          <p className="text-gray-400">Loading your inventory overview...</p>
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
          <h1 className="text-3xl font-bold text-white">Warehouse Dashboard</h1>
          <p className="text-gray-400">Error loading dashboard</p>
        </div>
        <div className="text-center text-red-400 py-8">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Warehouse Dashboard</h1>
        <p className="text-gray-400">Manage your inventory and stock movements</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Items"
          value={stats.totalItems}
          icon={<Package size={32} />}
          trend="2.5% from last week"
          trendUp={true}
        />
        <StatCard
          label="Low Stock Alerts"
          value={stats.lowStockAlerts}
          icon={<AlertCircle size={32} />}
          trend="Action needed"
          trendUp={false}
        />
        <StatCard
          label="Active Locations"
          value={stats.activeLocations}
          icon={<MapPin size={32} />}
          trend="All operational"
          trendUp={true}
        />
        <StatCard
          label="Stock Movements Today"
          value={stats.stockMovementsToday}
          icon={<TrendingUp size={32} />}
          trend="4 more than average"
          trendUp={true}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Movements */}
        <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Stock Movements</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#333]">
              <div>
                <p className="text-white font-medium">Item SKU-001 moved</p>
                <p className="text-gray-500 text-sm">From Rack A1 to B3</p>
              </div>
              <p className="text-gray-400 text-sm">2 mins ago</p>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-[#333]">
              <div>
                <p className="text-white font-medium">Shipment received</p>
                <p className="text-gray-500 text-sm">25 units of SKU-045</p>
              </div>
              <p className="text-gray-400 text-sm">1 hour ago</p>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-[#333]">
              <div>
                <p className="text-white font-medium">Count discrepancy</p>
                <p className="text-gray-500 text-sm">Location C2 - 3 units missing</p>
              </div>
              <p className="text-gray-400 text-sm">3 hours ago</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Outbound shipment</p>
                <p className="text-gray-500 text-sm">50 units to customer</p>
              </div>
              <p className="text-gray-400 text-sm">1 day ago</p>
            </div>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-[#121212] border border-[#333] rounded-[12px] p-6">
          <h2 className="text-xl font-bold text-white mb-4">Low Stock Items</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#333]">
              <div>
                <p className="text-white font-medium">SKU-015</p>
                <p className="text-gray-500 text-sm">Current: 5 units</p>
              </div>
              <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded text-xs font-semibold">
                Critical
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-[#333]">
              <div>
                <p className="text-white font-medium">SKU-032</p>
                <p className="text-gray-500 text-sm">Current: 12 units</p>
              </div>
              <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded text-xs font-semibold">
                Low
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-[#333]">
              <div>
                <p className="text-white font-medium">SKU-047</p>
                <p className="text-gray-500 text-sm">Current: 8 units</p>
              </div>
              <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded text-xs font-semibold">
                Critical
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">SKU-061</p>
                <p className="text-gray-500 text-sm">Current: 15 units</p>
              </div>
              <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded text-xs font-semibold">
                Low
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
