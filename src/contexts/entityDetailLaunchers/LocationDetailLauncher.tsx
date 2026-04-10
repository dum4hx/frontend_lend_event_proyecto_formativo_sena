import { useEffect, useState } from "react";
import { LoadingSpinner, ErrorDisplay } from "../../components/ui";
import { LocationDetailModal } from "../../modules/app/pages/locations/LocationDetailModal";
import { getLocation, type WarehouseLocation } from "../../services/warehouseOperatorService";
import { getMaterialTypes, getMaterialCategories } from "../../services/materialService";
import type { MaterialType, MaterialCategory } from "../../types/api";

interface Props {
  id: string;
  onClose: () => void;
}

export default function LocationDetailLauncher({ id, onClose }: Props) {
  const [location, setLocation] = useState<WarehouseLocation | null>(null);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getLocation(id), getMaterialTypes(), getMaterialCategories()])
      .then(([locationRes, typesRes, catsRes]) => {
        if (cancelled) return;
        setLocation(locationRes.data);
        setMaterialTypes(typesRes.data.materialTypes);
        setCategories(catsRes.data.categories);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load location details.");
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

  if (error || !location) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
          <ErrorDisplay error={error ?? "Location not found."} />
          <button type="button" onClick={onClose} className="mt-4 w-full btn-secondary text-sm">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <LocationDetailModal
      open={true}
      onClose={onClose}
      location={location}
      materialTypes={materialTypes}
      categories={categories}
    />
  );
}
