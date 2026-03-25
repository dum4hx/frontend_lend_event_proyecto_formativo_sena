/**
 * Inspection service.
 *
 * Post-return damage assessment and documentation.
 */

import { get, post, type ApiSuccessResponse } from "../lib/api";
import type { Inspection, CreateInspectionPayload, PendingLoan } from "../types/api";

// ─── List ──────────────────────────────────────────────────────────────────

/** List all inspections. */
export async function getInspections(): Promise<
  ApiSuccessResponse<{
    inspections: Inspection[];
    total: number;
    page: number;
    totalPages: number;
  }>
> {
  return get<{
    inspections: Inspection[];
    total: number;
    page: number;
    totalPages: number;
  }>("/inspections");
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
