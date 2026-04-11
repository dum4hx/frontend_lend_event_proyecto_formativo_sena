/**
 * TanStack Query hooks for User domain.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/useAuth";
import {
  getUsers,
  getUser,
  inviteUser,
  updateUser,
  updateUserRole,
  deactivateUser,
  reactivateUser,
  resendInvite,
  deleteUser,
} from "../../services/userService";
import type {
  UsersQueryParams,
  InviteUserPayload,
  UpdateUserPayload,
  UpdateUserRolePayload,
} from "../../types/api";

// ─── Users Keys ────────────────────────────────────────────────────────────

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: UsersQueryParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
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
  const { checkAuth, user } = useAuth();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserRolePayload }) =>
      updateUserRole(id, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
      qc.invalidateQueries({ queryKey: userKeys.detail(vars.id) });
      
      // If the current user's role was changed, refresh auth context to reload permissions
      if (user && user._id === vars.id) {
        void checkAuth();
      }
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

export function useResendInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resendInvite(id),
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
