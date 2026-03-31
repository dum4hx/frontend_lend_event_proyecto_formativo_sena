/**
 * TanStack Query hooks for User / Team domain.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUsers,
  getUser,
  inviteUser,
  updateUser,
  updateUserRole,
  deactivateUser,
  reactivateUser,
  deleteUser,
} from "../../services/userService";
import {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
} from "../../services/teamService";
import type {
  UsersQueryParams,
  InviteUserPayload,
  UpdateUserPayload,
  UpdateUserRolePayload,
  TeamsQueryParams,
  CreateTeamPayload,
  UpdateTeamPayload,
  AddTeamMemberPayload,
  PaginationParams,
} from "../../types/api";

// ─── Users Keys ────────────────────────────────────────────────────────────

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: UsersQueryParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// ─── Teams Keys ────────────────────────────────────────────────────────────

export const teamKeys = {
  all: ["teams"] as const,
  lists: () => [...teamKeys.all, "list"] as const,
  list: (params?: TeamsQueryParams) => [...teamKeys.lists(), params ?? {}] as const,
  details: () => [...teamKeys.all, "detail"] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
  members: (teamId: string) => [...teamKeys.detail(teamId), "members"] as const,
};

// ─── User Queries ──────────────────────────────────────────────────────────

export function useUsers(params: UsersQueryParams = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => getUsers(params),
    select: (res) => ({
      users: res.data.users,
      total: res.data.total,
      page: res.data.page,
      totalPages: res.data.totalPages,
    }),
  });
}

export function useUser(id: string, enabled = true) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUser(id),
    select: (res) => res.data.user,
    enabled: enabled && !!id,
  });
}

// ─── User Mutations ────────────────────────────────────────────────────────

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InviteUserPayload) => inviteUser(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
      qc.invalidateQueries({ queryKey: userKeys.detail(vars.id) });
    },
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserRolePayload }) =>
      updateUserRole(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useReactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reactivateUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

// ─── Team Queries ──────────────────────────────────────────────────────────

export function useTeams(params?: TeamsQueryParams) {
  return useQuery({
    queryKey: teamKeys.list(params),
    queryFn: () => getTeams(params),
    select: (res) => res.data,
  });
}

export function useTeam(id: string, enabled = true) {
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: () => getTeam(id),
    select: (res) => res.data.team,
    enabled: enabled && !!id,
  });
}

export function useTeamMembers(teamId: string, params?: PaginationParams) {
  return useQuery({
    queryKey: teamKeys.members(teamId),
    queryFn: () => getTeamMembers(teamId, params),
    select: (res) => res.data,
    enabled: !!teamId,
  });
}

// ─── Team Mutations ────────────────────────────────────────────────────────

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTeamPayload) => createTeam(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.all });
    },
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTeamPayload }) =>
      updateTeam(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.all });
    },
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTeam(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.all });
    },
  });
}

export function useAddTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, payload }: { teamId: string; payload: AddTeamMemberPayload }) =>
      addTeamMember(teamId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: teamKeys.members(vars.teamId) });
    },
  });
}

export function useRemoveTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      removeTeamMember(teamId, userId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: teamKeys.members(vars.teamId) });
    },
  });
}
