/**
 * BatchRepairView — Dedicated view for repairing items within a maintenance batch.
 *
 * Shows all items in the batch with their current status and a resolve action
 * for each item that is in_repair.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Wrench } from "lucide-react";
import { LoadingSpinner, StatusBadge } from "../../../../../components/ui";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { useToast } from "../../../../../contexts/ToastContext";
import { usePermissions } from "../../../../../contexts/usePermissions";
import { useActionPermission } from "../../../../../hooks/useActionPermission";
import {
  getMaintenanceBatch,
  resolveMaintenanceBatchItem,
} from "../../../../../services/maintenanceService";
import { ResolveItemModal } from "../components";
import {
  getMaintenanceBatchStatusLabel,
  getMaintenanceItemStatusLabel,
} from "../../../../../utils/statusLabels";
import Unauthorized from "../../../../../pages/Unauthorized";
import type {
  MaintenanceBatch,
  MaintenanceBatchItem,
  MaintenanceItemStatus,
  ResolveMaintenanceBatchItemPayload,
} from "../../../../../types/api";

export function BatchRepairView() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { t, formatCurrency, formatDate, language } = useLanguage();
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const { guard } = useActionPermission(language === "es" ? "es" : "en");

  const [batch, setBatch] = useState<MaintenanceBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolveTarget, setResolveTarget] = useState<MaintenanceBatchItem | null>(null);

  const fetchBatch = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMaintenanceBatch(batchId);
      setBatch(res.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    void fetchBatch();
  }, [fetchBatch]);

  const handleResolveSubmit = async (
    instanceId: string,
    payload: ResolveMaintenanceBatchItemPayload,
  ) => {
    if (!batchId) return;
    try {
      const res = await resolveMaintenanceBatchItem(batchId, instanceId, payload);
      setBatch(res.data);
      showToast("success", t("maintenance.resolveSuccess"), t("common.success"));
      setResolveTarget(null);
    } catch (err) {
      const error = err as Error;
      showToast("error", error.message || t("maintenance.resolveError"), t("common.error"));
    }
  };

  const getSerialNumber = (item: MaintenanceBatchItem): string =>
    typeof item.materialInstanceId === "string"
      ? item.materialInstanceId
      : item.materialInstanceId.serialNumber;

  const lang = language === "es" ? "es" : "en";

  if (!hasPermission("maintenance:read")) return <Unauthorized />;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="p-6 md:p-10 space-y-6">
        <button
          onClick={() => navigate("/app/maintenance")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          {t("common.back")}
        </button>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400 text-sm">
          {error || t("common.error")}
        </div>
      </div>
    );
  }

  const resolvedCount = batch.items.filter(
    (i) => i.itemStatus === "repaired" || i.itemStatus === "unrecoverable",
  ).length;

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate("/app/maintenance")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          {t("common.back")}
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div data-help-id="maintenance-repair-title">
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Wrench className="text-[#FFD700]" size={28} />
              {t("maintenance.repairView.title")}
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              {batch.name} — {t("maintenance.repairView.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge
              status={batch.status}
              label={getMaintenanceBatchStatusLabel(batch.status, lang)}
            />
            <span className="text-xs text-gray-500">
              {t("maintenance.createdAt")}: {formatDate(batch.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress stats */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        data-help-id="maintenance-repair-stats"
      >
        <div className="bg-[#1a1a1a] border border-[#222] px-6 py-4 rounded-xl shadow-lg">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
            {t("maintenance.repairView.totalItems")}
          </p>
          <p className="text-2xl font-black text-[#FFD700]">{batch.items.length}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#222] px-6 py-4 rounded-xl shadow-lg">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
            {t("maintenance.repairView.resolved")}
          </p>
          <p className="text-2xl font-black text-green-400">{resolvedCount}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#222] px-6 py-4 rounded-xl shadow-lg">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
            {t("maintenance.repairView.pending")}
          </p>
          <p className="text-2xl font-black text-yellow-400">
            {batch.items.length - resolvedCount}
          </p>
        </div>
      </div>

      {/* Items table */}
      <div
        className="bg-[#121212] border border-[#222] rounded-2xl overflow-hidden shadow-2xl"
        data-help-id="maintenance-repair-items"
      >
        {batch.items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">{t("maintenance.noItems")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0d0d0d] border-b border-[#222] text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">{t("maintenance.serialNumber")}</th>
                  <th className="px-6 py-4">{t("maintenance.repairView.itemStatus")}</th>
                  <th className="px-6 py-4">{t("maintenance.form.entryReason")}</th>
                  <th className="px-6 py-4">{t("maintenance.form.sourceType")}</th>
                  <th className="px-6 py-4">{t("maintenance.form.estimatedCost")}</th>
                  <th className="px-6 py-4">{t("maintenance.form.actualCost")}</th>
                  <th className="px-6 py-4">{t("maintenance.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {batch.items.map((item) => {
                  const canResolve =
                    batch.status === "in_progress" && item.itemStatus === "in_repair";
                  return (
                    <tr key={item._id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-6 py-4 text-white font-mono text-xs">
                        {getSerialNumber(item)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={item.itemStatus as MaintenanceItemStatus}
                          label={getMaintenanceItemStatusLabel(item.itemStatus, lang)}
                        />
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {t(`maintenance.entryReason.${item.entryReason}`)}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {t(`maintenance.sourceType.${item.sourceType}`)}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {item.estimatedCost != null ? formatCurrency(item.estimatedCost) : "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {item.actualCost != null ? formatCurrency(item.actualCost) : "—"}
                      </td>
                      <td className="px-6 py-4">
                        {canResolve ? (
                          <button
                            onClick={guard("maintenance:resolve", () => setResolveTarget(item))}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#FFD700]/10 text-[#FFD700] text-xs font-semibold rounded-lg border border-[#FFD700]/30 hover:bg-[#FFD700]/20 transition-colors"
                            title={t("maintenance.action.resolve")}
                          >
                            <Wrench size={14} />
                            {t("maintenance.action.resolve")}
                          </button>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolve Item Modal */}
      <ResolveItemModal
        open={!!resolveTarget}
        onClose={() => setResolveTarget(null)}
        item={resolveTarget}
        onSubmit={handleResolveSubmit}
      />
    </div>
  );
}
