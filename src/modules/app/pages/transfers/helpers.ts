import type {
  TransferRequestStatus,
  TransferStatus,
  TransferCondition,
  MaterialInstance,
} from "./types";

// ─── Status Labels ─────────────────────────────────────────────────────────

export const REQUEST_STATUS_LABEL: Record<TransferRequestStatus, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  fulfilled: "Fulfilled",
};

export const getRequestStatusLabel = (status: TransferRequestStatus, isEs: boolean): string => {
  const labels: Record<TransferRequestStatus, string> = {
    requested: isEs ? "Solicitado" : "Requested",
    approved: isEs ? "Aprobado" : "Approved",
    rejected: isEs ? "Rechazado" : "Rejected",
    fulfilled: isEs ? "Cumplido" : "Fulfilled",
  };
  return labels[status];
};

export const REQUEST_STATUS_CLASSES: Record<TransferRequestStatus, string> = {
  requested: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  approved: "bg-green-500/15 text-green-400 border-green-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  fulfilled: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

export const CONDITION_LABEL: Record<TransferCondition, string> = {
  OK: "OK",
  DAMAGED: "Damaged",
  MISSING_PARTS: "Missing Parts",
  DIRTY: "Dirty",
  REPAIR_REQUIRED: "Repair Required",
  LOST: "Lost",
};

export const getConditionLabel = (condition: TransferCondition, isEs: boolean): string => {
  const labels: Record<TransferCondition, string> = {
    OK: "OK",
    DAMAGED: isEs ? "Dañado" : "Damaged",
    MISSING_PARTS: isEs ? "Piezas Faltantes" : "Missing Parts",
    DIRTY: isEs ? "Sucio" : "Dirty",
    REPAIR_REQUIRED: isEs ? "Reparación Requerida" : "Repair Required",
    LOST: isEs ? "Perdido" : "Lost",
  };
  return labels[condition];
};

export const TRANSFER_STATUS_LABEL: Record<TransferStatus, string> = {
  in_transit: "In Transit",
  completed: "Completed",
  cancelled: "Cancelled",
  received: "Received",
};

export const getTransferStatusLabel = (status: TransferStatus, isEs: boolean): string => {
  const labels: Record<TransferStatus, string> = {
    in_transit: isEs ? "En Tránsito" : "In Transit",
    completed: isEs ? "Completado" : "Completed",
    cancelled: isEs ? "Cancelado" : "Cancelled",
    received: isEs ? "Recibido" : "Received",
  };
  return labels[status];
};

export const TRANSFER_STATUS_CLASSES: Record<TransferStatus, string> = {
  in_transit: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/15 text-green-400 border-green-500/30",
  cancelled: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  received: "bg-green-500/15 text-green-400 border-green-500/30",
};

// ─── Utility Functions ─────────────────────────────────────────────────────

export function formatDate(iso: string, isEs: boolean): string {
  return new Date(iso).toLocaleDateString(isEs ? "es-CO" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function extractInstanceLocationId(instance: MaterialInstance): string | undefined {
  const candidate: unknown = (
    instance as MaterialInstance & {
      locationId?: string | { _id?: string; id?: string };
      location?: { _id?: string; id?: string };
    }
  ).locationId;

  if (typeof candidate === "string") return candidate;
  if (candidate && typeof candidate === "object") {
    const locationObj = candidate as { _id?: string; id?: string };
    return locationObj._id ?? locationObj.id;
  }

  const fallback = (instance as MaterialInstance & { location?: { _id?: string; id?: string } })
    .location;
  return fallback?._id ?? fallback?.id;
}

export function getInstanceModelName(instance: MaterialInstance, isEs: boolean): string {
  const raw = instance as MaterialInstance & {
    model?: string | { _id?: string; name?: string };
    modelId?: string | { _id?: string; name?: string };
  };

  if (raw.model && typeof raw.model === "object" && raw.model.name) {
    return raw.model.name;
  }
  if (raw.modelId && typeof raw.modelId === "object" && raw.modelId.name) {
    return raw.modelId.name;
  }
  return isEs ? "Material desconocido" : "Unknown material";
}
