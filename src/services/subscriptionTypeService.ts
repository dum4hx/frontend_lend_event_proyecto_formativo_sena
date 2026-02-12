/**
 * Subscription type service (super-admin only).
 *
 * CRUD for dynamic plan configurations and cost calculation.
 */

import { get, post, patch, del, type ApiSuccessResponse } from "../lib/api";
import type {
  SubscriptionType,
  CreateSubscriptionTypePayload,
  PlanCostResult,
} from "../types/api";

// ─── List ──────────────────────────────────────────────────────────────────

/** List all active subscription types. */
export async function getSubscriptionTypes(): Promise<
  ApiSuccessResponse<{ subscriptionTypes: SubscriptionType[] }>
> {
  return get<{ subscriptionTypes: SubscriptionType[] }>("/subscription-types");
}

// ─── Single ────────────────────────────────────────────────────────────────

/** Fetch a subscription type by plan name. */
export async function getSubscriptionType(
  plan: string,
): Promise<ApiSuccessResponse<{ subscriptionType: SubscriptionType }>> {
  return get<{ subscriptionType: SubscriptionType }>(
    `/subscription-types/${plan}`,
  );
}

// ─── Create ────────────────────────────────────────────────────────────────

/** Create a new subscription type (super-admin only). */
export async function createSubscriptionType(
  payload: CreateSubscriptionTypePayload,
): Promise<ApiSuccessResponse<{ subscriptionType: SubscriptionType }>> {
  return post<
    { subscriptionType: SubscriptionType },
    CreateSubscriptionTypePayload
  >("/subscription-types", payload);
}

// ─── Update ────────────────────────────────────────────────────────────────

/** Update a subscription type (super-admin only). */
export async function updateSubscriptionType(
  plan: string,
  updates: Partial<Omit<CreateSubscriptionTypePayload, "plan">>,
): Promise<ApiSuccessResponse<{ subscriptionType: SubscriptionType }>> {
  return patch<{ subscriptionType: SubscriptionType }>(
    `/subscription-types/${plan}`,
    updates,
  );
}

// ─── Delete (soft) ─────────────────────────────────────────────────────────

/** Deactivate a subscription type (soft delete). */
export async function deleteSubscriptionType(
  plan: string,
): Promise<ApiSuccessResponse<null>> {
  return del<null>(`/subscription-types/${plan}`);
}

// ─── Cost Calculation ──────────────────────────────────────────────────────

/** Calculate the cost for a plan with a given seat count. */
export async function calculatePlanCost(
  plan: string,
  seatCount: number,
): Promise<ApiSuccessResponse<PlanCostResult>> {
  return post<PlanCostResult>(`/subscription-types/${plan}/calculate-cost`, {
    seatCount,
  });
}
