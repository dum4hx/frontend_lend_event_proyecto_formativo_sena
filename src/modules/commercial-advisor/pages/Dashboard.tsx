import { useState } from "react";
import {
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "../components";

interface DashboardStats {
  totalOrders: number;
  totalCustomers: number;
  monthlyRevenue: number;
  activeRentals: number;
}

interface RecentOrder {
  id: string;
  orderId: string;
  customer: string;
  total: number;
  status: string;
  date: string;
}

const SAMPLE_STATS: DashboardStats = {
  totalOrders: 342,
  totalCustomers: 156,
  monthlyRevenue: 45800,
  activeRentals: 87,
};

const SAMPLE_ORDERS: RecentOrder[] = [
  {
    id: "1",
    orderId: "ORD-2024-001",
    customer: "Acme Corporation",
    total: 2500,
    status: "completed",
    date: "2 hours ago",
  },
  {
    id: "2",
    orderId: "ORD-2024-002",
    customer: "Tech Solutions Inc",
    total: 1800,
    status: "pending",
    date: "5 hours ago",
  },
  {
    id: "3",
    orderId: "ORD-2024-003",
    customer: "Creative Events Ltd",
    total: 3200,
    status: "in-progress",
    date: "1 day ago",
  },
  {
    id: "4",
    orderId: "ORD-2024-004",
    customer: "Business Solutions",
    total: 1500,
    status: "completed",
    date: "2 days ago",
  },
  {
    id: "5",
    orderId: "ORD-2024-005",
    customer: "Global Industries",
    total: 4200,
    status: "pending",
    date: "3 days ago",
  },
];

export default function CommercialAdvisorDashboard() {
  const [stats] = useState<DashboardStats>(SAMPLE_STATS);
  const [orders] = useState<RecentOrder[]>(SAMPLE_ORDERS);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "in-progress":
        return "bg-blue-500/20 text-blue-400";
      case "cancelled":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white">Sales Dashboard</h1>
        <p className="text-gray-400 mt-2">Track orders, customers, and revenue</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Orders"
          value={stats.totalOrders}
          icon={<ShoppingCart size={32} />}
          trend="15% from last month"
          trendUp={true}
        />
        <StatCard
          label="Customers"
          value={stats.totalCustomers}
          icon={<Users size={32} />}
          trend="8% growth"
          trendUp={true}
        />
        <StatCard
          label="Monthly Revenue"
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          icon={<DollarSign size={32} />}
          trend="22% increase"
          trendUp={true}
        />
        <StatCard
          label="Active Rentals"
          value={stats.activeRentals}
          icon={<TrendingUp size={32} />}
          trend="12 from yesterday"
          trendUp={true}
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-[12px] p-6">
        <h2 className="text-xl font-bold text-white mb-6">Recent Orders</h2>

        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-4 bg-[#121212] rounded-[8px] border border-[#333] hover:border-[#FFD700] transition-all"
            >
              <div className="flex-1">
                <p className="text-white font-semibold">{order.customer}</p>
                <p className="text-gray-400 text-sm">{order.orderId}</p>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-[#FFD700] font-bold">${order.total.toLocaleString()}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                  {order.status.replace("-", " ")}
                </span>
                <span className="text-gray-500 text-sm">{order.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#171717] border border-[#FFD700] border-opacity-20 rounded-[12px] p-6 cursor-pointer hover:border-opacity-100 transition-all">
          <h3 className="text-lg font-bold text-white mb-2">Create New Order</h3>
          <p className="text-gray-400 text-sm">Start a new rental order for a customer</p>
        </div>
        <div className="bg-[#171717] border border-[#FFD700] border-opacity-20 rounded-[12px] p-6 cursor-pointer hover:border-opacity-100 transition-all">
          <h3 className="text-lg font-bold text-white mb-2">Add Customer</h3>
          <p className="text-gray-400 text-sm">Register a new customer in the system</p>
        </div>
      </div>
    </div>
  );
}
