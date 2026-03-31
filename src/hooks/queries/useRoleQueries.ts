/**
 * TanStack Query hooks for Roles & Permissions.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPermissions,
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
} from "../../services/roleService";
import type { CreateRolePayload, UpdateRolePayload } from "../../types/api";

export const roleKeys = {
  all: ["roles"] as const,
  list: () => [...roleKeys.all, "list"] as const,
  details: () => [...roleKeys.all, "detail"] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
  permissions: () => ["permissions"] as const,
};

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: () => getRoles(),
    select: (res) => res.data,
  });
}

export function useRole(id: string, enabled = true) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => getRole(id),
    select: (res) => res.data.role,
    enabled: enabled && !!id,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: roleKeys.permissions(),
    queryFn: () => getPermissions(),
    select: (res) => res.data,
    staleTime: 1000 * 60 * 30,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => createRole(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRolePayload }) =>
      updateRole(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}
