/**
 * TanStack Query hooks for Materials domain.
 * Covers categories, types, instances, packages, and attributes.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMaterialCategories,
  createMaterialCategory,
  updateMaterialCategory,
  deleteMaterialCategory,
  getMaterialTypes,
  createMaterialType,
  updateMaterialType,
  deleteMaterialType,
  getMaterialInstances,
  createMaterialInstance,
  updateMaterialInstanceStatus,
  getMaterialAttributes,
  createMaterialAttribute,
  updateMaterialAttribute,
  deleteMaterialAttribute,
  getPackages,
  getPackage,
  createPackage,
  getPackageAvailability,
} from "../../services/materialService";
import type {
  CreateMaterialCategoryPayload,
  UpdateMaterialCategoryPayload,
  MaterialTypesQueryParams,
  CreateMaterialTypePayload,
  UpdateMaterialTypePayload,
  MaterialInstancesQueryParams,
  CreateMaterialInstancePayload,
  UpdateMaterialInstanceStatusPayload,
  CreateMaterialAttributePayload,
  UpdateMaterialAttributePayload,
  CreatePackagePayload,
} from "../../types/api";

// ─── Query Keys ────────────────────────────────────────────────────────────

export const materialKeys = {
  categories: {
    all: ["materialCategories"] as const,
    list: () => [...materialKeys.categories.all, "list"] as const,
  },
  types: {
    all: ["materialTypes"] as const,
    lists: () => [...materialKeys.types.all, "list"] as const,
    list: (params: MaterialTypesQueryParams) => [...materialKeys.types.lists(), params] as const,
    details: () => [...materialKeys.types.all, "detail"] as const,
    detail: (id: string) => [...materialKeys.types.details(), id] as const,
  },
  instances: {
    all: ["materialInstances"] as const,
    lists: () => [...materialKeys.instances.all, "list"] as const,
    list: (params: MaterialInstancesQueryParams) =>
      [...materialKeys.instances.lists(), params] as const,
  },
  attributes: {
    all: ["materialAttributes"] as const,
    list: () => [...materialKeys.attributes.all, "list"] as const,
  },
  packages: {
    all: ["packages"] as const,
    lists: () => [...materialKeys.packages.all, "list"] as const,
    details: () => [...materialKeys.packages.all, "detail"] as const,
    detail: (id: string) => [...materialKeys.packages.details(), id] as const,
    availability: (id: string, start: string, end: string) =>
      [...materialKeys.packages.details(), id, "availability", start, end] as const,
  },
};

// ─── Categories ────────────────────────────────────────────────────────────

export function useMaterialCategories() {
  return useQuery({
    queryKey: materialKeys.categories.list(),
    queryFn: () => getMaterialCategories(),
    select: (res) => res.data.categories,
  });
}

export function useCreateMaterialCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMaterialCategoryPayload) => createMaterialCategory(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: materialKeys.categories.all });
    },
  });
}

export function useUpdateMaterialCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMaterialCategoryPayload }) =>
      updateMaterialCategory(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: materialKeys.categories.all });
    },
  });
}

export function useDeleteMaterialCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMaterialCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: materialKeys.categories.all });
    },
  });
}

// ─── Types ─────────────────────────────────────────────────────────────────

export function useMaterialTypes(params: MaterialTypesQueryParams = {}) {
  return useQuery({
    queryKey: materialKeys.types.list(params),
    queryFn: () => getMaterialTypes(params),
    select: (res) => res.data,
  });
}

export function useCreateMaterialType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMaterialTypePayload) => createMaterialType(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: materialKeys.types.all });
    },
  });
}

export function useUpdateMaterialType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMaterialTypePayload }) =>
      updateMaterialType(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: materialKeys.types.all });
    },
  });
}

export function useDeleteMaterialType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMaterialType(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: materialKeys.types.all });
    },
  });
}

// ─── Instances ─────────────────────────────────────────────────────────────

export function useMaterialInstances(params: MaterialInstancesQueryParams = {}) {
  return useQuery({
    queryKey: materialKeys.instances.list(params),
    queryFn: () => getMaterialInstances(params),
    select: (res) => res.data,
  });
}

export function useCreateMaterialInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMaterialInstancePayload) => createMaterialInstance(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: materialKeys.instances.all });
    },
  });
}

export function useUpdateMaterialInstanceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMaterialInstanceStatusPayload }) =>
      updateMaterialInstanceStatus(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: materialKeys.instances.all });
    },
  });
}

// ─── Attributes ────────────────────────────────────────────────────────────

export function useMaterialAttributes() {
  return useQuery({
    queryKey: materialKeys.attributes.list(),
    queryFn: () => getMaterialAttributes(),
    select: (res) => res.data.attributes,
  });
}

export function useCreateMaterialAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMaterialAttributePayload) => createMaterialAttribute(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: materialKeys.attributes.all });
    },
  });
}

export function useUpdateMaterialAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMaterialAttributePayload }) =>
      updateMaterialAttribute(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: materialKeys.attributes.all });
    },
  });
}

export function useDeleteMaterialAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMaterialAttribute(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: materialKeys.attributes.all });
    },
  });
}

// ─── Packages ──────────────────────────────────────────────────────────────

export function usePackages() {
  return useQuery({
    queryKey: materialKeys.packages.lists(),
    queryFn: () => getPackages(),
    select: (res) => res.data.packages,
  });
}

export function usePackage(id: string, enabled = true) {
  return useQuery({
    queryKey: materialKeys.packages.detail(id),
    queryFn: () => getPackage(id),
    select: (res) => res.data.package,
    enabled: enabled && !!id,
  });
}

export function useCreatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePackagePayload) => createPackage(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: materialKeys.packages.all });
    },
  });
}

export function usePackageAvailability(
  id: string,
  startDate: string,
  endDate: string,
  enabled = true,
) {
  return useQuery({
    queryKey: materialKeys.packages.availability(id, startDate, endDate),
    queryFn: () => getPackageAvailability(id, startDate, endDate),
    select: (res) => res.data,
    enabled: enabled && !!id && !!startDate && !!endDate,
  });
}
