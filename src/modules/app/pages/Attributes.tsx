import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { useApiQuery } from "../../../hooks/useApiQuery";
import {
  getMaterialAttributes,
  getMaterialCategories,
  createMaterialAttribute,
  updateMaterialAttribute,
  deleteMaterialAttribute,
} from "../../../services/materialService";
import { MaterialAttributeForm } from "../modules/material-attributes/components/AttributeForm";
import { useToast } from "../../../contexts/ToastContext";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { ErrorDisplay } from "../../../components/ui/ErrorDisplay";
import type { MaterialAttribute, CreateMaterialAttributePayload } from "../../../types/api";
import { usePermissions } from "../../../contexts/usePermissions";

export default function Attributes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<MaterialAttribute | undefined>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [attributeToDelete, setAttributeToDelete] = useState<MaterialAttribute | null>(null);

  const { showToast } = useToast();
  const { hasPermission } = usePermissions();

  const {
    data: attributesData,
    isLoading: isLoadingAttributes,
    error: attributesError,
    refetch: refetchAttributes,
  } = useApiQuery(getMaterialAttributes, { context: "Material Attributes" });

  const { data: categoriesData } = useApiQuery(getMaterialCategories, {
    context: "Material Categories",
  });

  const attributes = useMemo(() => attributesData?.data?.attributes || [], [attributesData]);
  const categories = useMemo(() => categoriesData?.data?.categories || [], [categoriesData]);

  const canCreate = hasPermission("material_attributes:create");
  const canUpdate = hasPermission("material_attributes:update");
  const canDelete = hasPermission("material_attributes:delete");

  const filtered = useMemo(() => {
    return attributes.filter(
      (attr: MaterialAttribute) =>
        attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attr.unit.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [attributes, searchTerm]);

  const handleCreateOrUpdate = async (payload: CreateMaterialAttributePayload) => {
    try {
      if (selectedAttribute) {
        await updateMaterialAttribute(selectedAttribute._id, payload);
        showToast("success", "Attribute updated successfully");
      } else {
        await createMaterialAttribute(payload);
        showToast("success", "Attribute created successfully");
      }
      setIsModalOpen(false);
      setSelectedAttribute(undefined);
      refetchAttributes();
    } catch {
      // Toast shown by form
    }
  };

  const handleDelete = async () => {
    if (!attributeToDelete) return;
    try {
      await deleteMaterialAttribute(attributeToDelete._id);
      showToast("success", "Attribute deleted successfully");
      setIsDeleteDialogOpen(false);
      setAttributeToDelete(null);
      refetchAttributes();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error deleting attribute";
      showToast("error", errorMessage);
    }
  };

  if (isLoadingAttributes && !attributesData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-400">Loading attributes...</p>
      </div>
    );
  }

  if (attributesError) {
    return <ErrorDisplay error={attributesError} onRetry={refetchAttributes} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Material Attributes</h1>
          <p className="text-gray-400 mt-1">Define reusable metrics for material catalog items</p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              setSelectedAttribute(undefined);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black rounded-[8px] font-semibold hover:bg-[#FFC700] transition-all"
          >
            <Plus size={20} />
            Add Attribute
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
          size={20}
        />
        <input
          type="text"
          placeholder="Search by name or unit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
        />
      </div>

      {/* Attributes List */}
      <div className="space-y-4">
        {filtered.map((attribute) => (
          <div
            key={attribute._id}
            className="bg-[#1a1a1a] border border-[#333] rounded-[12px] p-6 hover:border-[#FFD700] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white">{attribute.name}</h3>
                  <span className="px-2 py-1 bg-[#FFD700]/20 text-[#FFD700] rounded text-xs font-semibold">
                    {attribute.unit}
                  </span>
                  {attribute.isRequired && (
                    <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded text-xs font-semibold">
                      Required
                    </span>
                  )}
                  {attribute.categoryId && (
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-xs font-semibold">
                      {categories.find((c) => c._id === attribute.categoryId)?.name || "Restricted"}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canUpdate && (
                  <button
                    onClick={() => {
                      setSelectedAttribute(attribute);
                      setIsModalOpen(true);
                    }}
                    className="p-2 hover:bg-[#121212] rounded-[6px] text-gray-400 hover:text-[#FFD700] transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => {
                      setAttributeToDelete(attribute);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="p-2 hover:bg-[#121212] rounded-[6px] text-gray-400 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Values and Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-2 font-semibold">Allowed Values:</p>
                <div className="flex flex-wrap gap-2">
                  {attribute.allowedValues && attribute.allowedValues.length > 0 ? (
                    attribute.allowedValues.map((value, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-[#121212] border border-[#333] rounded-full text-xs text-gray-300"
                      >
                        {value}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-xs italic">
                      Any {attribute.unit} accepted
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2 font-semibold">Usage:</p>
                <div className="flex items-center">
                  <div className="flex-1 bg-[#121212] rounded-full h-2 mr-3 overflow-hidden">
                    <div
                      className="bg-[#FFD700] h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((attribute.usageCount || 0) * 10, 100)}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold text-[#FFD700]">{attribute.usageCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-12 bg-[#1a1a1a] rounded-[12px] border border-dashed border-[#333]">
          <p className="text-gray-400">No attributes found</p>
        </div>
      )}

      {/* Modal for Create/Update */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] border border-[#333] rounded-[16px] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-[#333]">
              <h2 className="text-xl font-bold text-white">
                {selectedAttribute ? "Edit Attribute" : "New Attribute"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-white transition-all"
              >
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <div className="p-6">
              <MaterialAttributeForm
                categories={categories}
                onSubmit={handleCreateOrUpdate}
                onCancel={() => setIsModalOpen(false)}
                initialData={selectedAttribute}
                isEditing={!!selectedAttribute}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Attribute"
        message={`Are you sure you want to delete "${attributeToDelete?.name}"? This action cannot be undone and will fail if any material types are currently using this attribute.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
