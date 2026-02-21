import { useState } from "react";
import type {
  CreateMaterialCategoryPayload,
  MaterialCategory,
  UpdateMaterialCategoryPayload,
} from "../../../../types/api";
import { MaterialModelForm } from "./components/MaterialModelForm";
import { MaterialModelList } from "./components/MaterialModelList";
import { useMaterialModels } from "./hooks/useMaterialModels";

export function MaterialModelsModule() {
  const {
    models,
    loading,
    error,
    createModel,
    updateModel,
    deleteModel,
  } = useMaterialModels();
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
      await deleteModel(modelId);
      if (editingModel?._id === modelId) setEditingModel(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete material model";
      setSubmitError(message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Material Models</h1>
        <p className="text-gray-400 text-sm mt-1">
          Create and manage material models
        </p>
      </div>

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
    </div>
  );
}
