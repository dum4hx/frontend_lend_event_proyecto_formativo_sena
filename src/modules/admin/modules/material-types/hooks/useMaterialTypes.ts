import { useCallback, useEffect, useState } from "react";
import type {
  CreateMaterialTypePayload,
  MaterialType,
  UpdateMaterialTypePayload,
} from "../../../../../types/api";
import {
  createMaterialType,
  deleteMaterialType,
  getMaterialTypes,
  updateMaterialType,
} from "../../../../../services/materialService";

interface UseMaterialTypesResult {
  types: MaterialType[];
  loading: boolean;
  error: string | null;
  createType: (payload: CreateMaterialTypePayload) => Promise<void>;
  updateType: (typeId: string, payload: UpdateMaterialTypePayload) => Promise<void>;
  deleteType: (typeId: string) => Promise<void>;
  refreshTypes: () => Promise<void>;
}

export function useMaterialTypes(): UseMaterialTypesResult {
  const [types, setTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMaterialTypes();
      setTypes(response.data.materialTypes ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch material types";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const createType = useCallback(async (payload: CreateMaterialTypePayload) => {
    try {
      setError(null);
      const response = await createMaterialType(payload);
      setTypes((prev) => [...prev, response.data.materialType]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create material type";
      setError(message);
      throw err;
    }
  }, []);

  const updateType = useCallback(
    async (typeId: string, payload: UpdateMaterialTypePayload) => {
      try {
        setError(null);
        const response = await updateMaterialType(typeId, payload);
        setTypes((prev) =>
          prev.map((type) =>
            type._id === typeId ? response.data.materialType : type,
          ),
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update material type";
        setError(message);
        throw err;
      }
    },
    [],
  );

  const deleteType = useCallback(async (typeId: string) => {
    try {
      setError(null);
      await deleteMaterialType(typeId);
      setTypes((prev) => prev.filter((type) => type._id !== typeId));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete material type";
      setError(message);
      throw err;
    }
  }, []);

  const refreshTypes = useCallback(async () => {
    await fetchTypes();
  }, [fetchTypes]);

  return {
    types,
    loading,
    error,
    createType,
    updateType,
    deleteType,
    refreshTypes,
  };
}
