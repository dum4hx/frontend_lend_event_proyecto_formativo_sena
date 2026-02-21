import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { MaterialList, MaterialFilters } from "../components";
import type { MaterialFilterState } from "../components/MaterialFilters";
import { MaterialDetailModal } from "../components/MaterialDetailModal";
import { useMaterials, useCategories } from "../hooks";
import type { MaterialType } from "../../../../../types/api";

export function MaterialCatalogPage() {
  const navigate = useNavigate();
  const { materials, loading, error, refreshMaterials } = useMaterials();
  const { categories } = useCategories();

  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType | null>(
    null,
  );
  const [filters, setFilters] = useState<MaterialFilterState>({
    searchTerm: "",
    categoryId: "",
    priceRange: { min: 0, max: 10000 },
  });

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      !filters.searchTerm ||
      material.name.toLowerCase().includes(filters.searchTerm.toLowerCase());

    const matchesCategory = !filters.categoryId || material.categoryId === filters.categoryId;

    const matchesPrice =
      material.pricePerDay >= filters.priceRange.min &&
      material.pricePerDay <= filters.priceRange.max;

    return matchesSearch && matchesCategory && matchesPrice;
  });

  const handleDelete = async (materialId: string) => {
    // TODO: Implement delete functionality
    console.log("Delete material:", materialId);
    await refreshMaterials();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Material Catalog</h1>
          <p className="text-gray-600 text-sm mt-1">
            View and manage all materials in your inventory
          </p>
        </div>
        <button
          onClick={() => navigate("create")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          New Material
        </button>
      </div>

      {/* Filters */}
      <MaterialFilters
        categories={categories}
        onFilterChange={setFilters}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-600 mb-1">Total Materials</p>
          <p className="text-2xl font-bold text-blue-900">{materials.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-600 mb-1">Visible</p>
          <p className="text-2xl font-bold text-green-900">{filteredMaterials.length}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-600 mb-1">Value</p>
          <p className="text-2xl font-bold text-purple-900">
            ${filteredMaterials
              .reduce((sum, m) => sum + m.pricePerDay, 0)
              .toFixed(2)}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Materials List */}
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
          materials={filteredMaterials}
          onEdit={(material) => console.log("Edit:", material)}
          onDelete={handleDelete}
          onView={(material) => setSelectedMaterial(material)}
        />
      )}

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
