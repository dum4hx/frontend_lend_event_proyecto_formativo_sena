import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Download, Upload } from "lucide-react";
import { MaterialList, MaterialFilters } from "../components";
import type { MaterialFilterState } from "../components/MaterialFilters";
import { MaterialDetailModal } from "../components/MaterialDetailModal";
import { useMaterials, useCategories } from "../hooks";
import { deleteMaterialType } from "../../../../../services/materialService";
import type { MaterialType } from "../../../../../types/api";

interface MaterialCatalogPageProps {
  onCreateMaterial?: () => void;
}

export function MaterialCatalogPage({ onCreateMaterial }: MaterialCatalogPageProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { materials, loading, error, refreshMaterials, createMaterial } = useMaterials();
  const { categories } = useCategories();

  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [filters, setFilters] = useState<MaterialFilterState>({
    searchTerm: "",
    categoryId: "",
    priceRange: { min: 0, max: 1000000000 },
  });

  const filteredMaterials = materials.filter((material) => {
    const price = material.pricePerDay ?? 0;

    const matchesSearch = filters.searchExact
      ? (!filters.searchTerm || material.name.toLowerCase() === filters.searchTerm.toLowerCase())
      : (!filters.searchTerm || material.name.toLowerCase().includes(filters.searchTerm.toLowerCase()));

    // Always show all materials in the main list regardless of selected category.
    // The category selector still drives the detail panel in the filters component.
    const matchesPrice = price >= filters.priceRange.min && price <= filters.priceRange.max;

    return matchesSearch && matchesPrice;
  });

  // Diagnostic log to help debug why the list may be empty at runtime.
  console.debug("MaterialCatalog debug", {
    materialsLength: materials.length,
    filters,
    filteredLength: filteredMaterials.length,
  });

  // Fallback: if the filtered result is empty but there are materials available
  // and the user hasn't entered a search term, show all materials to avoid
  // an empty screen on first load.
  const visibleMaterials =
    filteredMaterials.length > 0
      ? filteredMaterials
      : (!filters.searchTerm && materials.length > 0 ? materials : filteredMaterials);

  const handleDelete = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    try {
      await deleteMaterialType(materialId);
      await refreshMaterials();
    } catch (err) {
      console.error("MaterialCatalog.delete error:", err);
      // optionally show an in-UI message later
    }
  };

  const formatCop = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 2,
    }).format(value);

  const totalPages = Math.max(1, Math.ceil((visibleMaterials?.length ?? 0) / pageSize));

  const pagedMaterials = visibleMaterials.slice((page - 1) * pageSize, page * pageSize);

  const exportToExcel = async (items: MaterialType[]) => {
    try {
      const rows = items.map((m) => {
        let cat: any = (m as any).categoryId ?? (m as any).category ?? (m as any).modelId ?? (m as any).model;
        if (Array.isArray(cat)) cat = cat[0];
        if (typeof cat === "object") cat = cat._id ?? cat.name ?? "";
        if (typeof cat !== "string") cat = String(cat ?? "");
        return {
          Name: m.name,
          CategoryId: cat || "",
          PricePerDay: m.pricePerDay ?? 0,
          Description: m.description ?? "",
        };
      });
      const xlsx = await import("xlsx");
      const ws = xlsx.utils.json_to_sheet(rows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Materials");
      xlsx.writeFile(wb, "materials.xlsx");
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export materials. Install 'xlsx' or check console.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Material Models</h1>
          <p className="text-gray-400 text-sm mt-1">
            View and manage all material models in your inventory
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToExcel(visibleMaterials)}
            className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] text-gray-200 border border-[#333] rounded-lg hover:opacity-90 transition"
            title="Export visible materials to Excel"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] text-gray-200 border border-[#333] rounded-lg hover:opacity-90 transition"
            title="Import materials from Excel"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>

          <button
            onClick={() => (onCreateMaterial ? onCreateMaterial() : navigate("create"))}
            className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black font-bold rounded-lg hover:bg-yellow-400 transition"
          >
            <Plus className="w-5 h-5" />
            New Material
          </button>
        </div>
      </div>

      {/* hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const data = await file.arrayBuffer();
            const xlsx = await import("xlsx");
            const wb = xlsx.read(data, { type: "array" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows: any[] = xlsx.utils.sheet_to_json(ws);
            for (const row of rows) {
              const payload: any = {
                name: row.Name || row.name || "",
                categoryId: row.CategoryId || row.Category || "",
                pricePerDay: Number(row.PricePerDay || row.pricePerDay) || 0,
                description: row.Description || row.description || "",
              };
              try {
                await createMaterial(payload);
              } catch (err) {
                console.error("Error creating material from row:", row, err);
              }
            }
            await refreshMaterials();
          } catch (err) {
            console.error("Import failed:", err);
            alert("Failed to import materials. Check console for details.");
          } finally {
            // reset input so same file can be re-picked if needed
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
        }}
      />

      {/* Filters */}
      <MaterialFilters
        categories={categories}
        onFilterChange={setFilters}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#121212] border border-[#333] rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Total Materials</p>
          <p className="text-2xl font-bold text-white">{materials.length}</p>
        </div>
        <div className="bg-[#121212] border border-[#333] rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Visible</p>
          <p className="text-2xl font-bold text-white">
            {visibleMaterials.length}
          </p>
        </div>
        <div className="bg-[#121212] border border-[#333] rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Value</p>
          <p className="text-2xl font-bold text-white">
            {formatCop(
              visibleMaterials.reduce((sum, m) => sum + (m.pricePerDay ?? 0), 0),
            )}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {/* Materials List */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-[#121212] border border-[#333] rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-4 border-[#333] border-t-[#FFD700] rounded-full animate-spin" />
            </div>
            <p className="text-gray-400">Loading materials...</p>
          </div>
        </div>
      ) : (
        <>
          <MaterialList
            materials={pagedMaterials}
            onEdit={(material) => navigate("create", { state: { material } })}
            onDelete={handleDelete}
            onView={(material) => setSelectedMaterial(material)}
          />
          {/* Pagination controls */}
          {visibleMaterials.length > pageSize && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-400">Page {page} of {totalPages}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-[#1a1a1a] border border-[#333] rounded text-gray-200 disabled:opacity-50"
                >Prev</button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-[#1a1a1a] border border-[#333] rounded text-gray-200 disabled:opacity-50"
                >Next</button>
              </div>
            </div>
          )}
        </>
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
