import { useState, useEffect } from "react";
import {
  getMaterialCategories,
  createMaterialCategory,
  updateMaterialCategory,
  deleteMaterialCategory,
} from "../../../../../services/materialService";
import type { MaterialCategory, CreateMaterialCategoryPayload } from "../../../../../types/api";

export function useCategories() {
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMaterialCategories();
      setCategories(response.data.categories || []);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Error fetching categories");
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const addCategory = async (payload: CreateMaterialCategoryPayload) => {
    const response = await createMaterialCategory(payload);
    setCategories((prev) => [...prev, response.data.category]);
    return response.data.category;
  };

  const updateCategory = async (categoryId: string, payload: CreateMaterialCategoryPayload) => {
    const response = await updateMaterialCategory(categoryId, payload);
    setCategories((prev) =>
      prev.map((cat) => (cat._id === categoryId ? response.data.category : cat)),
    );
    return response.data.category;
  };

  const removeCategory = async (categoryId: string) => {
    await deleteMaterialCategory(categoryId);
    setCategories((prev) => prev.filter((cat) => cat._id !== categoryId));
  };

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    addCategory,
    updateCategory,
    removeCategory,
  };
}
