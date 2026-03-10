import React, { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { useMaterialInstances } from "../hooks";
import {
  MaterialInstanceList,
  MaterialInstanceDetailModal,
  MaterialInstanceForm,
} from "../components";
import { AdminPagination } from "../../../components";
import { ExcelExportImport } from "../../../../../components/export/ExcelExportImport";
import { useToast } from "../../../../../contexts/ToastContext";
import type { MaterialInstance, CreateMaterialInstancePayload } from "../../../../../types/api";

export const MaterialInstanceCatalog: React.FC = () => {
  const { instances, loading, error, removeInstance, addInstance } = useMaterialInstances();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedInstance, setSelectedInstance] = useState<MaterialInstance | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingInstance, setEditingInstance] = useState<MaterialInstance | null>(null);
  const pageSize = 10;

  const filteredInstances = instances.filter((inst) =>
    inst.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filteredInstances.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedInstances = filteredInstances.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleDelete = (instance: MaterialInstance) => {
    showToast(
      "warning",
      `Do you want to delete instance "${instance.serialNumber}"? This action cannot be undone.`,
      "Confirm Deletion",
      {
        duration: Infinity,
        action: {
          label: "Confirm",
          onClick: async () => {
            try {
              await removeInstance(instance._id);
              showToast("success", "Material instance deleted successfully", "Success");
            } catch (error: unknown) {
              showToast(
                "error",
                error instanceof Error ? error.message : "Failed to delete material instance",
                "Error",
              );
            }
          },
        },
      },
    );
  };

  const handleCreateOrUpdate = async (data: CreateMaterialInstancePayload) => {
    try {
      if (editingInstance) {
        // Since the current useMaterialInstances doesn't have an update method for general fields,
        // and per instructions we are focusing on the form modal flow.
        // For now, if editing is needed, we'd need an update method in the service/hook.
        // If the service doesn't support PATCH /instances/:id yet for modelId/serial/loc,
        // we might only support creation for now.
        showToast("info", "Update functionality depends on backend PATCH implementation.");
      } else {
        await addInstance(data);
        showToast("success", "Material instance created successfully", "Success");
      }
      setIsFormModalOpen(false);
      setEditingInstance(null);
    } catch (error: unknown) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Failed to save material instance",
        "Error",
      );
    }
  };

  interface ImportRow {
    modelId?: string;
    serialNumber?: string;
    locationId?: string;
  }

  const handleImportInstances = async (data: ImportRow[]) => {
    try {
      let successCount = 0;
      for (const item of data) {
        if (!item.modelId || !item.serialNumber || !item.locationId) {
          console.error("Skipping invalid import row (missing required fields):", item);
          continue;
        }
        try {
          await addInstance({
            modelId: item.modelId,
            serialNumber: item.serialNumber,
            locationId: item.locationId,
          });
          successCount++;
        } catch (itemError) {
          console.error("Error importing item:", item, itemError);
        }
      }
      showToast(
        "success",
        `Imported ${successCount}/${data.length} material instances`,
        "Import Complete",
      );
    } catch (error: unknown) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Error importing material instances",
        "Import Failed",
      );
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

  const statusCounts = instances.reduce(
    (acc, inst) => {
      acc[inst.status] = (acc[inst.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

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
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
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
              onClick={() => {
                setEditingInstance(null);
                setIsFormModalOpen(true);
              }}
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
            <p className="text-3xl font-bold text-green-400">{statusCounts.available || 0}</p>
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
            instances={pagedInstances}
            onView={setSelectedInstance}
            onEdit={(instance) => {
              setEditingInstance(instance);
              setIsFormModalOpen(true);
            }}
            onDelete={handleDelete}
          />
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredInstances.length}
            pageSize={pageSize}
            itemLabel="instances"
            onPageChange={setPage}
          />
        </div>

        {/* Form Modal */}
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[#121212] border border-[#333] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
                <h2 className="text-xl font-bold text-white">
                  {editingInstance ? "Edit Material Instance" : "New Material Instance"}
                </h2>
                <button
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                <MaterialInstanceForm
                  onSubmit={handleCreateOrUpdate}
                  onCancel={() => setIsFormModalOpen(false)}
                  initialData={editingInstance || undefined}
                  isEditing={!!editingInstance}
                />
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedInstance && (
          <MaterialInstanceDetailModal
            instance={selectedInstance}
            onClose={() => setSelectedInstance(null)}
          />
        )}
      </div>
    </div>
  );
};
