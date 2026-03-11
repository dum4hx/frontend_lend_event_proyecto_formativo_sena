import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Tag, X } from "lucide-react";
import { useMaterialTypes } from "../hooks";
import { useCategories } from "../../material-categories/hooks";
import { MaterialTypeList, MaterialTypeDetailModal } from "../components";
import { AdminPagination } from "../../../components";
import { ExcelExportImport } from "../../../../../components/export/ExcelExportImport";
import { useToast } from "../../../../../contexts/ToastContext";
import type { MaterialType } from "../../../../../types/api";

export const MaterialTypeCatalog: React.FC = () => {
  const navigate = useNavigate();
  const { materialTypes, loading, error, removeMaterialType, addMaterialType } = useMaterialTypes();
  const { categories } = useCategories();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [selectedMaterialType, setSelectedMaterialType] = useState<MaterialType | null>(null);
  const pageSize = 10;

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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
    const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategoryIds.size === 0 ||
      selectedCategoryIds.has(extractCategoryId((type as any).categoryId) ?? "");
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filteredMaterialTypes.length / pageSize));
  const pagedMaterialTypes = filteredMaterialTypes.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategoryIds]);

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
      // Build a Set of valid category IDs from the list already loaded by useCategories()
      const validCategoryIds = new Set(categories.map((c) => c._id));

      let successCount = 0;
      const rejected: { name: string; categoryId: string; reason: string }[] = [];

      for (const item of data) {
        const catId = item.categoryId as string | undefined;

        // ✅ Strict validation: reject if categoryId is empty or not found in DB categories
        if (!catId || !validCategoryIds.has(catId)) {
          rejected.push({
            name: (item.name as string) ?? "(unnamed)",
            categoryId: catId ?? "(empty)",
            reason: "categoryId does not exist in the categories collection",
          });
          continue;
        }

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
        <div className="flex flex-col gap-4 mb-6">
          {/* Search + buttons row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
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
                onClick={() => navigate("create")}
                className="flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-colors whitespace-nowrap gold-action-btn"
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
                onClick={() => setSelectedCategoryIds(new Set())}
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
                  (t) => extractCategoryId((t as any).categoryId) === cat._id,
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
                  onClick={() => setSelectedCategoryIds(new Set())}
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
          <MaterialTypeList
            materialTypes={pagedMaterialTypes}
            categories={categories}
            onView={setSelectedMaterialType}
            onEdit={(type) => navigate("create", { state: { materialType: type } })}
            onDelete={handleDelete}
          />
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredMaterialTypes.length}
            pageSize={pageSize}
            itemLabel="types"
            onPageChange={setPage}
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
