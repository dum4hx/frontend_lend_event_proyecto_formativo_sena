import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useMaterialInstances } from '../hooks';
import { useMaterialTypes } from '../../material-types/hooks';
import { MaterialInstanceList, MaterialInstanceDetailModal } from '../components';
import { ExcelExportImport } from '../../../../../components/export/ExcelExportImport';
import { useToast } from '../../../../../contexts/ToastContext';
import type { MaterialInstance } from '../../../../../types/api';

export const MaterialInstanceCatalog: React.FC = () => {
  const navigate = useNavigate();
  const { instances, loading, error, removeInstance, addInstance } = useMaterialInstances();
  const { materialTypes } = useMaterialTypes();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstance, setSelectedInstance] = useState<MaterialInstance | null>(null);

  const filteredInstances = instances.filter((inst) =>
    inst.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (instance: MaterialInstance) => {
    showToast(
      'warning',
      `¿Desea eliminar la instancia "${instance.serialNumber}"? Esta acción no se puede deshacer.`,
      'Confirmar eliminación',
      {
        duration: Infinity,
        action: {
          label: 'Confirmar',
          onClick: async () => {
            try {
              await removeInstance(instance._id);
              showToast('success', 'Instancia de material eliminada exitosamente', 'Éxito');
            } catch (error: any) {
              showToast('error', error.message || 'Error al eliminar instancia de material', 'Error');
            }
          },
        },
      }
    );
  };

  const handleImportInstances = async (data: any[]) => {
    try {
      let successCount = 0;
      for (const item of data) {
        try {
          await addInstance({
            modelId: item.modelId,
            serialNumber: item.serialNumber,
            purchaseDate: item.purchaseDate,
            purchaseCost: item.purchaseCost ? parseFloat(item.purchaseCost) : undefined,
          });
          successCount++;
        } catch (itemError) {
          console.error('Error importing item:', item, itemError);
        }
      }
      showToast('success', `Imported ${successCount}/${data.length} material instances`, 'Import Complete');
    } catch (error: any) {
      showToast('error', error.message || 'Error importing material instances', 'Import Failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading material instances...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  const statusCounts = instances.reduce((acc, inst) => {
    acc[inst.status] = (acc[inst.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-[#121212] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Material Instances</h1>
          <p className="text-gray-400">Manage your physical inventory of material items</p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by serial number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]"
            />
          </div>
          <div className="flex gap-2">
            <ExcelExportImport
              data={filteredInstances}
              filename="material-instances"
              onImport={handleImportInstances}
              showLabels={true}
            />
            <button
              onClick={() => navigate('create')}
              className="flex items-center gap-2 px-6 py-3 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-[#FFC700] transition-colors whitespace-nowrap"
            >
              <Plus size={20} />
              New Instance
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">Total Instances</p>
            <p className="text-3xl font-bold text-white">{instances.length}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">Available</p>
            <p className="text-3xl font-bold text-green-400">
              {statusCounts.available || 0}
            </p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">In Use</p>
            <p className="text-3xl font-bold text-yellow-400">
              {(statusCounts.reserved || 0) + (statusCounts.loaned || 0)}
            </p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">Needs Attention</p>
            <p className="text-3xl font-bold text-red-400">
              {(statusCounts.maintenance || 0) + (statusCounts.damaged || 0)}
            </p>
          </div>
        </div>

        {/* Instance List */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
          <MaterialInstanceList
            instances={filteredInstances}
            materialTypes={materialTypes}
            onView={setSelectedInstance}
            onEdit={(instance) =>
              navigate('create', { state: { instance } })
            }
            onDelete={handleDelete}
          />
        </div>

        {/* Detail Modal */}
        {selectedInstance && (
          <MaterialInstanceDetailModal
            instance={selectedInstance}
            materialTypes={materialTypes}
            onClose={() => setSelectedInstance(null)}
          />
        )}
      </div>
    </div>
  );
};
