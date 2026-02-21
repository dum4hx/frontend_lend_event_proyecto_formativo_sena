import { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string;
  materialCount: number;
  createdDate: string;
}

const SAMPLE_CATEGORIES: Category[] = [
  {
    id: "1",
    name: "Furniture",
    description: "Office and event furniture items",
    materialCount: 28,
    createdDate: "2024-01-15",
  },
  {
    id: "2",
    name: "Electronics",
    description: "Tech equipment and devices",
    materialCount: 15,
    createdDate: "2024-01-20",
  },
  {
    id: "3",
    name: "Lighting",
    description: "Lighting solutions and fixtures",
    materialCount: 22,
    createdDate: "2024-02-01",
  },
  {
    id: "4",
    name: "Office Equipment",
    description: "Office related equipment",
    materialCount: 18,
    createdDate: "2024-02-10",
  },
  {
    id: "5",
    name: "Decorations",
    description: "Decorative items and accents",
    materialCount: 35,
    createdDate: "2024-02-15",
  },
];

export default function Categories() {
  const [categories] = useState<Category[]>(SAMPLE_CATEGORIES);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Material Categories</h1>
          <p className="text-gray-400 mt-1">Organize materials by category</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black rounded-[8px] font-semibold hover:bg-[#FFC700] transition-all">
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((category) => (
          <div
            key={category.id}
            className="bg-[#1a1a1a] border border-[#333] rounded-[12px] p-6 hover:border-[#FFD700] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{category.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{category.description}</p>
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

            <div className="pt-4 border-t border-[#333]">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Materials</span>
                <span className="text-[#FFD700] font-bold text-lg">{category.materialCount}</span>
              </div>
              <p className="text-gray-500 text-xs mt-2">Created: {category.createdDate}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No categories found</p>
        </div>
      )}
    </div>
  );
}
