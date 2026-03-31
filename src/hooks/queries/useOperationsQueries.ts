/**
 * TanStack Query hooks for location operations endpoints.
 * All hooks are disabled when locationId is empty/undefined.
 */

import { useQuery } from "@tanstack/react-query";
import {
  getOpsOverview,
  getOpsInspections,
  getOpsOverdueFinancials,
  getOpsInventoryIssues,
  getOpsTransfers,
  getOpsLoanDeadlines,
  getOpsDamages,
  getOpsTasks,
} from "../../services/operationsService";

const OPERATIONS_KEYS = {
  all: (locationId: string) => ["operations", locationId] as const,
  overview: (locationId: string) => [...OPERATIONS_KEYS.all(locationId), "overview"] as const,
  inspections: (locationId: string) => [...OPERATIONS_KEYS.all(locationId), "inspections"] as const,
  financials: (locationId: string) => [...OPERATIONS_KEYS.all(locationId), "financials"] as const,
  inventory: (locationId: string) => [...OPERATIONS_KEYS.all(locationId), "inventory"] as const,
  transfers: (locationId: string) => [...OPERATIONS_KEYS.all(locationId), "transfers"] as const,
  deadlines: (locationId: string) => [...OPERATIONS_KEYS.all(locationId), "deadlines"] as const,
  damages: (locationId: string) => [...OPERATIONS_KEYS.all(locationId), "damages"] as const,
  tasks: (locationId: string) => [...OPERATIONS_KEYS.all(locationId), "tasks"] as const,
};

export { OPERATIONS_KEYS };

export function useOpsOverview(locationId: string) {
  return useQuery({
    queryKey: OPERATIONS_KEYS.overview(locationId),
    queryFn: () => getOpsOverview(locationId).then((r) => r.data),
    enabled: !!locationId,
    refetchInterval: 60_000,
  });
}

export function useOpsInspections(locationId: string) {
  return useQuery({
    queryKey: OPERATIONS_KEYS.inspections(locationId),
    queryFn: () => getOpsInspections(locationId).then((r) => r.data),
    enabled: !!locationId,
    refetchInterval: 60_000,
  });
}

export function useOpsOverdueFinancials(locationId: string) {
  return useQuery({
    queryKey: OPERATIONS_KEYS.financials(locationId),
    queryFn: () => getOpsOverdueFinancials(locationId).then((r) => r.data),
    enabled: !!locationId,
  });
}

export function useOpsInventoryIssues(locationId: string) {
  return useQuery({
    queryKey: OPERATIONS_KEYS.inventory(locationId),
    queryFn: () => getOpsInventoryIssues(locationId).then((r) => r.data),
    enabled: !!locationId,
  });
}

export function useOpsTransfers(locationId: string) {
  return useQuery({
    queryKey: OPERATIONS_KEYS.transfers(locationId),
    queryFn: () => getOpsTransfers(locationId).then((r) => r.data),
    enabled: !!locationId,
  });
}

export function useOpsLoanDeadlines(locationId: string) {
  return useQuery({
    queryKey: OPERATIONS_KEYS.deadlines(locationId),
    queryFn: () => getOpsLoanDeadlines(locationId).then((r) => r.data),
    enabled: !!locationId,
    refetchInterval: 60_000,
  });
}

export function useOpsDamages(locationId: string) {
  return useQuery({
    queryKey: OPERATIONS_KEYS.damages(locationId),
    queryFn: () => getOpsDamages(locationId).then((r) => r.data),
    enabled: !!locationId,
  });
}

export function useOpsTasks(locationId: string) {
  return useQuery({
    queryKey: OPERATIONS_KEYS.tasks(locationId),
    queryFn: () => getOpsTasks(locationId).then((r) => r.data),
    enabled: !!locationId,
    refetchInterval: 30_000,
  });
}
