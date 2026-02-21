import { useState } from "react";
import {
  Package,
  Grid,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { StatCard } from "../components";

interface DashboardStats {
  totalMaterials: number;
  totalCategories: number;
  activePlans: number;
  outOfStockItems: number;
}

interface RecentActivity {
  id: string;
  action: string;
  material: string;
  timestamp: string;
}

const SAMPLE_STATS: DashboardStats = {
  totalMaterials: 156,
  totalCategories: 12,
  activePlans: 28,
  outOfStockItems: 5,
};

const SAMPLE_ACTIVITIES: RecentActivity[] = [
  {
    id: "1",
    action: "Created",
    material: "Office Chair - Model A",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    action: "Updated Price",
    material: "Desk Lamp - LED",
    timestamp: "5 hours ago",
  },
  {
    id: "3",
    action: "Added to Plan",
    material: "Whiteboard - Wall Mount",
    timestamp: "1 day ago",
  },
  {
    id: "4",
    action: "Category Created",
    material: "Furniture Category",
    timestamp: "2 days ago",
  },
  {
    id: "5",
    action: "Stock Adjusted",
    material: "Projector - 4K",
    timestamp: "3 days ago",
  },
];

export default function LocationManagerDashboard() {
  const [stats] = useState<DashboardStats>(SAMPLE_STATS);
  const [activities] = useState<RecentActivity[]>(SAMPLE_ACTIVITIES);
  const [isLoading] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-2">Manage your material inventory and catalog</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Materials"
          value={stats.totalMaterials}
          icon={<Package size={32} />}
          trend="12% from last month"
          trendUp={true}
        />
        <StatCard
          label="Categories"
          value={stats.totalCategories}
          icon={<Grid size={32} />}
          trend="Organized"
          trendUp={true}
        />
        <StatCard
          label="Active Plans"
          value={stats.activePlans}
          icon={<TrendingUp size={32} />}
          trend="8% growth"
          trendUp={true}
        />
        <StatCard
          label="Out of Stock"
          value={stats.outOfStockItems}
          icon={<AlertTriangle size={32} />}
          trend="Action needed"
          trendUp={false}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-[12px] p-6">
        <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No activities yet</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 bg-[#121212] rounded-[8px] border border-[#333] hover:border-[#FFD700] transition-all"
              >
                <div>
                  <p className="text-white font-medium">{activity.material}</p>
                  <p className="text-gray-400 text-sm">{activity.action}</p>
                </div>
                <p className="text-gray-500 text-sm">{activity.timestamp}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#171717] border border-[#FFD700] border-opacity-20 rounded-[12px] p-6 cursor-pointer hover:border-opacity-100 transition-all">
          <h3 className="text-lg font-bold text-white mb-2">Add New Material</h3>
          <p className="text-gray-400 text-sm">Create a new material entry in your catalog</p>
        </div>
        <div className="bg-[#171717] border border-[#FFD700] border-opacity-20 rounded-[12px] p-6 cursor-pointer hover:border-opacity-100 transition-all">
          <h3 className="text-lg font-bold text-white mb-2">Create Material Plan</h3>
          <p className="text-gray-400 text-sm">Set up new rental plans for materials</p>
        </div>
      </div>
    </div>
  );
}
