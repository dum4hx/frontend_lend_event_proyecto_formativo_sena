import { useEffect, useState } from "react";
import { LoadingSpinner, ErrorDisplay } from "../../components/ui";
import { CategoryDetailModal } from "../../modules/app/modules/material-categories/components/CategoryDetailModal";
import { getMaterialCategories } from "../../services/materialService";
import type { MaterialCategory } from "../../types/api";

interface Props {
  id: string;
  onClose: () => void;
}

export default function CategoryDetailLauncher({ id, onClose }: Props) {
  const [category, setCategory] = useState<MaterialCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMaterialCategories()
      .then((res) => {
        if (cancelled) return;
        const found = res.data.categories.find((c) => c._id === id) ?? null;
        setCategory(found);
        if (!found) setError("Category not found.");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load category details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
          <ErrorDisplay error={error ?? "Category not found."} />
          <button type="button" onClick={onClose} className="mt-4 w-full btn-secondary text-sm">
            Close
          </button>
        </div>
      </div>
    );
  }

  return <CategoryDetailModal category={category} onClose={onClose} />;
}
