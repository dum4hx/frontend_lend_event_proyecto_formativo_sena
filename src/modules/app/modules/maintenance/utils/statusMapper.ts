import type { MaintenanceItemStatus, MaintenanceBatchStatus } from "../../../../../types/api";

/**
 * Maps maintenance item statuses returned by the backend to localised labels.
 */
const ITEM_STATUS_MAP: Record<MaintenanceItemStatus, { en: string; es: string }> = {
  pending: { en: "Pending", es: "Pendiente" },
  in_repair: { en: "In Repair", es: "En Reparación" },
  repaired: { en: "Repaired", es: "Reparado" },
  unrecoverable: { en: "Unrecoverable", es: "Irrecuperable" },
};

/**
 * Maps maintenance batch statuses returned by the backend to localised labels.
 */
const BATCH_STATUS_MAP: Record<MaintenanceBatchStatus, { en: string; es: string }> = {
  draft: { en: "Draft", es: "Borrador" },
  in_progress: { en: "In Progress", es: "En Progreso" },
  completed: { en: "Completed", es: "Completado" },
  cancelled: { en: "Cancelled", es: "Cancelado" },
};

/** Returns the localised label for a maintenance item status. */
export function getItemStatusLabel(status: MaintenanceItemStatus, language: "en" | "es"): string {
  return ITEM_STATUS_MAP[status]?.[language] ?? status;
}

/** Returns the localised label for a maintenance batch status. */
export function getBatchStatusLabel(status: MaintenanceBatchStatus, language: "en" | "es"): string {
  return BATCH_STATUS_MAP[status]?.[language] ?? status;
}
