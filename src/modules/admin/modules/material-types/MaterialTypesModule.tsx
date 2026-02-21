import { useState } from "react";
import type {
  CreateMaterialTypePayload,
  MaterialType,
  UpdateMaterialTypePayload,
} from "../../../../types/api";
import { useMaterialModels } from "../material-models/hooks";
import { MaterialTypeForm } from "./components/MaterialTypeForm";
import { MaterialTypeList } from "./components/MaterialTypeList";
import { useMaterialTypes } from "./hooks/useMaterialTypes";

export function MaterialTypesModule() {
  const { types, loading, error, createType, updateType, deleteType } =
    useMaterialTypes();
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Material Types</h1>
        <p className="text-gray-400 text-sm mt-1">
          Create and manage material types linked to models
        </p>
      </div>

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
