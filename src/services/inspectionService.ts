/**
 * Inspection service.
 *
 * Post-return damage assessment and documentation.
 */

import { get, post, type ApiSuccessResponse } from "../lib/api";
import type {
  Inspection,
  InspectionListItem,
  InspectionsQueryParams,
  CreateInspectionPayload,
  PendingLoan,
} from "../types/api";

// ─── List ──────────────────────────────────────────────────────────────────

/** List all inspections with optional filters. */
export async function getInspections(params: InspectionsQueryParams = {}): Promise<
  ApiSuccessResponse<{
    inspections: InspectionListItem[];
    total: number;
    page: number;
    totalPages: number;
  }>
> {
  return get<{
    inspections: InspectionListItem[];
    total: number;
    page: number;
    totalPages: number;
  }>("/inspections", params as Record<string, string | number | boolean | undefined>);
}

/** List all loans that have been returned but not yet inspected. */
export async function getPendingLoans(): Promise<
  ApiSuccessResponse<{ pendingLoans: PendingLoan[] }>
> {
  return get<{ pendingLoans: PendingLoan[] }>("/inspections/pending-loans");
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
  return post<{ inspection: Inspection }, CreateInspectionPayload>("/inspections", payload);
}
