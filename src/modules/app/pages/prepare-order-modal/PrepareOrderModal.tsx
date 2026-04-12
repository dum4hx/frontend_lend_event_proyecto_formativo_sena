/**
 * PrepareOrderModal
 *
 * Rich preparation modal for approved loan requests.
 *
 * Features:
 * - Live available-material data via GET /requests/:id/available-materials
 * - Instance assignment cards with availability badges per material type
 * - Auto-assign shortcut (available-now instances only)
 * - Manual instance selection with per-type quantity cap
 * - Shortfall section: auto-grouped by source location, with destination
 *   dropdown + notes for creating transfer request(s)
 * - Prepare All / Prepare Available (partial) actions
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { CheckCircle2, Loader2, X, Zap } from "lucide-react";
import Button from "../../../../components/ui/Button";
import { useConfirmModal } from "../../../../hooks/useConfirmModal";
import { useToast } from "../../../../contexts/ToastContext";
import { useAuth } from "../../../../contexts/useAuth";
import { useLanguage } from "../../../../contexts/useLanguage";
import { getAvailableMaterials, assignMaterials } from "../../../../services/loanService";
import { createTransferRequest } from "../../../../services/transferService";
import {
  getLocations,
  type WarehouseLocation,
} from "../../../../services/warehouseOperatorService";
import type {
  AvailableMaterialInstance,
  AvailableMaterialsResponse,
  AssignMaterialPayload,
} from "../../../../types/api";
import type { MaterialTypeRow, ShortfallGroup, PrepareOrderModalProps } from "./types";
import MaterialAssignmentCard from "./MaterialAssignmentCard";
import ShortfallSection from "./ShortfallSection";

export default function PrepareOrderModal({
  isOpen,
  requestId,
  customerName,
  requiredMaterialTypes,
  onClose,
  onSuccess,
}: PrepareOrderModalProps) {
  const { user } = useAuth();
  const { showConfirm, ConfirmModal } = useConfirmModal();
  const { showToast } = useToast();
  const { t } = useLanguage();

  // ── Fetch state ──
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [availableMaterials, setAvailableMaterials] = useState<AvailableMaterialsResponse | null>(
    null,
  );
  const [allLocations, setAllLocations] = useState<WarehouseLocation[]>([]);

  // ── Assignment selections: materialTypeId → selected instanceIds ──
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  // ── Transfer request form ──
  const [destinationLocationId, setDestinationLocationId] = useState("");
  const [transferNotes, setTransferNotes] = useState("");

  // ── Submit state ──
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  // ── Load available materials + all locations when modal opens ──
  const loadData = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    setSelections({});
    setDestinationLocationId("");
    setTransferNotes("");
    try {
      const [availRes, locRes] = await Promise.all([
        getAvailableMaterials(requestId),
        getLocations({ limit: 100 }),
      ]);
      setAvailableMaterials(availRes.data);
      setAllLocations(locRes.data.items ?? []);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : t("orders.prepare.errorTitle"));
    } finally {
      setLoading(false);
    }
  }, [requestId, t]);

  useEffect(() => {
    if (isOpen) {
      void loadData();
    }
  }, [isOpen, loadData]);

  // ── Build per-type instance rows from the API response ──
  const materialTypeRows = useMemo<MaterialTypeRow[]>(() => {
    if (!availableMaterials) return [];

    return requiredMaterialTypes.map(({ materialTypeId, materialTypeName, quantity }) => {
      const currentUserInstances: AvailableMaterialInstance[] = [];
      for (const loc of availableMaterials.currentUserLocations) {
        for (const inst of loc.instances) {
          if (inst.model._id === materialTypeId) currentUserInstances.push(inst);
        }
      }
      return { materialTypeId, materialTypeName, quantity, currentUserInstances };
    });
  }, [availableMaterials, requiredMaterialTypes]);

  // ── Auto-fill selections once materialTypeRows are built ──
  useEffect(() => {
    if (materialTypeRows.length === 0) return;
    const initial: Record<string, string[]> = {};
    for (const row of materialTypeRows) {
      const sorted = [
        ...row.currentUserInstances.filter((i) => i.availability === "available"),
        ...row.currentUserInstances.filter((i) => i.availability === "upcoming"),
      ];
      initial[row.materialTypeId] = sorted.slice(0, row.quantity).map((i) => i._id);
    }
    setSelections(initial);
  }, [materialTypeRows]);

  // ── Stock summary ──
  const stockSummary = useMemo(() => {
    const total = requiredMaterialTypes.length;
    const fulfilled = materialTypeRows.filter(
      (row) => (selections[row.materialTypeId]?.length ?? 0) >= row.quantity,
    ).length;
    return { total, fulfilled };
  }, [materialTypeRows, selections, requiredMaterialTypes.length]);

  const fullyAssignedRows = useMemo(
    () =>
      materialTypeRows.filter(
        (row) => (selections[row.materialTypeId]?.length ?? 0) >= row.quantity,
      ),
    [materialTypeRows, selections],
  );

  const canPrepareAll = stockSummary.fulfilled === stockSummary.total && stockSummary.total > 0;
  const canPreparePartial = stockSummary.fulfilled > 0 && !canPrepareAll;

  // ── Shortfall per type: required - selected ──
  const shortfallByType = useMemo(() => {
    const result = new Map<string, number>();
    for (const row of materialTypeRows) {
      const need = row.quantity - (selections[row.materialTypeId]?.length ?? 0);
      if (need > 0) result.set(row.materialTypeId, need);
    }
    return result;
  }, [materialTypeRows, selections]);

  // ── Shortfall groups (one per source location) for transfer requests ──
  const shortfallGroups = useMemo<ShortfallGroup[]>(() => {
    if (!availableMaterials || shortfallByType.size === 0) return [];

    const groups = new Map<string, { locationName: string; items: ShortfallGroup["items"] }>();

    for (const [materialTypeId, need] of shortfallByType) {
      const row = materialTypeRows.find((r) => r.materialTypeId === materialTypeId);
      if (!row) continue;

      type LocEntry = {
        locationName: string;
        instances: AvailableMaterialInstance[];
      };
      const byLoc = new Map<string, LocEntry>();
      for (const loc of availableMaterials.otherLocations) {
        const matching = loc.instances.filter((i) => i.model._id === materialTypeId);
        if (matching.length > 0) {
          byLoc.set(loc.location._id, {
            locationName: loc.location.name,
            instances: matching,
          });
        }
      }

      const sorted = Array.from(byLoc.entries()).sort(
        ([, a], [, b]) => b.instances.length - a.instances.length,
      );

      let remaining = need;
      for (const [locId, { locationName, instances }] of sorted) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, instances.length);
        remaining -= take;
        if (!groups.has(locId)) {
          groups.set(locId, { locationName, items: [] });
        }
        groups.get(locId)!.items.push({
          materialTypeId,
          materialTypeName: row.materialTypeName,
          quantity: take,
        });
      }
    }

    return Array.from(groups.entries()).map(([fromLocationId, { locationName, items }]) => ({
      fromLocationId,
      fromLocationName: locationName,
      items,
    }));
  }, [availableMaterials, shortfallByType, materialTypeRows]);

  // ── Destination dropdown: locations accessible to the current user ──
  const userLocations = useMemo(() => {
    const accessible = user?.locations ?? [];
    if (accessible.length === 0) return allLocations;
    return allLocations.filter((loc) => accessible.includes(loc._id));
  }, [allLocations, user?.locations]);

  // ── Destination validation ──
  const destinationConflict =
    destinationLocationId !== "" &&
    shortfallGroups.some((g) => g.fromLocationId === destinationLocationId);

  const canCreateTransfer =
    shortfallGroups.length > 0 &&
    destinationLocationId !== "" &&
    !destinationConflict &&
    !submittingTransfer;

  // ── Instance toggle ──
  const toggleInstance = useCallback(
    (materialTypeId: string, instanceId: string, requiredQty: number) => {
      setSelections((prev) => {
        const current = prev[materialTypeId] ?? [];
        if (current.includes(instanceId)) {
          return {
            ...prev,
            [materialTypeId]: current.filter((id) => id !== instanceId),
          };
        }
        if (current.length >= requiredQty) return prev;
        return { ...prev, [materialTypeId]: [...current, instanceId] };
      });
    },
    [],
  );

  // ── Auto-assign all rows ──
  const autoAssignAll = useCallback(() => {
    const next: Record<string, string[]> = {};
    for (const row of materialTypeRows) {
      next[row.materialTypeId] = row.currentUserInstances
        .filter((i) => i.availability === "available")
        .slice(0, row.quantity)
        .map((i) => i._id);
    }
    setSelections(next);
  }, [materialTypeRows]);

  // ── Prepare (full or partial) ──
  const handlePrepare = async (partial: boolean) => {
    const rows = partial ? fullyAssignedRows : materialTypeRows;
    if (rows.length === 0) return;

    if (partial) {
      const confirmed = await showConfirm({
        title: t("orders.prepare.partialConfirm.title"),
        message: t("orders.prepare.partialConfirm.message", {
          fulfilled: fullyAssignedRows.length,
          total: materialTypeRows.length,
        }),
        confirmText: t("orders.prepare.partialConfirm.confirm"),
        variant: "warning",
      });
      if (!confirmed) return;
    }

    const assignments: AssignMaterialPayload[] = rows.flatMap((row) =>
      (selections[row.materialTypeId] ?? []).map((instanceId) => ({
        materialTypeId: row.materialTypeId,
        materialInstanceId: instanceId,
      })),
    );

    if (assignments.length === 0) {
      showToast(
        "error",
        t("orders.prepare.toasts.noAssignments"),
        t("orders.prepare.toasts.preparationError"),
      );
      return;
    }

    setSubmittingAssign(true);
    try {
      await assignMaterials(requestId, assignments);
      showToast(
        "success",
        t("orders.prepare.toasts.prepared"),
        t("orders.prepare.toasts.preparedTitle"),
      );
      onClose();
      await onSuccess();
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : t("orders.prepare.toasts.prepareFailed"),
        t("orders.prepare.toasts.preparationError"),
      );
    } finally {
      setSubmittingAssign(false);
    }
  };

  // ── Create transfer request(s) for shortfall ──
  const handleCreateTransferRequests = async () => {
    if (!destinationLocationId) {
      showToast("error", t("orders.prepare.toasts.selectDestination"), t("common.validation"));
      return;
    }
    if (destinationConflict) {
      showToast("error", t("orders.prepare.shortfall.destinationConflict"), t("common.validation"));
      return;
    }
    if (shortfallGroups.length === 0) return;

    const destName =
      userLocations.find((l) => l._id === destinationLocationId)?.name ?? destinationLocationId;

    const from = t("orders.prepare.shortfall.from");
    const summary = shortfallGroups
      .map(
        (g) =>
          `• ${from} ${g.fromLocationName}: ${g.items.map((i) => `${i.quantity}× ${i.materialTypeName}`).join(", ")}`,
      )
      .join("\n");

    const confirmed = await showConfirm({
      title: t("orders.prepare.transferConfirm.title", { count: shortfallGroups.length }),
      message: `${t("orders.prepare.transferConfirm.toMessage", { destName })}\n\n${summary}`,
      confirmText: t("orders.prepare.transferConfirm.confirm"),
      variant: "info",
    });
    if (!confirmed) return;

    setSubmittingTransfer(true);
    try {
      await Promise.all(
        shortfallGroups.map((group) =>
          createTransferRequest({
            fromLocationId: group.fromLocationId,
            toLocationId: destinationLocationId,
            items: group.items.map((item) => ({
              modelId: item.materialTypeId,
              quantity: item.quantity,
            })),
            notes: transferNotes || undefined,
          }),
        ),
      );
      showToast(
        "success",
        t("orders.prepare.toasts.transfersCreated", { count: shortfallGroups.length }),
        t("orders.prepare.toasts.transferCreatedTitle"),
      );
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : t("orders.prepare.toasts.transferFailed"),
        t("orders.prepare.toasts.transferError"),
      );
    } finally {
      setSubmittingTransfer(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("orders.prepare.title")}
    >
      <div className="bg-[#1a1a1a] border border-[#333] rounded-[12px] w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333] flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">{t("orders.prepare.title")}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{customerName}</p>
          </div>
          <div className="flex items-center gap-3">
            {!loading && availableMaterials && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  stockSummary.fulfilled === stockSummary.total
                    ? "bg-emerald-500/20 text-emerald-300"
                    : stockSummary.fulfilled > 0
                      ? "bg-yellow-500/20 text-yellow-300"
                      : "bg-red-500/20 text-red-300"
                }`}
              >
                {t("orders.prepare.typesAssigned", {
                  fulfilled: stockSummary.fulfilled,
                  total: stockSummary.total,
                })}
              </span>
            )}
            <button
              className="text-gray-400 hover:text-white transition-colors"
              onClick={onClose}
              aria-label={t("common.close")}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin text-[#FFD700]" size={28} />
              <span className="text-gray-400">{t("orders.prepare.loading")}</span>
            </div>
          )}

          {/* Fetch error */}
          {!loading && fetchError && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 space-y-2">
              <p className="text-sm font-semibold text-red-300">{t("orders.prepare.errorTitle")}</p>
              <p className="text-sm text-red-400">{fetchError}</p>
              <button
                className="text-sm text-[#FFD700] hover:underline"
                onClick={() => void loadData()}
              >
                {t("common.retry")}
              </button>
            </div>
          )}

          {/* Main content */}
          {!loading && !fetchError && availableMaterials && (
            <>
              {/* Auto-assign all toolbar */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{t("orders.prepare.subtitle")}</p>
                <Button
                  size="sm"
                  leftIcon={Zap}
                  onClick={autoAssignAll}
                  className="bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30 hover:bg-[#FFD700]/20"
                >
                  {t("orders.prepare.autoAssignAll")}
                </Button>
              </div>

              {/* Material type assignment cards */}
              <div className="space-y-3">
                {materialTypeRows.map((row) => (
                  <MaterialAssignmentCard
                    key={row.materialTypeId}
                    row={row}
                    selected={selections[row.materialTypeId] ?? []}
                    onToggleInstance={toggleInstance}
                  />
                ))}
              </div>

              {/* Shortfall section */}
              <ShortfallSection
                shortfallByType={shortfallByType}
                shortfallGroups={shortfallGroups}
                materialTypeRows={materialTypeRows}
                userLocations={userLocations}
                destinationLocationId={destinationLocationId}
                onDestinationChange={setDestinationLocationId}
                transferNotes={transferNotes}
                onTransferNotesChange={setTransferNotes}
                destinationConflict={destinationConflict}
                canCreateTransfer={canCreateTransfer}
                submittingTransfer={submittingTransfer}
                onCreateTransferRequests={() => void handleCreateTransferRequests()}
              />
            </>
          )}
        </div>

        {/* ── Action bar ── */}
        {!loading && !fetchError && availableMaterials && (
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#333] flex-shrink-0">
            <button
              className="text-sm text-gray-400 hover:text-white transition-colors"
              onClick={onClose}
              disabled={submittingAssign}
            >
              {t("common.cancel")}
            </button>
            <div className="flex items-center gap-3">
              {canPreparePartial && (
                <Button
                  onClick={() => void handlePrepare(true)}
                  disabled={submittingAssign}
                  className="bg-violet-500/15 text-violet-300 border-violet-500/40 hover:bg-violet-500/25"
                >
                  {submittingAssign
                    ? t("orders.prepare.preparing")
                    : t("orders.prepare.preparePartial", { count: fullyAssignedRows.length })}
                </Button>
              )}
              <Button
                leftIcon={canPrepareAll ? CheckCircle2 : undefined}
                onClick={() => void handlePrepare(false)}
                disabled={submittingAssign || !canPrepareAll}
                className="bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25 disabled:opacity-50"
              >
                {submittingAssign ? t("orders.prepare.preparing") : t("orders.prepare.prepareAll")}
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal />
    </div>
  );
}
