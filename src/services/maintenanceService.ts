/**
 * Maintenance Batch service.
 *
 * Manages the full lifecycle of maintenance batches: creation, item
 * management, status transitions (start / cancel), and item resolution.
 * All methods are organization-scoped and require authentication.
 */

import { get, post, patch, del, type ApiSuccessResponse } from "../lib/api";
import type {
  MaintenanceBatch,
  MaintenanceBatchListItem,
  MaintenanceBatchQueryParams,
  CreateMaintenanceBatchPayload,
  UpdateMaintenanceBatchPayload,
  AddMaintenanceBatchItemsPayload,
  ResolveMaintenanceBatchItemPayload,
  PaginationMeta,
} from "../types/api";

// ─── List ──────────────────────────────────────────────────────────────────

/** List maintenance batches with optional filters and pagination. */
export async function getMaintenanceBatches(params?: MaintenanceBatchQueryParams): Promise<
  ApiSuccessResponse<{
    batches: MaintenanceBatchListItem[];
    pagination: PaginationMeta;
  }>
> {
  return get<{ batches: MaintenanceBatchListItem[]; pagination: PaginationMeta }>(
    "/maintenance",
    params as Record<string, string | number | boolean | undefined>,
  );
}

// ─── Single ────────────────────────────────────────────────────────────────

/** Fetch a single maintenance batch by ID with populated references. */
export async function getMaintenanceBatch(
  id: string,
): Promise<ApiSuccessResponse<MaintenanceBatch>> {
  return get<MaintenanceBatch>(`/maintenance/${id}`);
}

// ─── Create ────────────────────────────────────────────────────────────────

/** Create a new maintenance batch in draft status. */
export async function createMaintenanceBatch(
  payload: CreateMaintenanceBatchPayload,
): Promise<ApiSuccessResponse<MaintenanceBatch>> {
  return post<MaintenanceBatch, CreateMaintenanceBatchPayload>("/maintenance", payload);
}

// ─── Update ────────────────────────────────────────────────────────────────

/** Update batch metadata. Only allowed while batch is in draft status. */
export async function updateMaintenanceBatch(
  id: string,
  payload: UpdateMaintenanceBatchPayload,
): Promise<ApiSuccessResponse<MaintenanceBatch>> {
  return patch<MaintenanceBatch, UpdateMaintenanceBatchPayload>(`/maintenance/${id}`, payload);
}

// ─── Status Transitions ───────────────────────────────────────────────────

/** Start a maintenance batch (draft → in_progress). */
export async function startMaintenanceBatch(
  id: string,
): Promise<ApiSuccessResponse<MaintenanceBatch>> {
  return post<MaintenanceBatch>(`/maintenance/${id}/start`);
}

/** Cancel a maintenance batch from draft or in_progress. */
export async function cancelMaintenanceBatch(
  id: string,
): Promise<ApiSuccessResponse<MaintenanceBatch>> {
  return post<MaintenanceBatch>(`/maintenance/${id}/cancel`);
}

// ─── Item Management ──────────────────────────────────────────────────────

/** Add items to a draft maintenance batch. */
export async function addMaintenanceBatchItems(
  id: string,
  payload: AddMaintenanceBatchItemsPayload,
): Promise<ApiSuccessResponse<MaintenanceBatch>> {
  return post<MaintenanceBatch, AddMaintenanceBatchItemsPayload>(
    `/maintenance/${id}/items`,
    payload,
  );
}

/** Remove an item from a draft maintenance batch. */
export async function removeMaintenanceBatchItem(
  id: string,
  instanceId: string,
): Promise<ApiSuccessResponse<MaintenanceBatch>> {
  return del<MaintenanceBatch>(`/maintenance/${id}/items/${instanceId}`);
}

// ─── Item Resolution ──────────────────────────────────────────────────────

/** Resolve a single item as repaired or unrecoverable. */
export async function resolveMaintenanceBatchItem(
  id: string,
  instanceId: string,
  payload: ResolveMaintenanceBatchItemPayload,
): Promise<ApiSuccessResponse<MaintenanceBatch>> {
  return patch<MaintenanceBatch, ResolveMaintenanceBatchItemPayload>(
    `/maintenance/${id}/items/${instanceId}`,
    payload,
  );
}
