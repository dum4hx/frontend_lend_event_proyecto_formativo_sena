import React from 'react';
import { X } from 'lucide-react';
import type { MaterialCategory, MaterialType } from '../../../../../types/api';

interface MaterialTypeDetailModalProps {
  materialType: MaterialType;
  categories: MaterialCategory[];
  onClose: () => void;
}

export const MaterialTypeDetailModal: React.FC<MaterialTypeDetailModalProps> = ({
  materialType,
  categories,
  onClose,
}) => {
  const extractCategoryId = (value: unknown) => {
    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      const first = value[0] as { _id?: string } | undefined;
      return typeof first?._id === 'string' ? first?._id : undefined;
    }

    if (value && typeof value === 'object') {
      const maybeId = (value as { _id?: string })._id;
      return typeof maybeId === 'string' ? maybeId : undefined;
    }

    return undefined;
  };

  const getCategoryName = (
    typeData: MaterialType & {
      categoryId?: string | { _id?: string; name?: string };
      category?: { _id?: string; name?: string };
    }
  ) => {
    const embeddedCategory = typeData.category;
    if (embeddedCategory?.name) {
      return embeddedCategory.name;
    }

    const categoryIdValue = extractCategoryId(typeData.categoryId);

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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] border border-[#333] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#121212] border-b border-[#333] p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Material Type Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#1a1a1a] rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Material Name
              </label>
              <p className="text-white font-semibold text-lg">{materialType.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Category
              </label>
              <p className="text-white">{getCategoryName(materialType)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Price per Day
              </label>
              <p className="text-[#FFD700] font-bold text-xl">
                {formatPrice(materialType.pricePerDay)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Type ID
              </label>
              <p className="text-gray-400 text-sm font-mono">{materialType._id}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Description
            </label>
            <p className="text-white">
              {materialType.description || 'No description provided'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#333] p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-[#1a1a1a] text-white font-semibold rounded-lg hover:bg-[#222] transition-colors border border-[#333]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
