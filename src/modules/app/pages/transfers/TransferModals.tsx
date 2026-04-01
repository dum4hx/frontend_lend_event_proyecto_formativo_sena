import React, { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  CheckCircle,
  Eye,
  Package,
  Plus,
  Send,
  Truck,
  X,
} from "lucide-react";
import { useToast } from "../../../../contexts/ToastContext";
import { useLanguage } from "../../../../contexts/useLanguage";
import {
  createTransferRequest,
  createTransfer,
  receiveTransfer,
} from "../../../../services/transferService";
import { getMaterialInstances, getMaterialTypes } from "../../../../services/materialService";
import {
  CONDITION_LABEL,
  getConditionLabel,
  extractInstanceLocationId,
  getInstanceModelName,
} from "./helpers";
import type {
  TransferRequest,
  TransferRequestItem,
  TransferItem,
  TransferCondition,
  ReceiveTransferItem,
  MaterialInstance,
  MaterialType,
  WarehouseLocation,
} from "./types";
import type { CreateTransferRequestPayload, Transfer } from "../../../../types/api";

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

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
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
      showToast(
        "error",
        isEs
          ? "El origen y el destino deben ser diferentes"
          : "Origin and destination must be different",
        isEs ? "Error de Validación" : "Validation Error",
      );
      return;
    }
    const filledItems = requestItems.filter((it) => it.modelId.trim() !== "");
    if (filledItems.length === 0) {
      showToast(
        "error",
        isEs
          ? "Agrega al menos un artículo a la solicitud"
          : "Add at least one material item to the request",
        isEs ? "Error de Validación" : "Validation Error",
      );
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
      showToast(
        "success",
        isEs
          ? "Solicitud de transferencia creada exitosamente"
          : "Transfer request created successfully",
        isEs ? "Éxito" : "Success",
      );
      onCreated();
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "Error al crear la solicitud de transferencia"
            : "Failed to create transfer request",
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
              {isEs ? "Ubicación de Origen" : "From Location"}{" "}
              <span className="text-red-400">*</span>
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
              <option value="">
                {isEs ? "Seleccionar ubicación de origen" : "Select origin location"}
              </option>
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
              {isEs ? "Ubicación de Destino" : "To Location"}{" "}
              <span className="text-red-400">*</span>
            </label>
            <select
              value={toLocationId}
              onChange={(e) => setToLocationId(e.target.value)}
              required
              disabled={!fromLocationId}
              className="w-full h-10 px-3 bg-[#0a0a0a] border border-[#222] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] transition-all disabled:opacity-40"
            >
              <option value="">
                {isEs ? "Seleccionar ubicación de destino" : "Select destination location"}
              </option>
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
                    <option value="">
                      {isEs ? "Seleccionar tipo de material" : "Select material type"}
                    </option>
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
                    aria-label={
                      isEs ? `Cantidad para artículo ${idx + 1}` : `Quantity for item ${idx + 1}`
                    }
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
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              {isEs ? "Notas" : "Notes"}
            </label>
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
              {loading
                ? isEs
                  ? "Creando…"
                  : "Creating…"
                : isEs
                  ? "Crear Solicitud"
                  : "Create Request"}
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

export const InitiateShipmentModal: React.FC<InitiateShipmentModalProps> = ({
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

  const instancesByType = React.useMemo(() => {
    const groups = new Map<
      string,
      { materialTypeId: string; materialTypeName: string; instances: MaterialInstance[] }
    >();

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
      showToast(
        "error",
        isEs
          ? "Selecciona al menos un artículo para transferir"
          : "Select at least one item to transfer",
        isEs ? "Validación" : "Validation",
      );
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
      showToast(
        "success",
        isEs ? "Envío iniciado exitosamente" : "Shipment initiated successfully",
        isEs ? "Éxito" : "Success",
      );
      onCreated();
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "Error al iniciar el envío"
            : "Failed to initiate shipment",
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
                            aria-label={
                              isEs
                                ? `Condición de envío para ${inst.serialNumber}`
                                : `Sent condition for ${inst.serialNumber}`
                            }
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
              placeholder={
                isEs ? "Notas opcionales del remitente…" : "Optional notes from the sender…"
              }
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
                    {isEs ? "Todos los tipos" : "All Types"} ({selectedItems.length}{" "}
                    {isEs ? "artículos" : "items"})
                  </option>
                  {instancesByType
                    .filter((group) => group.instances.some((inst) => isSelected(inst._id)))
                    .map((group) => {
                      const count = group.instances.filter((inst) => isSelected(inst._id)).length;
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
                    .filter((group) => group.instances.some((inst) => isSelected(inst._id)))
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
                              ({selectedInGroup.length}{" "}
                              {selectedInGroup.length === 1
                                ? isEs
                                  ? "artículo"
                                  : "item"
                                : isEs
                                  ? "artículos"
                                  : "items"}
                              )
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
                    .filter((group) => group.instances.some((inst) => isSelected(inst._id)))
                    .some((group) => group.materialTypeId === previewFilterType) && (
                    <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
                      {isEs
                        ? "No hay artículos seleccionados para este tipo."
                        : "No items selected for this type."}
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
                {loading
                  ? isEs
                    ? "Enviando…"
                    : "Sending…"
                  : isEs
                    ? "Confirmar y Enviar"
                    : "Confirm & Send"}
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

export const ReceiveTransferModal: React.FC<ReceiveTransferModalProps> = ({
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
            <span className="text-white font-medium">{locationName(transfer.toLocationId)}</span>.{" "}
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
                      aria-label={
                        isEs
                          ? `Condición recibida para ${item.instanceId}`
                          : `Received condition for ${item.instanceId}`
                      }
                    >
                      <option value="">
                        {isEs ? "Condición (opcional)" : "Condition (optional)"}
                      </option>
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
              placeholder={
                isEs ? "Notas opcionales del receptor…" : "Optional notes from the receiver…"
              }
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
              {loading
                ? isEs
                  ? "Confirmando…"
                  : "Confirming…"
                : isEs
                  ? "Marcar como Recibido"
                  : "Mark as Received"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
