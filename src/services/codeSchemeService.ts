/**
 * Code Scheme service.
 *
 * Covers listing, fetching, creating, updating, deleting, and setting default
 * code schemes used to auto-generate human-readable codes for Loans,
 * Loan Requests, Invoices, Inspections, Incidents, Maintenance Batches,
 * and Material Instances.
 * All methods are organization-scoped and require authentication.
 */

import { get, post, put, del, patch, type ApiSuccessResponse } from "../lib/api";
import type {
  CodeScheme,
  CreateCodeSchemePayload,
  UpdateCodeSchemePayload,
  CodeSchemesQueryParams,
} from "../types/api";

// ─── List ──────────────────────────────────────────────────────────────────

/** Fetch all code schemes for the authenticated organization. */
export async function getCodeSchemes(
  params?: CodeSchemesQueryParams,
): Promise<ApiSuccessResponse<{ schemes: CodeScheme[] }>> {
  return get<{ schemes: CodeScheme[] }>(
    "/code-schemes",
    params as Record<string, string | number | boolean | undefined>,
  );
}

// ─── Detail ────────────────────────────────────────────────────────────────

/** Fetch a single code scheme by ID. */
export async function getCodeScheme(
  id: string,
): Promise<ApiSuccessResponse<{ scheme: CodeScheme }>> {
  return get<{ scheme: CodeScheme }>(`/code-schemes/${id}`);
}

// ─── Create ────────────────────────────────────────────────────────────────

/** Create a new code scheme. */
export async function createCodeScheme(
  payload: CreateCodeSchemePayload,
): Promise<ApiSuccessResponse<{ scheme: CodeScheme }>> {
  return post<{ scheme: CodeScheme }, CreateCodeSchemePayload>("/code-schemes", payload);
}

// ─── Update ────────────────────────────────────────────────────────────────

/** Update an existing code scheme. Cannot change entityType. */
export async function updateCodeScheme(
  id: string,
  payload: UpdateCodeSchemePayload,
): Promise<ApiSuccessResponse<{ scheme: CodeScheme }>> {
  return put<{ scheme: CodeScheme }, UpdateCodeSchemePayload>(`/code-schemes/${id}`, payload);
}

// ─── Delete ────────────────────────────────────────────────────────────────

/** Delete a code scheme. Cannot delete the default scheme. */
export async function deleteCodeScheme(id: string): Promise<ApiSuccessResponse<null>> {
  return del<null>(`/code-schemes/${id}`);
}

// ─── Set Default ───────────────────────────────────────────────────────────

/** Set a code scheme as the default for its entity type. */
export async function setDefaultCodeScheme(
  id: string,
): Promise<ApiSuccessResponse<{ scheme: CodeScheme }>> {
  return patch<{ scheme: CodeScheme }>(`/code-schemes/${id}/set-default`);
}
