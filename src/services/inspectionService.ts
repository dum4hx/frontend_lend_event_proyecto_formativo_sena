/**
 * Inspection service.
 *
 * Post-return damage assessment and documentation.
 */

import { get, post, type ApiSuccessResponse } from "../lib/api";
import type { Inspection, CreateInspectionPayload } from "../types/api";

// ─── List ──────────────────────────────────────────────────────────────────

/** List all inspections. */
export async function getInspections(): Promise<
  ApiSuccessResponse<{ inspections: Inspection[] }>
> {
  return get<{ inspections: Inspection[] }>("/inspections");
}

// ─── Single ────────────────────────────────────────────────────────────────

/** Fetch a specific inspection by ID. */
export async function getInspection(
  inspectionId: string,
): Promise<ApiSuccessResponse<{ inspection: Inspection }>> {
  return get<{ inspection: Inspection }>(`/inspections/${inspectionId}`);
}

// ─── Create ────────────────────────────────────────────────────────────────

/** Create an inspection for a returned loan. */
export async function createInspection(
  payload: CreateInspectionPayload,
): Promise<ApiSuccessResponse<{ inspection: Inspection }>> {
  return post<{ inspection: Inspection }, CreateInspectionPayload>(
    "/inspections",
    payload,
  );
}
