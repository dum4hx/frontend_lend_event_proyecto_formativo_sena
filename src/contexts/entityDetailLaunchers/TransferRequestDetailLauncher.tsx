import { useEffect, useState } from "react";
import { LoadingSpinner, ErrorDisplay } from "../../components/ui";
import { RequestDetailModal } from "../../modules/app/pages/transfers/TransferModals";
import { getTransferRequests } from "../../services/transferService";
import { getMaterialType } from "../../services/materialService";
import { getLocations, type WarehouseLocation } from "../../services/warehouseOperatorService";
import type { TransferRequest } from "../../types/api";

interface Props {
  id: string;
  onClose: () => void;
}

export default function TransferRequestDetailLauncher({ id, onClose }: Props) {
  const [request, setRequest] = useState<TransferRequest | null>(null);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [materialTypeCache] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;
    Promise.all([getTransferRequests(), getLocations()])
      .then(([reqRes, locRes]) => {
        if (cancelled) return;
        const found = reqRes.data.requests.find((r) => r._id === id) ?? null;
        setLocations(locRes.data.items ?? []);
        setRequest(found);
        if (!found) setError("Transfer request not found.");
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

  const locationName = (locationId: string) =>
    locations.find((l) => l._id === locationId)?.name ?? locationId;

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
