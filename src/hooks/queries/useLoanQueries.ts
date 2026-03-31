/**
 * TanStack Query hooks for Loan & Loan Request domain.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRequests,
  createRequest,
  approveRequest,
  rejectRequest,
  getAvailableMaterials,
  assignMaterials,
  updateRequest,
  getLoans,
  getLoan,
  getOverdueLoans,
  createLoanFromRequest,
  extendLoan,
  returnLoan,
  refundDeposit,
  recordPayment,
} from "../../services/loanService";
import type {
  LoanRequestsQueryParams,
  CreateLoanRequestPayload,
  AssignMaterialPayload,
  LoanRequestStatus,
  LoansQueryParams,
  ExtendLoanPayload,
} from "../../types/api";

// ─── Query Keys ────────────────────────────────────────────────────────────

export const requestKeys = {
  all: ["requests"] as const,
  lists: () => [...requestKeys.all, "list"] as const,
  list: (params: LoanRequestsQueryParams) => [...requestKeys.lists(), params] as const,
  details: () => [...requestKeys.all, "detail"] as const,
  detail: (id: string) => [...requestKeys.details(), id] as const,
  availableMaterials: (id: string) =>
    [...requestKeys.details(), id, "available-materials"] as const,
};

export const loanKeys = {
  all: ["loans"] as const,
  lists: () => [...loanKeys.all, "list"] as const,
  list: (params: LoansQueryParams) => [...loanKeys.lists(), params] as const,
  details: () => [...loanKeys.all, "detail"] as const,
  detail: (id: string) => [...loanKeys.details(), id] as const,
  overdue: () => [...loanKeys.all, "overdue"] as const,
};

// ─── Loan Request Queries ──────────────────────────────────────────────────

export function useRequests(params: LoanRequestsQueryParams = {}) {
  return useQuery({
    queryKey: requestKeys.list(params),
    queryFn: () => getRequests(params),
    select: (res) => ({
      requests: res.data.requests,
      total: res.data.total,
      page: res.data.page,
      totalPages: res.data.totalPages,
    }),
  });
}

export function useAvailableMaterials(requestId: string, enabled = true) {
  return useQuery({
    queryKey: requestKeys.availableMaterials(requestId),
    queryFn: () => getAvailableMaterials(requestId),
    select: (res) => res.data,
    enabled: enabled && !!requestId,
  });
}

// ─── Loan Request Mutations ────────────────────────────────────────────────

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLoanRequestPayload) => createRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestKeys.lists() });
    },
  });
}

export function useApproveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => approveRequest(id, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestKeys.all });
    },
  });
}

export function useRejectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectRequest(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestKeys.all });
    },
  });
}

export function useAssignMaterials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      assignments,
    }: {
      requestId: string;
      assignments: AssignMaterialPayload[];
    }) => assignMaterials(requestId, assignments),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestKeys.all });
    },
  });
}

export function useUpdateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CreateLoanRequestPayload> & { status?: LoanRequestStatus };
    }) => updateRequest(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestKeys.all });
    },
  });
}

// ─── Loan Queries ──────────────────────────────────────────────────────────

export function useLoans(params: LoansQueryParams = {}) {
  return useQuery({
    queryKey: loanKeys.list(params),
    queryFn: () => getLoans(params),
    select: (res) => ({
      loans: res.data.loans,
      total: res.data.total,
      page: res.data.page,
      totalPages: res.data.totalPages,
    }),
  });
}

export function useLoan(id: string, enabled = true) {
  return useQuery({
    queryKey: loanKeys.detail(id),
    queryFn: () => getLoan(id),
    select: (res) => res.data.loan,
    enabled: enabled && !!id,
  });
}

export function useOverdueLoans() {
  return useQuery({
    queryKey: loanKeys.overdue(),
    queryFn: () => getOverdueLoans(),
    select: (res) => res.data.loans,
  });
}

// ─── Loan Mutations ────────────────────────────────────────────────────────

export function useCreateLoanFromRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => createLoanFromRequest(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: loanKeys.all });
      qc.invalidateQueries({ queryKey: requestKeys.all });
    },
  });
}

export function useExtendLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ExtendLoanPayload }) =>
      extendLoan(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: loanKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: loanKeys.lists() });
    },
  });
}

export function useReturnLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => returnLoan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: loanKeys.all });
    },
  });
}

export function useRefundDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => refundDeposit(id, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: loanKeys.all });
    },
  });
}

export function useRecordRequestPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => recordPayment(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestKeys.all });
    },
  });
}
