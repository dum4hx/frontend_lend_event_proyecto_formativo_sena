import { useState } from "react";
import {
  Plus,
  Eye,
  Trash2,
  Search,
  ChevronDown,
} from "lucide-react";

interface Order {
  id: string;
  orderId: string;
  customer: string;
  date: string;
  items: number;
  total: number;
  status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";
  rentalStart: string;
  rentalEnd: string;
}

const SAMPLE_ORDERS: Order[] = [
  {
    id: "1",
    orderId: "ORD-2024-001",
    customer: "Acme Corporation",
    date: "2024-01-15",
    items: 12,
    total: 2500,
    status: "completed",
    rentalStart: "2024-01-15",
    rentalEnd: "2024-01-22",
  },
  {
    id: "2",
    orderId: "ORD-2024-002",
    customer: "Tech Solutions Inc",
    date: "2024-01-18",
    items: 8,
    total: 1800,
    status: "in-progress",
    rentalStart: "2024-01-18",
    rentalEnd: "2024-01-25",
  },
  {
    id: "3",
    orderId: "ORD-2024-003",
    customer: "Creative Events Ltd",
    date: "2024-01-20",
    items: 20,
    total: 3200,
    status: "confirmed",
    rentalStart: "2024-01-22",
    rentalEnd: "2024-01-25",
  },
  {
    id: "4",
    orderId: "ORD-2024-004",
    customer: "Business Solutions",
    date: "2024-01-21",
    items: 5,
    total: 1500,
    status: "pending",
    rentalStart: "2024-01-23",
    rentalEnd: "2024-01-30",
  },
  {
    id: "5",
    orderId: "ORD-2024-005",
    customer: "Global Industries",
    date: "2024-01-22",
    items: 15,
    total: 4200,
    status: "cancelled",
    rentalStart: "2024-01-25",
    rentalEnd: "2024-02-01",
  },
];

export default function Orders() {
  const [orders] = useState<Order[]>(SAMPLE_ORDERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const filtered = orders.filter((order) => {
    const matchesSearch = order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const statuses = ["all", ...Array.from(new Set(orders.map((o) => o.status)))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border border-green-500/30";
      case "in-progress":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      case "confirmed":
        return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Orders</h1>
          <p className="text-gray-400 mt-1">Manage rental orders and track status</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-[8px] font-semibold transition-all gold-action-btn">
          <Plus size={20} />
          New Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
          />
        </div>

        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="appearance-none px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white focus:outline-none focus:border-[#FFD700] transition-all cursor-pointer pr-10"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All Status" : status.replace("-", " ")}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
        </div>
      </div>

      {/* Orders Table */}
      <div className="border border-[#333] rounded-[12px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#121212] border-b border-[#333]">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Order ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Items</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Rental Period</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Total</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b border-[#333] hover:bg-[#1a1a1a] transition-all">
                  <td className="px-6 py-4 text-white font-semibold">{order.orderId}</td>
                  <td className="px-6 py-4 text-gray-400">{order.customer}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{order.date}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-[#FFD700]/20 text-[#FFD700] px-3 py-1 rounded-full text-sm font-semibold">
                      {order.items}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {order.rentalStart} to {order.rentalEnd}
                  </td>
                  <td className="px-6 py-4 text-white font-bold">${order.total.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-[#1a1a1a] rounded-[6px] text-gray-400 hover:text-[#FFD700] transition-all">
                        <Eye size={18} />
                      </button>
                      <button className="p-2 hover:bg-[#1a1a1a] rounded-[6px] text-gray-400 transition-all danger-icon-btn">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No orders found</p>
        </div>
      )}
    </div>
  );
}
