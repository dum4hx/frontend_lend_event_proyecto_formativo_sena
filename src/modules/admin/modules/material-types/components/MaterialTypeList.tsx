import type { MaterialCategory, MaterialType } from "../../../../../types/api";

interface MaterialTypeListProps {
  types: MaterialType[];
  models: MaterialCategory[];
  onEdit: (type: MaterialType) => void;
  onDelete: (typeId: string) => void;
}

export function MaterialTypeList({
  types,
  models,
  onEdit,
  onDelete,
}: MaterialTypeListProps) {
  if (types.length === 0) {
    return (
      <div className="text-center py-10 bg-[#121212] border border-[#333] rounded-lg">
        <p className="text-gray-400">No material types found</p>
      </div>
    );
  }

  const modelNameById = new Map(models.map((m) => [m._id, m.name]));

  return (
    <div className="bg-[#121212] border border-[#333] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0f0f0f] border-b border-[#333]">
            <tr>
              <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">
                Name
              </th>
              <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">
                Model
              </th>
              <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">
                Price/Day
              </th>
              <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">
                Replacement
              </th>
              <th className="px-6 py-4 text-left text-gray-400 text-sm font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {types.map((type) => (
              <tr
                key={type._id}
                className="border-b border-[#333] hover:bg-[#1a1a1a] transition-all"
              >
                <td className="px-6 py-4 text-white text-sm font-medium">
                  {type.name}
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {modelNameById.get(type.categoryId) ?? "—"}
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  ${type.pricePerDay.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {type.replacementCost
                    ? `$${type.replacementCost.toFixed(2)}`
                    : "—"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(type)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition"
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(type._id)}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded text-white transition"
                      title="Delete"
                    >
                      Delete
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
