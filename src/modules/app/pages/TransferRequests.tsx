import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftRight,
  CheckCircle,
  ChevronDown,
  CircleDashed,
  Plus,
  RefreshCw,
  Send,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import { usePermissions } from "../../../contexts/usePermissions";
import { useToast } from "../../../contexts/ToastContext";
import {
  getTransferRequests,
  createTransferRequest,
  respondToTransferRequest,
  getTransfers,
  createTransfer,
  receiveTransfer,
} from "../../../services/transferService";
import { getLocations, type WarehouseLocation } from "../../../services/warehouseOperatorService";
import { getMaterialInstances } from "../../../services/materialService";
import type {
  TransferRequest,
  TransferRequestStatus,
  Transfer,
  TransferStatus,
  CreateTransferRequestPayload,
  TransferItem,
  MaterialInstance,
} from "../../../types/api";

// ─── Helpers ───────────────────────────────────────────────────────────────

type ActiveTab = "requests" | "shipments";

const REQUEST_STATUS_LABEL: Record<TransferRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const REQUEST_STATUS_CLASSES: Record<TransferRequestStatus, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  approved: "bg-green-500/15 text-green-400 border-green-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  cancelled: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

const TRANSFER_STATUS_LABEL: Record<TransferStatus, string> = {
  in_transit: "In Transit",
  completed: "Completed",
  cancelled: "Cancelled",
};

