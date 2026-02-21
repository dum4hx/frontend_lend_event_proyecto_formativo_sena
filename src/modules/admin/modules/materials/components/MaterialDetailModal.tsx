import { X } from "lucide-react";
import type { MaterialType } from "../../../../../types/api";

interface MaterialDetailModalProps {
  material: MaterialType;
  onClose: () => void;
}

export function MaterialDetailModal({
  material,
  onClose,
}: MaterialDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">{material.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Category ID</p>
              <p className="font-medium text-gray-900">{material.categoryId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Price per Day</p>
              <p className="font-medium text-gray-900">
                ${material.pricePerDay.toFixed(2)}
              </p>
            </div>
            {material.replacementCost && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Replacement Cost</p>
                <p className="font-medium text-gray-900">
                  ${material.replacementCost.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          {material.description && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Description
              </p>
              <p className="text-gray-600">{material.description}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-4 space-y-2 text-xs text-gray-500">
            <p>ID: {material._id}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
