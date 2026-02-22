import { useCallback, useEffect, useState } from "react";
import type {
  CreateMaterialCategoryPayload,
  MaterialCategory,
  UpdateMaterialCategoryPayload,
} from "../../../../../types/api";
import {
  createMaterialCategory,
  deleteMaterialCategory,
  getMaterialCategories,
  getMaterialTypes,
  updateMaterialCategory,
} from "../../../../../services/materialService";

interface UseMaterialModelsResult {
  models: MaterialCategory[];
  loading: boolean;
  error: string | null;
  createModel: (payload: CreateMaterialCategoryPayload) => Promise<void>;
  updateModel: (
    modelId: string,
    payload: UpdateMaterialCategoryPayload,
  ) => Promise<void>;
  deleteModel: (modelId: string) => Promise<void>;
  refreshModels: () => Promise<void>;
}

export function useMaterialModels(): UseMaterialModelsResult {
  const [models, setModels] = useState<MaterialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMaterialCategories();
      setModels(response.data.categories ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch material models";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const createModel = useCallback(async (payload: CreateMaterialCategoryPayload) => {
    try {
      setError(null);
      const response = await createMaterialCategory(payload);
      setModels((prev) => [...prev, response.data.category]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create material model";
      setError(message);
      throw err;
    }
  }, []);

  const updateModel = useCallback(
    async (modelId: string, payload: UpdateMaterialCategoryPayload) => {
      try {
        setError(null);
        const response = await updateMaterialCategory(modelId, payload);
        setModels((prev) =>
          prev.map((model) =>
            model._id === modelId ? response.data.category : model,
          ),
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update material model";
        setError(message);
        throw err;
      }
    },
    [],
  );

  const deleteModel = useCallback(async (modelId: string) => {
    try {
      setError(null);
      // Pre-delete check: ensure there are no material types referencing this category
      try {
        const typesResp = await getMaterialTypes({ categoryId: modelId });
        const types = typesResp.data.materialTypes ?? [];
        if (types.length > 0) {
          const names = types.map((t) => t.name).slice(0, 10).join(", ");
          throw new Error(
            `Cannot delete category — it has ${types.length} material type(s): ${names}. Remove or reassign them first.`,
          );
        }
      } catch (checkErr) {
        // If the check failed with a network/server error, surface a clear message.
        // Convert to string safely (avoid accessing .message on unknown/object)
        const checkErrMsg = String((checkErr as any)?.message ?? checkErr ?? "");
        if (/not found|404/i.test(checkErrMsg)) {
          throw new Error("Category not found (already deleted).");
        }
        // If types were found we already threw above; otherwise proceed to attempt delete
      }

      await deleteMaterialCategory(modelId);
      setModels((prev) => prev.filter((model) => model._id !== modelId));
    } catch (err) {
      console.error("useMaterialModels.deleteModel error:", err);
      let message = err instanceof Error ? err.message : "Failed to delete material model";

      // Safely inspect common shapes without relying on typed properties.
      const anyErr = err as any;
      const status = anyErr?.status ?? anyErr?.statusCode ?? anyErr?.response?.status;
      const errMsg = String(anyErr?.message ?? anyErr?.response?.statusText ?? "");

      // Treat 404 or explicit 'route not found' messages as already-deleted: remove locally
      if (status === 404 || /Route .* not found/i.test(errMsg) || /not found|404/i.test(errMsg)) {
        setModels((prev) => prev.filter((model) => model._id !== modelId));
        setError(null);
        return; // swallow the error — UI is consistent
      }

      // Fall back to the generic message
      setError(message);
      throw err;
    }
  }, []);

  const refreshModels = useCallback(async () => {
    await fetchModels();
  }, [fetchModels]);

  return {
    models,
    loading,
    error,
    createModel,
    updateModel,
    deleteModel,
    refreshModels,
  };
}