const TRANSFER_STATUS_CLASSES: Record<TransferStatus, string> = {
  in_transit: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/15 text-green-400 border-green-500/30",
  cancelled: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Sub-components ────────────────────────────────────────────────────────

interface StatusBadgeProps {
  label: string;
  className: string;
}
const StatusBadge: React.FC<StatusBadgeProps> = ({ label, className }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold ${className}`}
  >
    {label}
  </span>
);

// ─── Create Request Modal ──────────────────────────────────────────────────

interface CreateRequestModalProps {
  locations: WarehouseLocation[];
  onClose: () => void;
  onCreated: () => void;
}

const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  locations,
  onClose,
  onCreated,
}) => {
  const { showToast } = useToast();
  const [fromLocationId, setFromLocationId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromLocationId || !toLocationId) return;
    if (fromLocationId === toLocationId) {
      showToast("error", "Origin and destination must be different", "Validation Error");
      return;
    }
    setLoading(true);
    try {
      const payload: CreateTransferRequestPayload = {
        fromLocationId,
        toLocationId,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      };
      await createTransferRequest(payload);
      showToast("success", "Transfer request created successfully", "Success");
      onCreated();
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to create transfer request",
        "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  const availableDestinations = locations.filter((l) => l._id !== fromLocationId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-[#222]">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ArrowLeftRight size={18} className="text-[#FFD700]" />
            New Transfer Request
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* From location */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              From Location <span className="text-red-400">*</span>
            </label>
            <select
              value={fromLocationId}
              onChange={(e) => {
                setFromLocationId(e.target.value);
                if (toLocationId === e.target.value) setToLocationId("");
              }}
              required
              className="w-full h-10 px-3 bg-[#0a0a0a] border border-[#222] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all"
            >
              <option value="">Select origin location</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* To location */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              To Location <span className="text-red-400">*</span>
            </label>
            <select
              value={toLocationId}
              onChange={(e) => setToLocationId(e.target.value)}
              required
              disabled={!fromLocationId}
              className="w-full h-10 px-3 bg-[#0a0a0a] border border-[#222] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all disabled:opacity-40"
            >
              <option value="">Select destination location</option>
              {availableDestinations.map((loc) => (
                <option key={loc._id} value={loc._id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional request notes…"
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 h-9 rounded text-sm text-gray-400 hover:text-white border border-[#333] hover:border-[#555] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !fromLocationId || !toLocationId}
              className="px-5 h-9 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold rounded text-sm transition-all disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Initiate Shipment Modal ───────────────────────────────────────────────

interface InitiateShipmentModalProps {
  request: TransferRequest;
  locationName: (id: string) => string;
  onClose: () => void;
  onCreated: () => void;
}

const InitiateShipmentModal: React.FC<InitiateShipmentModalProps> = ({
  request,
  locationName,
  onClose,
  onCreated,
}) => {
  const { showToast } = useToast();
  const [instances, setInstances] = useState<MaterialInstance[]>([]);
  const [selectedItems, setSelectedItems] = useState<TransferItem[]>([]);
  const [senderNotes, setSenderNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchInstances = async () => {
      try {
        const res = await getMaterialInstances({ status: "available" });
        const items = res.data.instances ?? [];
        setInstances(items.filter((i) => i.locationId === request.fromLocationId));
      } catch {
        // silently fall through — user sees empty list
      } finally {
        setFetching(false);
      }
    };
    void fetchInstances();
  }, [request.fromLocationId]);

  const toggleItem = (instanceId: string) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.instanceId === instanceId);
      if (exists) return prev.filter((i) => i.instanceId !== instanceId);
      return [...prev, { instanceId }];
    });
  };

  const isSelected = (instanceId: string) => selectedItems.some((i) => i.instanceId === instanceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      showToast("error", "Select at least one item to transfer", "Validation");
      return;
    }
    setLoading(true);
    try {
      await createTransfer({
        requestId: request._id,
        fromLocationId: request.fromLocationId,
        toLocationId: request.toLocationId,
        items: selectedItems,
        ...(senderNotes.trim() ? { senderNotes: senderNotes.trim() } : {}),
      });
      showToast("success", "Shipment initiated successfully", "Success");
      onCreated();
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to initiate shipment",
        "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-[#222]">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Truck size={18} className="text-[#FFD700]" />
            Initiate Shipment
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Route summary */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 flex items-center gap-3 text-sm">
            <span className="text-white font-medium">{locationName(request.fromLocationId)}</span>
            <ArrowLeftRight size={14} className="text-[#FFD700] shrink-0" />
            <span className="text-white font-medium">{locationName(request.toLocationId)}</span>
          </div>

          {/* Item selection */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Available Items at Origin{" "}
              <span className="text-gray-500">({selectedItems.length} selected)</span>
            </label>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-[#222] divide-y divide-[#1a1a1a] custom-scrollbar">
              {fetching && (
                <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
                  Loading…
                </div>
              )}
              {!fetching && instances.length === 0 && (
                <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
                  No available items at this location.
                </div>
              )}
              {!fetching &&
                instances.map((inst) => (
                  <label
                    key={inst._id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected(inst._id)}
                      onChange={() => toggleItem(inst._id)}
                      className="accent-[#FFD700] w-4 h-4 shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm text-gray-200 font-medium truncate">
                        {inst.serialNumber}
                      </span>
                      <span className="text-xs text-gray-500">{inst.model.name}</span>
                    </div>
                  </label>
                ))}
            </div>
          </div>

          {/* Sender notes */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Sender Notes</label>
            <textarea
              value={senderNotes}
              onChange={(e) => setSenderNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes from the sender…"
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 h-9 rounded text-sm text-gray-400 hover:text-white border border-[#333] hover:border-[#555] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedItems.length === 0}
              className="px-5 h-9 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold rounded text-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Send size={14} />
              {loading ? "Sending…" : "Send Shipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Receive Transfer Modal ────────────────────────────────────────────────

interface ReceiveTransferModalProps {
  transfer: Transfer;
  locationName: (id: string) => string;
  onClose: () => void;
  onReceived: () => void;
}

const ReceiveTransferModal: React.FC<ReceiveTransferModalProps> = ({
  transfer,
  locationName,
  onClose,
  onReceived,
}) => {
  const { showToast } = useToast();
  const [receiverNotes, setReceiverNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await receiveTransfer(transfer._id, receiverNotes.trim() ? { receiverNotes } : undefined);
      showToast("success", "Transfer marked as received", "Success");
      onReceived();
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to mark transfer as received",
        "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-[#222]">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400" />
            Confirm Receipt
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-gray-300">
            Confirm receipt of shipment from{" "}
            <span className="text-white font-medium">{locationName(transfer.fromLocationId)}</span>{" "}
            to <span className="text-white font-medium">{locationName(transfer.toLocationId)}</span>
            . All items will be set to <span className="text-green-400 font-medium">available</span>{" "}
            at the destination.
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Receiver Notes</label>
            <textarea
              value={receiverNotes}
              onChange={(e) => setReceiverNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes from the receiver…"
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 h-9 rounded text-sm text-gray-400 hover:text-white border border-[#333] hover:border-[#555] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 h-9 bg-green-600 hover:bg-green-500 text-white font-semibold rounded text-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle size={14} />
              {loading ? "Confirming…" : "Mark as Received"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────

const TransferRequests: React.FC = () => {
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();

  const canCreate = hasPermission("transfers:create");
  const canUpdate = hasPermission("transfers:update");

  const [activeTab, setActiveTab] = useState<ActiveTab>("requests");

  // ── State: requests ──
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestStatusFilter, setRequestStatusFilter] = useState<TransferRequestStatus | "">("");

  // ── State: transfers (shipments) ──
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [transfersLoading, setTransfersLoading] = useState(true);
  const [transferStatusFilter, setTransferStatusFilter] = useState<TransferStatus | "">("");

  // ── State: locations (for ID → name lookup) ──
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);

  // ── Modals ──
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [shipmentTarget, setShipmentTarget] = useState<TransferRequest | null>(null);
  const [receiveTarget, setReceiveTarget] = useState<Transfer | null>(null);

  // ── Helpers ──
  const locationName = useCallback(
    (id: string) => locations.find((l) => l._id === id)?.name ?? id,
    [locations],
  );

  // ── Loaders ──
  const loadLocations = useCallback(async () => {
    try {
      const res = await getLocations();
      setLocations(res.data.items ?? []);
    } catch {
      // non-critical
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const res = await getTransferRequests(
        requestStatusFilter ? { status: requestStatusFilter } : undefined,
      );
      setRequests(res.data.requests ?? []);
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to load transfer requests",
        "Error",
      );
    } finally {
      setRequestsLoading(false);
    }
  }, [requestStatusFilter, showToast]);

  const loadTransfers = useCallback(async () => {
    setTransfersLoading(true);
    try {
      const res = await getTransfers();
      const all = res.data.transfers ?? [];
      const filtered = transferStatusFilter
        ? all.filter((t) => t.status === transferStatusFilter)
        : all;
      setTransfers(filtered);
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to load shipments", "Error");
    } finally {
      setTransfersLoading(false);
    }
  }, [transferStatusFilter, showToast]);

  useEffect(() => {
    void loadLocations();
  }, [loadLocations]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    void loadTransfers();
  }, [loadTransfers]);

  // ── Request actions ──
  const handleRespond = async (
    requestId: string,
    status: "approved" | "rejected" | "cancelled",
  ) => {
    try {
      await respondToTransferRequest(requestId, { status });
      showToast("success", `Request ${status} successfully`, "Success");
      void loadRequests();
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error ? err.message : `Failed to ${status} request`,
        "Error",
      );
    }
  };

  // ── Render helpers ──
  const renderRequestActions = (req: TransferRequest) => {
    if (req.status === "pending" && canUpdate) {
      return (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => void handleRespond(req._id, "approved")}
            title="Approve"
            className="flex items-center gap-1 px-2.5 h-7 bg-green-700/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 border border-green-700/30 rounded text-xs font-medium transition-all"
          >
            <CheckCircle size={12} />
            Approve
          </button>
          <button
            onClick={() => void handleRespond(req._id, "rejected")}
            title="Reject"
            className="flex items-center gap-1 px-2.5 h-7 bg-red-700/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-700/30 rounded text-xs font-medium transition-all"
          >
            <XCircle size={12} />
            Reject
          </button>
          <button
            onClick={() => void handleRespond(req._id, "cancelled")}
            title="Cancel"
            className="flex items-center gap-1 px-2.5 h-7 bg-gray-700/20 hover:bg-gray-600/30 text-gray-400 hover:text-gray-300 border border-gray-600/30 rounded text-xs font-medium transition-all"
          >
            <X size={12} />
            Cancel
          </button>
        </div>
      );
    }

    if (req.status === "approved" && canCreate) {
      return (
        <button
          onClick={() => setShipmentTarget(req)}
          className="flex items-center gap-1 px-2.5 h-7 bg-[#FFD700]/15 hover:bg-[#FFD700]/25 text-[#FFD700] border border-[#FFD700]/30 rounded text-xs font-medium transition-all"
        >
          <Truck size={12} />
          Initiate Shipment
        </button>
      );
    }

    return <span className="text-xs text-gray-600 italic">No actions</span>;
  };

  // ── Render ──
  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ArrowLeftRight size={26} className="text-[#FFD700]" />
            Transfer Requests
          </h1>
          <p className="text-sm text-gray-400 mt-1">Manage material transfers between locations</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 h-10 px-5 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold rounded text-sm transition-all shadow-md hover:shadow-lg active:scale-95 shrink-0"
          >
            <Plus size={16} />
            New Request
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111] border border-[#222] rounded-lg p-1 w-fit">
        {(["requests", "shipments"] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded text-sm font-medium transition-all capitalize ${
              activeTab === tab
                ? "bg-[#FFD700] text-black shadow"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab === "requests" ? "Transfer Requests" : "Shipments"}
          </button>
        ))}
      </div>

      {/* ── Requests tab ── */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {/* Filters row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <select
                value={requestStatusFilter}
                onChange={(e) =>
                  setRequestStatusFilter(e.target.value as TransferRequestStatus | "")
                }
                className="h-9 pl-3 pr-8 bg-[#111] border border-[#2a2a2a] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] appearance-none"
              >
                <option value="">All statuses</option>
                {(Object.keys(REQUEST_STATUS_LABEL) as TransferRequestStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {REQUEST_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-2.5 text-gray-500 pointer-events-none"
              />
            </div>
            <button
              onClick={() => void loadRequests()}
              disabled={requestsLoading}
              className="flex items-center gap-1.5 h-9 px-3 bg-[#111] border border-[#2a2a2a] rounded text-sm text-gray-400 hover:text-white transition-all disabled:opacity-40"
            >
              <RefreshCw size={14} className={requestsLoading ? "animate-spin" : ""} />
              Refresh
            </button>
            <span className="ml-auto text-xs text-gray-500">{requests.length} result(s)</span>
          </div>

          {/* Table */}
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            {requestsLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <RefreshCw size={20} className="animate-spin mr-2" />
                Loading requests…
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
                <CircleDashed size={32} />
                <p className="text-sm">No transfer requests found</p>
                {canCreate && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="text-[#FFD700] hover:underline text-sm"
                  >
                    Create the first request
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#1a1a1a] text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">From</th>
                      <th className="px-4 py-3">To</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Notes</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {requests.map((req) => (
                      <tr key={req._id} className="hover:bg-white/3 transition-colors group">
                        <td className="px-4 py-3 text-gray-200 font-medium whitespace-nowrap">
                          {locationName(req.fromLocationId)}
                        </td>
                        <td className="px-4 py-3 text-gray-200 whitespace-nowrap">
                          {locationName(req.toLocationId)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            label={REQUEST_STATUS_LABEL[req.status]}
                            className={REQUEST_STATUS_CLASSES[req.status]}
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-400 max-w-[200px] truncate">
                          {req.notes ?? <span className="text-gray-600 italic">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                          {formatDate(req.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">{renderRequestActions(req)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Shipments tab ── */}
      {activeTab === "shipments" && (
        <div className="space-y-4">
          {/* Filters row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <select
                value={transferStatusFilter}
                onChange={(e) => setTransferStatusFilter(e.target.value as TransferStatus | "")}
                className="h-9 pl-3 pr-8 bg-[#111] border border-[#2a2a2a] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] appearance-none"
              >
                <option value="">All statuses</option>
                {(Object.keys(TRANSFER_STATUS_LABEL) as TransferStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {TRANSFER_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-2.5 text-gray-500 pointer-events-none"
              />
            </div>
            <button
              onClick={() => void loadTransfers()}
              disabled={transfersLoading}
              className="flex items-center gap-1.5 h-9 px-3 bg-[#111] border border-[#2a2a2a] rounded text-sm text-gray-400 hover:text-white transition-all disabled:opacity-40"
            >
              <RefreshCw size={14} className={transfersLoading ? "animate-spin" : ""} />
              Refresh
            </button>
            <span className="ml-auto text-xs text-gray-500">{transfers.length} result(s)</span>
          </div>

          {/* Table */}
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            {transfersLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <RefreshCw size={20} className="animate-spin mr-2" />
                Loading shipments…
              </div>
            ) : transfers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
                <Truck size={32} />
                <p className="text-sm">No shipments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#1a1a1a] text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">From</th>
                      <th className="px-4 py-3">To</th>
                      <th className="px-4 py-3">Items</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Sender Notes</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {transfers.map((tr) => (
                      <tr key={tr._id} className="hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3 text-gray-200 font-medium whitespace-nowrap">
                          {locationName(tr.fromLocationId)}
                        </td>
                        <td className="px-4 py-3 text-gray-200 whitespace-nowrap">
                          {locationName(tr.toLocationId)}
                        </td>
                        <td className="px-4 py-3 text-gray-400">{tr.items.length} item(s)</td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            label={TRANSFER_STATUS_LABEL[tr.status]}
                            className={TRANSFER_STATUS_CLASSES[tr.status]}
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-400 max-w-[180px] truncate">
                          {tr.senderNotes ?? <span className="text-gray-600 italic">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                          {formatDate(tr.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {tr.status === "in_transit" && canUpdate ? (
                            <button
                              onClick={() => setReceiveTarget(tr)}
                              className="flex items-center gap-1 px-2.5 h-7 bg-green-700/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 border border-green-700/30 rounded text-xs font-medium transition-all"
                            >
                              <CheckCircle size={12} />
                              Receive
                            </button>
                          ) : (
                            <span className="text-xs text-gray-600 italic">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showCreateModal && (
        <CreateRequestModal
          locations={locations}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            void loadRequests();
          }}
        />
      )}

      {shipmentTarget && (
        <InitiateShipmentModal
          request={shipmentTarget}
          locationName={locationName}
          onClose={() => setShipmentTarget(null)}
          onCreated={() => {
            setShipmentTarget(null);
            void loadTransfers();
            void loadRequests();
            setActiveTab("shipments");
          }}
        />
      )}

      {receiveTarget && (
        <ReceiveTransferModal
          transfer={receiveTarget}
          locationName={locationName}
          onClose={() => setReceiveTarget(null)}
          onReceived={() => {
            setReceiveTarget(null);
            void loadTransfers();
          }}
        />
      )}
    </div>
  );
};

export default TransferRequests;
