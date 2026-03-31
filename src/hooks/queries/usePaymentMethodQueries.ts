/**
 * TanStack Query hooks for Payment Methods.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "../../services/paymentMethodService";
import type { CreatePaymentMethodPayload, UpdatePaymentMethodPayload } from "../../types/api";

export const paymentMethodKeys = {
  all: ["paymentMethods"] as const,
  list: () => [...paymentMethodKeys.all, "list"] as const,
};

export function usePaymentMethods() {
  return useQuery({
    queryKey: paymentMethodKeys.list(),
    queryFn: () => getPaymentMethods(),
    select: (res) => res.data.paymentMethods,
  });
}

export function useCreatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePaymentMethodPayload) => createPaymentMethod(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentMethodKeys.all });
    },
  });
}

export function useUpdatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePaymentMethodPayload }) =>
      updatePaymentMethod(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentMethodKeys.all });
    },
  });
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePaymentMethod(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentMethodKeys.all });
    },
  });
}
