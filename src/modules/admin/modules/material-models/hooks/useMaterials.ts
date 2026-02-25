import { useState, useEffect, useCallback } from "react";
import type {
  MaterialType,
  CreateMaterialTypePayload,
} from "../../../../../types/api";
import {
  createMaterialType,
  getMaterialTypes,
  updateMaterialType,
} from "../../../../../services/materialService";

interface UseMaterialsResult {
  materials: MaterialType[];
  loading: boolean;
  error: string | null;
  createMaterial: (payload: CreateMaterialTypePayload) => Promise<void>;
  updateMaterial: (typeId: string, payload: Partial<CreateMaterialTypePayload>) => Promise<void>;
  refreshMaterials: () => Promise<void>;
}

export function useMaterials(): UseMaterialsResult {
  const [materials, setMaterials] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMaterialTypes();
      setMaterials(response.data.materialTypes ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch materials";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const createMaterial = useCallback(
    async (payload: CreateMaterialTypePayload) => {
      try {
        setError(null);
        const response = await createMaterialType(payload);
        setMaterials((prev) => [...prev, response.data.materialType]);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create material";
        setError(message);
        throw err;
      }
    },
    [],
  );

  const updateMaterial = useCallback(
    async (typeId: string, payload: Partial<CreateMaterialTypePayload>) => {
      try {
        setError(null);
        const response = await updateMaterialType(typeId, payload);
        setMaterials((prev) =>
          prev.map((m) => (m._id === typeId ? response.data.materialType : m)),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update material";
        setError(message);
        throw err;
      }
    },
    [],
  );

  const refreshMaterials = useCallback(async () => {
    await fetchMaterials();
  }, [fetchMaterials]);

  return {
    materials,
    loading,
    error,
    createMaterial,
    updateMaterial,
    refreshMaterials,
  };
}
