import { useState, useRef } from "react";
import type {
  CreateMaterialTypePayload,
  MaterialType,
  UpdateMaterialTypePayload,
} from "../../../../types/api";
import { useMaterialModels } from "../material-models/hooks";
import { Download, Upload } from "lucide-react";
import { MaterialTypeForm } from "./components/MaterialTypeForm";
import { MaterialTypeList } from "./components/MaterialTypeList";
import { useMaterialTypes } from "./hooks/useMaterialTypes";

export function MaterialTypesModule() {
  const { types, loading, error, createType, updateType, deleteType, refreshTypes } =
    useMaterialTypes();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    models,
    loading: modelsLoading,
    error: modelsError,
  } = useMaterialModels();

  const [editingType, setEditingType] = useState<MaterialType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (
    payload: CreateMaterialTypePayload | UpdateMaterialTypePayload,
  ) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      if (editingType) {
        await updateType(editingType._id, payload);
      } else {
        await createType(payload as CreateMaterialTypePayload);
      }
      setEditingType(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save material type";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (typeId: string) => {
    if (!confirm("Delete this material type?")) return;
    try {
      await deleteType(typeId);
      if (editingType?._id === typeId) setEditingType(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete material type";
      setSubmitError(message);
    }
  };

  const exportTypesToExcel = async (items: typeof types) => {
    try {
      const rows = items.map((t) => ({
        Name: t.name,
        CategoryId: t.categoryId,
        PricePerDay: t.pricePerDay,
        ReplacementCost: t.replacementCost ?? "",
        Description: t.description ?? "",
      }));
      const xlsx = await import("xlsx");
      const ws = xlsx.utils.json_to_sheet(rows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "MaterialTypes");
      xlsx.writeFile(wb, "material-types.xlsx");
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export material types. Install 'xlsx' or check console.");
    }
  };

  const handleImportFile = async (file?: File | null) => {
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const xlsx = await import("xlsx");
      const wb = xlsx.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = xlsx.utils.sheet_to_json(ws);
      for (const row of rows) {
        const payload = {
          name: row.Name || row.name || "",
          categoryId: row.CategoryId || row.Category || "",
          pricePerDay: Number(row.PricePerDay || row.pricePerDay) || 0,
          replacementCost: row.ReplacementCost ? Number(row.ReplacementCost) : undefined,
          description: row.Description || row.description || "",
        } as any;
        try {
          await createType(payload);
        } catch (err) {
          console.error("Error creating material type from row:", row, err);
        }
      }
      await refreshTypes();
    } catch (err) {
      console.error("Import failed:", err);
      alert("Failed to import material types. Check console for details.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Material Types</h1>
          <p className="text-gray-400 text-sm mt-1">
            Create and manage material types linked to models
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportTypesToExcel(types)}
            className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] text-gray-200 border border-[#333] rounded-lg hover:opacity-90 transition"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] text-gray-200 border border-[#333] rounded-lg hover:opacity-90 transition"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          await handleImportFile(file);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
      />

      {submitError && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-200">
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {modelsLoading ? (
            <div className="flex items-center justify-center h-48 bg-[#121212] border border-[#333] rounded-lg">
              <p className="text-gray-400">Loading models...</p>
            </div>
          ) : (
            <MaterialTypeForm
              models={models}
              initialType={editingType}
              isLoading={isSubmitting}
              onCancel={() => setEditingType(null)}
              onSubmit={handleSubmit}
            />
          )}
          {modelsError && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-200 mt-4">
              {modelsError}
            </div>
          )}
        </div>
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-[#121212] border border-[#333] rounded-lg">
              <p className="text-gray-400">Loading types...</p>
            </div>
          ) : (
            <MaterialTypeList
              types={types}
              models={models}
              onEdit={setEditingType}
              onDelete={handleDelete}
            />
          )}
          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-200 mt-4">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
