import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useMaterialTypes } from '../hooks';
import { useCategories } from '../../material-categories/hooks';
import { MaterialTypeList, MaterialTypeDetailModal } from '../components';
import { ExcelExportImport } from '../../../../../components/export/ExcelExportImport';
import { useToast } from '../../../../../contexts/ToastContext';
import type { MaterialType } from '../../../../../types/api';

export const MaterialTypeCatalog: React.FC = () => {
  const navigate = useNavigate();
  const { materialTypes, loading, error, removeMaterialType, addMaterialType } = useMaterialTypes();
  const { categories } = useCategories();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterialType, setSelectedMaterialType] = useState<MaterialType | null>(null);

  const filteredMaterialTypes = materialTypes.filter((type) =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (type: MaterialType) => {
    showToast(
      'warning',
      `¿Desea eliminar "${type.name}"? Esta acción no se puede deshacer.`,
      'Confirmar eliminación',
      {
        duration: Infinity,
        action: {
          label: 'Confirmar',
          onClick: async () => {
            try {
              await removeMaterialType(type._id);
              showToast('success', 'Tipo de material eliminado exitosamente', 'Éxito');
            } catch (error: any) {
              showToast('error', error.message || 'Error al eliminar tipo de material', 'Error');
            }
          },
        },
      }
    );
  };

  const handleImportMaterialTypes = async (data: any[]) => {
    try {
      let successCount = 0;
      for (const item of data) {
        try {
          await addMaterialType({
            name: item.name,
            description: item.description,
            categoryId: item.categoryId,
            pricePerDay: parseFloat(item.pricePerDay),
          });
          successCount++;
        } catch (itemError) {
          console.error('Error importing item:', item, itemError);
        }
      }
      showToast('success', `Imported ${successCount}/${data.length} material types`, 'Import Complete');
    } catch (error: any) {
      showToast('error', error.message || 'Error importing material types', 'Import Failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading material types...</div>
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

  return (
    <div className="min-h-screen bg-[#121212] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Material Types</h1>
          <p className="text-gray-400">Manage your material type catalog (items for rental)</p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search material types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]"
            />
          </div>
          <div className="flex gap-2">
            <ExcelExportImport
              data={filteredMaterialTypes}
              filename="material-types"
              onImport={handleImportMaterialTypes}
              showLabels={true}
            />
            <button
              onClick={() => navigate('create')}
              className="flex items-center gap-2 px-6 py-3 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-[#FFC700] transition-colors whitespace-nowrap"
            >
              <Plus size={20} />
              New Material Type
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">Total Material Types</p>
            <p className="text-3xl font-bold text-white">{materialTypes.length}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">Search Results</p>
            <p className="text-3xl font-bold text-white">{filteredMaterialTypes.length}</p>
          </div>
        </div>

        {/* Material Type List */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
          <MaterialTypeList
            materialTypes={filteredMaterialTypes}
            categories={categories}
            onView={setSelectedMaterialType}
            onEdit={(type) =>
              navigate('create', { state: { materialType: type } })
            }
            onDelete={handleDelete}
          />
        </div>

        {/* Detail Modal */}
        {selectedMaterialType && (
          <MaterialTypeDetailModal
            materialType={selectedMaterialType}
            categories={categories}
            onClose={() => setSelectedMaterialType(null)}
          />
        )}
      </div>
    </div>
  );
};
