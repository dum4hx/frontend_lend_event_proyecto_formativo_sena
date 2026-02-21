import { useState } from "react";
import { Search, ArrowRight, Filter } from "lucide-react";

interface StockMovement {
  id: string;
  type: "inbound" | "outbound" | "transfer" | "adjustment";
  itemSku: string;
  itemName: string;
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  timestamp: string;
  operator: string;
  reason?: string;
}

const SAMPLE_MOVEMENTS: StockMovement[] = [
  {
    id: "1",
    type: "inbound",
    itemSku: "SKU-001",
    itemName: "Standard Event Chair",
    quantity: 50,
    toLocation: "A1",
    timestamp: "2024-02-20 14:30",
    operator: "John Doe",
    reason: "Purchase order #PO-2024-001",
  },
  {
    id: "2",
    type: "transfer",
    itemSku: "SKU-032",
    itemName: "Sound Equipment Package",
    quantity: 5,
    fromLocation: "A2",
    toLocation: "B1",
    timestamp: "2024-02-20 12:15",
    operator: "Jane Smith",
  },
  {
    id: "3",
    type: "outbound",
    itemSku: "SKU-045",
    itemName: "Table Set",
    quantity: 20,
    fromLocation: "D3",
    timestamp: "2024-02-20 10:45",
    operator: "Mike Johnson",
    reason: "Customer order #CO-2024-515",
  },
  {
    id: "4",
    type: "adjustment",
    itemSku: "SKU-015",
    itemName: "LED Light System",
    quantity: -3,
    fromLocation: "B2",
    timestamp: "2024-02-20 09:20",
    operator: "Sarah Wilson",
    reason: "Count discrepancy - inventory adjustment",
  },
  {
    id: "5",
    type: "inbound",
    itemSku: "SKU-047",
    itemName: "Decoration Pack",
    quantity: 15,
    toLocation: "C2",
    timestamp: "2024-02-19 16:00",
    operator: "John Doe",
    reason: "Return from customer",
  },
];

const getMovementTypeColor = (type: string) => {
  switch (type) {
    case "inbound":
      return "bg-green-500/20 text-green-400";
    case "outbound":
      return "bg-blue-500/20 text-blue-400";
    case "transfer":
      return "bg-purple-500/20 text-purple-400";
    case "adjustment":
      return "bg-yellow-500/20 text-yellow-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
};

const getMovementIcon = (type: string) => {
  switch (type) {
    case "inbound":
      return "↓";
    case "outbound":
      return "↑";
    case "transfer":
      return "→";
    case "adjustment":
      return "○";
    default:
      return "•";
  }
};

export default function StockMovementsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [movements] = useState<StockMovement[]>(SAMPLE_MOVEMENTS);

  const filteredMovements = movements.filter((movement) => {
    const matchesSearch =
      movement.itemSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.operator.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === "all" || movement.type === filterType;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Stock Movements</h1>
        <p className="text-gray-400">View all inventory movements and transactions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-3 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search by SKU, item name, or operator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3">
          <Filter size={18} className="text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent text-white focus:outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
            <option value="transfer">Transfer</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>
      </div>

      {/* Movements List */}
      <div className="bg-[#121212] border border-[#333] rounded-[12px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a] border-b border-[#333]">
              <tr>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Type</th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Item</th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Quantity</th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Location</th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Date & Time</th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Operator</th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map((movement) => (
                <tr key={movement.id} className="border-b border-[#333] hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${getMovementTypeColor(movement.type)}`}>
                      {getMovementIcon(movement.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-semibold">{movement.itemSku}</p>
                      <p className="text-gray-500 text-xs">{movement.itemName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${movement.quantity > 0 ? "text-green-400" : "text-red-400"}`}>
                      {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {movement.fromLocation && (
                        <>
                          <span className="text-white font-mono">{movement.fromLocation}</span>
                          <ArrowRight size={16} className="text-gray-500" />
                        </>
                      )}
                      <span className="text-white font-mono">
                        {movement.toLocation || movement.fromLocation}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{movement.timestamp}</td>
                  <td className="px-6 py-4 text-white text-sm">{movement.operator}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm max-w-xs truncate">
                    {movement.reason || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredMovements.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No movements found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
