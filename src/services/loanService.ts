/**
 * Loan request & loan service.
 *
 * Covers the full rental lifecycle: request → approval → checkout →
 * extension → return.
 */

import { get, post, patch, type ApiSuccessResponse } from "../lib/api";
import type {
  LoanRequest,
  CreateLoanRequestPayload,
  AssignMaterialPayload,
  Loan,
  ExtendLoanPayload,
  LoanRequestsQueryParams,
  LoansQueryParams,
  PaginationMeta,
} from "../types/api";

// ═══════════════════════════════════════════════════════════════════════════
// Loan Requests
// ═══════════════════════════════════════════════════════════════════════════

/** List loan requests with optional filters. */
export async function getRequests(
  params: LoanRequestsQueryParams = {},
): Promise<ApiSuccessResponse<{ requests: LoanRequest[] } & PaginationMeta>> {
  return get<{ requests: LoanRequest[] } & PaginationMeta>(
    "/requests",
    params as Record<string, string | number | boolean | undefined>,
  );
}

/** Create a new loan request. */
export async function createRequest(
  payload: CreateLoanRequestPayload,
): Promise<ApiSuccessResponse<{ request: LoanRequest }>> {
  return post<{ request: LoanRequest }, CreateLoanRequestPayload>(
    "/requests",
    payload,
  );
}

/** Approve a pending loan request (manager action). */
export async function approveRequest(
  requestId: string,
  notes?: string,
): Promise<ApiSuccessResponse<{ request: LoanRequest }>> {
  return post<{ request: LoanRequest }>(`/requests/${requestId}/approve`, {
    notes,
  });
}

/** Reject a pending loan request. */
export async function rejectRequest(
  requestId: string,
  reason: string,
): Promise<ApiSuccessResponse<{ request: LoanRequest }>> {
  return post<{ request: LoanRequest }>(`/requests/${requestId}/reject`, {
    reason,
  });
}

/** Assign specific material instances to a request (warehouse op). */
export async function assignMaterials(
  requestId: string,
  assignments: AssignMaterialPayload[],
): Promise<ApiSuccessResponse<{ request: LoanRequest }>> {
  return post<{ request: LoanRequest }>(
    `/requests/${requestId}/assign-materials`,
    {
      assignments,
    },
  );
}

/** Update a loan request. */
export async function updateRequest(
  requestId: string,
  updates: Partial<CreateLoanRequestPayload>,
): Promise<ApiSuccessResponse<{ request: LoanRequest }>> {
  return patch<{ request: LoanRequest }>(`/requests/${requestId}`, updates);
}

// ═══════════════════════════════════════════════════════════════════════════
// Loans
// ═══════════════════════════════════════════════════════════════════════════

/** List loans with optional filters. */
export async function getLoans(
  params: LoansQueryParams = {},
): Promise<ApiSuccessResponse<{ loans: Loan[] } & PaginationMeta>> {
  return get<{ loans: Loan[] } & PaginationMeta>(
    "/loans",
    params as Record<string, string | number | boolean | undefined>,
  );
}

/** Get a specific loan by ID. */
export async function getLoan(
  loanId: string,
): Promise<ApiSuccessResponse<{ loan: Loan }>> {
  return get<{ loan: Loan }>(`/loans/${loanId}`);
}

/** Get all overdue loans (auto-updates overdue status). */
export async function getOverdueLoans(): Promise<
  ApiSuccessResponse<{ loans: Loan[] }>
> {
  return get<{ loans: Loan[] }>("/loans/overdue");
}

/** Create a loan from a ready request (pickup action). */
export async function createLoanFromRequest(
  requestId: string,
): Promise<ApiSuccessResponse<{ loan: Loan }>> {
  return post<{ loan: Loan }>(`/loans/from-request/${requestId}`);
}

/** Extend a loan's end date. */
export async function extendLoan(
  loanId: string,
  payload: ExtendLoanPayload,
): Promise<ApiSuccessResponse<{ loan: Loan }>> {
  return post<{ loan: Loan }, ExtendLoanPayload>(
    `/loans/${loanId}/extend`,
    payload,
  );
}

/** Mark a loan as returned. */
export async function returnLoan(
  loanId: string,
): Promise<ApiSuccessResponse<{ loan: Loan }>> {
  return post<{ loan: Loan }>(`/loans/${loanId}/return`);
}
