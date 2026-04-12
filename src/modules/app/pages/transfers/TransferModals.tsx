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
  Calendar,
  User,
  FileText,
  Info,
  Copy,
} from "lucide-react";
import { useToast } from "../../../../contexts/ToastContext";
import { useLanguage } from "../../../../contexts/useLanguage";
import { useCopyToClipboard } from "../../../../hooks/useCopyToClipboard";
import { SearchableSelect, EntityLink, MaterialTraceabilityTimeline } from "../../../../components/ui";
import type { SelectOption } from "../../../../components/ui";
import {
  createTransferRequest,
  createTransfer,
  receiveTransfer,
  updateTransferRequest,
} from "../../../../services/transferService";
import { getMaterialInstances, getCatalogOverview } from "../../../../services/materialService";
import {
  CONDITION_LABEL,
  getConditionLabel,
  extractInstanceLocationId,
  getInstanceModelName,
  REQUEST_STATUS_CLASSES,
  getRequestStatusLabel,
  TRANSFER_STATUS_CLASSES,
  getTransferStatusLabel,
  formatDate,
} from "./helpers";
import type {
  TransferRequest,
  TransferRequestItem,
  TransferItem,
  TransferCondition,
  ReceiveTransferItem,
  MaterialInstance,
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

// ─── Request Detail Modal ──────────────────────────────────────────────────

interface RequestDetailModalProps {
  request: TransferRequest;
  locationName: (id: string) => string;
  materialTypeName: (modelId: string) => string;
  userName: (userId: string) => string;
  userId?: string;
  canUpdate?: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  onClose: () => void;
}

/**
 * Detailed view modal for transfer requests.
 * Displays comprehensive information about a transfer request including
 * status, locations, items, notes, timestamps, and requester info.
 */
export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  request,
  locationName,
  materialTypeName,
  userName,
  userId,
  canUpdate,
  onEdit,
  onCancel,
  onClose,
}) => {
  const { language } = useLanguage();
  const isEs = language === "es";

  const statusBadgeClass = REQUEST_STATUS_CLASSES[request.status];
  const statusLabel = getRequestStatusLabel(request.status, language);
  const createdDate = formatDate(request.createdAt, isEs);
  const updatedDate = request.updatedAt ? formatDate(request.updatedAt, isEs) : null;

  // Group items by material type for better readability
  const itemsByType = new Map<string, TransferRequestItem[]>();
  request.items.forEach((item) => {
    const key = item.modelId;
    if (!itemsByType.has(key)) {
      itemsByType.set(key, []);
    }
    itemsByType.get(key)!.push(item);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFD700]/10 rounded-lg">
              <Info className="w-5 h-5 text-[#FFD700]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEs ? "Detalles de la Solicitud" : "Request Details"}
              </h2>
              <p className="text-xs text-gray-500 font-mono mt-1">
                {isEs ? "ID:" : "ID:"} {request._id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white hover:bg-[#222] rounded-lg transition-colors"
            aria-label={isEs ? "Cerrar" : "Close"}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${statusBadgeClass}`}
            >
              <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
              {statusLabel}
            </span>
          </div>

          {/* Transfer Route */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
            <p className="text-xs text-gray-500 font-semibold mb-3 uppercase tracking-wide">
              {isEs ? "Ruta de Transferencia" : "Transfer Route"}
            </p>
            <div className="flex items-center gap-3 text-sm">
              <EntityLink
                entityType="location"
                entityId={request.fromLocationId}
                label={locationName(request.fromLocationId)}
                className="font-medium"
              />
              <ArrowLeftRight size={14} className="text-[#FFD700] shrink-0" />
              <EntityLink
                entityType="location"
                entityId={request.toLocationId}
                label={locationName(request.toLocationId)}
                className="font-medium"
              />
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Created At */}
            <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-[#FFD700]" />
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                  {isEs ? "Solicitado el" : "Requested"}
                </p>
              </div>
              <p className="text-sm text-white font-medium">{createdDate}</p>
            </div>

            {/* Updated At (if applicable) */}
            {updatedDate && (
              <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-[#FFD700]" />
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                    {isEs ? "Actualizado el" : "Updated"}
                  </p>
                </div>
                <p className="text-sm text-white font-medium">{updatedDate}</p>
              </div>
            )}

            {/* Requested By */}
            <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User size={14} className="text-[#FFD700]" />
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                  {isEs ? "Solicitado por" : "Requested By"}
                </p>
              </div>
              <p className="text-sm text-gray-300 font-medium">{userName(request.requestedBy)}</p>
            </div>

            {/* Item Count */}
            <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package size={14} className="text-[#FFD700]" />
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                  {isEs ? "Cantidad de Artículos" : "Item Count"}
                </p>
              </div>
              <p className="text-sm text-white font-medium">{request.items.length}</p>
            </div>
          </div>

          {/* Items Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package size={14} className="text-[#FFD700]" />
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {isEs ? "Artículos Solicitados" : "Requested Items"}
              </h3>
            </div>
            <div className="space-y-3">
              {Array.from(itemsByType.entries()).map(([materialTypeId, items]) => (
                <div
                  key={materialTypeId}
                  className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <EntityLink
                      entityType="materialType"
                      entityId={materialTypeId}
                      label={materialTypeName(materialTypeId)}
                      className="text-sm font-semibold"
                    />
                    <span className="px-2.5 py-0.5 bg-[#FFD700]/15 text-[#FFD700] rounded text-xs font-bold">
                      ×{items.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes Section */}
          {request.notes && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={14} className="text-[#FFD700]" />
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {isEs ? "Notas" : "Notes"}
                </h3>
              </div>
              <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4">
                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {request.notes}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-[#222]">
          {(() => {
            console.log(
              `[RequestDetailModal] Conditions - canUpdate: ${canUpdate}, userId: ${userId}, requestedBy: ${request.requestedBy}, status: ${request.status}`,
            );
            return (
              canUpdate &&
              userId === request.requestedBy &&
              request.status === "requested" && (
                <>
                  <button
                    onClick={onCancel}
                    className="px-5 py-2.5 bg-red-700/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-700/30 rounded-lg text-sm font-medium transition-all"
                  >
                    {isEs ? "Cancelar Solicitud" : "Cancel Request"}
                  </button>
                  <button
                    onClick={onEdit}
                    className="px-5 py-2.5 bg-blue-700/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-700/30 rounded-lg text-sm font-medium transition-all"
                  >
                    {isEs ? "Editar" : "Edit"}
                  </button>
                </>
              )
            );
          })()}
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#FFD700] text-black font-bold rounded-lg text-sm hover:bg-[#e6c200] transition-colors"
          >
            {isEs ? "Cerrar" : "Close"}
          </button>
        </div>
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
  const [materialTypeOptions, setMaterialTypeOptions] = useState<SelectOption[]>([]);
  const [allMaterialTypeCount, setAllMaterialTypeCount] = useState(0);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch material types only after fromLocationId is set
  useEffect(() => {
    if (!fromLocationId) {
      setMaterialTypeOptions([]);
      return;
    }

    setLoadingItems(true);
    getCatalogOverview({ locationId: fromLocationId, limit: 100 })
      .then((res) => {
        const allTypes = res.data.materialTypes ?? [];
        setAllMaterialTypeCount(allTypes.length);

        // Filter to only types with one or more instances (regardless of status)
        const typesWithInstances = allTypes.filter((mt) => mt.totals.totalInstances > 0);

        const options: SelectOption[] = typesWithInstances.map((mt) => ({
          value: mt.materialTypeId,
          label: mt.name,
        }));
        setMaterialTypeOptions(options);
      })
      .catch(() => {
        /* non-critical */
        setMaterialTypeOptions([]);
      })
      .finally(() => setLoadingItems(false));
  }, [fromLocationId]);

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
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 overflow-y-auto custom-scrollbar"
          data-help-id="transfer-requests-form-create-request"
        >
          {/* From location */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              {isEs ? "Ubicación de Origen" : "From Location"}{" "}
              <span className="text-red-400">*</span>
            </label>
            <select
              data-help-id="transfer-requests-form-from-location"
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
              data-help-id="transfer-requests-form-to-location"
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
          <div data-help-id="transfer-requests-form-items">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-400">
                {isEs ? "Artículos" : "Items"} <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={addItem}
                disabled={!fromLocationId}
                className="flex items-center gap-1 text-xs text-[#FFD700] hover:text-[#FFD700]/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={12} />
                {isEs ? "Agregar artículo" : "Add item"}
              </button>
            </div>

            {!fromLocationId && (
              <p className="text-xs text-gray-500 mb-2">
                {isEs
                  ? "Selecciona una ubicación de origen para ver los tipos de material disponibles."
                  : "Select an origin location to see available material types."}
              </p>
            )}

            {fromLocationId && allMaterialTypeCount > materialTypeOptions.length && (
              <p className="text-xs text-gray-600 mb-2 italic">
                {isEs
                  ? `Solo se muestran tipos de material con instancias disponibles. ${allMaterialTypeCount - materialTypeOptions.length} tipo(s) no aparecen porque no tienen inventario.`
                  : `Only material types with available instances are shown. ${allMaterialTypeCount - materialTypeOptions.length} type(s) are not displayed because they have no inventory.`}
              </p>
            )}

            <div className="space-y-2">
              {requestItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      options={materialTypeOptions}
                      value={item.modelId}
                      onChange={(value) => updateItem(idx, { modelId: value })}
                      placeholder={isEs ? "Seleccionar tipo de material" : "Select material type"}
                      disabled={!fromLocationId || loadingItems}
                    />
                  </div>
                  <input
                    type="number"
                    min={1}
                    data-help-id={`transfer-requests-form-item-quantity-${idx}`}
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
              data-help-id="transfer-requests-form-notes"
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
              data-help-id="transfer-requests-form-cancel"
              className="px-4 h-9 rounded text-sm text-gray-400 hover:text-white border border-[#333] hover:border-[#555] transition-all"
            >
              {isEs ? "Cancelar" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading || !fromLocationId || !toLocationId}
              data-help-id="transfer-requests-form-submit"
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

// ─── Edit Request Modal ────────────────────────────────────────────────────

interface EditRequestModalProps {
  request: TransferRequest;
  locations: WarehouseLocation[];
  onClose: () => void;
  onUpdated: () => void;
}

export const EditRequestModal: React.FC<EditRequestModalProps> = ({
  request,
  locations,
  onClose,
  onUpdated,
}) => {
  const { showToast } = useToast();
  const { language } = useLanguage();
  const isEs = language === "es";
  const [notes, setNotes] = useState(request.notes ?? "");
  const [requestItems, setRequestItems] = useState<TransferRequestItem[]>([...request.items]);
  const [materialTypeOptions, setMaterialTypeOptions] = useState<SelectOption[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch material types once for the from location
  useEffect(() => {
    setLoadingItems(true);
    getCatalogOverview({ locationId: request.fromLocationId, limit: 100 })
      .then((res) => {
        const typesWithInstances = (res.data.materialTypes ?? []).filter(
          (mt) => mt.totals.totalInstances > 0,
        );
        const options: SelectOption[] = typesWithInstances.map((mt) => ({
          value: mt.materialTypeId,
          label: mt.name,
        }));
        setMaterialTypeOptions(options);
      })
      .catch(() => {
        setMaterialTypeOptions([]);
      })
      .finally(() => setLoadingItems(false));
  }, [request.fromLocationId]);

  const addItem = () => setRequestItems((prev) => [...prev, { modelId: "", quantity: 1 }]);

  const removeItem = (index: number) =>
    setRequestItems((prev) => prev.filter((_, i) => i !== index));

  const updateItem = (index: number, patch: Partial<TransferRequestItem>) =>
    setRequestItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await updateTransferRequest(request._id, {
        items: filledItems,
        ...(notes.trim() ? { notes: notes.trim() } : { notes: "" }),
      });
      showToast(
        "success",
        isEs
          ? "Solicitud de transferencia actualizada exitosamente"
          : "Transfer request updated successfully",
        isEs ? "Éxito" : "Success",
      );
      onUpdated();
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "Error al actualizar la solicitud de transferencia"
            : "Failed to update transfer request",
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
            <ArrowLeftRight size={18} className="text-[#FFD700]" />
            {isEs ? "Editar Solicitud de Transferencia" : "Edit Transfer Request"}
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
          {/* Read-only from location */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              {isEs ? "Ubicación de Origen" : "From Location"}
            </label>
            <div className="h-10 px-3 bg-[#0a0a0a] border border-[#222] rounded text-sm text-gray-500 flex items-center">
              {locations.find((l) => l._id === request.fromLocationId)?.name ??
                request.fromLocationId}
            </div>
          </div>

          {/* Read-only to location */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              {isEs ? "Ubicación de Destino" : "To Location"}
            </label>
            <div className="h-10 px-3 bg-[#0a0a0a] border border-[#222] rounded text-sm text-gray-500 flex items-center">
              {locations.find((l) => l._id === request.toLocationId)?.name ?? request.toLocationId}
            </div>
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

            {loadingItems && (
              <p className="text-xs text-gray-500">{isEs ? "Cargando..." : "Loading..."}</p>
            )}

            {requestItems.map((item, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <SearchableSelect
                  options={materialTypeOptions}
                  value={item.modelId}
                  onChange={(val) => updateItem(idx, { modelId: val })}
                  placeholder={isEs ? "Seleccionar tipo" : "Select material type"}
                  disabled={loadingItems}
                />
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, { quantity: parseInt(e.target.value) || 1 })}
                  placeholder="Qty"
                  className="w-16 h-10 px-2 bg-[#0a0a0a] border border-[#222] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700]"
                />
                {requestItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="px-2 h-10 bg-red-700/20 hover:bg-red-600/30 text-red-400 rounded text-xs transition-all"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              {isEs ? "Notas" : "Notes"}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              placeholder={isEs ? "Notas opcionales..." : "Optional notes..."}
              className="w-full h-20 px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FFD700] resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{notes.length}/500</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 bg-[#1a1a1a] hover:bg-[#222] text-white rounded text-sm font-medium transition-all"
            >
              {isEs ? "Cancelar" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 bg-[#FFD700] hover:bg-[#e6c200] text-black rounded text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (isEs ? "Guardando..." : "Saving...") : isEs ? "Guardar" : "Save"}
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
  const { copy } = useCopyToClipboard();
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

        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 overflow-y-auto custom-scrollbar"
          data-help-id="transfer-requests-form-initiate-shipment"
        >
          {/* Route summary */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 flex items-center gap-3 text-sm">
            <span className="text-white font-medium">{locationName(request.fromLocationId)}</span>
            <ArrowLeftRight size={14} className="text-[#FFD700] shrink-0" />
            <span className="text-white font-medium">{locationName(request.toLocationId)}</span>
          </div>

          {/* Item selection */}
          <div data-help-id="transfer-requests-form-shipment-items">
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
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              copy(inst.serialNumber);
                            }}
                            className="text-sm text-gray-200 font-medium truncate hover:text-[#FFD700] hover:underline transition-colors flex items-center gap-1 group/copy"
                            title="Haz click para copiar"
                          >
                            {inst.serialNumber}
                            <Copy size={13} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                          </button>
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
                                {getConditionLabel(c, language)}
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
              data-help-id="transfer-requests-form-sender-notes"
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
              data-help-id="transfer-requests-form-shipment-cancel"
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
              data-help-id="transfer-requests-form-shipment-preview"
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
                                  className="flex items-center justify-between text-xs gap-2"
                                >
                                  <button
                                    onClick={() => copy(inst.serialNumber)}
                                    className="text-gray-300 hover:text-[#FFD700] hover:underline transition-colors flex items-center gap-1 group/copy"
                                    title="Haz click para copiar"
                                  >
                                    {inst.serialNumber}
                                    <Copy size={11} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                                  </button>
                                  {condition && (
                                    <span className="text-gray-500">
                                      {getConditionLabel(condition, language)}
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
                data-help-id="transfer-requests-form-shipment-submit"
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

// ─── Shipment Detail Modal ────────────────────────────────────────────────

interface ShipmentDetailModalProps {
  shipment: Transfer;
  locationName: (id: string) => string;
  onClose: () => void;
  onReceive?: () => void;
  /** Whether the current user has `transfers:receive` permission */
  canReceive?: boolean;
}

/**
 * Detailed view modal for shipments (transfers).
 * Displays comprehensive information about a transfer including
 * status, locations, items with conditions, notes, timestamps.
 */
export const ShipmentDetailModal: React.FC<ShipmentDetailModalProps> = ({
  shipment,
  locationName,
  onClose,
  onReceive,
  canReceive = true,
}) => {
  const { language } = useLanguage();
  const isEs = language === "es";

  const statusBadgeClass = TRANSFER_STATUS_CLASSES[shipment.status];
  const statusLabel = getTransferStatusLabel(shipment.status, language);
  const createdDate = formatDate(shipment.createdAt, isEs);
  const updatedDate = shipment.updatedAt ? formatDate(shipment.updatedAt, isEs) : null;

  // Group items by condition for better readability
  const itemsByCondition = new Map<string, TransferItem[]>();
  shipment.items.forEach((item) => {
    const key = item.sentCondition ?? "unknown";
    if (!itemsByCondition.has(key)) {
      itemsByCondition.set(key, []);
    }
    itemsByCondition.get(key)!.push(item);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFD700]/10 rounded-lg">
              <Truck className="w-5 h-5 text-[#FFD700]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEs ? "Detalles del Envío" : "Shipment Details"}
              </h2>
              <p className="text-xs text-gray-500 font-mono mt-1">
                {isEs ? "ID:" : "ID:"} {shipment._id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white hover:bg-[#222] rounded-lg transition-colors"
            aria-label={isEs ? "Cerrar" : "Close"}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${statusBadgeClass}`}
            >
              <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
              {statusLabel}
            </span>
          </div>

          {/* Transfer Route */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
            <p className="text-xs text-gray-500 font-semibold mb-3 uppercase tracking-wide">
              {isEs ? "Ruta de Transferencia" : "Transfer Route"}
            </p>
            <div className="flex items-center gap-3 text-sm">
              <EntityLink
                entityType="location"
                entityId={shipment.fromLocationId}
                label={locationName(shipment.fromLocationId)}
                className="font-medium"
              />
              <ArrowLeftRight size={14} className="text-[#FFD700] shrink-0" />
              <EntityLink
                entityType="location"
                entityId={shipment.toLocationId}
                label={locationName(shipment.toLocationId)}
                className="font-medium"
              />
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Created At */}
            <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-[#FFD700]" />
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                  {isEs ? "Iniciado el" : "Initiated"}
                </p>
              </div>
              <p className="text-sm text-white font-medium">{createdDate}</p>
            </div>

            {/* Updated At (if applicable) */}
            {updatedDate && (
              <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-[#FFD700]" />
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                    {isEs ? "Actualizado el" : "Updated"}
                  </p>
                </div>
                <p className="text-sm text-white font-medium">{updatedDate}</p>
              </div>
            )}

            {/* Item Count */}
            <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package size={14} className="text-[#FFD700]" />
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                  {isEs ? "Cantidad de Artículos" : "Item Count"}
                </p>
              </div>
              <p className="text-sm text-white font-medium">{shipment.items.length}</p>
            </div>

            {/* Request ID (if linked) */}
            {shipment.requestId && (
              <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={14} className="text-[#FFD700]" />
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                    {isEs ? "Solicitud Asociada" : "Related Request"}
                  </p>
                </div>
                <EntityLink
                  entityType="transferRequest"
                  entityId={shipment.requestId}
                  label={shipment.requestId.slice(-8).toUpperCase()}
                  className="text-xs font-mono"
                />
              </div>
            )}
          </div>

          {/* Items Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package size={14} className="text-[#FFD700]" />
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {isEs ? "Artículos en Tránsito" : "Shipped Items"}
              </h3>
            </div>
            <div className="space-y-3">
              {shipment.items.map((item, idx) => (
                <div key={idx} className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-white">
                      {isEs ? "Artículo" : "Item"} #{idx + 1}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">{item.instanceId}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {item.sentCondition && (
                      <div>
                        <p className="text-gray-500 mb-1">
                          {isEs ? "Condición Enviada" : "Sent Condition"}
                        </p>
                        <p className="px-2 py-1 bg-[#1a1a1a] text-gray-300 rounded w-fit">
                          {getConditionLabel(item.sentCondition, language)}
                        </p>
                      </div>
                    )}
                    {item.receivedCondition && (
                      <div>
                        <p className="text-gray-500 mb-1">
                          {isEs ? "Condición Recibida" : "Received Condition"}
                        </p>
                        <p className="px-2 py-1 bg-[#1a1a1a] text-gray-300 rounded w-fit">
                          {getConditionLabel(item.receivedCondition, language)}
                        </p>
                      </div>
                    )}
                  </div>
                  {item.notes && (
                    <div className="mt-2 pt-2 border-t border-[#222]">
                      <p className="text-xs text-gray-500 mb-1">{isEs ? "Notas" : "Notes"}</p>
                      <p className="text-xs text-gray-300">{item.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sender Notes (if applicable) */}
          {shipment.senderNotes && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={14} className="text-[#FFD700]" />
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {isEs ? "Notas del Remitente" : "Sender Notes"}
                </h3>
              </div>
              <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4">
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{shipment.senderNotes}</p>
              </div>
            </div>
          )}

          {/* Receiver Notes (if applicable) */}
          {shipment.receiverNotes && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={14} className="text-[#FFD700]" />
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {isEs ? "Notas del Receptor" : "Receiver Notes"}
                </h3>
              </div>
              <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4">
                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                  {shipment.receiverNotes}
                </p>
              </div>
            </div>
          )}

          <MaterialTraceabilityTimeline
            events={shipment.traceabilityEvents ?? []}
            entityType="transfer"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-[#222]">
          {onReceive && shipment.status === "in_transit" && (
            <button
              onClick={onReceive}
              aria-disabled={!canReceive}
              className={`px-5 py-2.5 bg-blue-700/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-700/30 rounded-lg text-sm font-medium transition-all ${!canReceive ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isEs ? "Marcar como Recibido" : "Mark as Received"}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#FFD700] text-black font-bold rounded-lg text-sm hover:bg-[#e6c200] transition-colors"
          >
            {isEs ? "Cerrar" : "Close"}
          </button>
        </div>
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
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 overflow-y-auto custom-scrollbar"
          data-help-id="transfer-requests-form-receive-shipment"
        >
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
            <div data-help-id="transfer-requests-form-receive-items">
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
                          {getConditionLabel(c, language)}
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
              data-help-id="transfer-requests-form-receiver-notes"
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
              data-help-id="transfer-requests-form-receive-cancel"
              className="px-4 h-9 rounded text-sm text-gray-400 hover:text-white border border-[#333] hover:border-[#555] transition-all"
            >
              {isEs ? "Cancelar" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading}
              data-help-id="transfer-requests-form-receive-submit"
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
