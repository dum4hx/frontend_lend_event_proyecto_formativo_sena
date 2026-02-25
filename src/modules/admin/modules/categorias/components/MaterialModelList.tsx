import type { MaterialCategory } from "../../../../../types/api";
import { Edit, Trash2 } from "lucide-react";

interface MaterialModelListProps {
  models: MaterialCategory[];
  onEdit: (model: MaterialCategory) => void;
  onDelete: (modelId: string) => void;
}

export function MaterialModelList({
  models,
  onEdit,
  onDelete,
}: MaterialModelListProps) {
  if (models.length === 0) {
    return (
      <div className="text-center py-10 bg-[#121212] border border-[#333] rounded-lg">
        <p className="text-gray-400">No material models found</p>
      </div>
    );
  }

  // parent removed: no mapping needed

  return (
    <div className="bg-[#121212] border border-[#333] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0f0f0f] border-b border-[#333]">
            <tr>
              <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">
                Name
              </th>
              {/* Parent column removed */}
              <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">
                Description
              </th>
              <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {models.map((model) => (
              <tr
                key={model._id}
                className="border-b border-[#333] hover:bg-[#1a1a1a] transition-all"
              >
                <td className="px-6 py-4 text-white text-sm font-medium">
                  {model.name}
                </td>
                {/* Parent column removed */}
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {model.description || "—"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(model)}
                      className="p-2 hover:bg-[#1a1a1a] rounded-md transition text-gray-300"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(model._id)}
                      className="p-2 hover:bg-red-900/30 rounded-md transition text-red-300"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
