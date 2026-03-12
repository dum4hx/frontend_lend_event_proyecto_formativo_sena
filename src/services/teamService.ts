/**
 * Team management service.
 *
 * Covers all CRUD operations for teams and team members within an organization.
 * Teams allow grouping users for better organization and collaboration.
 */

import { get, post, patch, del, type ApiSuccessResponse } from "../lib/api";
import type {
  Team,
  TeamsListResponse,
  CreateTeamPayload,
  UpdateTeamPayload,
  TeamMember,
  TeamMembersListResponse,
  AddTeamMemberPayload,
  TeamsQueryParams,
  PaginationParams,
} from "../types/api";

// ═══════════════════════════════════════════════════════════════════════════
// Teams CRUD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * List all teams for the current organization.
 */
export async function getTeams(
  params?: TeamsQueryParams,
): Promise<ApiSuccessResponse<TeamsListResponse>> {
  return get<TeamsListResponse>(
    "/teams",
    params as Record<string, string | number | boolean | undefined>,
  );
}

/**
 * Get a single team by ID.
 */
export async function getTeam(teamId: string): Promise<ApiSuccessResponse<{ team: Team }>> {
  return get<{ team: Team }>(`/teams/${teamId}`);
}

/**
 * Create a new team.
 */
export async function createTeam(
  payload: CreateTeamPayload,
): Promise<ApiSuccessResponse<{ team: Team }>> {
  return post<{ team: Team }, CreateTeamPayload>("/teams", payload);
}

/**
 * Update an existing team.
 */
export async function updateTeam(
  teamId: string,
  payload: UpdateTeamPayload,
): Promise<ApiSuccessResponse<{ team: Team }>> {
  return patch<{ team: Team }, UpdateTeamPayload>(`/teams/${teamId}`, payload);
}

/**
 * Delete a team.
 */
export async function deleteTeam(teamId: string): Promise<ApiSuccessResponse<null>> {
  return del<null>(`/teams/${teamId}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Team Members
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all members of a team.
 */
export async function getTeamMembers(
  teamId: string,
  params?: PaginationParams,
): Promise<ApiSuccessResponse<TeamMembersListResponse>> {
  return get<TeamMembersListResponse>(
    `/teams/${teamId}/members`,
    params as Record<string, string | number | boolean | undefined>,
  );
}

/**
 * Add a user to a team.
 */
export async function addTeamMember(
  teamId: string,
  payload: AddTeamMemberPayload,
): Promise<ApiSuccessResponse<{ member: TeamMember }>> {
  return post<{ member: TeamMember }, AddTeamMemberPayload>(
    `/teams/${teamId}/members`,
    payload,
  );
}

/**
 * Remove a user from a team.
 */
export async function removeTeamMember(
  teamId: string,
  userId: string,
): Promise<ApiSuccessResponse<null>> {
  return del<null>(`/teams/${teamId}/members/${userId}`);
}
