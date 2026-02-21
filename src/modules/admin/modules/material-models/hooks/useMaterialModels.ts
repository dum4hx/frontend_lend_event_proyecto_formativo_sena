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
      await deleteMaterialCategory(modelId);
      setModels((prev) => prev.filter((model) => model._id !== modelId));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete material model";
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
