import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import type { MaterialCategory } from '../../../../../types/api';
import { AdminTable } from '../../../components';

interface CategoryListProps {
  categories: MaterialCategory[];
  onView: (category: MaterialCategory) => void;
  onEdit: (category: MaterialCategory) => void;
  onDelete: (category: MaterialCategory) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  onView,
  onEdit,
  onDelete,
}) => {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No categories found. Create your first category to get started.</p>
      </div>
    );
  }

  return (
    <AdminTable>
      <thead className="bg-[#0f0f0f] border-b border-[#333]">
        <tr>
            <th className="text-left py-4 px-4 text-gray-400 font-semibold">Name</th>
            <th className="text-left py-4 px-4 text-gray-400 font-semibold">Description</th>
            <th className="text-left py-4 px-4 text-gray-400 font-semibold">Attributes</th>
            <th className="text-right py-4 px-4 text-gray-400 font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody>
          {categories.map((category) => {
            const requiredCount = (category.attributes || []).filter((a) => a.isRequired).length;
            const totalCount = (category.attributes || []).length;
            const attributeLabel =
              totalCount === 0
                ? "No attributes"
                : totalCount === 1
                  ? `1 attribute${requiredCount === 1 ? " (required)" : ""}`
                  : `${totalCount} attributes (${requiredCount} required)`;

            return (
              <tr
                key={category._id}
                className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors"
              >
                <td className="py-4 px-4 text-white font-medium">{category.name}</td>
                <td className="py-4 px-4 text-gray-400">
                  {category.description || '-'}
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-400">
                    {attributeLabel}
                  </span>
                  {totalCount > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(category.attributes || []).map((attr) => (
                        <span
                          key={attr.attributeId}
                          className={`inline-block text-xs px-2 py-1 rounded ${
                            attr.isRequired
                              ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                              : 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                          }`}
                          title={`Attribute ID: ${attr.attributeId}${attr.isRequired ? ' (Required)' : ''}`}
                        >
                          {attr.isRequired ? '■' : '□'} {attr.attributeId.substring(0, 8)}...
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="py-4 px-4">
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => onView(category)}
                      className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                      title="View Details"
                      aria-label={`View details for ${category.name}`}
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(category)}
                      className="p-2 text-[#FFD700] hover:bg-[#FFD700]/10 rounded-lg transition-colors"
                      title="Edit Category"
                      aria-label={`Edit ${category.name}`}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(category)}
                      className="p-2 text-red-300 border border-red-500/40 hover:bg-red-500/15 rounded-lg transition-colors"
                      title="Delete Category"
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
      </tbody>
    </AdminTable>
  );
};
