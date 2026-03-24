/**
 * Pricing configuration service.
 *
 * Covers CRUD for pricing configurations and the pricing preview
 * calculation endpoint.
 */

import { get, post, put, del, type ApiSuccessResponse } from "../lib/api";
import type {
  PricingConfig,
  CreatePricingConfigPayload,
  UpdatePricingConfigPayload,
  PricingPreviewParams,
  PricingPreviewResult,
} from "../types/api";

// ═══════════════════════════════════════════════════════════════════════════
// Pricing Configurations
// ═══════════════════════════════════════════════════════════════════════════

/** List all pricing configurations for the organization. */
export async function getPricingConfigs(): Promise<ApiSuccessResponse<PricingConfig[]>> {
  return get<PricingConfig[]>("/pricing/configs");
}

/** Get a single pricing configuration by ID. */
export async function getPricingConfig(id: string): Promise<ApiSuccessResponse<PricingConfig>> {
  return get<PricingConfig>(`/pricing/configs/${id}`);
}

/** Create a new pricing configuration. */
export async function createPricingConfig(
  payload: CreatePricingConfigPayload,
): Promise<ApiSuccessResponse<PricingConfig>> {
  return post<PricingConfig, CreatePricingConfigPayload>("/pricing/configs", payload);
}

/** Update an existing pricing configuration. */
export async function updatePricingConfig(
  id: string,
  payload: UpdatePricingConfigPayload,
): Promise<ApiSuccessResponse<PricingConfig>> {
  return put<PricingConfig, UpdatePricingConfigPayload>(`/pricing/configs/${id}`, payload);
}

/** Delete a pricing configuration. */
export async function deletePricingConfig(
  id: string,
): Promise<ApiSuccessResponse<Record<string, never>>> {
  return del<Record<string, never>>(`/pricing/configs/${id}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Pricing Preview
// ═══════════════════════════════════════════════════════════════════════════

/** Calculate estimated price without persisting. */
export async function previewPricing(
  params: PricingPreviewParams,
): Promise<ApiSuccessResponse<PricingPreviewResult>> {
  return post<PricingPreviewResult, PricingPreviewParams>("/pricing/preview", params);
}
