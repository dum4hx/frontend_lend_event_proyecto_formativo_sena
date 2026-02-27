import { Trash2, Edit, Eye } from "lucide-react";
import type { MaterialType } from "../../../../../types/api";
import { useState } from "react";
import { AdminTable } from "../../../components";

interface MaterialListProps {
  materials: MaterialType[];
  onEdit: (material: MaterialType) => void;
  onDelete: (materialId: string) => void;
  onView: (material: MaterialType) => void;
  categories?: import("../../../../../types/api").MaterialCategory[];
}

export function MaterialList({
  materials,
  onEdit,
  onDelete,
  onView,
  categories,
}: MaterialListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatCop = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 2,
    }).format(value);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this material?")) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (materials.length === 0) {
    return (
      <div className="text-center py-12 bg-[#121212] border border-[#333] rounded-lg">
        <p className="text-gray-400">No materials found</p>
        <p className="text-sm text-gray-500">
          Create your first material to get started
        </p>
      </div>
    );
  }

  return (
    <AdminTable>
      <thead className="bg-[#0f0f0f] border-b border-[#333]">
            <tr>
              <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">
                Name
              </th>
              <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">
                Category
              </th>
              <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">
                Price per Day
              </th>
              <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">
                Actions
              </th>
            </tr>
      </thead>
      <tbody>
            {materials.map((material) => (
              <tr
                key={material._id}
                className="border-b border-[#333] hover:bg-[#1a1a1a] transition-all"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-white">
                      {material.name}
                    </p>
                    {material.description && (
                      <p className="text-sm text-gray-500 truncate">
                        {material.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  <span className="inline-block bg-[#1a1a1a] text-gray-200 px-2 py-1 rounded border border-[#333]">
                    {(() => {
                      const anyMat: any = material;
                      let cat: any = anyMat.categoryId ?? anyMat.category ?? anyMat.modelId ?? anyMat.model;
                      if (!cat) return "N/A";
                      if (Array.isArray(cat)) cat = cat[0];
                      if (typeof cat === "string") {
                        if (categories) {
                          const found = categories.find((c) => c._id === cat);
                          return found ? found.name : cat.slice(0, 8);
                        }
                        return cat.slice(0, 8);
                      }
                      if (typeof cat === "object" && (cat.name || cat._id)) return cat.name ?? cat._id;
                      return "N/A";
                    })()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-white font-medium">
                  {formatCop(material.pricePerDay)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onView(material)}
                      className="p-2 hover:bg-[#1a1a1a] rounded-md transition text-gray-300"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(material)}
                      className="p-2 hover:bg-[#1a1a1a] rounded-md transition text-gray-300"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(material._id)}
                      disabled={deletingId === material._id}
                      className="p-2 hover:bg-red-900/30 rounded-md transition text-red-300 disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
      </tbody>
    </AdminTable>
  );
}
