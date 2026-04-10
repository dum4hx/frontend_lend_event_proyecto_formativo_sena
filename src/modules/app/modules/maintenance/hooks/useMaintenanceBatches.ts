/**
 * Hook for managing maintenance batches.
 *
 * Provides state for batch listing, detail view, and all CRUD / lifecycle
 * actions (create, update, start, cancel, add/remove items, resolve items).
 */

import { useState, useEffect, useCallback } from "react";
import {
  getMaintenanceBatches,
  getMaintenanceBatch,
  createMaintenanceBatch,
  updateMaintenanceBatch,
  startMaintenanceBatch,
  cancelMaintenanceBatch,
  addMaintenanceBatchItems,
  removeMaintenanceBatchItem,
  resolveMaintenanceBatchItem,
} from "../../../../../services/maintenanceService";
import type {
  MaintenanceBatch,
  MaintenanceBatchListItem,
  MaintenanceBatchStatus,
  CreateMaintenanceBatchPayload,
  UpdateMaintenanceBatchPayload,
  AddMaintenanceBatchItemsPayload,
  ResolveMaintenanceBatchItemPayload,
  PaginationMeta,
} from "../../../../../types/api";

interface UseMaintenanceBatchesState {
  batches: MaintenanceBatchListItem[];
  selectedBatch: MaintenanceBatch | null;
  pagination: PaginationMeta;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
  statusFilter: MaintenanceBatchStatus | undefined;
  page: number;
}

export function useMaintenanceBatches() {
  const [state, setState] = useState<UseMaintenanceBatchesState>({
    batches: [],
    selectedBatch: null,
    pagination: { total: 0, page: 1, totalPages: 1 },
    loading: true,
    detailLoading: false,
    error: null,
    statusFilter: undefined,
    page: 1,
  });

  const fetchBatches = useCallback(async (page = 1, status?: MaintenanceBatchStatus) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const res = await getMaintenanceBatches({ page, limit: 20, status });
      setState((prev) => ({
        ...prev,
        batches: res.data.batches || [],
        pagination: res.data.pagination,
        loading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: (err as Error).message || "Failed to fetch batches",
        loading: false,
      }));
    }
  }, []);

  const fetchDetail = useCallback(async (id: string) => {
    try {
      setState((prev) => ({ ...prev, detailLoading: true, error: null }));
      const res = await getMaintenanceBatch(id);
      setState((prev) => ({
        ...prev,
        selectedBatch: res.data,
        detailLoading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: (err as Error).message || "Failed to fetch batch detail",
        detailLoading: false,
      }));
    }
  }, []);

  useEffect(() => {
    fetchBatches(state.page, state.statusFilter);
  }, [fetchBatches, state.page, state.statusFilter]);

  const setStatusFilter = (status: MaintenanceBatchStatus | undefined) => {
    setState((prev) => ({ ...prev, statusFilter: status, page: 1 }));
  };

  const setPage = (page: number) => {
    setState((prev) => ({ ...prev, page }));
  };

  const clearSelectedBatch = () => {
    setState((prev) => ({ ...prev, selectedBatch: null }));
  };

  const handleCreate = async (payload: CreateMaintenanceBatchPayload) => {
    const res = await createMaintenanceBatch(payload);
    await fetchBatches(state.page, state.statusFilter);
    return res.data;
  };

  const handleUpdate = async (id: string, payload: UpdateMaintenanceBatchPayload) => {
    const res = await updateMaintenanceBatch(id, payload);
    setState((prev) => ({ ...prev, selectedBatch: res.data }));
    await fetchBatches(state.page, state.statusFilter);
    return res.data;
  };

  const handleStart = async (id: string) => {
    const res = await startMaintenanceBatch(id);
    setState((prev) => ({ ...prev, selectedBatch: res.data }));
    await fetchBatches(state.page, state.statusFilter);
    return res.data;
  };

  const handleCancel = async (id: string) => {
    const res = await cancelMaintenanceBatch(id);
    setState((prev) => ({ ...prev, selectedBatch: res.data }));
    await fetchBatches(state.page, state.statusFilter);
    return res.data;
  };

  const handleAddItems = async (id: string, payload: AddMaintenanceBatchItemsPayload) => {
    const res = await addMaintenanceBatchItems(id, payload);
    setState((prev) => ({ ...prev, selectedBatch: res.data }));
    await fetchBatches(state.page, state.statusFilter);
    return res.data;
  };

  const handleRemoveItem = async (batchId: string, instanceId: string) => {
    const res = await removeMaintenanceBatchItem(batchId, instanceId);
    setState((prev) => ({ ...prev, selectedBatch: res.data }));
    await fetchBatches(state.page, state.statusFilter);
    return res.data;
  };

  const handleResolveItem = async (
    batchId: string,
    instanceId: string,
    payload: ResolveMaintenanceBatchItemPayload,
  ) => {
    const res = await resolveMaintenanceBatchItem(batchId, instanceId, payload);
    setState((prev) => ({ ...prev, selectedBatch: res.data }));
    await fetchBatches(state.page, state.statusFilter);
    return res.data;
  };

  return {
    batches: state.batches,
    selectedBatch: state.selectedBatch,
    pagination: state.pagination,
    loading: state.loading,
    detailLoading: state.detailLoading,
    error: state.error,
    statusFilter: state.statusFilter,
    page: state.page,
    setStatusFilter,
    setPage,
    fetchDetail,
    clearSelectedBatch,
    createBatch: handleCreate,
    updateBatch: handleUpdate,
    startBatch: handleStart,
    cancelBatch: handleCancel,
    addItems: handleAddItems,
    removeItem: handleRemoveItem,
    resolveItem: handleResolveItem,
    refetch: () => fetchBatches(state.page, state.statusFilter),
  };
}
