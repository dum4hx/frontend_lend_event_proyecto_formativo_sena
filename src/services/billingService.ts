/**
 * Billing service.
 *
 * Stripe integration: checkout sessions, portal, seat management, and
 * cancellation.
 */

import { get, post, patch, del, type ApiSuccessResponse } from "../lib/api";
import type {
  CreateCheckoutPayload,
  CheckoutResult,
  CreatePortalPayload,
  UpdateSeatsPayload,
  CancelSubscriptionPayload,
  ChangePlanPayload,
  ChangePlanResult,
  PendingChangeData,
  BillingHistoryEntry,
} from "../types/api";

// ─── Checkout ──────────────────────────────────────────────────────────────

/** Create a Stripe Checkout session for a subscription. */
export async function createCheckoutSession(
  payload: CreateCheckoutPayload,
): Promise<ApiSuccessResponse<CheckoutResult>> {
  return post<CheckoutResult, CreateCheckoutPayload>(
    "/billing/checkout",
    payload,
  );
}

// ─── Portal ────────────────────────────────────────────────────────────────

/** Create a Stripe Billing Portal session. */
export async function createPortalSession(
  payload: CreatePortalPayload,
): Promise<ApiSuccessResponse<{ url: string }>> {
  return post<{ url: string }, CreatePortalPayload>("/billing/portal", payload);
}

// ─── Seats ─────────────────────────────────────────────────────────────────

/** Update the subscription seat quantity. */
export async function updateSeats(
  payload: UpdateSeatsPayload,
): Promise<ApiSuccessResponse<null>> {
  return patch<null, UpdateSeatsPayload>("/billing/seats", payload);
}

// ─── Cancel ────────────────────────────────────────────────────────────────

/** Cancel the current subscription. */
export async function cancelSubscription(
  payload: CancelSubscriptionPayload = {},
): Promise<ApiSuccessResponse<null>> {
  return post<null, CancelSubscriptionPayload>("/billing/cancel", payload);
}

// ─── History ───────────────────────────────────────────────────────────────

/** Get billing history for the organization. */
export async function getBillingHistory(
  limit = 50,
): Promise<ApiSuccessResponse<{ history: BillingHistoryEntry[] }>> {
  return get<{ history: BillingHistoryEntry[] }>("/billing/history", { limit });
}

// ─── Change Plan ───────────────────────────────────────────────────────────

/** Change the subscription plan (upgrade or downgrade). */
export async function changePlan(
  payload: ChangePlanPayload,
): Promise<ApiSuccessResponse<ChangePlanResult>> {
  return post<ChangePlanResult, ChangePlanPayload>(
    "/billing/change-plan",
    payload,
  );
}

// ─── Pending Changes ───────────────────────────────────────────────────────

/** Get pending plan change information (scheduled downgrades). */
export async function getPendingChanges(): Promise<
  ApiSuccessResponse<PendingChangeData>
> {
  return get<PendingChangeData>("/billing/pending-changes");
}

/** Cancel a pending plan change (deferred downgrade). */
export async function cancelPendingChange(): Promise<ApiSuccessResponse<null>> {
  return del<null>("/billing/pending-changes");
}
