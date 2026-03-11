import { useState } from "react";
import {
  Plus,
  Package,
  AlertCircle,
  Search,
  ChevronDown,
} from "lucide-react";

interface Rental {
  id: string;
  rentalId: string;
  customer: string;
  materials: string[];
  startDate: string;
  endDate: string;
  daysElapsed: number;
  totalDays: number;
  status: "active" | "pending" | "returned" | "overdue";
  depositAmount: number;
}

const SAMPLE_RENTALS: Rental[] = [
  {
    id: "1",
    rentalId: "RNT-2024-001",
    customer: "Acme Corporation",
    materials: ["Office Chairs (12)", "Desk Lamps (8)", "Conference Table (1)"],
    startDate: "2024-01-15",
    endDate: "2024-01-22",
    daysElapsed: 7,
    totalDays: 7,
    status: "returned",
    depositAmount: 1500,
  },
  {
    id: "2",
    rentalId: "RNT-2024-002",
    customer: "Tech Solutions Inc",
    materials: ["Projectors (2)", "Whiteboards (3)", "Tech Equipment (5)"],
    startDate: "2024-01-18",
    endDate: "2024-01-25",
    daysElapsed: 5,
    totalDays: 7,
    status: "active",
    depositAmount: 2000,
  },
  {
    id: "3",
    rentalId: "RNT-2024-003",
    customer: "Creative Events Ltd",
    materials: ["Furniture Bundle (20)", "Lighting Kit (1)"],
    startDate: "2024-01-20",
    endDate: "2024-01-25",
    daysElapsed: 3,
    totalDays: 5,
    status: "active",
    depositAmount: 3000,
  },
  {
    id: "4",
    rentalId: "RNT-2024-004",
    customer: "Business Solutions",
    materials: ["Office Setup (8)", "Accessories (5)"],
    startDate: "2024-01-10",
    endDate: "2024-01-17",
    daysElapsed: 12,
    totalDays: 7,
    status: "overdue",
    depositAmount: 1200,
  },
  {
    id: "5",
    rentalId: "RNT-2023-005",
    customer: "Global Industries",
    materials: ["Executive Package (15)"],
    startDate: "2023-12-20",
    endDate: "2024-01-10",
    daysElapsed: 21,
    totalDays: 21,
    status: "returned",
    depositAmount: 4500,
  },
];

export default function Rentals() {
  const [rentals] = useState<Rental[]>(SAMPLE_RENTALS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const filtered = rentals.filter((rental) => {
    const matchesSearch = rental.rentalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || rental.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const statuses = ["all", ...Array.from(new Set(rentals.map((r) => r.status)))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "returned":
        return "bg-blue-500/20 text-blue-400";
      case "overdue":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getProgressWidth = (elapsed: number, total: number) => {
    return `${(elapsed / total) * 100}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Rentals</h1>
          <p className="text-gray-400 mt-1">Track active rentals and returns</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-[8px] font-semibold transition-all gold-action-btn">
          <Plus size={20} />
          New Rental
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search rentals..."
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

      {/* Rentals List */}
      <div className="space-y-4">
        {filtered.map((rental) => (
          <div
            key={rental.id}
            className="bg-[#1a1a1a] border border-[#333] rounded-[12px] p-6 hover:border-[#FFD700] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{rental.rentalId}</h3>
                <p className="text-gray-400 text-sm mt-1">{rental.customer}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(rental.status)}`}>
                  {rental.status}
                </span>
                {rental.status === "overdue" && (
                  <AlertCircle size={20} className="text-red-400" />
                )}
              </div>
            </div>

            {/* Materials */}
            <div className="mb-4 pb-4 border-b border-[#333]">
              <p className="text-gray-400 text-sm mb-2 font-semibold">Materials:</p>
              <div className="flex flex-wrap gap-2">
                {rental.materials.map((material, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 px-3 py-1 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-full text-xs text-gray-400"
                  >
                    <Package size={12} />
                    {material}
                  </span>
                ))}
              </div>
            </div>

            {/* Dates and Progress */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400 text-xs mb-1">Rental Period</p>
                <p className="text-white font-semibold text-sm">
                  {rental.startDate} to {rental.endDate}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-2">Progress ({rental.daysElapsed}/{rental.totalDays} days)</p>
                <div className="w-full bg-[#121212] rounded-full h-2">
                  <div
                    className="bg-[#FFD700] h-2 rounded-full transition-all"
                    style={{ width: getProgressWidth(rental.daysElapsed, rental.totalDays) }}
                  ></div>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Deposit</p>
                <p className="text-[#FFD700] font-bold">${rental.depositAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No rentals found</p>
        </div>
      )}
    </div>
  );
}
