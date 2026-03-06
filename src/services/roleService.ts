/**
 * Role management service.
 *
 * Covers all CRUD operations for organization-scoped roles and the
 * permissions catalogue used to populate the role editor.
 */
import { get, post, patch, del, type ApiSuccessResponse } from "../lib/api";
import type {
  Role,
  RolesListResponse,
  CreateRolePayload,
  UpdateRolePayload,
  PermissionsResponse,
} from "../types/api";

// ─── Permissions ───────────────────────────────────────────────────────────

/** Fetch all organization-assignable permissions (excludes super-admin-only). */
export async function getPermissions(): Promise<ApiSuccessResponse<PermissionsResponse>> {
  return get<PermissionsResponse>("/permissions");
}

// ─── List roles ────────────────────────────────────────────────────────────

/** List all roles for the current organization. */
export async function getRoles(): Promise<ApiSuccessResponse<RolesListResponse>> {
  return get<RolesListResponse>("/roles");
}

// ─── Single role ───────────────────────────────────────────────────────────

/** Fetch a single role by its ID. */
export async function getRole(roleId: string): Promise<ApiSuccessResponse<{ role: Role }>> {
  return get<{ role: Role }>(`/roles/${roleId}`);
}

// ─── Create ────────────────────────────────────────────────────────────────

/** Create a new custom role for the current organization. */
export async function createRole(
  payload: CreateRolePayload,
): Promise<ApiSuccessResponse<{ role: Role }>> {
  return post<{ role: Role }, CreateRolePayload>("/roles", payload);
}

// ─── Update ────────────────────────────────────────────────────────────────

/** Update an existing custom role (PATCH — only provided fields are updated). */
export async function updateRole(
  roleId: string,
  payload: UpdateRolePayload,
): Promise<ApiSuccessResponse<{ role: Role }>> {
  return patch<{ role: Role }, UpdateRolePayload>(`/roles/${roleId}`, payload);
}

// ─── Delete ────────────────────────────────────────────────────────────────

/** Delete a custom role. System roles will be rejected by the API (403). */
export async function deleteRole(roleId: string): Promise<ApiSuccessResponse<null>> {
  return del<null>(`/roles/${roleId}`);
}
