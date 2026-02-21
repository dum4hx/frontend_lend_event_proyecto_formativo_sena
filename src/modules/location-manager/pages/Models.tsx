import { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  ChevronDown,
} from "lucide-react";

interface Model {
  id: string;
  name: string;
  category: string;
  modelType: string;
  description: string;
  totalVariants: number;
  status: "active" | "inactive";
}

const SAMPLE_MODELS: Model[] = [
  {
    id: "1",
    name: "Office Chair - Premium",
    category: "Furniture",
    modelType: "Ergonomic",
    description: "High-end ergonomic office chair with lumbar support",
    totalVariants: 4,
    status: "active",
  },
  {
    id: "2",
    name: "Desk Lamp - LED Modern",
    category: "Lighting",
    modelType: "Modern",
    description: "Contemporary LED desk lamp with adjustable brightness",
    totalVariants: 3,
    status: "active",
  },
  {
    id: "3",
    name: "Conference Table - Executive",
    category: "Furniture",
    modelType: "Executive",
    description: "Large conference table for executive meetings",
    totalVariants: 2,
    status: "active",
  },
  {
    id: "4",
    name: "Projector - 4K Ultra",
    category: "Electronics",
    modelType: "Premium",
    description: "4K resolution projector with advanced features",
    totalVariants: 1,
    status: "active",
  },
  {
    id: "5",
    name: "Whiteboard - Interactive",
    category: "Office",
    modelType: "Smart",
    description: "Interactive whiteboard with digital capabilities",
    totalVariants: 2,
    status: "inactive",
  },
];

export default function Models() {
  const [models] = useState<Model[]>(SAMPLE_MODELS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filtered = models.filter((model) => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || model.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(models.map((m) => m.category)))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Material Models</h1>
          <p className="text-gray-400 mt-1">Define and manage material models and variants</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black rounded-[8px] font-semibold hover:bg-[#FFC700] transition-all">
          <Plus size={20} />
          Add Model
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search models..."
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

      {/* Models Table */}
      <div className="border border-[#333] rounded-[12px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#121212] border-b border-[#333]">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Model Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Description</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Variants</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((model) => (
                <tr key={model.id} className="border-b border-[#333] hover:bg-[#1a1a1a] transition-all">
                  <td className="px-6 py-4 text-white font-medium">{model.name}</td>
                  <td className="px-6 py-4 text-gray-400">{model.category}</td>
                  <td className="px-6 py-4 text-gray-400">{model.modelType}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm max-w-xs truncate">{model.description}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-[#FFD700]/20 text-[#FFD700] px-3 py-1 rounded-full text-sm font-semibold">
                      {model.totalVariants}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        model.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {model.status}
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
          <p className="text-gray-400">No models found</p>
        </div>
      )}
    </div>
  );
}
