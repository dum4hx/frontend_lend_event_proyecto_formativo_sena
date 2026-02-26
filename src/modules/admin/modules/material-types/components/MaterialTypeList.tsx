import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import type { MaterialCategory, MaterialType } from '../../../../../types/api';

interface MaterialTypeListProps {
  materialTypes: MaterialType[];
  categories: MaterialCategory[];
  onView: (materialType: MaterialType) => void;
  onEdit: (materialType: MaterialType) => void;
  onDelete: (materialType: MaterialType) => void;
}

export const MaterialTypeList: React.FC<MaterialTypeListProps> = ({
  materialTypes,
  categories,
  onView,
  onEdit,
  onDelete,
}) => {
  const extractCategoryId = (value: unknown): string | undefined => {
    // Plain string ID
    if (typeof value === 'string') return value;

    // Array — backend returns categoryId as string[] or populated object[]
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      if (typeof first === 'string') return first;          // string[]
      if (first && typeof first === 'object') {
        const id = (first as { _id?: string })._id;
        return typeof id === 'string' ? id : undefined;     // populated object[]
      }
    }

    // Single populated object
    if (value && typeof value === 'object') {
      const maybeId = (value as { _id?: string })._id;
      return typeof maybeId === 'string' ? maybeId : undefined;
    }

    return undefined;
  };

  const getCategoryName = (
    materialType: MaterialType & {
      categoryId?: string | { _id?: string; name?: string };
      category?: { _id?: string; name?: string };
    }
  ) => {
    const embeddedCategory = materialType.category;
    if (embeddedCategory?.name) {
      return embeddedCategory.name;
    }

    const categoryIdValue = extractCategoryId(materialType.categoryId);

    const category = categories.find((c) => c._id === categoryIdValue);
    return category?.name || 'Unknown';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (materialTypes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No material types found. Create your first material type to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#333]">
            <th className="text-left py-4 px-4 text-gray-400 font-semibold">Name</th>
            <th className="text-left py-4 px-4 text-gray-400 font-semibold">Description</th>
            <th className="text-left py-4 px-4 text-gray-400 font-semibold">Category</th>
            <th className="text-left py-4 px-4 text-gray-400 font-semibold">Price/Day</th>
            <th className="text-right py-4 px-4 text-gray-400 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {materialTypes.map((type) => (
            <tr
              key={type._id}
              className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors"
            >
              <td className="py-4 px-4 text-white font-medium">{type.name}</td>
              <td className="py-4 px-4 text-gray-400">
                {type.description || '-'}
              </td>
              <td className="py-4 px-4 text-gray-400">
                {getCategoryName(type)}
              </td>
              <td className="py-4 px-4 text-[#FFD700] font-semibold">
                {formatPrice(type.pricePerDay)}
              </td>
              <td className="py-4 px-4">
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => onView(type)}
                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => onEdit(type)}
                    className="p-2 text-[#FFD700] hover:bg-[#FFD700]/10 rounded-lg transition-colors"
                    title="Edit Material Type"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(type)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Delete Material Type"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
