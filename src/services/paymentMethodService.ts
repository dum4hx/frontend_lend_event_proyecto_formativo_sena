/**
 * Payment Method service.
 *
 * Covers listing, creating, updating, and deactivating organization payment methods.
 * All methods are organization-scoped and require authentication.
 */

import { get, post, patch, del, type ApiSuccessResponse } from "../lib/api";
import type {
  PaymentMethod,
  CreatePaymentMethodPayload,
  UpdatePaymentMethodPayload,
} from "../types/api";

// ─── List ──────────────────────────────────────────────────────────────────

/** Fetch all active payment methods for the authenticated organization. */
export async function getPaymentMethods(): Promise<
  ApiSuccessResponse<{ paymentMethods: PaymentMethod[] }>
> {
  return get<{ paymentMethods: PaymentMethod[] }>("/payment-methods");
}

// ─── Create ────────────────────────────────────────────────────────────────

/** Create a new payment method for the organization. */
export async function createPaymentMethod(
  payload: CreatePaymentMethodPayload,
): Promise<ApiSuccessResponse<{ paymentMethod: PaymentMethod }>> {
  return post<{ paymentMethod: PaymentMethod }, CreatePaymentMethodPayload>(
    "/payment-methods",
    payload,
  );
}

// ─── Update ────────────────────────────────────────────────────────────────

/** Update an existing payment method. The name of default methods cannot be changed. */
export async function updatePaymentMethod(
  id: string,
  payload: UpdatePaymentMethodPayload,
): Promise<ApiSuccessResponse<{ paymentMethod: PaymentMethod }>> {
  return patch<{ paymentMethod: PaymentMethod }, UpdatePaymentMethodPayload>(
    `/payment-methods/${id}`,
    payload,
  );
}

// ─── Delete (soft) ─────────────────────────────────────────────────────────

/** Deactivate a payment method (soft delete — sets status to inactive). */
export async function deletePaymentMethod(
  id: string,
): Promise<ApiSuccessResponse<{ id: string; status: "inactive" }>> {
  return del<{ id: string; status: "inactive" }>(`/payment-methods/${id}`);
}
