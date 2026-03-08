import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import type { MaterialInstance } from '../../../../../types/api';
import { AdminTable } from '../../../components';

interface MaterialInstanceListProps {
  instances: MaterialInstance[];
  materialTypes: any[];
  onView: (instance: MaterialInstance) => void;
  onEdit: (instance: MaterialInstance) => void;
  onDelete: (instance: MaterialInstance) => void;
}

export const MaterialInstanceList: React.FC<MaterialInstanceListProps> = ({
  instances,
  materialTypes,
  onView,
  onEdit,
  onDelete,
}) => {
  const getMaterialTypeName = (modelId: string) => {
    const type = materialTypes.find((t) => t._id === modelId);
    return type?.name || 'Unknown';
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

  if (instances.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No material instances found. Create your first instance to get started.</p>
      </div>
    );
  }

  return (
    <AdminTable>
      <thead className="bg-[#0f0f0f] border-b border-[#333]">
        <tr>
            <th className="text-left py-4 px-4 text-gray-400 font-semibold">Serial Number</th>
            <th className="text-left py-4 px-4 text-gray-400 font-semibold">Material Type</th>
            <th className="text-left py-4 px-4 text-gray-400 font-semibold">Status</th>
            <th className="text-right py-4 px-4 text-gray-400 font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody>
          {instances.map((instance) => (
            <tr
              key={instance._id}
              className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors"
            >
              <td className="py-4 px-4 text-white font-mono font-medium">
                {instance.serialNumber}
              </td>
              <td className="py-4 px-4 text-gray-400">
                {getMaterialTypeName(instance.modelId)}
              </td>
              <td className="py-4 px-4">
                <span className={`font-semibold ${getStatusColor(instance.status)}`}>
                  {instance.status.toUpperCase()}
                </span>
              </td>
              <td className="py-4 px-4">
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => onView(instance)}
                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => onEdit(instance)}
                    className="p-2 text-[#FFD700] hover:bg-[#FFD700]/10 rounded-lg transition-colors"
                    title="Edit Status"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(instance)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Delete Instance"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
      </tbody>
    </AdminTable>
  );
};
