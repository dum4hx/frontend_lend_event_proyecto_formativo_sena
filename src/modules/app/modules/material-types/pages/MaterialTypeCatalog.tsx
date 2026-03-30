import React, { useState } from "react";
import { Plus, Search, Tag, X } from "lucide-react";
import { useMaterialTypes } from "../hooks";
import { useCategories } from "../../material-categories/hooks";
import { MaterialTypeList, MaterialTypeDetailModal, MaterialTypeForm } from "../components";
import { AdminPagination } from "../../../components";
import { ExcelExportImport } from "../../../../../components/export/ExcelExportImport";
import { useToast } from "../../../../../contexts/ToastContext";
import type {
  MaterialType,
  CreateMaterialTypePayload,
  UpdateMaterialTypePayload,
} from "../../../../../types/api";

type MaterialWithCategory = MaterialType & {
  categoryId?: string | string[] | { _id?: string } | { _id?: string }[];
};

export const MaterialTypeCatalog: React.FC = () => {
  const {
    materialTypes,
    loading,
    error,
    removeMaterialType,
    addMaterialType,
    updateMaterialType: updateMaterialTypeData,
  } = useMaterialTypes();
  const { categories } = useCategories();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [selectedMaterialType, setSelectedMaterialType] = useState<MaterialType | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<MaterialType | null>(null);
  const pageSize = 10;
  const searchInputId = "material-types-search";

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setPage(1);
  };

  // Extracts the first categoryId string regardless of backend format (string | string[] | object[])
  const extractCategoryId = (value: unknown): string | undefined => {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      if (typeof first === "string") return first;
      if (first && typeof first === "object") return (first as { _id?: string })._id;
    }
    if (value && typeof value === "object") return (value as { _id?: string })._id;
    return undefined;
  };

  const filteredMaterialTypes = materialTypes.filter((type) => {
    const material = type as MaterialWithCategory;
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategoryIds.size === 0 ||
      selectedCategoryIds.has(extractCategoryId(material.categoryId) ?? "");
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (type: MaterialType) => {
    setEditingType(type);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (payload: CreateMaterialTypePayload) => {
    try {
      if (editingType) {
        await updateMaterialTypeData(editingType._id, payload as UpdateMaterialTypePayload);
        showToast("success", "Material type updated successfully", "Success");
      } else {
        await addMaterialType(payload);
        showToast("success", "Material type created successfully", "Success");
      }
      setIsFormOpen(false);
      setEditingType(null);
    } catch (err) {
      const error = err as Error;
      showToast("error", error.message || "Failed to save material type", "Error");
      throw err;
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredMaterialTypes.length / pageSize));

  // Ensure current page is within total pages range
  const currentPage = Math.min(page, totalPages);
  const pagedMaterialTypes = filteredMaterialTypes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleDelete = (type: MaterialType) => {
    showToast(
      "warning",
      `Do you want to delete "${type.name}"? This action cannot be undone.`,
      "Confirm Deletion",
      {
        duration: Infinity,
        action: {
          label: "Confirm",
          onClick: async () => {
            try {
              await removeMaterialType(type._id);
              showToast("success", "Material type deleted successfully", "Success");
            } catch (error) {
              const err = error as Error;
              showToast("error", err.message || "Failed to delete material type", "Error");
            }
          },
        },
      },
    );
  };

  const handleImportMaterialTypes = async (data: Record<string, unknown>[]) => {
    try {
      // Build lookup structures from loaded categories
      const categoryIdMap = new Map(categories.map((c) => [c._id, c._id]));
      const categoryNameMap = new Map(categories.map((c) => [c.name.toLowerCase().trim(), c._id]));

      let successCount = 0;
      const rejected: { name: string; categoryId: string; reason: string }[] = [];

      for (const item of data) {
        // Accept either categoryId (ObjectId) or categoryName (human-readable)
        const rawCatId = item.categoryId as string | undefined;
        const rawCatName = item.categoryName as string | undefined;

        let resolvedCategoryId: string | undefined;

        if (rawCatId && categoryIdMap.has(rawCatId)) {
          resolvedCategoryId = rawCatId;
        } else if (rawCatName) {
          resolvedCategoryId = categoryNameMap.get(rawCatName.toLowerCase().trim());
        }

        if (!resolvedCategoryId) {
          rejected.push({
            name: (item.name as string) ?? "(unnamed)",
            categoryId: rawCatId ?? rawCatName ?? "(empty)",
            reason: "categoryId / categoryName not found in categories collection",
          });
          continue;
        }

        const catId = resolvedCategoryId;

        try {
          await addMaterialType({
            name: item.name as string,
            description: item.description as string,
            categoryId: catId,
            pricePerDay: parseFloat(item.pricePerDay as string),
          });
          successCount++;
        } catch (itemError) {
          console.error("[Import] Error creating record:", item, itemError);
          rejected.push({
            name: (item.name as string) ?? "(unnamed)",
            categoryId: catId,
            reason: itemError instanceof Error ? itemError.message : "Error creating record",
          });
        }
      }

      const total = data.length;
      const rejectedCount = rejected.length;

      if (rejectedCount > 0) {
        // Log full rejection detail to console for debugging
        console.warn(`[Import] ${rejectedCount} rejected record(s):`, rejected);
        showToast(
          successCount > 0 ? "warning" : "error",
          `${successCount} imported, ${rejectedCount} rejected due to invalid categoryId. Check console for details.`,
          `Import: ${successCount}/${total}`,
        );
      } else {
        showToast("success", `${successCount}/${total} material types imported`, "Import complete");
      }
    } catch (error) {
      const err = error as Error;
      showToast("error", err.message || "Error importing material types", "Import Failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] p-8">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="mb-8 space-y-3">
            <div className="h-9 w-72 rounded bg-[#262626]" />
            <div className="h-4 w-80 rounded bg-[#222]" />
          </div>
          <div className="mb-6 h-14 rounded-lg bg-[#1a1a1a] border border-[#333]" />
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="h-8 w-16 rounded-full bg-[#262626]" />
            <div className="h-8 w-28 rounded-full bg-[#222]" />
            <div className="h-8 w-24 rounded-full bg-[#222]" />
            <div className="h-8 w-32 rounded-full bg-[#222]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="h-28 rounded-lg bg-[#1a1a1a] border border-[#333]" />
            <div className="h-28 rounded-lg bg-[#1a1a1a] border border-[#333]" />
          </div>
          <div className="rounded-lg bg-[#1a1a1a] border border-[#333] p-6 space-y-3">
            <div className="h-12 rounded bg-[#232323]" />
            <div className="h-12 rounded bg-[#232323]" />
            <div className="h-12 rounded bg-[#232323]" />
            <div className="h-12 rounded bg-[#232323]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] p-8 flex items-center justify-center">
        <div className="bg-[#1a1a1a] border border-red-900/70 rounded-xl p-6 max-w-lg w-full">
          <h2 className="text-xl font-semibold text-red-300 mb-2">Unable to load material types</h2>
          <p className="text-sm text-red-200/80 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg border border-[#B88A00] text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors"
          >
            Retry
          </button>
        </div>
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
        <div className="flex flex-col gap-4 mb-6">
          {/* Search + buttons row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <label htmlFor={searchInputId} className="sr-only">
                Search material types
              </label>
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                id={searchInputId}
                type="text"
                placeholder="Search material types..."
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
                data={filteredMaterialTypes as unknown as Record<string, unknown>[]}
                filename="material-types"
                onImport={handleImportMaterialTypes}
                showLabels={true}
              />
              <button
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-colors whitespace-nowrap border border-[#B88A00] text-[#FFD700] hover:bg-[#FFD700]/10"
              >
                <Plus size={20} />
                New Material Type
              </button>
            </div>
          </div>

          {/* Category filter pills */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="flex items-center gap-1 text-gray-400 text-sm mr-1">
                <Tag size={14} /> Filtrar:
              </span>
              <button
                onClick={() => {
                  setSelectedCategoryIds(new Set());
                  setPage(1);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategoryIds.size === 0
                    ? "bg-[#FFD700] text-black"
                    : "bg-[#1a1a1a] border border-[#333] text-gray-400 hover:border-[#FFD700] hover:text-white"
                }`}
              >
                Todas
              </button>
              {categories.map((cat) => {
                const isActive = selectedCategoryIds.has(cat._id);
                const count = materialTypes.filter(
                  (t) => extractCategoryId((t as MaterialWithCategory).categoryId) === cat._id,
                ).length;
                return (
                  <button
                    key={cat._id}
                    onClick={() => toggleCategory(cat._id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#FFD700] text-black"
                        : "bg-[#1a1a1a] border border-[#333] text-gray-400 hover:border-[#FFD700] hover:text-white"
                    }`}
                  >
                    {cat.name}
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        isActive ? "bg-black/20 text-black" : "bg-[#333] text-gray-300"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
              {selectedCategoryIds.size > 0 && (
                <button
                  onClick={() => {
                    setSelectedCategoryIds(new Set());
                    setPage(1);
                  }}
                  className="flex items-center gap-1 px-2 py-1.5 text-gray-500 hover:text-white text-sm transition-colors"
                  title="Limpiar filtros"
                >
                  <X size={14} /> Limpiar ({selectedCategoryIds.size})
                </button>
              )}
            </div>
          )}
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
          {filteredMaterialTypes.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg text-white mb-2">No material types found</p>
              <p className="text-sm text-gray-400 mb-6">
                {searchTerm || selectedCategoryIds.size > 0
                  ? "Try changing your search term or clearing the filters."
                  : "Create your first material type to start building your catalog."}
              </p>
              {!searchTerm && selectedCategoryIds.size === 0 && (
                <button
                  type="button"
                  onClick={() => setIsFormOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#B88A00] text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors"
                >
                  <Plus size={18} />
                  Create Material Type
                </button>
              )}
            </div>
          ) : (
            <>
              <MaterialTypeList
                materialTypes={pagedMaterialTypes}
                categories={categories}
                onView={setSelectedMaterialType}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredMaterialTypes.length}
                pageSize={pageSize}
                itemLabel="types"
                onPageChange={setPage}
              />
            </>
          )}
        </div>

        {/* Form Modal */}
        {isFormOpen && (
          <MaterialTypeForm
            categories={categories}
            initialData={editingType || undefined}
            isEditing={!!editingType}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingType(null);
            }}
          />
        )}

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
