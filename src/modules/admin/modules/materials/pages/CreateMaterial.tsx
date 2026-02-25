import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, ArrowLeft } from "lucide-react";
import { MaterialForm, MaterialList, MaterialFilters } from "../components";
import { deleteMaterialType } from "../../../../../services/materialService";
import type { MaterialFilterState } from "../components/MaterialFilters";
import { MaterialDetailModal } from "../components/MaterialDetailModal";
import { useMaterials, useCategories } from "../hooks";
import type { MaterialType, CreateMaterialTypePayload } from "../../../../../types/api";

interface CreateMaterialPageProps {
  onSuccess?: () => void;
  onNavigateBack?: () => void;
}

export function CreateMaterialPage({ onSuccess, onNavigateBack }: CreateMaterialPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { materials, loading, error, createMaterial, updateMaterial, refreshMaterials } =
    useMaterials();
  const { categories, loading: categoriesLoading, error: categoriesError } =
    useCategories();

  const [showForm, setShowForm] = useState(true);
  const [editingMaterial, setEditingMaterial] = useState<MaterialType | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType | null>(
    null,
  );
  const [filters, setFilters] = useState<MaterialFilterState>({
    searchTerm: "",
    categoryId: "",
    priceRange: { min: 0, max: 10000 },
  });

  useEffect(() => {
    const stateMaterial = (location.state as { material?: MaterialType } | null)?.material;
    if (stateMaterial) {
      setEditingMaterial(stateMaterial);
      setShowForm(true);
      navigate(".", { replace: true, state: null });
    }
  }, [location.state, navigate]);

  const fingeredMaterials = materials.filter((material) => {
    const matchesSearch =
      !filters.searchTerm ||
      material.name.toLowerCase().includes(filters.searchTerm.toLowerCase());

    const matchesCategory = !filters.categoryId || material.categoryId === filters.categoryId;

    const matchesPrice =
      material.pricePerDay >= filters.priceRange.min &&
      material.pricePerDay <= filters.priceRange.max;

    return matchesSearch && matchesCategory && matchesPrice;
  });

  const handleSubmit = async (payload: CreateMaterialTypePayload) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      if (editingMaterial) {
        await updateMaterial(editingMaterial._id, payload);
      } else {
        await createMaterial(payload);
      }
      if (onSuccess) {
        onSuccess();
      }
      // Refresh materials and redirect to catalog
      await refreshMaterials();
      setEditingMaterial(null);
      navigate("..", { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create material";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    try {
      await deleteMaterialType(materialId);
      await refreshMaterials();
    } catch (err) {
      console.error("CreateMaterialPage.delete error:", err);
      const message = err instanceof Error ? err.message : "Failed to delete material";
      setSubmitError(message);
    }
  };

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-medium">Error loading categories</p>
        <p className="text-red-600 text-sm mt-2">{categoriesError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => (onNavigateBack ? onNavigateBack() : navigate(".."))}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Back to catalog"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Material Management
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Create and manage your material catalog
            </p>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {showForm ? "New Material" : "Create Another"}
              </h2>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <Plus className="w-5 h-5 text-blue-600" />
                </button>
              )}
            </div>

            {showForm && (
              <MaterialForm
                categories={categories}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingMaterial(null);
                }}
                isLoading={isSubmitting}
                isEditing={Boolean(editingMaterial)}
                initialData={
                  editingMaterial
                    ? {
                        categoryId: editingMaterial.categoryId,
                        name: editingMaterial.name,
                        pricePerDay: editingMaterial.pricePerDay,
                        description: editingMaterial.description,
                      }
                    : undefined
                }
              />
            )}

            {!showForm && !isSubmitting && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-green-700 font-medium">✓ Material created successfully!</p>
                <p className="text-green-600 text-sm mt-1">
                  Click the + button to create another
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Materials List Section */}
        <div className="lg:col-span-2">
          {/* Filters */}
          <MaterialFilters
            categories={categories}
            onFilterChange={setFilters}
          />

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-600 mb-1">Total Materials</p>
              <p className="text-2xl font-bold text-blue-900">{materials.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-600 mb-1">Filtered Results</p>
              <p className="text-2xl font-bold text-green-900">{fingeredMaterials.length}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-purple-600 mb-1">Categories</p>
              <p className="text-2xl font-bold text-purple-900">{categories.length}</p>
            </div>
          </div>

          {/* Error Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
              {error}
            </div>
          )}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
              {submitError}
            </div>
          )}

          {/* Materials List */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Material Catalog
            </h2>
            {loading ? (
              <div className="flex items-center justify-center h-64 bg-white rounded-lg">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                  <p className="text-gray-600">Loading materials...</p>
                </div>
              </div>
            ) : (
              <MaterialList
                materials={fingeredMaterials}
                onEdit={(material) => {
                  setEditingMaterial(material);
                  setShowForm(true);
                }}
                onDelete={handleDelete}
                onView={(material) => setSelectedMaterial(material)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedMaterial && (
        <MaterialDetailModal
          material={selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
        />
      )}
    </div>
  );
}
