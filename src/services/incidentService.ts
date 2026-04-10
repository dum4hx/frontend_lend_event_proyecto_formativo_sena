/**
 * Incident service.
 *
 * Manages incident reports (novedades) across loan operations, transit,
 * storage, maintenance, and other operational contexts.
 */

import { get, post, type ApiSuccessResponse } from "../lib/api";
import type {
  Incident,
  CreateIncidentPayload,
  ResolveIncidentPayload,
  IncidentQueryParams,
} from "../types/api";

// ─── List ──────────────────────────────────────────────────────────────────

/** List all incidents with optional filters and pagination. */
export async function getIncidents(params?: IncidentQueryParams): Promise<
  ApiSuccessResponse<{
    incidents: Incident[];
    total: number;
    page: number;
    totalPages: number;
  }>
> {
  return get<{
    incidents: Incident[];
    total: number;
    page: number;
    totalPages: number;
  }>("/incidents", params as Record<string, string | number | boolean | undefined>);
}

// ─── Single ────────────────────────────────────────────────────────────────

/** Fetch a specific incident by ID. */
export async function getIncident(id: string): Promise<ApiSuccessResponse<{ incident: Incident }>> {
  return get<{ incident: Incident }>(`/incidents/${id}`);
}

// ─── Create ────────────────────────────────────────────────────────────────

/** Create a new incident manually. */
export async function createIncident(
  payload: CreateIncidentPayload,
): Promise<ApiSuccessResponse<{ incident: Incident }>> {
  return post<{ incident: Incident }, CreateIncidentPayload>("/incidents", payload);
}

// ─── Status transitions ───────────────────────────────────────────────────

/** Acknowledge an open incident. */
export async function acknowledgeIncident(
  id: string,
): Promise<ApiSuccessResponse<{ incident: Incident }>> {
  return post<{ incident: Incident }>(`/incidents/${id}/acknowledge`);
}

/** Resolve an incident with a resolution note. */
export async function resolveIncident(
  id: string,
  payload: ResolveIncidentPayload,
): Promise<ApiSuccessResponse<{ incident: Incident }>> {
  return post<{ incident: Incident }, ResolveIncidentPayload>(`/incidents/${id}/resolve`, payload);
}

/** Dismiss an open or acknowledged incident with a reason. */
export async function dismissIncident(
  id: string,
  payload: ResolveIncidentPayload,
): Promise<ApiSuccessResponse<{ incident: Incident }>> {
  return post<{ incident: Incident }, ResolveIncidentPayload>(`/incidents/${id}/dismiss`, payload);
}
