import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  CheckCircle,
  ChevronDown,
  CircleDashed,
  Eye,
  Package,
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
import { getMaterialInstances, getMaterialTypes } from "../../../services/materialService";
import type {
  TransferRequest,
  TransferRequestStatus,
  Transfer,
  TransferStatus,
  CreateTransferRequestPayload,
  TransferRequestItem,
  TransferItem,
  TransferCondition,
  ReceiveTransferItem,
  MaterialInstance,
  MaterialType,
} from "../../../types/api";

// ─── Helpers ───────────────────────────────────────────────────────────────

type ActiveTab = "requests" | "shipments";

const REQUEST_STATUS_LABEL: Record<TransferRequestStatus, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  fulfilled: "Fulfilled",
};

const REQUEST_STATUS_CLASSES: Record<TransferRequestStatus, string> = {
  requested: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  approved: "bg-green-500/15 text-green-400 border-green-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  fulfilled: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const CONDITION_LABEL: Record<TransferCondition, string> = {
  OK: "OK",
  DAMAGED: "Damaged",
  MISSING_PARTS: "Missing Parts",
  DIRTY: "Dirty",
  REPAIR_REQUIRED: "Repair Required",
  LOST: "Lost",
};

const TRANSFER_STATUS_LABEL: Record<TransferStatus, string> = {
  in_transit: "In Transit",
  completed: "Completed",
  cancelled: "Cancelled",
  received: "Received",
};

