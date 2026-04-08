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
  AvailableMaterialsResponse,
  Loan,
  LoanListItem,
  LoanDetail,
  LoanDetailGrouped,
  LoanRequestStatus,
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
  return post<{ request: LoanRequest }, CreateLoanRequestPayload>("/requests", payload);
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

/** Fetch available material instances for a request, classified by user-accessible locations. */
export async function getAvailableMaterials(
  requestId: string,
): Promise<ApiSuccessResponse<AvailableMaterialsResponse>> {
  return get<AvailableMaterialsResponse>(`/requests/${requestId}/available-materials`);
}

/** Assign specific material instances to a request (warehouse op). */
export async function assignMaterials(
  requestId: string,
  assignments: AssignMaterialPayload[],
): Promise<ApiSuccessResponse<{ request: LoanRequest }>> {
  return post<{ request: LoanRequest }>(`/requests/${requestId}/assign-materials`, {
    assignments,
  });
}

/** Mark a request as ready for checkout (assigned → ready). */
export async function markRequestReady(
  requestId: string,
): Promise<ApiSuccessResponse<{ request: LoanRequest }>> {
  return post<{ request: LoanRequest }>(`/requests/${requestId}/ready`);
}

/** Cancel a loan request (all states except shipped, completed, cancelled, rejected). */
export async function cancelRequest(
  requestId: string,
): Promise<ApiSuccessResponse<{ request: LoanRequest }>> {
  return post<{ request: LoanRequest }>(`/requests/${requestId}/cancel`);
}

/** Update a loan request. */
export async function updateRequest(
  requestId: string,
  updates: Partial<CreateLoanRequestPayload> & { status?: LoanRequestStatus },
): Promise<ApiSuccessResponse<{ request: LoanRequest }>> {
  return patch<{ request: LoanRequest }>(`/requests/${requestId}`, updates);
}

// ═══════════════════════════════════════════════════════════════════════════
// Loans
// ═══════════════════════════════════════════════════════════════════════════

/** List loans with optional filters. */
export async function getLoans(
  params: LoansQueryParams = {},
): Promise<ApiSuccessResponse<{ loans: LoanListItem[] } & PaginationMeta>> {
  return get<{ loans: LoanListItem[] } & PaginationMeta>(
    "/loans",
    params as Record<string, string | number | boolean | undefined>,
  );
}

/** Get a specific loan by ID. */
export async function getLoan(loanId: string): Promise<ApiSuccessResponse<{ loan: Loan }>> {
  return get<{ loan: Loan }>(`/loans/${loanId}`);
}

/** Get a specific loan by ID with full populated details (flat instance list). */
export async function getLoanDetail(
  loanId: string,
): Promise<ApiSuccessResponse<{ loan: LoanDetail }>> {
  return get<{ loan: LoanDetail }>(`/loans/${loanId}`);
}

/** Get a specific loan by ID with material instances grouped by material type. */
export async function getLoanDetailGrouped(
  loanId: string,
): Promise<ApiSuccessResponse<{ loan: LoanDetailGrouped }>> {
  return get<{ loan: LoanDetailGrouped }>(`/loans/${loanId}`, { groupByMaterialType: true });
}

/** Get all overdue loans (auto-updates overdue status). */
export async function getOverdueLoans(): Promise<ApiSuccessResponse<{ loans: Loan[] }>> {
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
  return post<{ loan: Loan }, ExtendLoanPayload>(`/loans/${loanId}/extend`, payload);
}

/** Mark a loan as returned. */
export async function returnLoan(loanId: string): Promise<ApiSuccessResponse<{ loan: Loan }>> {
  return post<{ loan: Loan }>(`/loans/${loanId}/return`);
}

/** Refund a loan's deposit (physical/manual refund). */
export async function refundDeposit(
  loanId: string,
  notes?: string,
): Promise<ApiSuccessResponse<{ loan: Loan }>> {
  return post<{ loan: Loan }>(`/loans/${loanId}/deposit/refund`, { notes });
}

/** Record that a deposit for a request has been paid manually. */
export async function recordPayment(
  requestId: string,
): Promise<ApiSuccessResponse<{ request: LoanRequest }>> {
  return post<{ request: LoanRequest }>(`/requests/${requestId}/record-payment`);
}

/** Record that the rental fee for a request has been paid manually. */
export async function recordRentalPayment(
  requestId: string,
): Promise<ApiSuccessResponse<{ request: LoanRequest }>> {
  return post<{ request: LoanRequest }>(`/requests/${requestId}/record-rental-payment`);
}

/** Complete a loan after inspection (transitions to closed). */
export async function completeLoan(loanId: string): Promise<ApiSuccessResponse<{ loan: Loan }>> {
  return post<{ loan: Loan }>(`/loans/${loanId}/complete`);
}
