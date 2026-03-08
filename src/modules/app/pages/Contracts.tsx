import { useState } from "react";
import {
  Plus,
  Download,
  Eye,
  Trash2,
  Search,
  FileText,
} from "lucide-react";

interface Contract {
  id: string;
  contractId: string;
  customer: string;
  signDate: string;
  startDate: string;
  endDate: string;
  totalValue: number;
  status: "draft" | "active" | "completed" | "cancelled";
  items: number;
}

const SAMPLE_CONTRACTS: Contract[] = [
  {
    id: "1",
    contractId: "CTR-2024-001",
    customer: "Acme Corporation",
    signDate: "2024-01-10",
    startDate: "2024-01-15",
    endDate: "2024-12-31",
    totalValue: 45000,
    status: "active",
    items: 25,
  },
  {
    id: "2",
    contractId: "CTR-2024-002",
    customer: "Tech Solutions Inc",
    signDate: "2024-01-12",
    startDate: "2024-01-20",
    endDate: "2024-06-30",
    totalValue: 28500,
    status: "active",
    items: 15,
  },
  {
    id: "3",
    contractId: "CTR-2024-003",
    customer: "Creative Events Ltd",
    signDate: "2024-01-05",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    totalValue: 67200,
    status: "active",
    items: 40,
  },
  {
    id: "4",
    contractId: "CTR-2024-004",
    customer: "Business Solutions",
    signDate: "2024-01-18",
    startDate: "2024-02-01",
    endDate: "2024-03-31",
    totalValue: 12500,
    status: "draft",
    items: 8,
  },
  {
    id: "5",
    contractId: "CTR-2023-005",
    customer: "Global Industries",
    signDate: "2023-06-20",
    startDate: "2023-07-01",
    endDate: "2023-12-31",
    totalValue: 54000,
    status: "completed",
    items: 30,
  },
];

export default function Contracts() {
  const [contracts] = useState<Contract[]>(SAMPLE_CONTRACTS);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = contracts.filter(
    (contract) =>
      contract.contractId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400";
      case "draft":
        return "bg-yellow-500/20 text-yellow-400";
      case "completed":
        return "bg-blue-500/20 text-blue-400";
      case "cancelled":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Contracts</h1>
          <p className="text-gray-400 mt-1">Create and manage rental contracts</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black rounded-[8px] font-semibold hover:bg-[#FFC700] transition-all">
          <Plus size={20} />
          New Contract
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
        <input
          type="text"
          placeholder="Search contracts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
        />
      </div>

      {/* Contracts List */}
      <div className="space-y-4">
        {filtered.map((contract) => (
          <div
            key={contract.id}
            className="bg-[#1a1a1a] border border-[#333] rounded-[12px] p-6 hover:border-[#FFD700] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FileText size={20} className="text-[#FFD700]" />
                  <h3 className="text-lg font-bold text-white">{contract.contractId}</h3>
                </div>
                <p className="text-gray-400">{contract.customer}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-[#121212] rounded-[6px] text-gray-400 hover:text-[#FFD700] transition-all">
                  <Download size={18} />
                </button>
                <button className="p-2 hover:bg-[#121212] rounded-[6px] text-gray-400 hover:text-[#FFD700] transition-all">
                  <Eye size={18} />
                </button>
                <button className="p-2 hover:bg-[#121212] rounded-[6px] text-gray-400 hover:text-red-400 transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Contract Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-[#333]">
              <div>
                <p className="text-gray-400 text-xs mb-1">Sign Date</p>
                <p className="text-white font-semibold">{contract.signDate}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Period</p>
                <p className="text-white font-semibold text-sm">{contract.startDate} to {contract.endDate}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Items</p>
                <p className="text-[#FFD700] font-bold">{contract.items}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Value</p>
                <p className="text-white font-bold">${contract.totalValue.toLocaleString()}</p>
              </div>
            </div>

            {/* Status */}
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contract.status)}`}>
              {contract.status}
            </span>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No contracts found</p>
        </div>
      )}
    </div>
  );
}
