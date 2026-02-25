import { X } from "lucide-react";
import type { MaterialType } from "../../../../../types/api";
import { useMemo } from "react";
import { useCategories } from "../hooks";

interface MaterialDetailModalProps {
  material: MaterialType;
  onClose: () => void;
}

export function MaterialDetailModal({ material, onClose }: MaterialDetailModalProps) {
  const { categories } = useCategories();
  const categoryDisplay = useMemo(() => {
    const cat: any = material.categoryId;
    if (!cat) return "N/A";
    if (typeof cat === "string") {
      const found = categories.find((c) => c._id === cat);
      return found ? found.name : cat.slice(0, 8);
    }
    if (typeof cat === "object") return cat.name ?? cat._id ?? "N/A";
    return "N/A";
  }, [material.categoryId, categories]);
  const formatCop = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#121212] border border-[#333] rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <h2 className="text-2xl font-bold text-white">{material.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1a1a1a] rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Category</p>
              <p className="font-medium text-white">{categoryDisplay}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Price per Day</p>
              <p className="font-medium text-white">
                {formatCop(material.pricePerDay)}
              </p>
            </div>
          </div>

          {/* Description */}
          {material.description && (
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">
                Description
              </p>
              <p className="text-gray-400">{material.description}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-[#333] pt-4 space-y-2 text-xs text-gray-500">
            <p>ID: {material._id}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#333] p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
