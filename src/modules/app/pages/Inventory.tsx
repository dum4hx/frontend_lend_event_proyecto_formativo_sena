import { useState } from "react";
import { Search, Plus, Edit2, Trash2 } from "lucide-react";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  minThreshold: number;
  location: string;
  lastUpdated: string;
}

const SAMPLE_ITEMS: InventoryItem[] = [
  {
    id: "1",
    sku: "SKU-001",
    name: "Standard Event Chair",
    quantity: 150,
    minThreshold: 50,
    location: "A1",
    lastUpdated: "2 hours ago",
  },
  {
    id: "2",
    sku: "SKU-015",
    name: "LED Light System",
    quantity: 5,
    minThreshold: 25,
    location: "B2",
    lastUpdated: "1 day ago",
  },
  {
    id: "3",
    sku: "SKU-032",
    name: "Sound Equipment Package",
    quantity: 12,
    minThreshold: 20,
    location: "C1",
    lastUpdated: "3 hours ago",
  },
  {
    id: "4",
    sku: "SKU-045",
    name: "Table Set",
    quantity: 200,
    minThreshold: 75,
    location: "D3",
    lastUpdated: "1 hour ago",
  },
  {
    id: "5",
    sku: "SKU-047",
    name: "Decoration Pack",
    quantity: 8,
    minThreshold: 30,
    location: "B1",
    lastUpdated: "5 hours ago",
  },
];

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [items] = useState<InventoryItem[]>(SAMPLE_ITEMS);

  const filteredItems = items.filter(
    (item) =>
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (quantity: number, minThreshold: number) => {
    if (quantity <= minThreshold * 0.2) {
      return { label: "Critical", color: "bg-red-500/20 text-red-400" };
    } else if (quantity <= minThreshold) {
      return { label: "Low", color: "bg-yellow-500/20 text-yellow-400" };
    }
    return { label: "Normal", color: "bg-green-500/20 text-green-400" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
          <p className="text-gray-400">Monitor and manage all warehouse items</p>
        </div>
        <button className="flex items-center gap-2 bg-[#FFD700] text-black font-semibold px-4 py-2 rounded-lg hover:bg-[#FFC107] transition-all">
          <Plus size={20} />
          Add Item
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3 text-gray-500" size={20} />
        <input
          type="text"
          placeholder="Search by SKU or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
        />
      </div>

      {/* Items Table */}
      <div className="bg-[#121212] border border-[#333] rounded-[12px] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1a1a1a] border-b border-[#333]">
            <tr>
              <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">SKU</th>
              <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Item Name</th>
              <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Quantity</th>
              <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Location</th>
              <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Status</th>
              <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Last Updated</th>
              <th className="px-6 py-4 text-left text-gray-400 font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const status = getStockStatus(item.quantity, item.minThreshold);
              return (
                <tr key={item.id} className="border-b border-[#333] hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-6 py-4 text-white font-semibold">{item.sku}</td>
                  <td className="px-6 py-4 text-white">{item.name}</td>
                  <td className="px-6 py-4 text-white">
                    <div>
                      <p className="font-semibold">{item.quantity}</p>
                      <p className="text-gray-500 text-xs">Min: {item.minThreshold}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white font-mono">{item.location}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{item.lastUpdated}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-400 hover:text-blue-300 transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button className="text-red-400 hover:text-red-300 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No items found matching your search</p>
        </div>
      )}
    </div>
  );
}
