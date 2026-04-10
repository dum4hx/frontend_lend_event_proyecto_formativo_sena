/**
 * TanStack Query hooks for Code Schemes.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCodeSchemes,
  createCodeScheme,
  updateCodeScheme,
  deleteCodeScheme,
  setDefaultCodeScheme,
} from "../../services/codeSchemeService";
import type {
  CodeSchemeEntityType,
  CreateCodeSchemePayload,
  UpdateCodeSchemePayload,
} from "../../types/api";

export const codeSchemeKeys = {
  all: ["codeSchemes"] as const,
  list: (entityType?: CodeSchemeEntityType) => [...codeSchemeKeys.all, "list", entityType] as const,
};

export function useCodeSchemes(entityType?: CodeSchemeEntityType) {
  return useQuery({
    queryKey: codeSchemeKeys.list(entityType),
    queryFn: () => getCodeSchemes(entityType ? { entityType } : undefined),
    select: (res) => res.data.schemes,
  });
}

export function useCreateCodeScheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCodeSchemePayload) => createCodeScheme(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: codeSchemeKeys.all });
    },
  });
}

export function useUpdateCodeScheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCodeSchemePayload }) =>
      updateCodeScheme(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: codeSchemeKeys.all });
    },
  });
}

export function useDeleteCodeScheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCodeScheme(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: codeSchemeKeys.all });
    },
  });
}

export function useSetDefaultCodeScheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setDefaultCodeScheme(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: codeSchemeKeys.all });
    },
  });
}
