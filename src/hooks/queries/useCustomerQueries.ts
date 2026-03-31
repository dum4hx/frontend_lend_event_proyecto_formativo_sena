/**
 * TanStack Query hooks for Customer domain.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCustomers,
  getCustomer,
  getDocumentTypes,
  createCustomer,
  updateCustomer,
  blacklistCustomer,
  activateCustomer,
  deactivateCustomer,
  deleteCustomer,
} from "../../services/customerService";
import type {
  CustomersQueryParams,
  CreateCustomerPayload,
  UpdateCustomerPayload,
} from "../../types/api";

export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (params: CustomersQueryParams) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  documentTypes: () => [...customerKeys.all, "documentTypes"] as const,
};

export function useCustomers(params: CustomersQueryParams = {}) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => getCustomers(params),
    select: (res) => ({
      customers: res.data.customers,
      total: res.data.total,
      page: res.data.page,
      totalPages: res.data.totalPages,
    }),
  });
}

export function useCustomer(id: string, enabled = true) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => getCustomer(id),
    select: (res) => res.data.customer,
    enabled: enabled && !!id,
  });
}

export function useDocumentTypes() {
  return useQuery({
    queryKey: customerKeys.documentTypes(),
    queryFn: () => getDocumentTypes(),
    select: (res) => res.data.documentTypes,
    staleTime: 1000 * 60 * 30, // 30 min — rarely changes
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) => createCustomer(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCustomerPayload }) =>
      updateCustomer(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
      qc.invalidateQueries({ queryKey: customerKeys.detail(vars.id) });
    },
  });
}

export function useBlacklistCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => blacklistCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useActivateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activateCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useDeactivateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}
