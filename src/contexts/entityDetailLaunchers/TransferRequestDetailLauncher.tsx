import { useEffect, useState } from "react";
import { LoadingSpinner, ErrorDisplay } from "../../components/ui";
import { RequestDetailModal } from "../../modules/app/pages/transfers/TransferModals";
import { getTransferRequest } from "../../services/transferService";
import { getMaterialType } from "../../services/materialService";
import type { TransferRequest } from "../../types/api";

interface Props {
  id: string;
  onClose: () => void;
}

export default function TransferRequestDetailLauncher({ id, onClose }: Props) {
  const [request, setRequest] = useState<TransferRequest | null>(null);
  const [locationNames, setLocationNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [materialTypeCache] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;
    getTransferRequest(id)
      .then(({ request: req, locationNames: names }) => {
        if (cancelled) return;
        setRequest(req);
        setLocationNames(names);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load transfer request details.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const locationName = (locationId: string) => locationNames[locationId] ?? locationId;

  const materialTypeName = (modelId: string): string => {
    const cached = materialTypeCache.get(modelId);
    if (cached) return cached;
    void getMaterialType(modelId)
      .then((res) => {
        const name = res.data.materialType?.name ?? modelId;
        materialTypeCache.set(modelId, name);
      })
      .catch(() => {
        materialTypeCache.set(modelId, modelId);
      });
    return modelId;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full">
          <ErrorDisplay error={error ?? "Transfer request not found."} />
          <button type="button" onClick={onClose} className="mt-4 w-full btn-secondary text-sm">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <RequestDetailModal
      request={request}
      locationName={locationName}
      materialTypeName={materialTypeName}
      userName={(userId) => userId}
      onClose={onClose}
    />
  );
}
