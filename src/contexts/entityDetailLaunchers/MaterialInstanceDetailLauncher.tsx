import { useEffect, useState } from "react";
import { LoadingSpinner, ErrorDisplay } from "../../components/ui";
import { MaterialInstanceDetailModal } from "../../modules/app/modules/material-instances/components/MaterialInstanceDetailModal";
import { getMaterialInstance } from "../../services/materialService";
import type { MaterialInstance } from "../../types/api";

interface Props {
  id: string;
  onClose: () => void;
}

export default function MaterialInstanceDetailLauncher({ id, onClose }: Props) {
  const [instance, setInstance] = useState<MaterialInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMaterialInstance(id)
      .then((res) => {
        if (cancelled) return;
        setInstance(res.data.instance);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load material instance details.");
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

  if (error || !instance) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
          <ErrorDisplay error={error ?? "Material instance not found."} />
          <button type="button" onClick={onClose} className="mt-4 w-full btn-secondary text-sm">
            Close
          </button>
        </div>
      </div>
    );
  }

  return <MaterialInstanceDetailModal instance={instance} onClose={onClose} />;
}
