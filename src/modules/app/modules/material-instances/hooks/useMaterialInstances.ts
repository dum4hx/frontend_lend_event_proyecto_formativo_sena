import { useCallback, useEffect, useState } from "react";
import {
  getMaterialInstances,
  createMaterialInstance,
  updateMaterialInstanceStatus,
  deleteMaterialInstance,
} from "../../../../../services/materialService";
import { useAuth } from "../../../../../contexts/useAuth";
import { isOwnerRoleName } from "../../../pages/team/types";
import type {
  MaterialInstance,
  CreateMaterialInstancePayload,
  UpdateMaterialInstanceStatusPayload,
} from "../../../../../types/api";

export function useMaterialInstances() {
  const [instances, setInstances] = useState<MaterialInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchInstances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMaterialInstances({ byUserAccessibleLocation: true });
      const isOwner = user ? isOwnerRoleName(user.roleName) : false;

      const currentUserInstances =
        response.data.currentUserLocations?.flatMap((group) => group.instances) ?? [];
      const otherInstances = isOwner
        ? (response.data.otherLocations?.flatMap((group) => group.instances) ?? [])
        : [];

      setInstances([...currentUserInstances, ...otherInstances]);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Error fetching material instances");
      console.error("Error fetching instances:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const addInstance = async (payload: CreateMaterialInstancePayload, skipFetch = false) => {
    const response = await createMaterialInstance(payload);
    // Refresh the list from the server to ensure we get the grouped location metadata correctly
    if (!skipFetch) {
      await fetchInstances();
    }
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
