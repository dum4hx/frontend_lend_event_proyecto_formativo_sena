/**
 * TanStack Query hooks for Invoice domain.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInvoices,
  getInvoiceById,
  getInvoicesSummary,
  recordPayment,
  voidInvoice,
  sendInvoice,
} from "../../services/invoiceService";
import type {
  InvoicesQueryParams,
  RecordPaymentPayload,
} from "../../types/api";

export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  list: (params: InvoicesQueryParams) => [...invoiceKeys.lists(), params] as const,
  details: () => [...invoiceKeys.all, "detail"] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  summary: () => [...invoiceKeys.all, "summary"] as const,
};

export function useInvoices(params: InvoicesQueryParams = {}) {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => getInvoices(params),
    select: (res) => ({
      invoices: res.data.invoices,
      total: res.data.total,
      page: res.data.page,
      totalPages: res.data.totalPages,
    }),
  });
}

export function useInvoice(id: string, enabled = true) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => getInvoiceById(id),
    select: (res) => res.data.invoice,
    enabled: enabled && !!id,
  });
}

export function useInvoicesSummary() {
  return useQuery({
    queryKey: invoiceKeys.summary(),
    queryFn: () => getInvoicesSummary(),
    select: (res) => res.data,
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, payload }: { invoiceId: string; payload: RecordPaymentPayload }) =>
      recordPayment(invoiceId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}

export function useVoidInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, reason }: { invoiceId: string; reason: string }) =>
      voidInvoice(invoiceId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}

export function useSendInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => sendInvoice(invoiceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}
