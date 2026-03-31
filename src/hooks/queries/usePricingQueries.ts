/**
 * TanStack Query hooks for Pricing Configurations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPricingConfigs,
  getPricingConfig,
  createPricingConfig,
  updatePricingConfig,
  deletePricingConfig,
  previewPricing,
} from "../../services/pricingService";
import type {
  CreatePricingConfigPayload,
  UpdatePricingConfigPayload,
  PricingPreviewParams,
} from "../../types/api";

export const pricingKeys = {
  all: ["pricing"] as const,
  list: () => [...pricingKeys.all, "list"] as const,
  details: () => [...pricingKeys.all, "detail"] as const,
  detail: (id: string) => [...pricingKeys.details(), id] as const,
};

export function usePricingConfigs() {
  return useQuery({
    queryKey: pricingKeys.list(),
    queryFn: () => getPricingConfigs(),
    select: (res) => res.data,
  });
}

export function usePricingConfig(id: string, enabled = true) {
  return useQuery({
    queryKey: pricingKeys.detail(id),
    queryFn: () => getPricingConfig(id),
    select: (res) => res.data,
    enabled: enabled && !!id,
  });
}

export function useCreatePricingConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePricingConfigPayload) => createPricingConfig(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pricingKeys.all });
    },
  });
}

export function useUpdatePricingConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePricingConfigPayload }) =>
      updatePricingConfig(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pricingKeys.all });
    },
  });
}

export function useDeletePricingConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePricingConfig(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pricingKeys.all });
    },
  });
}

export function usePreviewPricing() {
  return useMutation({
    mutationFn: (params: PricingPreviewParams) => previewPricing(params),
  });
}
