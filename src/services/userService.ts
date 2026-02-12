/**
 * User management service.
 *
 * Covers CRUD operations for organization members including invites,
 * role updates, deactivation, and reactivation.
 */

import { get, post, patch, del, type ApiSuccessResponse } from "../lib/api";
import type {
  User,
  InviteUserPayload,
  UpdateUserPayload,
  UpdateUserRolePayload,
  UsersQueryParams,
  PaginationMeta,
} from "../types/api";

// ─── List users ────────────────────────────────────────────────────────────

/** Fetch a paginated list of organization users. */
export async function getUsers(
  params: UsersQueryParams = {},
): Promise<ApiSuccessResponse<{ users: User[] } & PaginationMeta>> {
  return get<{ users: User[] } & PaginationMeta>(
    "/users",
    params as Record<string, string | number | boolean | undefined>,
  );
}

// ─── Single user ───────────────────────────────────────────────────────────

/** Fetch a single user by ID. */
export async function getUser(
  userId: string,
): Promise<ApiSuccessResponse<{ user: User }>> {
  return get<{ user: User }>(`/users/${userId}`);
}

// ─── Invite ────────────────────────────────────────────────────────────────

/** Invite a new user to the organization.  Sends an invitation email. */
export async function inviteUser(
  payload: InviteUserPayload,
): Promise<ApiSuccessResponse<{ user: User }>> {
  return post<{ user: User }, InviteUserPayload>("/users/invite", payload);
}

// ─── Update profile ────────────────────────────────────────────────────────

/** Update a user's profile fields. */
export async function updateUser(
  userId: string,
  payload: UpdateUserPayload,
): Promise<ApiSuccessResponse<{ user: User }>> {
  return patch<{ user: User }, UpdateUserPayload>(`/users/${userId}`, payload);
}

// ─── Update role ───────────────────────────────────────────────────────────

/** Change a user's role (owner-only action). */
export async function updateUserRole(
  userId: string,
  payload: UpdateUserRolePayload,
): Promise<ApiSuccessResponse<{ user: User }>> {
  return patch<{ user: User }, UpdateUserRolePayload>(
    `/users/${userId}/role`,
    payload,
  );
}

// ─── Deactivate / Reactivate ───────────────────────────────────────────────

/** Deactivate a user account. */
export async function deactivateUser(
  userId: string,
): Promise<ApiSuccessResponse<null>> {
  return post<null>(`/users/${userId}/deactivate`);
}

/** Reactivate a previously deactivated user account. */
export async function reactivateUser(
  userId: string,
): Promise<ApiSuccessResponse<null>> {
  return post<null>(`/users/${userId}/reactivate`);
}

// ─── Delete ────────────────────────────────────────────────────────────────

/** Permanently delete a user. */
export async function deleteUser(
  userId: string,
): Promise<ApiSuccessResponse<null>> {
  return del<null>(`/users/${userId}`);
}
