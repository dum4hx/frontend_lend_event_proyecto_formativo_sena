import React from 'react';
import { X } from 'lucide-react';
import type { MaterialInstance } from '../../../../../types/api';

interface MaterialInstanceDetailModalProps {
  instance: MaterialInstance;
  materialTypes: any[];
  onClose: () => void;
}

export const MaterialInstanceDetailModal: React.FC<MaterialInstanceDetailModalProps> = ({
  instance,
  materialTypes,
  onClose,
}) => {
  const getMaterialTypeName = (modelId: string) => {
    const type = materialTypes.find((t) => t._id === modelId);
    return type?.name || 'Unknown';
  };

  const formatCost = (cost?: number) => {
    if (!cost) return 'N/A';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(cost);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'text-green-400',
      reserved: 'text-blue-400',
      loaned: 'text-yellow-400',
      returned: 'text-purple-400',
      maintenance: 'text-orange-400',
      damaged: 'text-red-400',
      lost: 'text-red-600',
      retired: 'text-gray-500',
    };
    return colors[status] || 'text-gray-400';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] border border-[#333] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#121212] border-b border-[#333] p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Material Instance Details</h2>
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
                Serial Number
              </label>
              <p className="text-white font-mono font-semibold text-lg">
                {instance.serialNumber}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Status
              </label>
              <p className={`font-bold text-lg ${getStatusColor(instance.status)}`}>
                {instance.status.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Material Type
              </label>
              <p className="text-white">{getMaterialTypeName(instance.modelId)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Instance ID
              </label>
              <p className="text-gray-400 text-sm font-mono">{instance._id}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Purchase Date
              </label>
              <p className="text-white">
                {instance.purchaseDate
                  ? new Date(instance.purchaseDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Purchase Cost
              </label>
              <p className="text-[#FFD700] font-semibold">
                {formatCost(instance.purchaseCost)}
              </p>
            </div>
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
