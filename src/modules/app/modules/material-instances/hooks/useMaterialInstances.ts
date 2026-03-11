import { useState, useEffect } from "react";
import {
  getMaterialInstances,
  createMaterialInstance,
  updateMaterialInstanceStatus,
  deleteMaterialInstance,
} from "../../../../../services/materialService";
import type {
  MaterialInstance,
  CreateMaterialInstancePayload,
  UpdateMaterialInstanceStatusPayload,
} from "../../../../../types/api";

export function useMaterialInstances() {
  const [instances, setInstances] = useState<MaterialInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstances = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMaterialInstances();
      setInstances(response.data.instances || []);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Error fetching material instances");
      console.error("Error fetching instances:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  const addInstance = async (payload: CreateMaterialInstancePayload) => {
    const response = await createMaterialInstance(payload);
    setInstances((prev) => [...prev, response.data.instance]);
    return response.data.instance;
  };

  const updateInstanceStatus = async (
    instanceId: string,
    payload: UpdateMaterialInstanceStatusPayload,
  ) => {
    const response = await updateMaterialInstanceStatus(instanceId, payload);
    setInstances((prev) =>
      prev.map((inst) => (inst._id === instanceId ? response.data.instance : inst)),
    );
    return response.data.instance;
  };

  const removeInstance = async (instanceId: string) => {
    await deleteMaterialInstance(instanceId);
    setInstances((prev) => prev.filter((inst) => inst._id !== instanceId));
  };

  return {
    instances,
    loading,
    error,
    refetch: fetchInstances,
    addInstance,
    updateInstanceStatus,
    removeInstance,
  };
}
