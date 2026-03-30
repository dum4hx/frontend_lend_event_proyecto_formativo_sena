import { useState, useEffect, useCallback } from "react";
import {
  getMaterialAttributes,
  createMaterialAttribute,
  updateMaterialAttribute,
  deleteMaterialAttribute,
} from "../../../../../services/materialService";
import type {
  MaterialAttribute,
  CreateMaterialAttributePayload,
  UpdateMaterialAttributePayload,
} from "../../../../../types/api";

export function useMaterialAttributes(categoryId?: string) {
  const [attributes, setAttributes] = useState<MaterialAttribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttributes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMaterialAttributes({ categoryId });
      setAttributes(response.data.attributes || []);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Error fetching material attributes");
      console.error("Error fetching material attributes:", err);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  const addAttribute = async (payload: CreateMaterialAttributePayload) => {
    const response = await createMaterialAttribute(payload);
    setAttributes((prev) => [...prev, response.data.attribute]);
    return response.data.attribute;
  };

  const updateAttribute = async (attributeId: string, payload: UpdateMaterialAttributePayload) => {
    const response = await updateMaterialAttribute(attributeId, payload);
    setAttributes((prev) =>
      prev.map((attr) => (attr._id === attributeId ? response.data.attribute : attr)),
    );
    return response.data.attribute;
  };

  const removeAttribute = async (attributeId: string) => {
    await deleteMaterialAttribute(attributeId);
    setAttributes((prev) => prev.filter((attr) => attr._id !== attributeId));
  };

  return {
    attributes,
    loading,
    error,
    refetch: fetchAttributes,
    addAttribute,
    updateAttribute,
    removeAttribute,
  };
}
