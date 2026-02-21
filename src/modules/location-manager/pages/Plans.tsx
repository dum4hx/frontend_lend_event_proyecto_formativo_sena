import { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  ChevronDown,
} from "lucide-react";

interface MaterialPlan {
  id: string;
  name: string;
  category: string;
  duration: string;
  price: number;
  materials: number;
  isActive: boolean;
  createdDate: string;
}

const SAMPLE_PLANS: MaterialPlan[] = [
  {
    id: "1",
    name: "Office Starter Pack",
    category: "Furniture",
    duration: "1 week",
    price: 150,
    materials: 5,
    isActive: true,
    createdDate: "2024-01-10",
  },
  {
    id: "2",
    name: "Event Furniture Bundle",
    category: "Furniture",
    duration: "3 days",
    price: 300,
    materials: 12,
    isActive: true,
    createdDate: "2024-01-15",
  },
  {
    id: "3",
    name: "Tech Conference Setup",
    category: "Electronics",
    duration: "2 days",
    price: 500,
    materials: 8,
    isActive: true,
    createdDate: "2024-02-01",
  },
  {
    id: "4",
    name: "Lighting Kit - Premium",
    category: "Lighting",
    duration: "1 week",
    price: 200,
    materials: 6,
    isActive: true,
    createdDate: "2024-02-05",
  },
  {
    id: "5",
    name: "Corporate Meeting Setup",
    category: "Furniture",
    duration: "1 month",
    price: 800,
    materials: 20,
    isActive: false,
    createdDate: "2024-02-10",
  },
];

export default function MaterialPlans() {
  const [plans] = useState<MaterialPlan[]>(SAMPLE_PLANS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filtered = plans.filter((plan) => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || plan.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(plans.map((p) => p.category)))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Material Plans</h1>
          <p className="text-gray-400 mt-1">Create and manage rental plans for material bundles</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black rounded-[8px] font-semibold hover:bg-[#FFC700] transition-all">
          <Plus size={20} />
          Add Plan
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search plans..."
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

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filtered.map((plan) => (
          <div
            key={plan.id}
            className="bg-[#1a1a1a] border border-[#333] rounded-[12px] p-6 hover:border-[#FFD700] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{plan.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-[#121212] rounded-[6px] text-gray-400 hover:text-[#FFD700] transition-all">
                  <Edit2 size={18} />
                </button>
                <button className="p-2 hover:bg-[#121212] rounded-[6px] text-gray-400 hover:text-red-400 transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Plan Details */}
            <div className="space-y-4 mb-6 pb-6 border-b border-[#333]">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Duration</span>
                <span className="text-white font-semibold">{plan.duration}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Price</span>
                <span className="text-[#FFD700] font-bold text-lg">${plan.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Materials</span>
                <span className="bg-[#FFD700]/20 text-[#FFD700] px-3 py-1 rounded-full text-sm font-semibold">
                  {plan.materials}
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Status</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  plan.isActive
                    ? "bg-green-500/20 text-green-400"
                    : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {plan.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No plans found</p>
        </div>
      )}
    </div>
  );
}
