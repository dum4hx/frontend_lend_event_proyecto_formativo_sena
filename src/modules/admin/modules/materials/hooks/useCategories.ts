import { useState, useEffect, useCallback } from "react";
import type { MaterialCategory } from "../../../../../types/api";
import { getMaterialCategories } from "../../../../../services/materialService";

interface UseCategoriesResult {
  categories: MaterialCategory[];
  loading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
}

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMaterialCategories();
      setCategories(response.data.categories ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch categories";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const refreshCategories = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refreshCategories,
  };
}
