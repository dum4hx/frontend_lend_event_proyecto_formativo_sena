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
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Package as PackageIcon,
  X,
  Zap,
} from "lucide-react";
import Button from "../../../components/ui/Button";
import { useConfirmModal } from "../../../hooks/useConfirmModal";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/useAuth";
import { getAvailableMaterials, assignMaterials } from "../../../services/loanService";
import { createTransferRequest } from "../../../services/transferService";
import { getLocations, type WarehouseLocation } from "../../../services/warehouseOperatorService";
import type {
  AvailableMaterialInstance,
  AvailableMaterialsResponse,
  AssignMaterialPayload,
} from "../../../types/api";

// ─── Local types ─────────────────────────────────────────────────────────────

/** A single material type required by the order. */
interface RequiredMaterialTypeEntry {
  materialTypeId: string;
  materialTypeName: string;
  quantity: number;
}

interface MaterialTypeRow extends RequiredMaterialTypeEntry {
  currentUserInstances: AvailableMaterialInstance[];
}

interface ShortfallGroup {
  fromLocationId: string;
  fromLocationName: string;
  items: Array<{
    materialTypeId: string;
    materialTypeName: string;
    quantity: number;
  }>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PrepareOrderModalProps {
  /** Whether the modal is open. */
  isOpen: boolean;
  /** The loan request ID to prepare. */
  requestId: string;
  /** Customer display name shown in the header. */
  customerName: string;
  /**
   * Pre-computed list of material types required by the order (with quantities).
   * The parent is responsible for expanding package items before passing this.
   */
  requiredMaterialTypes: RequiredMaterialTypeEntry[];
  /** Close without any action. */
  onClose: () => void;
  /** Called after a successful preparation so the parent can refresh. */
  onSuccess: () => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

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
      setFetchError(
        err instanceof Error ? err.message : "Failed to load available materials. Please retry.",
      );
    } finally {
      setLoading(false);
    }
  }, [requestId]);

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

      // Collect other-location instances for this type, sorted by count desc
      type LocEntry = { locationName: string; instances: AvailableMaterialInstance[] };
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
        groups
          .get(locId)!
          .items.push({ materialTypeId, materialTypeName: row.materialTypeName, quantity: take });
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
          return { ...prev, [materialTypeId]: current.filter((id) => id !== instanceId) };
        }
        if (current.length >= requiredQty) return prev; // cap at required qty
        return { ...prev, [materialTypeId]: [...current, instanceId] };
      });
    },
    [],
  );

  // ── Auto-assign available instances for a single row ──
  const autoAssignRow = useCallback((row: MaterialTypeRow) => {
    const available = row.currentUserInstances
      .filter((i) => i.availability === "available")
      .slice(0, row.quantity);
    setSelections((prev) => ({
      ...prev,
      [row.materialTypeId]: available.map((i) => i._id),
    }));
  }, []);

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
        title: "Partial Preparation",
        message: `Only ${fullyAssignedRows.length} of ${materialTypeRows.length} material type(s) will be assigned — the others are not fully stocked. The order will still move to "ready" with the assigned items. Continue?`,
        confirmText: "Prepare Partially",
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
      showToast("error", "No assignments to submit.", "Preparation Error");
      return;
    }

    setSubmittingAssign(true);
    try {
      await assignMaterials(requestId, assignments);
      showToast("success", "Order prepared and moved to ready status.", "Order Prepared");
      onClose();
      await onSuccess();
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to prepare order.",
        "Preparation Error",
      );
    } finally {
      setSubmittingAssign(false);
    }
  };

  // ── Create transfer request(s) for shortfall ──
  const handleCreateTransferRequests = async () => {
    if (!destinationLocationId) {
      showToast("error", "Please select a destination location.", "Validation");
      return;
    }
    if (destinationConflict) {
      showToast("error", "Destination cannot be the same as a source location.", "Validation");
      return;
    }
    if (shortfallGroups.length === 0) return;

    const destName =
      userLocations.find((l) => l._id === destinationLocationId)?.name ?? destinationLocationId;

    const summary = shortfallGroups
      .map(
        (g) =>
          `• From ${g.fromLocationName}: ${g.items.map((i) => `${i.quantity}× ${i.materialTypeName}`).join(", ")}`,
      )
      .join("\n");

    const confirmed = await showConfirm({
      title: `Create ${shortfallGroups.length} Transfer Request${shortfallGroups.length > 1 ? "s" : ""}`,
      message: `Transfer to ${destName}:\n\n${summary}`,
      confirmText: "Create Requests",
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
        `${shortfallGroups.length} transfer request${shortfallGroups.length > 1 ? "s" : ""} created.`,
        "Transfer Requests Created",
      );
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to create transfer request.",
        "Transfer Error",
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
      aria-label="Prepare Order"
    >
      <div className="bg-[#1a1a1a] border border-[#333] rounded-[12px] w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333] flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Prepare Order</h2>
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
                {stockSummary.fulfilled}/{stockSummary.total} types assigned
              </span>
            )}
            <button
              className="text-gray-400 hover:text-white transition-colors"
              onClick={onClose}
              aria-label="Close modal"
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
              <span className="text-gray-400">Loading available materials…</span>
            </div>
          )}

          {/* Fetch error */}
          {!loading && fetchError && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 space-y-2">
              <p className="text-sm font-semibold text-red-300">
                Failed to load available materials
              </p>
              <p className="text-sm text-red-400">{fetchError}</p>
              <button
                className="text-sm text-[#FFD700] hover:underline"
                onClick={() => void loadData()}
              >
                Retry
              </button>
            </div>
          )}

          {/* Main content */}
          {!loading && !fetchError && availableMaterials && (
            <>
              {/* Auto-assign all toolbar */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Select instances to assign per material type.
                </p>
                <Button
                  size="sm"
                  leftIcon={Zap}
                  onClick={autoAssignAll}
                  className="bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30 hover:bg-[#FFD700]/20"
                >
                  Auto-assign All Available
                </Button>
              </div>

              {/* Material type assignment cards */}
              <div className="space-y-3">
                {materialTypeRows.map((row) => {
                  const selected = selections[row.materialTypeId] ?? [];
                  const isFulfilled = selected.length >= row.quantity;

                  return (
                    <div
                      key={row.materialTypeId}
                      className={`rounded-lg border p-4 transition-colors ${
                        isFulfilled
                          ? "border-emerald-500/40 bg-emerald-500/5"
                          : "border-[#444] bg-[#121212]"
                      }`}
                    >
                      {/* Row header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {isFulfilled ? (
                            <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                          ) : (
                            <PackageIcon size={15} className="text-gray-500 flex-shrink-0" />
                          )}
                          <span className="font-semibold text-white text-sm">
                            {row.materialTypeName}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              isFulfilled
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-gray-700 text-gray-400"
                            }`}
                          >
                            {selected.length}/{row.quantity}
                          </span>
                        </div>
                        <button
                          className="text-xs text-[#FFD700] hover:underline flex items-center gap-1 flex-shrink-0"
                          onClick={() => autoAssignRow(row)}
                        >
                          <Zap size={10} />
                          Auto-assign
                        </button>
                      </div>

                      {/* Instance badges */}
                      {row.currentUserInstances.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">
                          No instances in your accessible locations.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {row.currentUserInstances.map((inst) => {
                            const isSelected = selected.includes(inst._id);
                            const isCapReached = !isSelected && selected.length >= row.quantity;
                            const isAvailNow = inst.availability === "available";

                            return (
                              <button
                                key={inst._id}
                                onClick={() =>
                                  toggleInstance(row.materialTypeId, inst._id, row.quantity)
                                }
                                disabled={isCapReached}
                                aria-pressed={isSelected}
                                title={`${inst.serialNumber} — ${inst.availability}`}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                  isSelected
                                    ? isAvailNow
                                      ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
                                      : "bg-blue-500/20 border-blue-500/60 text-blue-300"
                                    : isCapReached
                                      ? "opacity-40 cursor-not-allowed bg-[#1a1a1a] border-[#333] text-gray-500"
                                      : isAvailNow
                                        ? "bg-[#1a1a1a] border-[#444] text-gray-300 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                                        : "bg-[#1a1a1a] border-[#444] text-gray-400 hover:border-blue-500/50 hover:bg-blue-500/5"
                                }`}
                              >
                                <span>{inst.serialNumber}</span>
                                <span
                                  className={`text-[10px] px-1 py-0.5 rounded ${
                                    isAvailNow
                                      ? "bg-[#FFD700]/20 text-[#FFD700]"
                                      : "bg-gray-700/80 text-gray-400"
                                  }`}
                                >
                                  {isAvailNow ? "available" : "upcoming"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Shortfall section ── */}
              {shortfallByType.size > 0 && (
                <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/5 p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={15} className="text-yellow-400 flex-shrink-0" />
                    <h3 className="font-semibold text-yellow-300 text-sm">
                      Insufficient Local Stock
                    </h3>
                  </div>
                  <p className="text-sm text-yellow-200/70">
                    {shortfallByType.size} material type(s) cannot be fully fulfilled from your
                    accessible locations.
                  </p>

                  {/* Shortfall summary per type */}
                  <div className="space-y-1">
                    {Array.from(shortfallByType.entries()).map(([typeId, need]) => {
                      const row = materialTypeRows.find((r) => r.materialTypeId === typeId);
                      return (
                        <div key={typeId} className="flex items-center gap-2 text-sm">
                          <span className="text-gray-300">{row?.materialTypeName ?? typeId}</span>
                          <ArrowRight size={12} className="text-gray-500 flex-shrink-0" />
                          <span className="text-red-400">{need} more needed</span>
                        </div>
                      );
                    })}
                  </div>

                  {shortfallGroups.length > 0 ? (
                    <>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Suggested transfer sources
                      </p>
                      <div className="space-y-2">
                        {shortfallGroups.map((group) => (
                          <div
                            key={group.fromLocationId}
                            className="flex items-start gap-3 bg-[#121212] rounded-lg px-3 py-2 text-sm"
                          >
                            <span className="text-gray-500 text-xs mt-0.5 flex-shrink-0">From</span>
                            <div>
                              <span className="text-white font-medium">
                                {group.fromLocationName}
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {group.items.map((item) => (
                                  <span
                                    key={item.materialTypeId}
                                    className="text-xs bg-[#333] text-gray-300 px-2 py-0.5 rounded"
                                  >
                                    {item.quantity}× {item.materialTypeName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Destination & notes */}
                      <div className="space-y-3 pt-3 border-t border-yellow-500/20">
                        <div>
                          <label
                            htmlFor="transfer-destination"
                            className="block text-sm font-medium text-gray-300 mb-1"
                          >
                            Destination Location{" "}
                            <span className="text-red-400" aria-hidden="true">
                              *
                            </span>
                          </label>
                          <select
                            id="transfer-destination"
                            value={destinationLocationId}
                            onChange={(e) => setDestinationLocationId(e.target.value)}
                            className="w-full px-3 py-2 bg-[#121212] border border-[#444] rounded-lg text-white focus:outline-none focus:border-[#FFD700] transition-colors text-sm"
                          >
                            <option value="">Select destination…</option>
                            {userLocations.map((loc) => (
                              <option key={loc._id} value={loc._id}>
                                {loc.name}
                              </option>
                            ))}
                          </select>
                          {destinationConflict && (
                            <p className="text-xs text-red-400 mt-1">
                              Destination cannot be the same as a source location.
                            </p>
                          )}
                          {destinationLocationId === "" && shortfallGroups.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Required to create the transfer request.
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="transfer-notes"
                            className="block text-sm font-medium text-gray-300 mb-1"
                          >
                            Notes <span className="text-gray-500 font-normal">(optional)</span>
                          </label>
                          <textarea
                            id="transfer-notes"
                            value={transferNotes}
                            onChange={(e) => setTransferNotes(e.target.value)}
                            rows={2}
                            maxLength={500}
                            placeholder="Reason or context for the transfer…"
                            className="w-full px-3 py-2 bg-[#121212] border border-[#444] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-colors text-sm resize-none"
                          />
                        </div>

                        <Button
                          leftIcon={ArrowLeftRight}
                          onClick={() => void handleCreateTransferRequests()}
                          disabled={!canCreateTransfer}
                          className="bg-yellow-500/15 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/25 disabled:opacity-50"
                        >
                          {submittingTransfer
                            ? "Creating…"
                            : `Create Transfer Request${shortfallGroups.length > 1 ? "s" : ""} (${shortfallGroups.length})`}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-yellow-200/60 italic">
                      No other warehouse locations have the required instances available.
                    </p>
                  )}
                </div>
              )}
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
              Cancel
            </button>
            <div className="flex items-center gap-3">
              {canPreparePartial && (
                <Button
                  onClick={() => void handlePrepare(true)}
                  disabled={submittingAssign}
                  className="bg-violet-500/15 text-violet-300 border-violet-500/40 hover:bg-violet-500/25"
                >
                  {submittingAssign
                    ? "Preparing…"
                    : `Prepare Available (${fullyAssignedRows.length} type${fullyAssignedRows.length !== 1 ? "s" : ""})`}
                </Button>
              )}
              <Button
                leftIcon={canPrepareAll ? CheckCircle2 : undefined}
                onClick={() => void handlePrepare(false)}
                disabled={submittingAssign || !canPrepareAll}
                className="bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25 disabled:opacity-50"
              >
                {submittingAssign ? "Preparing…" : "Prepare All"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal />
    </div>
  );
}
