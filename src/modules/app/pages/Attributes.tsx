import { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
} from "lucide-react";

interface Attribute {
  id: string;
  name: string;
  type: string;
  description: string;
  values: string[];
  appliedTo: number;
}

const SAMPLE_ATTRIBUTES: Attribute[] = [
  {
    id: "1",
    name: "Color",
    type: "Select",
    description: "Material color option",
    values: ["Black", "White", "Gray", "Blue", "Red"],
    appliedTo: 45,
  },
  {
    id: "2",
    name: "Size",
    type: "Select",
    description: "Item size variant",
    values: ["Small", "Medium", "Large", "XL"],
    appliedTo: 52,
  },
  {
    id: "3",
    name: "Material",
    type: "Select",
    description: "Material composition",
    values: ["Wood", "Metal", "Plastic", "Leather", "Fabric"],
    appliedTo: 38,
  },
  {
    id: "4",
    name: "Capacity",
    type: "Number",
    description: "Item storage capacity",
    values: ["10L", "20L", "30L", "50L"],
    appliedTo: 22,
  },
  {
    id: "5",
    name: "Weight Limit",
    type: "Number",
    description: "Maximum weight capacity",
    values: ["50kg", "100kg", "150kg", "200kg"],
    appliedTo: 18,
  },
];

export default function Attributes() {
  const [attributes] = useState<Attribute[]>(SAMPLE_ATTRIBUTES);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = attributes.filter(
    (attr) =>
      attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attr.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Material Attributes</h1>
          <p className="text-gray-400 mt-1">Define attributes for material variants</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-[8px] font-semibold transition-all gold-action-btn">
          <Plus size={20} />
          Add Attribute
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
        <input
          type="text"
          placeholder="Search attributes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
        />
      </div>

      {/* Attributes List */}
      <div className="space-y-4">
        {filtered.map((attribute) => (
          <div
            key={attribute.id}
            className="bg-[#1a1a1a] border border-[#333] rounded-[12px] p-6 hover:border-[#FFD700] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white">{attribute.name}</h3>
                  <span className="px-2 py-1 bg-[#FFD700]/20 text-[#FFD700] rounded text-xs font-semibold">
                    {attribute.type}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1">{attribute.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-[#121212] rounded-[6px] text-gray-400 hover:text-[#FFD700] transition-all">
                  <Edit2 size={18} />
                </button>
                <button className="p-2 hover:bg-[#121212] rounded-[6px] text-gray-400 transition-all danger-icon-btn">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Values and Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-2 font-semibold">Values:</p>
                <div className="flex flex-wrap gap-2">
                  {attribute.values.map((value, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[#121212] border border-[#333] rounded-full text-xs text-gray-300"
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2 font-semibold">Applied to:</p>
                <div className="flex items-center">
                  <div className="flex-1 bg-[#121212] rounded-full h-2 mr-3">
                    <div
                      className="bg-[#FFD700] h-2 rounded-full transition-all"
                      style={{ width: `${(attribute.appliedTo / 52) * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold text-[#FFD700]">{attribute.appliedTo}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No attributes found</p>
        </div>
      )}
    </div>
  );
}