const TRANSFER_STATUS_CLASSES: Record<TransferStatus, string> = {
  in_transit: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/15 text-green-400 border-green-500/30",
  cancelled: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  received: "bg-green-500/15 text-green-400 border-green-500/30",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function extractInstanceLocationId(instance: MaterialInstance): string | undefined {
  const candidate: unknown = (
    instance as MaterialInstance & {
      locationId?: string | { _id?: string; id?: string };
      location?: { _id?: string; id?: string };
    }
  ).locationId;

  if (typeof candidate === "string") return candidate;
  if (candidate && typeof candidate === "object") {
    const locationObj = candidate as { _id?: string; id?: string };
    return locationObj._id ?? locationObj.id;
  }

  const fallback = (instance as MaterialInstance & { location?: { _id?: string; id?: string } })
    .location;
  return fallback?._id ?? fallback?.id;
}

function getInstanceModelName(instance: MaterialInstance): string {
  const raw = instance as MaterialInstance & {
    model?: string | { _id?: string; name?: string };
    modelId?: string | { _id?: string; name?: string };
  };

  if (raw.model && typeof raw.model === "object" && raw.model.name) {
    return raw.model.name;
  }
  if (raw.modelId && typeof raw.modelId === "object" && raw.modelId.name) {
    return raw.modelId.name;
  }
  return "Unknown material";
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

/** 
 * Enhanced transfer route component with professional styling 
 */
interface TransferRouteProps {
  fromLocation: string;
  toLocation: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}
const TransferRoute: React.FC<TransferRouteProps> = ({ 
  fromLocation, 
  toLocation, 
  className = "",
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'text-xs gap-1.5',
    md: 'text-sm gap-2',
    lg: 'text-base gap-3'
  };

  const locationClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  return (
    <div className={`flex items-center ${sizeClasses[size]} ${className}`}>
      <div className={`${locationClasses[size]} bg-gray-800/60 backdrop-blur-sm border border-gray-600/30 rounded-lg text-gray-200 font-medium whitespace-nowrap transition-colors relative overflow-hidden group`}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="relative z-10">{fromLocation}</span>
      </div>
      
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20">
        <ArrowLeftRight size={iconSizes[size]} className="text-[#FFD700] transform transition-transform group-hover:scale-110" />
      </div>
      
      <div className={`${locationClasses[size]} bg-gray-800/60 backdrop-blur-sm border border-gray-600/30 rounded-lg text-gray-200 font-medium whitespace-nowrap transition-colors relative overflow-hidden group`}>
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="relative z-10">{toLocation}</span>
      </div>
    </div>
  );
};

/**
 * Professional transfer request card with sophisticated design
 */
interface TransferRequestCardProps {
  request: TransferRequest;
  locationName: (id: string) => string;
  onAction?: (request: TransferRequest, action: string) => void;
  actions?: React.ReactNode;
}
const TransferRequestCard: React.FC<TransferRequestCardProps> = ({ 
  request, 
  locationName, 
  actions 
}) => {
  const statusConfig = {
    requested: { icon: CircleDashed, color: 'amber' },
    approved: { icon: CheckCircle, color: 'emerald' },
    rejected: { icon: XCircle, color: 'red' },
    fulfilled: { icon: CheckCircle, color: 'blue' }
  };

  const StatusIcon = statusConfig[request.status]?.icon || CircleDashed;

  return (
    <div className="group relative bg-gradient-to-br from-[#1a1a1a] to-[#161616] border border-[#2a2a2a]/50 rounded-xl p-5 transition-all duration-300 hover:border-[#3a3a3a]/70 hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5">
      {/* Subtle background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header with route and metadata */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <TransferRoute 
              fromLocation={locationName(request.fromLocationId)}
              toLocation={locationName(request.toLocationId)}
              className="mb-3"
              size="md"
            />
            
            {/* Metadata row */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-gray-500">
                <div className="w-1 h-1 bg-gray-500 rounded-full" />
                <span className="font-medium">{request.items.length}</span>
                <span>{request.items.length === 1 ? 'type' : 'types'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <div className="w-1 h-1 bg-gray-500 rounded-full" />
                <span>{formatDate(request.createdAt)}</span>
              </div>
            </div>
          </div>
          
          {/* Status and actions */}
          <div className="flex flex-col items-end gap-3 ml-4">
            <div className="flex items-center gap-1.5">
              <StatusIcon size={14} className={`text-${statusConfig[request.status]?.color || 'gray'}-400`} />
              <StatusBadge
                label={REQUEST_STATUS_LABEL[request.status]}
                className={REQUEST_STATUS_CLASSES[request.status]}
              />
            </div>
            {actions && (
              <div className="transition-all duration-200 opacity-60 group-hover:opacity-100">
                {actions}
              </div>
            )}
          </div>
        </div>
        
        {/* Notes section with enhanced styling */}
        {request.notes && (
          <div className="mt-4 pt-4 border-t border-[#2a2a2a]/50">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-gray-600 rounded-full mt-2 flex-shrink-0" />
              <p className="text-xs text-gray-400 leading-relaxed italic">
                "{request.notes}"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Professional transfer/shipment card with enhanced UX
 */
interface TransferCardProps {
  transfer: Transfer;
  locationName: (id: string) => string;
  actions?: React.ReactNode;
}
const TransferCard: React.FC<TransferCardProps> = ({ 
  transfer, 
  locationName, 
  actions 
}) => {
  const statusConfig = {
    in_transit: { icon: Truck, color: 'blue', bgGradient: 'from-blue-500/5 to-blue-600/10' },
    completed: { icon: CheckCircle, color: 'emerald', bgGradient: 'from-emerald-500/5 to-emerald-600/10' },
    cancelled: { icon: XCircle, color: 'gray', bgGradient: 'from-gray-500/5 to-gray-600/10' },
    received: { icon: CheckCircle, color: 'green', bgGradient: 'from-green-500/5 to-green-600/10' }
  };

  const StatusIcon = statusConfig[transfer.status]?.icon || Truck;
  const bgGradient = statusConfig[transfer.status]?.bgGradient;

  return (
    <div className="group relative bg-gradient-to-br from-[#1a1a1a] to-[#161616] border border-[#2a2a2a]/50 rounded-xl p-5 transition-all duration-300 hover:border-[#3a3a3a]/70 hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5">
      {/* Dynamic background based on status */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none`} />
      
      <div className="relative z-10">
        {/* Header section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-pulse" />
              <span className="text-xs font-medium text-[#FFD700] uppercase tracking-wider">Shipment</span>
            </div>
            
            <TransferRoute 
              fromLocation={locationName(transfer.fromLocationId)}
              toLocation={locationName(transfer.toLocationId)}
              className="mb-3"
              size="md"
            />
            
            {/* Enhanced metadata */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-gray-500">
                <StatusIcon size={12} className={`text-${statusConfig[transfer.status]?.color || 'gray'}-400`} />
                <span className="font-medium">{transfer.items.length}</span>
                <span>{transfer.items.length === 1 ? 'item' : 'items'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <div className="w-1 h-1 bg-gray-500 rounded-full" />
                <span>{formatDate(transfer.createdAt)}</span>
              </div>
            </div>
          </div>
          
          {/* Status and actions */}
          <div className="flex flex-col items-end gap-3 ml-4">
            <StatusBadge
              label={TRANSFER_STATUS_LABEL[transfer.status]}
              className={TRANSFER_STATUS_CLASSES[transfer.status]}
            />
            {actions && (
              <div className="transition-all duration-200 opacity-60 group-hover:opacity-100">
                {actions}
              </div>
            )}
          </div>
        </div>
        
        {/* Enhanced notes section */}
        {transfer.senderNotes && (
          <div className="mt-4 pt-4 border-t border-[#2a2a2a]/50">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-gray-600 rounded-full mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Sender Note</p>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed italic">
                  "{transfer.senderNotes}"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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
  const [requestItems, setRequestItems] = useState<TransferRequestItem[]>([
    { modelId: "", quantity: 1 },
  ]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMaterialTypes({ limit: 100 })
      .then((res) => setMaterialTypes(res.data.materialTypes ?? []))
      .catch(() => {
        /* non-critical */
      });
  }, []);

  const addItem = () => setRequestItems((prev) => [...prev, { modelId: "", quantity: 1 }]);

  const removeItem = (index: number) =>
    setRequestItems((prev) => prev.filter((_, i) => i !== index));

  const updateItem = (index: number, patch: Partial<TransferRequestItem>) =>
    setRequestItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromLocationId || !toLocationId) return;
    if (fromLocationId === toLocationId) {
      showToast("error", "Origin and destination must be different", "Validation Error");
      return;
    }
    const filledItems = requestItems.filter((it) => it.modelId.trim() !== "");
    if (filledItems.length === 0) {
      showToast("error", "Add at least one material item to the request", "Validation Error");
      return;
    }
    setLoading(true);
    try {
      const payload: CreateTransferRequestPayload = {
        fromLocationId,
        toLocationId,
        items: filledItems,
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
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
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

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-400">
                Items <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-xs text-[#FFD700] hover:text-[#FFD700]/80 transition-colors"
              >
                <Plus size={12} />
                Add item
              </button>
            </div>
            <div className="space-y-2">
              {requestItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={item.modelId}
                    onChange={(e) => updateItem(idx, { modelId: e.target.value })}
                    className="flex-1 h-9 px-2 bg-[#0a0a0a] border border-[#222] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all"
                  >
                    <option value="">Select material type</option>
                    {materialTypes.map((mt) => (
                      <option key={mt._id} value={mt._id}>
                        {mt.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(idx, { quantity: Math.max(1, Number(e.target.value)) })
                    }
                    className="w-20 h-9 px-2 bg-[#0a0a0a] border border-[#222] rounded text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all"
                    aria-label={`Quantity for item ${idx + 1}`}
                  />
                  {requestItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
                      aria-label="Remove item"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
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

interface InstancesByType {
  materialTypeId: string;
  materialTypeName: string;
  instances: MaterialInstance[];
}

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
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [selectedItems, setSelectedItems] = useState<TransferItem[]>([]);
  const [senderNotes, setSenderNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [openTypeIds, setOpenTypeIds] = useState<Set<string>>(new Set());
  const [previewFilterType, setPreviewFilterType] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [instancesRes, typesRes] = await Promise.all([
          getMaterialInstances({ status: "available" }),
          getMaterialTypes({ limit: 200 }),
        ]);
        const items = instancesRes.data.instances ?? [];
        const filteredInstances = items.filter(
          (instance) => extractInstanceLocationId(instance) === request.fromLocationId,
        );
        setInstances(filteredInstances);
        setMaterialTypes(typesRes.data.materialTypes ?? []);
        
        // Auto-expand all types by default
        const typeIds = new Set<string>();
        filteredInstances.forEach((inst) => {
          const typeId = getInstanceModelId(inst);
          if (typeId) typeIds.add(typeId);
        });
        setOpenTypeIds(typeIds);
      } catch {
        // silently fall through — user sees empty list
      } finally {
        setFetching(false);
      }
    };
    void fetchData();
  }, [request.fromLocationId]);

  const toggleItem = (instanceId: string) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.instanceId === instanceId);
      if (exists) return prev.filter((i) => i.instanceId !== instanceId);
      return [...prev, { instanceId }];
    });
  };

  const setItemCondition = (instanceId: string, sentCondition: TransferCondition) => {
    setSelectedItems((prev) =>
      prev.map((i) => (i.instanceId === instanceId ? { ...i, sentCondition } : i)),
    );
  };

  const isSelected = (instanceId: string) => selectedItems.some((i) => i.instanceId === instanceId);

  const getItemCondition = (instanceId: string): TransferCondition | "" =>
    selectedItems.find((i) => i.instanceId === instanceId)?.sentCondition ?? "";

  // Helper to extract material type ID from instance
  const getInstanceModelId = (instance: MaterialInstance): string | undefined => {
    const raw = instance as MaterialInstance & {
      model?: string | { _id?: string; id?: string };
      modelId?: string | { _id?: string; id?: string };
    };
    if (raw.model && typeof raw.model === "object") return raw.model._id ?? raw.model.id;
    if (raw.modelId && typeof raw.modelId === "object") return raw.modelId._id ?? raw.modelId.id;
    if (typeof raw.model === "string") return raw.model;
    if (typeof raw.modelId === "string") return raw.modelId;
    return undefined;
  };

  // Group instances by material type
  const instancesByType = useMemo<InstancesByType[]>(() => {
    const groups = new Map<string, MaterialInstance[]>();
    instances.forEach((inst) => {
      const typeId = getInstanceModelId(inst);
      if (!typeId) return;
      if (!groups.has(typeId)) groups.set(typeId, []);
      groups.get(typeId)!.push(inst);
    });

    const result: InstancesByType[] = [];
    groups.forEach((instances, typeId) => {
      const type = materialTypes.find(
        (t) => t._id === typeId || (t as MaterialType & { id?: string }).id === typeId,
      );
      result.push({
        materialTypeId: typeId,
        materialTypeName: type?.name ?? "Unknown Type",
        instances,
      });
    });

    return result.sort((a, b) => a.materialTypeName.localeCompare(b.materialTypeName));
  }, [instances, materialTypes]);

  const toggleTypeExpanded = (typeId: string) => {
    setOpenTypeIds((prev) => {
      const next = new Set(prev);
      if (next.has(typeId)) next.delete(typeId);
      else next.add(typeId);
      return next;
    });
  };

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
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Route summary */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <TransferRoute 
              fromLocation={locationName(request.fromLocationId)}
              toLocation={locationName(request.toLocationId)}
            />
          </div>

          {/* Item selection grouped by material type */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Available Items at Origin{" "}
              <span className="text-[#FFD700]">({selectedItems.length} selected)</span>
            </label>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-[#222] custom-scrollbar">
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
              {!fetching && instancesByType.length > 0 && (
                <div className="divide-y divide-[#1a1a1a]">
                  {instancesByType.map((group) => {
                    const isOpen = openTypeIds.has(group.materialTypeId);
                    const selectedInGroup = group.instances.filter((inst) =>
                      isSelected(inst._id),
                    ).length;
                    return (
                      <div key={group.materialTypeId} className="bg-[#0a0a0a]/50">
                        {/* Material Type Header */}
                        <button
                          type="button"
                          onClick={() => toggleTypeExpanded(group.materialTypeId)}
                          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Package size={14} className="text-[#FFD700]" />
                            <span className="text-sm font-semibold text-white">
                              {group.materialTypeName}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({group.instances.length} available{selectedInGroup > 0 ? `, ${selectedInGroup} selected` : ""})
                            </span>
                          </div>
                          <ChevronDown
                            size={16}
                            className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>

                        {/* Instances List */}
                        {isOpen && (
                          <div className="divide-y divide-[#1a1a1a]/50">
                            {group.instances.map((inst) => {
                              const selected = isSelected(inst._id);
                              return (
                                <div
                                  key={inst._id}
                                  className="px-3 py-2.5 pl-9 hover:bg-white/5 transition-colors"
                                >
                                  <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() => toggleItem(inst._id)}
                                      className="accent-[#FFD700] w-4 h-4 shrink-0"
                                    />
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-sm text-gray-200 font-medium truncate">
                                        {inst.serialNumber}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {getInstanceModelName(inst)}
                                      </span>
                                    </div>
                                  </label>
                                  {selected && (
                                    <div className="mt-2 ml-7">
                                      <select
                                        value={getItemCondition(inst._id)}
                                        onChange={(e) =>
                                          setItemCondition(
                                            inst._id,
                                            e.target.value as TransferCondition,
                                          )
                                        }
                                        className="h-8 px-2 bg-[#0a0a0a] border border-[#222] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all"
                                        aria-label={`Sent condition for ${inst.serialNumber}`}
                                      >
                                        <option value="">Sent condition (optional)</option>
                                        {(Object.keys(CONDITION_LABEL) as TransferCondition[]).map(
                                          (c) => (
                                            <option key={c} value={c}>
                                              {CONDITION_LABEL[c]}
                                            </option>
                                          ),
                                        )}
                                      </select>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
              type="button"
              onClick={() => {
                setPreviewFilterType("");
                setShowPreview(true);
              }}
              disabled={loading || selectedItems.length === 0}
              className="px-5 h-9 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold rounded text-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Eye size={14} />
              Preview & Confirm
            </button>
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[#222]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Eye size={18} className="text-[#FFD700]" />
                Preview Shipment
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-white transition-colors"
                aria-label="Close preview"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
              {/* Route Summary */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                <TransferRoute
                  fromLocation={locationName(request.fromLocationId)}
                  toLocation={locationName(request.toLocationId)}
                />
              </div>

              {/* Filter by Material Type */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-400 whitespace-nowrap">
                  Filter by Type:
                </label>
                <select
                  value={previewFilterType}
                  onChange={(e) => setPreviewFilterType(e.target.value)}
                  className="flex-1 h-9 px-3 bg-[#0a0a0a] border border-[#222] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all"
                >
                  <option value="">All Types ({selectedItems.length} items)</option>
                  {instancesByType
                    .filter((group) =>
                      group.instances.some((inst) => isSelected(inst._id)),
                    )
                    .map((group) => {
                      const count = group.instances.filter((inst) =>
                        isSelected(inst._id),
                      ).length;
                      return (
                        <option key={group.materialTypeId} value={group.materialTypeId}>
                          {group.materialTypeName} ({count})
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Items Summary by Type */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                  {previewFilterType
                    ? `${
                        instancesByType.find((g) => g.materialTypeId === previewFilterType)
                          ?.materialTypeName ?? "Selected Type"
                      } Items`
                    : `All Items to Transfer (${selectedItems.length})`}
                </h3>
                <div className="space-y-3">
                  {instancesByType
                    .filter((group) =>
                      group.instances.some((inst) => isSelected(inst._id)),
                    )
                    .filter((group) =>
                      previewFilterType ? group.materialTypeId === previewFilterType : true,
                    )
                    .map((group) => {
                      const selectedInGroup = group.instances.filter((inst) =>
                        isSelected(inst._id),
                      );
                      return (
                        <div
                          key={group.materialTypeId}
                          className="bg-[#0a0a0a]/80 border border-[#222] rounded-lg p-3"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Package size={14} className="text-[#FFD700]" />
                            <span className="text-sm font-semibold text-white">
                              {group.materialTypeName}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({selectedInGroup.length} {selectedInGroup.length === 1 ? "item" : "items"})
                            </span>
                          </div>
                          <div className="space-y-1.5 ml-5">
                            {selectedInGroup.map((inst) => {
                              const condition = getItemCondition(inst._id);
                              return (
                                <div
                                  key={inst._id}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <span className="text-gray-300">{inst.serialNumber}</span>
                                  {condition && (
                                    <span className="text-gray-500">
                                      {CONDITION_LABEL[condition]}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
                {previewFilterType &&
                  !instancesByType
                    .filter((group) =>
                      group.instances.some((inst) => isSelected(inst._id)),
                    )
                    .some((group) => group.materialTypeId === previewFilterType) && (
                    <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
                      No items selected for this type.
                    </div>
                  )}
              </div>

              {/* Sender Notes */}
              {senderNotes.trim() && (
                <div className="bg-[#0a0a0a]/80 border border-[#222] rounded-lg p-3">
                  <h3 className="text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                    Sender Notes
                  </h3>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{senderNotes}</p>
                </div>
              )}
            </div>

            {/* Confirm Actions */}
            <div className="flex justify-end gap-3 p-5 border-t border-[#222]">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                disabled={loading}
                className="px-4 h-9 rounded text-sm text-gray-400 hover:text-white border border-[#333] hover:border-[#555] transition-all"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-5 h-9 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold rounded text-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={14} />
                {loading ? "Sending…" : "Confirm & Send"}
              </button>
            </div>
          </div>
        </div>
      )}
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
  const [itemConditions, setItemConditions] = useState<Record<string, TransferCondition | "">>(() =>
    Object.fromEntries(transfer.items.map((i) => [i.instanceId, ""])),
  );
  const [loading, setLoading] = useState(false);

  const setCondition = (instanceId: string, condition: TransferCondition | "") => {
    setItemConditions((prev) => ({ ...prev, [instanceId]: condition }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const items: ReceiveTransferItem[] = Object.entries(itemConditions)
        .filter(([, cond]) => cond !== "")
        .map(([instanceId, receivedCondition]) => ({
          instanceId,
          receivedCondition: receivedCondition as TransferCondition,
        }));

      await receiveTransfer(transfer._id, {
        ...(receiverNotes.trim() ? { receiverNotes } : {}),
        ...(items.length > 0 ? { items } : {}),
      });
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
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
<div className="space-y-3">
              <p className="text-sm text-gray-300">
                Confirm receipt of this shipment. All items will be set to{" "}
                <span className="text-green-400 font-medium">available</span> at the destination.
              </p>
              <TransferRoute 
                fromLocation={locationName(transfer.fromLocationId)}
                toLocation={locationName(transfer.toLocationId)}
                className="justify-center"
              />
            </div>

          {/* Per-item condition */}
          {transfer.items.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Received Condition per Item
              </label>
              <div className="rounded-lg border border-[#222] divide-y divide-[#1a1a1a]">
                {transfer.items.map((item) => (
                  <div key={item.instanceId} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="text-sm text-gray-300 font-mono flex-1 truncate">
                      {item.instanceId}
                    </span>
                    <select
                      value={itemConditions[item.instanceId] ?? ""}
                      onChange={(e) =>
                        setCondition(item.instanceId, e.target.value as TransferCondition | "")
                      }
                      className="h-8 px-2 bg-[#0a0a0a] border border-[#222] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all"
                      aria-label={`Received condition for ${item.instanceId}`}
                    >
                      <option value="">Condition (optional)</option>
                      {(Object.keys(CONDITION_LABEL) as TransferCondition[]).map((c) => (
                        <option key={c} value={c}>
                          {CONDITION_LABEL[c]}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

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
  const [showFulfilled, setShowFulfilled] = useState(false);

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
      const res = await getTransferRequests({
        status: requestStatusFilter || undefined,
        fulfilled: showFulfilled,
      });
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
  }, [requestStatusFilter, showFulfilled, showToast]);

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
  const handleRespond = async (requestId: string, status: "approved" | "rejected") => {
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

  const renderRequestActions = (req: TransferRequest) => {
    if (req.status === "requested" && canUpdate) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => void handleRespond(req._id, "approved")}
            title="Approve Request"
            className="group relative flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg text-xs font-medium transition-all duration-200 overflow-hidden"
          >
            <div className="absolute inset-0 bg-emerald-500/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            <CheckCircle size={12} className="relative z-10 transition-transform group-hover:scale-110" />
            <span className="relative z-10">Approve</span>
          </button>
          <button
            onClick={() => void handleRespond(req._id, "rejected")}
            title="Reject Request"
            className="group relative flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-lg text-xs font-medium transition-all duration-200 overflow-hidden"
          >
            <div className="absolute inset-0 bg-red-500/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            <XCircle size={12} className="relative z-10 transition-transform group-hover:scale-110" />
            <span className="relative z-10">Reject</span>
          </button>
        </div>
      );
    }

    if (req.status === "approved" && canCreate) {
      return (
        <button
          onClick={() => setShipmentTarget(req)}
          className="group relative flex items-center gap-1.5 px-3 py-1.5 bg-[#FFD700]/10 hover:bg-[#FFD700]/20 text-[#FFD700] hover:text-[#FFD700]/90 border border-[#FFD700]/30 hover:border-[#FFD700]/50 rounded-lg text-xs font-medium transition-all duration-200 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[#FFD700]/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
          <Truck size={12} className="relative z-10 transition-transform group-hover:scale-110" />
          <span className="relative z-10">Start Shipment</span>
        </button>
      );
    }

    return (
      <div className="text-xs text-gray-600 italic flex items-center gap-1">
        <div className="w-1 h-1 bg-gray-600 rounded-full" />
        <span>No actions available</span>
      </div>
    );
  };

  // ── Render ──
  return (
    <div className="p-6 space-y-6">
{/* Enhanced page header */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-[#FFD700]/20 blur-xl rounded-full" />
                <div className="relative bg-[#FFD700]/10 p-3 rounded-xl border border-[#FFD700]/20">
                  <ArrowLeftRight size={24} className="text-[#FFD700]" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Transfer Management
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-1 h-1 bg-[#FFD700] rounded-full" />
                  <p className="text-sm text-gray-400">Coordinate material movements across locations</p>
                </div>
              </div>
            </div>
            
            {/* Stats summary */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span>Requests: {requests.length}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>Transfers: {transfers.length}</span>
              </div>
            </div>
          </div>
          
          {canCreate && (
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowCreateModal(true)}
                className="group relative h-11 px-6 bg-gradient-to-r from-[#FFD700] to-[#FFC700] hover:from-[#FFD700]/90 hover:to-[#FFC700]/90 text-black font-semibold rounded-xl text-sm transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-98 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
                <div className="relative flex items-center gap-2">
                  <Plus size={16} className="transition-transform group-hover:rotate-90" />
                  <span>New Request</span>
                </div>
              </button>
            </div>
        )}
      </div>

{/* Enhanced tabs with better UX */}
        <div className="relative bg-[#0f0f0f] border border-[#2a2a2a]/50 rounded-xl p-1.5 w-fit backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/5 via-transparent to-[#FFD700]/5 rounded-xl" />
          
          <div className="relative flex gap-1">
            {(["requests", "shipments"] as ActiveTab[]).map((tab) => {
              const isActive = activeTab === tab;
              const labels = {
                requests: { label: "Requests", icon: Send, count: requests.length },
                shipments: { label: "Shipments", icon: Truck, count: transfers.length }
              };
              
              const { label, icon: Icon, count } = labels[tab];
              
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative group px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? "bg-[#FFD700] text-black shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]/50"
                  }`}
                >
                  <Icon size={14} className={`transition-transform ${
                    isActive ? "scale-110" : "group-hover:scale-105"
                  }`} />
                  <span>{label}</span>
                  <div className={`px-1.5 py-0.5 text-xs rounded-full font-semibold ${
                    isActive 
                      ? "bg-black/20 text-black" 
                      : "bg-gray-700/50 text-gray-500 group-hover:bg-gray-600/50"
                  }`}>
                    {count}
                  </div>
                  
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-lg pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
      </div>

      {/* ── Requests tab ── */}
      {activeTab === "requests" && (
        <div className="space-y-4">
{/* Enhanced filters row */}
            <div className="flex items-center justify-between gap-4 p-4 bg-[#0f0f0f]/50 backdrop-blur-sm border border-[#2a2a2a]/30 rounded-xl">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Status filter with enhanced styling */}
                <div className="relative group">
                  <select
                    value={requestStatusFilter}
                    onChange={(e) =>
                      setRequestStatusFilter(e.target.value as TransferRequestStatus | "")
                    }
                    className="h-9 pl-3 pr-10 bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#333]/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 focus:border-[#FFD700] appearance-none transition-all duration-200 hover:border-[#444] min-w-[140px]"
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
                    className="absolute right-3 top-2.5 text-gray-500 pointer-events-none group-hover:text-gray-400 transition-colors"
                  />
                </div>

                {/* Enhanced toggle switch */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={showFulfilled}
                        onChange={(e) => setShowFulfilled(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                        showFulfilled 
                          ? "bg-[#FFD700] shadow-lg shadow-[#FFD700]/25" 
                          : "bg-gray-600/50 border border-gray-500/30"
                      }`}>
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-lg ${
                          showFulfilled ? "translate-x-5" : "translate-x-0"
                        }`} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors font-medium">
                      Include fulfilled
                    </span>
                  </label>
                </div>

                {/* Enhanced refresh button */}
                <button
                  onClick={() => void loadRequests()}
                  disabled={requestsLoading}
                  className="group flex items-center gap-2 h-9 px-4 bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#333]/50 rounded-lg text-sm text-gray-400 hover:text-white hover:border-[#444] transition-all duration-200 disabled:opacity-40 hover:bg-[#222]/50"
                >
                  <RefreshCw size={14} className={`${requestsLoading ? "animate-spin" : "group-hover:rotate-180"} transition-transform duration-500`} />
                  <span className="font-medium">Refresh</span>
                </button>
              </div>
              
              {/* Results counter with enhanced styling */}
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-pulse" />
                <span className="text-gray-400">
                  <span className="font-semibold text-white">{requests.length}</span> 
                  {requests.length === 1 ? ' result' : ' results'}
                </span>
              </div>
          </div>

          {/* Professional empty state */}
          <div className="space-y-6">
            {requestsLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-gray-700 border-t-[#FFD700] rounded-full animate-spin" />
                  <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-[#FFD700]/30 rounded-full animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-gray-400 font-medium">Loading transfer requests</p>
                  <p className="text-xs text-gray-600 mt-1">Please wait while we fetch the latest data</p>
                </div>
              </div>
            ) : requests.length === 0 ? (
              <div className="relative bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] border border-[#2a2a2a]/50 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/[0.02] via-transparent to-[#FFD700]/[0.01]" />
                
                <div className="relative p-12">
                  <div className="flex flex-col items-center text-center max-w-md mx-auto">
                    {/* Enhanced empty state icon */}
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-[#FFD700]/10 blur-2xl rounded-full" />
                      <div className="relative bg-[#1a1a1a] p-6 rounded-2xl border border-[#333]/50">
                        <ArrowLeftRight size={48} className="text-[#FFD700]/60" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-lg font-semibold text-white mb-3">
                      No Transfer Requests Yet
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed mb-6">
                      Transfer requests help you coordinate material movements between warehouse locations. 
                      Create your first request to get started with inventory transfers.
                    </p>
                    
                    {canCreate && (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="group relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#FFD700] to-[#FFC700] hover:from-[#FFD700]/95 hover:to-[#FFC700]/95 text-black font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-98"
                      >
                        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12 rounded-xl" />
                        <Plus size={18} className="relative z-10 transition-transform group-hover:rotate-90" />
                        <span className="relative z-10">Create First Request</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <TransferRequestCard
                    key={req._id}
                    request={req}
                    locationName={locationName}
                    actions={renderRequestActions(req)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Shipments tab ── */}
      {activeTab === "shipments" && (
        <div className="space-y-4">
{/* Enhanced filters for shipments */}
            <div className="flex items-center justify-between gap-4 p-4 bg-[#0f0f0f]/50 backdrop-blur-sm border border-[#2a2a2a]/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <select
                    value={transferStatusFilter}
                    onChange={(e) => setTransferStatusFilter(e.target.value as TransferStatus | "")}
                    className="h-9 pl-3 pr-10 bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#333]/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 focus:border-[#FFD700] appearance-none transition-all duration-200 hover:border-[#444] min-w-[140px]"
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
                    className="absolute right-3 top-2.5 text-gray-500 pointer-events-none group-hover:text-gray-400 transition-colors"
                  />
                </div>
                
                <button
                  onClick={() => void loadTransfers()}
                  disabled={transfersLoading}
                  className="group flex items-center gap-2 h-9 px-4 bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#333]/50 rounded-lg text-sm text-gray-400 hover:text-white hover:border-[#444] transition-all duration-200 disabled:opacity-40 hover:bg-[#222]/50"
                >
                  <RefreshCw size={14} className={`${transfersLoading ? "animate-spin" : "group-hover:rotate-180"} transition-transform duration-500`} />
                  <span className="font-medium">Refresh</span>
                </button>
              </div>
              
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-gray-400">
                  <span className="font-semibold text-white">{transfers.length}</span> 
                  {transfers.length === 1 ? ' transfer' : ' transfers'}
                </span>
              </div>
          </div>

          {/* Cards Grid */}
          <div className="space-y-4">
            {transfersLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <RefreshCw size={20} className="animate-spin mr-2" />
                Loading shipments…
              </div>
            ) : transfers.length === 0 ? (
              <div className="bg-[#111] border border-[#222] rounded-xl">
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
                  <Truck size={32} />
                  <p className="text-sm">No shipments found</p>
                  <p className="text-xs text-gray-600 max-w-md text-center">
                    Shipments represent the actual transportation of materials between locations.
                    They are created from approved transfer requests.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {transfers.map((tr) => (
                  <TransferCard
                    key={tr._id}
                    transfer={tr}
                    locationName={locationName}
                    actions={
                      tr.status === "in_transit" && canUpdate ? (
                        <button
                          onClick={() => setReceiveTarget(tr)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-700/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 border border-green-700/30 rounded-md text-xs font-medium transition-all"
                        >
                          <CheckCircle size={12} />
                          Receive
                        </button>
                      ) : (
                        <span className="text-xs text-gray-600 italic">—</span>
                      )
                    }
                  />
                ))}
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
