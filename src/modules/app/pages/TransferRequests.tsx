import React, { useCallback, useEffect, useState } from "react";
import { useLanguage } from "../../../contexts/useLanguage";
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

const getRequestStatusLabel = (status: TransferRequestStatus, isEs: boolean): string => {
  const labels: Record<TransferRequestStatus, string> = {
    requested: isEs ? "Solicitado" : "Requested",
    approved: isEs ? "Aprobado" : "Approved",
    rejected: isEs ? "Rechazado" : "Rejected",
    fulfilled: isEs ? "Cumplido" : "Fulfilled",
  };
  return labels[status];
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

const getConditionLabel = (condition: TransferCondition, isEs: boolean): string => {
  const labels: Record<TransferCondition, string> = {
    OK: "OK",
    DAMAGED: isEs ? "Dañado" : "Damaged",
    MISSING_PARTS: isEs ? "Piezas Faltantes" : "Missing Parts",
    DIRTY: isEs ? "Sucio" : "Dirty",
    REPAIR_REQUIRED: isEs ? "Reparación Requerida" : "Repair Required",
    LOST: isEs ? "Perdido" : "Lost",
  };
  return labels[condition];
};

const TRANSFER_STATUS_LABEL: Record<TransferStatus, string> = {
  in_transit: "In Transit",
  completed: "Completed",
  cancelled: "Cancelled",
  received: "Received",
};

const getTransferStatusLabel = (status: TransferStatus, isEs: boolean): string => {
  const labels: Record<TransferStatus, string> = {
    in_transit: isEs ? "En Tránsito" : "In Transit",
    completed: isEs ? "Completado" : "Completed",
    cancelled: isEs ? "Cancelado" : "Cancelled",
    received: isEs ? "Recibido" : "Received",
  };
  return labels[status];
};

const TRANSFER_STATUS_CLASSES: Record<TransferStatus, string> = {
  in_transit: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/15 text-green-400 border-green-500/30",
  cancelled: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  received: "bg-green-500/15 text-green-400 border-green-500/30",
};

function formatDate(iso: string, isEs: boolean): string {
  return new Date(iso).toLocaleDateString(isEs ? "es-CO" : "en-US", {
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

function getInstanceModelName(instance: MaterialInstance, isEs: boolean): string {
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
  return isEs ? "Material desconocido" : "Unknown material";
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

// ─── Transfer Route Component ──────────────────────────────────────────────

interface TransferRouteProps {
  fromLocation: string;
  toLocation: string;
}

const TransferRoute: React.FC<TransferRouteProps> = ({ fromLocation, toLocation }) => (
  <div className="flex items-center gap-3 text-sm">
    <span className="text-white font-medium">{fromLocation}</span>
    <ArrowLeftRight size={14} className="text-[#FFD700] shrink-0" />
    <span className="text-white font-medium">{toLocation}</span>
  </div>
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
  const { language } = useLanguage();
  const isEs = language === "es";
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
      showToast("error", isEs ? "El origen y el destino deben ser diferentes" : "Origin and destination must be different", isEs ? "Error de Validación" : "Validation Error");
      return;
    }
    const filledItems = requestItems.filter((it) => it.modelId.trim() !== "");
    if (filledItems.length === 0) {
      showToast("error", isEs ? "Agrega al menos un artículo a la solicitud" : "Add at least one material item to the request", isEs ? "Error de Validación" : "Validation Error");
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
      showToast("success", isEs ? "Solicitud de transferencia creada exitosamente" : "Transfer request created successfully", isEs ? "Éxito" : "Success");
      onCreated();
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error ? err.message : (isEs ? "Error al crear la solicitud de transferencia" : "Failed to create transfer request"),
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
            {isEs ? "Nueva Solicitud de Transferencia" : "New Transfer Request"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
            aria-label={isEs ? "Cerrar" : "Close"}
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
          {/* From location */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              {isEs ? "Ubicación de Origen" : "From Location"} <span className="text-red-400">*</span>
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
              <option value="">{isEs ? "Seleccionar ubicación de origen" : "Select origin location"}</option>
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
              {isEs ? "Ubicación de Destino" : "To Location"} <span className="text-red-400">*</span>
            </label>
            <select
              value={toLocationId}
              onChange={(e) => setToLocationId(e.target.value)}
              required
              disabled={!fromLocationId}
              className="w-full h-10 px-3 bg-[#0a0a0a] border border-[#222] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all disabled:opacity-40"
            >
              <option value="">{isEs ? "Seleccionar ubicación de destino" : "Select destination location"}</option>
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
                {isEs ? "Artículos" : "Items"} <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-xs text-[#FFD700] hover:text-[#FFD700]/80 transition-colors"
              >
                <Plus size={12} />
                {isEs ? "Agregar artículo" : "Add item"}
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
                    <option value="">{isEs ? "Seleccionar tipo de material" : "Select material type"}</option>
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
                    aria-label={isEs ? `Cantidad para artículo ${idx + 1}` : `Quantity for item ${idx + 1}`}
                  />
                  {requestItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
                      aria-label={isEs ? "Eliminar artículo" : "Remove item"}
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
            <label className="block text-xs font-medium text-gray-400 mb-1.5">{isEs ? "Notas" : "Notes"}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={isEs ? "Notas opcionales de la solicitud…" : "Optional request notes…"}
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
              {isEs ? "Cancelar" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading || !fromLocationId || !toLocationId}
              className="px-5 h-9 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold rounded text-sm transition-all disabled:opacity-50"
            >
              {loading ? (isEs ? "Creando…" : "Creating…") : (isEs ? "Crear Solicitud" : "Create Request")}
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
  const { language } = useLanguage();
  const isEs = language === "es";
  const [instances, setInstances] = useState<MaterialInstance[]>([]);
  const [selectedItems, setSelectedItems] = useState<TransferItem[]>([]);
  const [senderNotes, setSenderNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFilterType, setPreviewFilterType] = useState<string>("");

  useEffect(() => {
    const fetchInstances = async () => {
      try {
        const res = await getMaterialInstances({ status: "available" });
        const items = res.data.instances ?? [];
        setInstances(
          items.filter(
            (instance) => extractInstanceLocationId(instance) === request.fromLocationId,
          ),
        );
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

  const setItemCondition = (instanceId: string, sentCondition: TransferCondition) => {
    setSelectedItems((prev) =>
      prev.map((i) => (i.instanceId === instanceId ? { ...i, sentCondition } : i)),
    );
  };

  const isSelected = (instanceId: string) => selectedItems.some((i) => i.instanceId === instanceId);

  const getItemCondition = (instanceId: string): TransferCondition | "" =>
    selectedItems.find((i) => i.instanceId === instanceId)?.sentCondition ?? "";

  // Group instances by material type for preview
  const instancesByType = React.useMemo(() => {
    const groups = new Map<string, { materialTypeId: string; materialTypeName: string; instances: MaterialInstance[] }>();
    
    instances.forEach((inst) => {
      const typeId = inst.model?._id ?? "unknown";
      const typeName = getInstanceModelName(inst, isEs);
      
      if (!groups.has(typeId)) {
        groups.set(typeId, {
          materialTypeId: typeId,
          materialTypeName: typeName,
          instances: [],
        });
      }
      groups.get(typeId)!.instances.push(inst);
    });
    
    return Array.from(groups.values());
  }, [instances, isEs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      showToast("error", isEs ? "Selecciona al menos un artículo para transferir" : "Select at least one item to transfer", isEs ? "Validación" : "Validation");
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
      showToast("success", isEs ? "Envío iniciado exitosamente" : "Shipment initiated successfully", isEs ? "Éxito" : "Success");
      onCreated();
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error ? err.message : (isEs ? "Error al iniciar el envío" : "Failed to initiate shipment"),
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
            {isEs ? "Iniciar Envío" : "Initiate Shipment"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
            aria-label={isEs ? "Cerrar" : "Close"}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Route summary */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 flex items-center gap-3 text-sm">
            <span className="text-white font-medium">{locationName(request.fromLocationId)}</span>
            <ArrowLeftRight size={14} className="text-[#FFD700] shrink-0" />
            <span className="text-white font-medium">{locationName(request.toLocationId)}</span>
          </div>

          {/* Item selection */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              {isEs ? "Artículos Disponibles en Origen" : "Available Items at Origin"}{" "}
              <span className="text-gray-500">
                ({selectedItems.length} {isEs ? "seleccionado(s)" : "selected"})
              </span>
            </label>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-[#222] divide-y divide-[#1a1a1a] custom-scrollbar">
              {fetching && (
                <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
                  {isEs ? "Cargando…" : "Loading…"}
                </div>
              )}
              {!fetching && instances.length === 0 && (
                <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
                  {isEs
                    ? "No hay artículos disponibles en esta ubicación."
                    : "No available items at this location."}
                </div>
              )}
              {!fetching &&
                instances.map((inst) => {
                  const selected = isSelected(inst._id);
                  return (
                    <div key={inst._id} className="px-3 py-2.5 hover:bg-white/5 transition-colors">
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
                            {getInstanceModelName(inst, isEs)}
                          </span>
                        </div>
                      </label>
                      {selected && (
                        <div className="mt-2 ml-7">
                          <select
                            value={getItemCondition(inst._id)}
                            onChange={(e) =>
                              setItemCondition(inst._id, e.target.value as TransferCondition)
                            }
                            className="h-8 px-2 bg-[#0a0a0a] border border-[#222] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all"
                            aria-label={isEs ? `Condición de envío para ${inst.serialNumber}` : `Sent condition for ${inst.serialNumber}`}
                          >
                            <option value="">
                              {isEs ? "Condición de envío (opcional)" : "Sent condition (optional)"}
                            </option>
                            {(Object.keys(CONDITION_LABEL) as TransferCondition[]).map((c) => (
                              <option key={c} value={c}>
                                {getConditionLabel(c, isEs)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Sender notes */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              {isEs ? "Notas del Remitente" : "Sender Notes"}
            </label>
            <textarea
              value={senderNotes}
              onChange={(e) => setSenderNotes(e.target.value)}
              rows={2}
              placeholder={isEs ? "Notas opcionales del remitente…" : "Optional notes from the sender…"}
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
              {isEs ? "Cancelar" : "Cancel"}
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
              {isEs ? "Vista Previa y Confirmar" : "Preview & Confirm"}
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
                {isEs ? "Vista Previa del Envío" : "Preview Shipment"}
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-white transition-colors"
                aria-label={isEs ? "Cerrar vista previa" : "Close preview"}
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
                  {isEs ? "Filtrar por Tipo:" : "Filter by Type:"}
                </label>
                <select
                  value={previewFilterType}
                  onChange={(e) => setPreviewFilterType(e.target.value)}
                  className="flex-1 h-9 px-3 bg-[#0a0a0a] border border-[#222] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all"
                >
                  <option value="">
                    {isEs ? "Todos los tipos" : "All Types"} ({selectedItems.length} {isEs ? "artículos" : "items"})
                  </option>
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
                          ?.materialTypeName ?? (isEs ? "Tipo Seleccionado" : "Selected Type")
                      } ${isEs ? "Artículos" : "Items"}`
                    : `${isEs ? "Todos los Artículos a Transferir" : "All Items to Transfer"} (${selectedItems.length})`}
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
                              ({selectedInGroup.length} {selectedInGroup.length === 1 ? (isEs ? "artículo" : "item") : (isEs ? "artículos" : "items")})
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
                                      {getConditionLabel(condition, isEs)}
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
                      {isEs ? "No hay artículos seleccionados para este tipo." : "No items selected for this type."}
                    </div>
                  )}
              </div>

              {/* Sender Notes */}
              {senderNotes.trim() && (
                <div className="bg-[#0a0a0a]/80 border border-[#222] rounded-lg p-3">
                  <h3 className="text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                    {isEs ? "Notas del Remitente" : "Sender Notes"}
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
                {isEs ? "Regresar a Editar" : "Back to Edit"}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-5 h-9 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold rounded text-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={14} />
                {loading ? (isEs ? "Enviando…" : "Sending…") : (isEs ? "Confirmar y Enviar" : "Confirm & Send")}
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
  const { language } = useLanguage();
  const isEs = language === "es";
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
      showToast(
        "success",
        isEs ? "Transferencia marcada como recibida" : "Transfer marked as received",
        isEs ? "Éxito" : "Success",
      );
      onReceived();
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "No se pudo marcar la transferencia como recibida"
            : "Failed to mark transfer as received",
        isEs ? "Error" : "Error",
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
            {isEs ? "Confirmar Recepción" : "Confirm Receipt"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
            aria-label={isEs ? "Cerrar" : "Close"}
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
          <p className="text-sm text-gray-300">
            {isEs ? "Confirma la recepción del envío desde" : "Confirm receipt of shipment from"}{" "}
            <span className="text-white font-medium">{locationName(transfer.fromLocationId)}</span>{" "}
            {isEs ? "hacia" : "to"}{" "}
            <span className="text-white font-medium">{locationName(transfer.toLocationId)}</span>
            .{" "}
            {isEs ? "Todos los artículos quedarán como" : "All items will be set to"}{" "}
            <span className="text-green-400 font-medium">{isEs ? "disponible" : "available"}</span>{" "}
            {isEs ? "en el destino." : "at the destination."}
          </p>

          {/* Per-item condition */}
          {transfer.items.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                {isEs ? "Condición Recibida por Artículo" : "Received Condition per Item"}
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
                      aria-label={isEs ? `Condición recibida para ${item.instanceId}` : `Received condition for ${item.instanceId}`}
                    >
                      <option value="">{isEs ? "Condición (opcional)" : "Condition (optional)"}</option>
                      {(Object.keys(CONDITION_LABEL) as TransferCondition[]).map((c) => (
                        <option key={c} value={c}>
                          {getConditionLabel(c, isEs)}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              {isEs ? "Notas del Receptor" : "Receiver Notes"}
            </label>
            <textarea
              value={receiverNotes}
              onChange={(e) => setReceiverNotes(e.target.value)}
              rows={3}
              placeholder={isEs ? "Notas opcionales del receptor…" : "Optional notes from the receiver…"}
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
              {isEs ? "Cancelar" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 h-9 bg-green-600 hover:bg-green-500 text-white font-semibold rounded text-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle size={14} />
              {loading ? (isEs ? "Confirmando…" : "Confirming…") : (isEs ? "Marcar como Recibido" : "Mark as Received")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────

const TransferRequests: React.FC = () => {
  const { language } = useLanguage();
  const isEs = language === "es";
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
        err instanceof Error
          ? err.message
          : isEs
            ? "No se pudieron cargar las solicitudes de transferencia"
            : "Failed to load transfer requests",
        isEs ? "Error" : "Error",
      );
    } finally {
      setRequestsLoading(false);
    }
  }, [isEs, requestStatusFilter, showFulfilled, showToast]);

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
      showToast(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "No se pudieron cargar los envíos"
            : "Failed to load shipments",
        isEs ? "Error" : "Error",
      );
    } finally {
      setTransfersLoading(false);
    }
  }, [isEs, transferStatusFilter, showToast]);

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
      const statusLabel = status === "approved"
        ? isEs
          ? "aprobada"
          : "approved"
        : isEs
          ? "rechazada"
          : "rejected";

      showToast(
        "success",
        isEs
          ? `Solicitud ${statusLabel} exitosamente`
          : `Request ${statusLabel} successfully`,
        isEs ? "Éxito" : "Success",
      );
      void loadRequests();
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? `No se pudo ${status === "approved" ? "aprobar" : "rechazar"} la solicitud`
            : `Failed to ${status} request`,
        isEs ? "Error" : "Error",
      );
    }
  };

  // ── Render helpers ──
  const renderRequestActions = (req: TransferRequest) => {
    if (req.status === "requested" && canUpdate) {
      return (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => void handleRespond(req._id, "approved")}
            title={isEs ? "Aprobar" : "Approve"}
            className="flex items-center gap-1 px-2.5 h-7 bg-green-700/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 border border-green-700/30 rounded text-xs font-medium transition-all"
          >
            <CheckCircle size={12} />
            {isEs ? "Aprobar" : "Approve"}
          </button>
          <button
            onClick={() => void handleRespond(req._id, "rejected")}
            title={isEs ? "Rechazar" : "Reject"}
            className="flex items-center gap-1 px-2.5 h-7 bg-red-700/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-700/30 rounded text-xs font-medium transition-all"
          >
            <XCircle size={12} />
            {isEs ? "Rechazar" : "Reject"}
          </button>
        </div>
      );
    }

    if (req.status === "approved" && canCreate) {
      return (
        <div className="flex items-center justify-end">
          <button
            onClick={() => setShipmentTarget(req)}
            className="flex items-center gap-1 px-2.5 h-7 bg-[#FFD700]/15 hover:bg-[#FFD700]/25 text-[#FFD700] border border-[#FFD700]/30 rounded text-xs font-medium transition-all"
          >
            <Truck size={12} />
            {isEs ? "Iniciar Envío" : "Initiate Shipment"}
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center">
        <span className="text-xs text-gray-600 italic">{isEs ? "Sin acciones" : "No actions"}</span>
      </div>
    );
  };

  // ── Render ──
  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ArrowLeftRight size={26} className="text-[#FFD700]" />
            {isEs ? "Solicitudes de Transferencia" : "Transfer Requests"}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {isEs
              ? "Gestiona transferencias de material entre ubicaciones"
              : "Manage material transfers between locations"}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 h-10 px-5 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold rounded text-sm transition-all shadow-md hover:shadow-lg active:scale-95 shrink-0"
          >
            <Plus size={16} />
            {isEs ? "Nueva Solicitud" : "New Request"}
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
            {tab === "requests"
              ? isEs
                ? "Solicitudes de Transferencia"
                : "Transfer Requests"
              : isEs
                ? "Envíos"
                : "Shipments"}
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
                <option value="">{isEs ? "Todos los estados" : "All statuses"}</option>
                {(Object.keys(REQUEST_STATUS_LABEL) as TransferRequestStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {getRequestStatusLabel(s, isEs)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-2.5 text-gray-500 pointer-events-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showFulfilled}
                  onChange={(e) => setShowFulfilled(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-8 h-4 rounded-full transition-colors ${
                    showFulfilled ? "bg-[#FFD700]" : "bg-gray-600"
                  }`}
                ></div>
                <div
                  className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
                    showFulfilled ? "translate-x-4" : ""
                  }`}
                ></div>
              </div>
              <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                {isEs ? "Mostrar cumplidas" : "Show fulfilled"}
              </span>
            </label>

            <button
              onClick={() => void loadRequests()}
              disabled={requestsLoading}
              className="flex items-center gap-1.5 h-9 px-3 bg-[#111] border border-[#2a2a2a] rounded text-sm text-gray-400 hover:text-white transition-all disabled:opacity-40"
            >
              <RefreshCw size={14} className={requestsLoading ? "animate-spin" : ""} />
              {isEs ? "Actualizar" : "Refresh"}
            </button>
            <span className="ml-auto text-xs text-gray-500">
              {requests.length} {isEs ? "resultado(s)" : "result(s)"}
            </span>
          </div>

          {/* Table */}
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            {requestsLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <RefreshCw size={20} className="animate-spin mr-2" />
                {isEs ? "Cargando solicitudes…" : "Loading requests…"}
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
                <CircleDashed size={32} />
                <p className="text-sm">
                  {isEs ? "No se encontraron solicitudes de transferencia" : "No transfer requests found"}
                </p>
                {canCreate && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="text-[#FFD700] hover:underline text-sm"
                  >
                    {isEs ? "Crear la primera solicitud" : "Create the first request"}
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#1a1a1a] text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">{isEs ? "Ruta" : "Route"}</th>
                      <th className="px-4 py-3">{isEs ? "Artículos" : "Items"}</th>
                      <th className="px-4 py-3">{isEs ? "Estado" : "Status"}</th>
                      <th className="px-4 py-3">{isEs ? "Notas" : "Notes"}</th>
                      <th className="px-4 py-3">{isEs ? "Creado" : "Created"}</th>
                      <th className="px-4 py-3 text-center">{isEs ? "Acciones" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {requests.map((req) => (
                      <tr key={req._id} className="hover:bg-white/3 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-200 font-medium whitespace-nowrap">{locationName(req.fromLocationId)}</span>
                            <ArrowLeftRight size={14} className="text-[#FFD700] shrink-0" />
                            <span className="text-gray-200 whitespace-nowrap">{locationName(req.toLocationId)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                          {req.items.length} {isEs ? "tipo(s)" : "type(s)"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            label={getRequestStatusLabel(req.status, isEs)}
                            className={REQUEST_STATUS_CLASSES[req.status]}
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-400 max-w-[200px] truncate">
                          {req.notes ?? <span className="text-gray-600 italic">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                          {formatDate(req.createdAt, isEs)}
                        </td>
                        <td className="px-4 py-3 text-center">{renderRequestActions(req)}</td>
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
                <option value="">{isEs ? "Todos los estados" : "All statuses"}</option>
                {(Object.keys(TRANSFER_STATUS_LABEL) as TransferStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {getTransferStatusLabel(s, isEs)}
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
              {isEs ? "Actualizar" : "Refresh"}
            </button>
            <span className="ml-auto text-xs text-gray-500">
              {transfers.length} {isEs ? "resultado(s)" : "result(s)"}
            </span>
          </div>

          {/* Table */}
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            {transfersLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <RefreshCw size={20} className="animate-spin mr-2" />
                {isEs ? "Cargando envíos…" : "Loading shipments…"}
              </div>
            ) : transfers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
                <Truck size={32} />
                <p className="text-sm">{isEs ? "No se encontraron envíos" : "No shipments found"}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#1a1a1a] text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">{isEs ? "Ruta" : "Route"}</th>
                      <th className="px-4 py-3">{isEs ? "Artículos" : "Items"}</th>
                      <th className="px-4 py-3">{isEs ? "Estado" : "Status"}</th>
                      <th className="px-4 py-3">{isEs ? "Notas del Remitente" : "Sender Notes"}</th>
                      <th className="px-4 py-3">{isEs ? "Creado" : "Created"}</th>
                      <th className="px-4 py-3 text-center">{isEs ? "Acciones" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {transfers.map((tr) => (
                      <tr key={tr._id} className="hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-200 font-medium whitespace-nowrap">{locationName(tr.fromLocationId)}</span>
                            <ArrowLeftRight size={14} className="text-[#FFD700] shrink-0" />
                            <span className="text-gray-200 whitespace-nowrap">{locationName(tr.toLocationId)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {tr.items.length} {isEs ? "artículo(s)" : "item(s)"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            label={getTransferStatusLabel(tr.status, isEs)}
                            className={TRANSFER_STATUS_CLASSES[tr.status]}
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-400 max-w-[180px] truncate">
                          {tr.senderNotes ?? <span className="text-gray-600 italic">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                          {formatDate(tr.createdAt, isEs)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tr.status === "in_transit" && canUpdate ? (
                            <div className="flex items-center justify-end">
                              <button
                                onClick={() => setReceiveTarget(tr)}
                                className="flex items-center gap-1 px-2.5 h-7 bg-green-700/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 border border-green-700/30 rounded text-xs font-medium transition-all"
                              >
                                <CheckCircle size={12} />
                                {isEs ? "Recibir" : "Receive"}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <span className="text-xs text-gray-600 italic">—</span>
                            </div>
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
