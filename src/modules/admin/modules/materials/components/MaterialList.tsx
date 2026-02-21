import { Trash2, Edit, Eye, MoreVertical } from "lucide-react";
import type { MaterialType } from "../../../../../types/api";
import { useState } from "react";

interface MaterialListProps {
  materials: MaterialType[];
  onEdit: (material: MaterialType) => void;
  onDelete: (materialId: string) => void;
  onView: (material: MaterialType) => void;
}

export function MaterialList({
  materials,
  onEdit,
  onDelete,
  onView,
}: MaterialListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this material?")) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } finally {
        setDeletingId(null);
        setOpenMenuId(null);
      }
    }
  };

  if (materials.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <p className="text-gray-500">No materials found</p>
        <p className="text-sm text-gray-400">Create your first material to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Price per Day
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Replacement Cost
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material) => (
              <tr
                key={material._id}
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {material.name}
                    </p>
                    {material.description && (
                      <p className="text-sm text-gray-500 truncate">
                        {material.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {material.categoryId?.slice(0, 8) || "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  ${material.pricePerDay.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {material.replacementCost
                    ? `$${material.replacementCost.toFixed(2)}`
                    : "—"}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="relative inline-block">
                    <button
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === material._id ? null : material._id,
                        )
                      }
                      className="p-2 hover:bg-gray-200 rounded-lg transition"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>

                    {openMenuId === material._id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <button
                          onClick={() => {
                            onView(material);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 transition"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            onEdit(material);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700 transition"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(material._id)}
                          disabled={deletingId === material._id}
                          className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 border-t transition disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          {deletingId === material._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
