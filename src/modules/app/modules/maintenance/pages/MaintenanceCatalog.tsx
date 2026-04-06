/**
 * MaintenanceCatalog — Main page for managing maintenance batches.
 *
 * Provides status-filter tabs, stat cards, paginated batch list, and modals
 * for creating, editing, viewing, adding items, and resolving items.
 */

import React, { useState } from "react";
import { Wrench, Plus, RefreshCcw, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { useMaintenanceBatches } from "../hooks/useMaintenanceBatches";
import {
  BatchListTable,
  BatchCreateModal,
  BatchEditModal,
  BatchDetailModal,
  AddItemsModal,
  ResolveItemModal,
} from "../components";
import { LoadingSpinner, ErrorDisplay, Pagination } from "../../../../../components/ui";
import { useLanguage } from "../../../../../contexts/useLanguage";
import type {
  MaintenanceBatchListItem,
  MaintenanceBatchItem,
  MaintenanceBatchStatus,
  CreateMaintenanceBatchPayload,
  UpdateMaintenanceBatchPayload,
  AddMaintenanceBatchItemsPayload,
  ResolveMaintenanceBatchItemPayload,
} from "../../../../../types/api";

const STATUS_TABS: Array<{ key: MaintenanceBatchStatus | "all"; icon: React.ReactNode }> = [
  { key: "all", icon: <FileText size={16} /> },
  { key: "draft", icon: <Clock size={16} /> },
  { key: "in_progress", icon: <Wrench size={16} /> },
  { key: "completed", icon: <CheckCircle size={16} /> },
  { key: "cancelled", icon: <XCircle size={16} /> },
];

export const MaintenanceCatalog: React.FC = () => {
  const { t, formatCurrency } = useLanguage();

  const {
    batches,
    selectedBatch,
    pagination,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    setPage,
    fetchDetail,
    clearSelectedBatch,
    createBatch,
    updateBatch,
    startBatch,
    cancelBatch,
    addItems,
    removeItem,
    resolveItem,
    refetch,
  } = useMaintenanceBatches();

  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [editBatch, setEditBatch] = useState<MaintenanceBatchListItem | null>(null);
  const [showAddItems, setShowAddItems] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<MaintenanceBatchItem | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleView = async (batch: MaintenanceBatchListItem) => {
    await fetchDetail(batch._id);
  };

  const handleEdit = async (batch: MaintenanceBatchListItem) => {
    await fetchDetail(batch._id);
    setEditBatch(batch);
  };

  const handleStartBatch = async (id: string) => {
    await startBatch(id);
  };

  const handleCancelBatch = async (id: string) => {
    await cancelBatch(id);
  };

  const handleAddItemsSubmit = async (payload: AddMaintenanceBatchItemsPayload) => {
    if (!selectedBatch) return;
    await addItems(selectedBatch._id, payload);
    setShowAddItems(false);
  };

  const handleRemoveItem = async (instanceId: string) => {
    if (!selectedBatch) return;
    await removeItem(selectedBatch._id, instanceId);
  };

  const handleResolveSubmit = async (
    instanceId: string,
    payload: ResolveMaintenanceBatchItemPayload,
  ) => {
    if (!selectedBatch) return;
    await resolveItem(selectedBatch._id, instanceId, payload);
    setResolveTarget(null);
  };

  // ── Early returns ─────────────────────────────────────────────────────

  if (loading && batches.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && batches.length === 0) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  // ── Computed stats ────────────────────────────────────────────────────

  const totalEstimated = batches.reduce((sum, b) => sum + b.totalEstimatedCost, 0);
  const totalActual = batches.reduce((sum, b) => sum + b.totalActualCost, 0);

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div data-help-id="maintenance-title">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {t("maintenance.title")} <span className="text-[#FFD700]">Hub</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm max-w-lg">{t("maintenance.subtitle")}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2"
            data-help-id="maintenance-create-btn"
          >
            <Plus size={16} />
            {t("maintenance.action.createBatch")}
          </button>
          <button
            onClick={refetch}
            disabled={loading}
            className="p-3 bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white hover:border-[#444] rounded-xl transition-all disabled:opacity-50"
            title={t("common.refresh")}
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-help-id="maintenance-stats">
        <div className="bg-[#1a1a1a] border border-[#222] px-6 py-4 rounded-xl shadow-lg">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
            {t("maintenance.stats.totalBatches")}
          </p>
          <p className="text-2xl font-black text-[#FFD700]">{pagination.total}</p>
          <p className="text-xs text-gray-500 mt-1">{t("maintenance.stats.totalBatchesDesc")}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#222] px-6 py-4 rounded-xl shadow-lg">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
            {t("maintenance.stats.estimatedCost")}
          </p>
          <p className="text-2xl font-black text-white">{formatCurrency(totalEstimated)}</p>
          <p className="text-xs text-gray-500 mt-1">{t("maintenance.stats.estimatedCostDesc")}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#222] px-6 py-4 rounded-xl shadow-lg">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
            {t("maintenance.stats.actualCost")}
          </p>
          <p className="text-2xl font-black text-white">{formatCurrency(totalActual)}</p>
          <p className="text-xs text-gray-500 mt-1">{t("maintenance.stats.actualCostDesc")}</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div
        className="flex flex-wrap gap-2 border-b border-[#222] pb-1"
        data-help-id="maintenance-status-tabs"
      >
        {STATUS_TABS.map(({ key, icon }) => {
          const isActive = key === "all" ? statusFilter === undefined : statusFilter === key;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key === "all" ? undefined : key)}
              className={`pb-3 px-4 text-sm font-bold tracking-wide transition-all relative flex items-center gap-2 ${
                isActive ? "text-[#FFD700]" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {icon}
              {key === "all" ? t("maintenance.allBatches") : t(`maintenance.statuses.${key}`)}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FFD700] rounded-t-full shadow-[0_-2px_6px_rgba(255,215,0,0.4)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Batch list table */}
      <div
        className="bg-[#121212] border border-[#222] rounded-2xl overflow-hidden shadow-2xl"
        data-help-id="maintenance-list"
      >
        <BatchListTable
          batches={batches}
          loading={loading}
          onView={handleView}
          onEdit={handleEdit}
          onStart={(batch: MaintenanceBatchListItem) => handleStartBatch(batch._id)}
          onCancel={(batch: MaintenanceBatchListItem) => handleCancelBatch(batch._id)}
          onAddItems={async (batch: MaintenanceBatchListItem) => {
            await fetchDetail(batch._id);
            setShowAddItems(true);
          }}
        />
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}

      {/* Create batch */}
      <BatchCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={async (payload: CreateMaintenanceBatchPayload) => {
          await createBatch(payload);
          setShowCreate(false);
        }}
      />

      {/* Edit batch */}
      {editBatch && selectedBatch && (
        <BatchEditModal
          open={!!editBatch}
          onClose={() => {
            setEditBatch(null);
            clearSelectedBatch();
          }}
          batch={selectedBatch}
          onSubmit={async (id: string, payload: UpdateMaintenanceBatchPayload) => {
            await updateBatch(id, payload);
            setEditBatch(null);
            clearSelectedBatch();
          }}
        />
      )}

      {/* Detail view (only when not editing) */}
      {selectedBatch && !editBatch && (
        <BatchDetailModal
          batch={selectedBatch}
          onClose={clearSelectedBatch}
          onStart={handleStartBatch}
          onCancel={handleCancelBatch}
          onAddItems={() => setShowAddItems(true)}
          onRemoveItem={handleRemoveItem}
          onResolveItem={setResolveTarget}
        />
      )}

      {/* Add Items */}
      <AddItemsModal
        open={showAddItems}
        onClose={() => setShowAddItems(false)}
        onSubmit={handleAddItemsSubmit}
      />

      {/* Resolve Item */}
      <ResolveItemModal
        open={!!resolveTarget}
        onClose={() => setResolveTarget(null)}
        item={resolveTarget}
        onSubmit={handleResolveSubmit}
      />
    </div>
  );
};
