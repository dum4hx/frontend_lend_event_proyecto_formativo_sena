/**
 * Invoice service.
 *
 * Covers invoice listing, fetching by ID, payments, voiding, and summary stats.
 */

import { get, post, type ApiSuccessResponse } from "../lib/api";
import type {
  Invoice,
  InvoiceSummary,
  RecordPaymentPayload,
  InvoicesQueryParams,
  PaginationMeta,
} from "../types/api";

// ─── List ──────────────────────────────────────────────────────────────────

/** Fetch a paginated list of invoices. */
export async function getInvoices(
  params: InvoicesQueryParams = {},
): Promise<ApiSuccessResponse<{ invoices: Invoice[] } & PaginationMeta>> {
  return get<{ invoices: Invoice[] } & PaginationMeta>(
    "/invoices",
    params as Record<string, string | number | boolean | undefined>,
  );
}

// ─── Get by ID ─────────────────────────────────────────────────────────────

/** Fetch a single invoice by ID, including populated line items and payment history. */
export async function getInvoiceById(
  id: string,
): Promise<ApiSuccessResponse<{ invoice: Invoice }>> {
  return get<{ invoice: Invoice }>(`/invoices/${id}`);
}

// ─── Summary ───────────────────────────────────────────────────────────────

/** Fetch invoice summary statistics. */
export async function getInvoicesSummary(): Promise<ApiSuccessResponse<InvoiceSummary>> {
  return get<InvoiceSummary>("/invoices/summary");
}

// ─── Payment ───────────────────────────────────────────────────────────────

/** Record a payment against an invoice. */
export async function recordPayment(
  invoiceId: string,
  payload: RecordPaymentPayload,
): Promise<ApiSuccessResponse<{ invoice: Invoice }>> {
  return post<{ invoice: Invoice }, RecordPaymentPayload>(`/invoices/${invoiceId}/pay`, payload);
}

// ─── Void ──────────────────────────────────────────────────────────────────

/** Void an invoice. */
export async function voidInvoice(
  invoiceId: string,
  reason: string,
): Promise<ApiSuccessResponse<null>> {
  return post<null>(`/invoices/${invoiceId}/void`, { reason });
}

// ─── Send ──────────────────────────────────────────────────────────────────

/** Send (finalise) a draft invoice via email. */
export async function sendInvoice(
  invoiceId: string,
): Promise<ApiSuccessResponse<{ invoice: Invoice }>> {
  return post<{ invoice: Invoice }>(`/invoices/${invoiceId}/send`, {});
}
