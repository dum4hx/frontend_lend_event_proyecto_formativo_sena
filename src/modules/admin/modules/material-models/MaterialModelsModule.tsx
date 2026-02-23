import { useState, useRef } from "react";
import type {
  CreateMaterialCategoryPayload,
  MaterialCategory,
  UpdateMaterialCategoryPayload,
  MaterialType,
} from "../../../../types/api";
import { MaterialModelForm } from "./components/MaterialModelForm";
import { MaterialModelList } from "./components/MaterialModelList";
import { Download, Upload } from "lucide-react";
import { useMaterialModels } from "./hooks/useMaterialModels";
import {
  getMaterialTypes,
  getMaterialInstances,
  deleteMaterialType,
  deleteMaterialInstance,
} from "../../../../services/materialService";

export function MaterialModelsModule() {
  const {
    models,
    loading,
    error,
    createModel,
    updateModel,
    deleteModel,
  } = useMaterialModels();
  const { refreshModels } = useMaterialModels();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editingModel, setEditingModel] = useState<MaterialCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (
    payload: CreateMaterialCategoryPayload | UpdateMaterialCategoryPayload,
  ) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      if (editingModel) {
        await updateModel(editingModel._id, payload);
      } else {
        await createModel(payload as CreateMaterialCategoryPayload);
      }
      setEditingModel(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save material model";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (modelId: string) => {
    if (!confirm("Delete this material model?")) return;
    try {
      // UI-level pre-check to show dependent types before attempting delete
      const typesResp = await getMaterialTypes({ categoryId: modelId });
      const dependent = typesResp.data.materialTypes ?? [];
      if (dependent.length > 0) {
        setDependentTypes(dependent);
        setSelectedModelId(modelId);
        setShowDepsModal(true);
        return;
      }

      await deleteModel(modelId);
      if (editingModel?._id === modelId) setEditingModel(null);
    } catch (err) {
      console.error("MaterialModelsModule.handleDelete error:", err);
      const message = err instanceof Error ? err.message : "Failed to delete material model";
      setSubmitError(message);
    }
  };

  const [showDepsModal, setShowDepsModal] = useState(false);
  const [dependentTypes, setDependentTypes] = useState<MaterialType[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [isForceDeleting, setIsForceDeleting] = useState(false);

  const closeDepsModal = () => {
    setShowDepsModal(false);
    setDependentTypes([]);
    setSelectedModelId(null);
    setIsForceDeleting(false);
  };

  const handleForceDelete = async () => {
    if (!selectedModelId) return;
    if (!confirm("This will permanently delete all instances and types in this category. Continue?")) return;
    setIsForceDeleting(true);
    setSubmitError(null);

    try {
      // Delete instances for each dependent type, then delete the type
      for (const t of dependentTypes) {
        // fetch instances for this type
        try {
          const instResp = await getMaterialInstances({ materialTypeId: t._id });
          const instances = instResp.data.instances ?? [];
          for (const inst of instances) {
            await deleteMaterialInstance(inst._id);
          }
        } catch (innerErr) {
          console.error("Failed deleting instances for type", t._id, innerErr);
          throw innerErr;
        }

        // delete the material type itself
        try {
          await deleteMaterialType(t._id);
        } catch (innerErr) {
          console.error("Failed deleting material type", t._id, innerErr);
          throw innerErr;
        }
      }

      // finally delete the category via hook (this will call deleteMaterialCategory)
      await deleteModel(selectedModelId);
      closeDepsModal();
    } catch (err) {
      console.error("Force delete failed:", err);
      const message = err instanceof Error ? err.message : "Force delete failed";
      setSubmitError(message);
    } finally {
      setIsForceDeleting(false);
    }
  };

  const exportModelsToExcel = async (items: typeof models) => {
    try {
      const rows = items.map((m) => ({
        Name: m.name,
        ParentId: m.parentId || "",
        Description: m.description || "",
      }));
      const xlsx = await import("xlsx");
      const ws = xlsx.utils.json_to_sheet(rows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "MaterialModels");
      xlsx.writeFile(wb, "material-models.xlsx");
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export material models. Install 'xlsx' or check console.");
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
          parentId: row.ParentId || row.Parent || undefined,
          description: row.Description || row.description || "",
        } as any;
        try {
          await createModel(payload);
        } catch (err) {
          console.error("Error creating model from row:", row, err);
        }
      }
      await refreshModels();
    } catch (err) {
      console.error("Import failed:", err);
      alert("Failed to import material models. Check console for details.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Material Models</h1>
          <p className="text-gray-400 text-sm mt-1">Create and manage material models</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportModelsToExcel(models)}
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
          <MaterialModelForm
            models={models}
            initialModel={editingModel}
            isLoading={isSubmitting}
            onCancel={() => setEditingModel(null)}
            onSubmit={handleSubmit}
          />
        </div>
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-[#121212] border border-[#333] rounded-lg">
              <p className="text-gray-400">Loading models...</p>
            </div>
          ) : (
            <MaterialModelList
              models={models}
              onEdit={setEditingModel}
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
      {showDepsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={closeDepsModal} />
          <div className="relative bg-[#0b0b0b] border border-[#333] rounded-lg p-6 w-full max-w-2xl z-10">
            <h2 className="text-xl font-semibold text-white">Cannot delete category</h2>
            <p className="text-gray-400 mt-2">
              This category has the following material types. Remove or reassign them before deleting the category.
            </p>
            <ul className="mt-4 max-h-56 overflow-auto divide-y divide-[#222]">
              {dependentTypes.map((t) => (
                <li key={t._id} className="py-3 flex justify-between items-center">
                  <div>
                    <div className="text-white">{t.name}</div>
                    <div className="text-gray-400 text-sm">{t.description || "—"}</div>
                  </div>
                  <div className="text-gray-400 text-sm">{t._id}</div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end">
              <div className="flex gap-2">
                <button
                  onClick={closeDepsModal}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleForceDelete}
                  disabled={isForceDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
                >
                  {isForceDeleting ? "Eliminando..." : "Forzar eliminación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
