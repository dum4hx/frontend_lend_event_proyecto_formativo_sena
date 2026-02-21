import { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  ChevronDown,
} from "lucide-react";

interface Material {
  id: string;
  name: string;
  sku: string;
  category: string;
  model: string;
  price: number;
  rentalPrice: number;
  quantity: number;
  status: "active" | "inactive" | "discontinued";
}

const SAMPLE_MATERIALS: Material[] = [
  {
    id: "1",
    name: "Office Chair - Ergonomic",
    sku: "CHR-001",
    category: "Furniture",
    model: "Premium",
    price: 250,
    rentalPrice: 15,
    quantity: 45,
    status: "active",
  },
  {
    id: "2",
    name: "Desk Lamp - LED",
    sku: "LMP-002",
    category: "Lighting",
    model: "Modern",
    price: 45,
    rentalPrice: 3,
    quantity: 120,
    status: "active",
  },
  {
    id: "3",
    name: "Whiteboard - Wall Mount",
    sku: "WBD-003",
    category: "Office",
    model: "Large",
    price: 85,
    rentalPrice: 5,
    quantity: 30,
    status: "active",
  },
  {
    id: "4",
    name: "Projector - 4K",
    sku: "PRJ-004",
    category: "Electronics",
    model: "Premium",
    price: 1200,
    rentalPrice: 50,
    quantity: 8,
    status: "active",
  },
  {
    id: "5",
    name: "Conference Table",
    sku: "TBL-005",
    category: "Furniture",
    model: "Executive",
    price: 850,
    rentalPrice: 40,
    quantity: 2,
    status: "active",
  },
];

export default function Materials() {
  const [materials] = useState<Material[]>(SAMPLE_MATERIALS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filtered = materials.filter((material) => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || material.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(materials.map((m) => m.category)))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border border-green-500/30";
      case "inactive":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      case "discontinued":
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
          <h1 className="text-3xl font-bold text-white">Materials</h1>
          <p className="text-gray-400 mt-1">Manage your material inventory and catalog</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black rounded-[8px] font-semibold hover:bg-[#FFC700] transition-all">
          <Plus size={20} />
          Add Material
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
          />
        </div>

        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="appearance-none px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white focus:outline-none focus:border-[#FFD700] transition-all cursor-pointer pr-10"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
        </div>
      </div>

      {/* Materials Table */}
      <div className="border border-[#333] rounded-[12px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#121212] border-b border-[#333]">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">SKU</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Rental</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Qty</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((material) => (
                <tr key={material.id} className="border-b border-[#333] hover:bg-[#1a1a1a] transition-all">
                  <td className="px-6 py-4 text-white font-medium">{material.name}</td>
                  <td className="px-6 py-4 text-gray-400">{material.sku}</td>
                  <td className="px-6 py-4 text-gray-400">{material.category}</td>
                  <td className="px-6 py-4 text-white">${material.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-white">${material.rentalPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-white font-semibold">{material.quantity}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(material.status)}`}>
                      {material.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-[#1a1a1a] rounded-[6px] text-gray-400 hover:text-[#FFD700] transition-all">
                        <Edit2 size={18} />
                      </button>
                      <button className="p-2 hover:bg-[#1a1a1a] rounded-[6px] text-gray-400 hover:text-red-400 transition-all">
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
          <p className="text-gray-400">No materials found</p>
        </div>
      )}
    </div>
  );
}
