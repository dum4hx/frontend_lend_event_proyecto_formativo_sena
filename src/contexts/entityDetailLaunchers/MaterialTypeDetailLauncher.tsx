import { useEffect, useState } from "react";
import { LoadingSpinner, ErrorDisplay } from "../../components/ui";
import { MaterialTypeDetailModal } from "../../modules/app/modules/material-types/components/MaterialTypeDetailModal";
import {
  getMaterialType,
  getMaterialCategories,
  getMaterialAttributes,
} from "../../services/materialService";
import type { MaterialType, MaterialCategory, MaterialAttribute } from "../../types/api";

interface Props {
  id: string;
  onClose: () => void;
}

export default function MaterialTypeDetailLauncher({ id, onClose }: Props) {
  const [materialType, setMaterialType] = useState<MaterialType | null>(null);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [attributes, setAttributes] = useState<MaterialAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMaterialType(id), getMaterialCategories(), getMaterialAttributes()])
      .then(([typeRes, catsRes, attrsRes]) => {
        if (cancelled) return;
        setMaterialType(typeRes.data.materialType);
        setCategories(catsRes.data.categories);
        setAttributes(attrsRes.data.attributes);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load material type details.");
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

  if (error || !materialType) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
          <ErrorDisplay error={error ?? "Material type not found."} />
          <button type="button" onClick={onClose} className="mt-4 w-full btn-secondary text-sm">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <MaterialTypeDetailModal
      materialType={materialType}
      categories={categories}
      attributes={attributes}
      onClose={onClose}
    />
  );
}
