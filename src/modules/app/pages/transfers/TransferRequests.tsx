import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftRight,
  CheckCircle,
  ChevronDown,
  CircleDashed,
  Eye,
  Plus,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";
import { useLanguage } from "../../../../contexts/useLanguage";
import { usePermissions } from "../../../../contexts/usePermissions";
import { useToast } from "../../../../contexts/ToastContext";
import { useAuth } from "../../../../contexts/useAuth";
import {
  getTransferRequests,
  respondToTransferRequest,
  getTransfers,
  cancelTransferRequest,
} from "../../../../services/transferService";
import { getLocations } from "../../../../services/warehouseOperatorService";
import { getUser } from "../../../../services/userService";
import { getMaterialType } from "../../../../services/materialService";
import { AnimatedPage, PageHeader, EntityLink } from "../../../../components/ui";
import {
  REQUEST_STATUS_LABEL,
  getRequestStatusLabel,
  REQUEST_STATUS_CLASSES,
  TRANSFER_STATUS_LABEL,
  getTransferStatusLabel,
  TRANSFER_STATUS_CLASSES,
  formatDate,
} from "./helpers";
import {
  CreateRequestModal,
  InitiateShipmentModal,
  ReceiveTransferModal,
  RequestDetailModal,
  EditRequestModal,
  ShipmentDetailModal,
} from "./TransferModals";
import type {
  TransferRequest,
  TransferRequestStatus,
  Transfer,
  TransferStatus,
  ActiveTab,
  WarehouseLocation,
} from "./types";

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

// ─── Main Page ─────────────────────────────────────────────────────────────

export function TransferRequests() {
  const { language } = useLanguage();
  const isEs = language === "es";
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();
  const { user } = useAuth();

  const canCreate = hasPermission("transfers:create");
  const canUpdate = hasPermission("transfers:update");
  const userLocations = user?.locations ?? [];

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

  // ── State: user cache (for ID → name lookup) ──
  const [userCache, setUserCache] = useState<Map<string, string>>(new Map());

  // ── State: material type cache (for ID → name lookup) ──
  const [materialTypeCache, setMaterialTypeCache] = useState<Map<string, string>>(new Map());

  // ── Modals ──
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewTarget, setViewTarget] = useState<TransferRequest | null>(null);
  const [editTarget, setEditTarget] = useState<TransferRequest | null>(null);
  const [shipmentTarget, setShipmentTarget] = useState<TransferRequest | null>(null);
  const [receiveTarget, setReceiveTarget] = useState<Transfer | null>(null);
  const [viewShipmentTarget, setViewShipmentTarget] = useState<Transfer | null>(null);

  // ── Helpers ──
  const locationName = useCallback(
    (id: string) => locations.find((l) => l._id === id)?.name ?? id,
    [locations],
  );

  const getUserName = useCallback(
    (userId: string): string => {
      // Return cached name if available
      const cached = userCache.get(userId);
      if (cached) return cached;
      // Fetch user name asynchronously
      void getUser(userId)
        .then((res) => {
          const name = res.data.user?.name
            ? `${res.data.user.name.firstName} ${res.data.user.name.firstSurname}`.trim()
            : userId;
          setUserCache((prev) => new Map(prev).set(userId, name));
        })
        .catch(() => {
          // On error, cache the ID itself
          setUserCache((prev) => new Map(prev).set(userId, userId));
        });
      return userId;
    },
    [userCache],
  );

  const getMaterialTypeName = useCallback(
    (modelId: string): string => {
      // Return cached name if available
      const cached = materialTypeCache.get(modelId);
      if (cached) return cached;
      // Fetch material type name asynchronously
      void getMaterialType(modelId)
        .then((res) => {
          const name = res.data.materialType?.name ?? modelId;
          setMaterialTypeCache((prev) => new Map(prev).set(modelId, name));
        })
        .catch(() => {
          // On error, cache the ID itself
          setMaterialTypeCache((prev) => new Map(prev).set(modelId, modelId));
        });
      return modelId;
    },
    [materialTypeCache],
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
      const statusLabel =
        status === "approved" ? (isEs ? "aprobada" : "approved") : isEs ? "rechazada" : "rejected";

      showToast(
        "success",
        isEs ? `Solicitud ${statusLabel} exitosamente` : `Request ${statusLabel} successfully`,
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

  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelTransferRequest(requestId);
      showToast(
        "success",
        isEs ? "Solicitud cancelada exitosamente" : "Request cancelled successfully",
        isEs ? "Éxito" : "Success",
      );
      setViewTarget(null);
      void loadRequests();
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error
          ? err.message
          : isEs
            ? "No se pudo cancelar la solicitud"
            : "Failed to cancel request",
        isEs ? "Error" : "Error",
      );
    }
  };

  // ── Render helpers ──
  const renderRequestActions = (req: TransferRequest) => {
    const canApproveReject = canUpdate && userLocations.includes(req.fromLocationId);
    const isCreator = user?._id === req.requestedBy;
    const canEdit = canUpdate && isCreator && req.status === "requested";

    console.log(
      `[renderRequestActions] Request ${req._id} - user._id: ${user?._id}, requestedBy: ${req.requestedBy}, isCreator: ${isCreator}, canUpdate: ${canUpdate}, status: ${req.status}, canEdit: ${canEdit}`,
    );

    if (req.status === "requested" && canUpdate) {
      return (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setViewTarget(req)}
            title={isEs ? "Ver detalles" : "View details"}
            className="flex items-center gap-1 px-2.5 h-7 bg-blue-700/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-700/30 rounded text-xs font-medium transition-all"
          >
            <Eye size={12} />
          </button>
          {canEdit && (
            <>
              <button
                onClick={() => setEditTarget(req)}
                title={isEs ? "Editar" : "Edit"}
                className="flex items-center gap-1 px-2.5 h-7 bg-blue-700/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-700/30 rounded text-xs font-medium transition-all"
              >
                {isEs ? "Editar" : "Edit"}
              </button>
              <button
                onClick={() => void handleCancelRequest(req._id)}
                title={isEs ? "Cancelar" : "Cancel"}
                className="flex items-center gap-1 px-2.5 h-7 bg-red-700/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-700/30 rounded text-xs font-medium transition-all"
              >
                {isEs ? "Cancelar" : "Cancel"}
              </button>
            </>
          )}
          {canApproveReject && (
            <>
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
            </>
          )}
        </div>
      );
    }

    if (req.status === "approved" && canCreate) {
      return (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setViewTarget(req)}
            title={isEs ? "Ver detalles" : "View details"}
            className="flex items-center gap-1 px-2.5 h-7 bg-blue-700/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-700/30 rounded text-xs font-medium transition-all"
          >
            <Eye size={12} />
          </button>
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
      <div className="flex items-center justify-end">
        <button
          onClick={() => setViewTarget(req)}
          title={isEs ? "Ver detalles" : "View details"}
          className="flex items-center gap-1 px-2.5 h-7 bg-blue-700/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-700/30 rounded text-xs font-medium transition-all"
        >
          <Eye size={12} />
        </button>
      </div>
    );
  };

  // ── Render ──
  return (
    <AnimatedPage>
      <div className="page-container">
        <div data-help-id="transfer-requests-title">
          <PageHeader
            title={isEs ? "Solicitudes de Transferencia" : "Transfer Requests"}
            subtitle={
              isEs
                ? "Gestiona transferencias de material entre ubicaciones"
                : "Manage material transfers between locations"
            }
            actions={
              canCreate ? (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 h-10 px-5 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold rounded text-sm transition-all shadow-md hover:shadow-lg active:scale-95 shrink-0"
                >
                  <Plus size={16} />
                  {isEs ? "Nueva Solicitud" : "New Request"}
                </button>
              ) : undefined
            }
          />
        </div>

        {/* Tabs */}
        <div
          data-help-id="transfer-requests-tabs"
          className="flex gap-1 bg-[#111] border border-[#222] rounded-lg p-1 w-fit"
        >
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
            <div
              data-help-id="transfer-requests-request-filters"
              className="flex items-center gap-3 flex-wrap"
            >
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
            <div
              data-help-id="transfer-requests-request-table"
              className="bg-[#111] border border-[#222] rounded-xl overflow-hidden"
            >
              {requestsLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-500">
                  <RefreshCw size={20} className="animate-spin mr-2" />
                  {isEs ? "Cargando solicitudes…" : "Loading requests…"}
                </div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
                  <CircleDashed size={32} />
                  <p className="text-sm">
                    {isEs
                      ? "No se encontraron solicitudes de transferencia"
                      : "No transfer requests found"}
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
                              <EntityLink
                                entityType="location"
                                entityId={req.fromLocationId}
                                label={locationName(req.fromLocationId)}
                                className="font-medium whitespace-nowrap"
                              />
                              <ArrowLeftRight size={14} className="text-[#FFD700] shrink-0" />
                              <EntityLink
                                entityType="location"
                                entityId={req.toLocationId}
                                label={locationName(req.toLocationId)}
                                className="whitespace-nowrap"
                              />
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
            <div
              data-help-id="transfer-requests-shipment-filters"
              className="flex items-center gap-3 flex-wrap"
            >
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
            <div
              data-help-id="transfer-requests-shipment-table"
              className="bg-[#111] border border-[#222] rounded-xl overflow-hidden"
            >
              {transfersLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-500">
                  <RefreshCw size={20} className="animate-spin mr-2" />
                  {isEs ? "Cargando envíos…" : "Loading shipments…"}
                </div>
              ) : transfers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
                  <Truck size={32} />
                  <p className="text-sm">
                    {isEs ? "No se encontraron envíos" : "No shipments found"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#1a1a1a] text-xs text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3">{isEs ? "Ruta" : "Route"}</th>
                        <th className="px-4 py-3">{isEs ? "Artículos" : "Items"}</th>
                        <th className="px-4 py-3">{isEs ? "Estado" : "Status"}</th>
                        <th className="px-4 py-3">
                          {isEs ? "Notas del Remitente" : "Sender Notes"}
                        </th>
                        <th className="px-4 py-3">{isEs ? "Creado" : "Created"}</th>
                        <th className="px-4 py-3 text-center">{isEs ? "Acciones" : "Actions"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]">
                      {transfers.map((tr) => (
                        <tr key={tr._id} className="hover:bg-white/3 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <EntityLink
                                entityType="location"
                                entityId={tr.fromLocationId}
                                label={locationName(tr.fromLocationId)}
                                className="font-medium whitespace-nowrap"
                              />
                              <ArrowLeftRight size={14} className="text-[#FFD700] shrink-0" />
                              <EntityLink
                                entityType="location"
                                entityId={tr.toLocationId}
                                label={locationName(tr.toLocationId)}
                                className="whitespace-nowrap"
                              />
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
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewShipmentTarget(tr)}
                                title={isEs ? "Ver detalles" : "View details"}
                                className="flex items-center gap-1 px-2.5 h-7 bg-blue-700/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-700/30 rounded text-xs font-medium transition-all"
                              >
                                <Eye size={12} />
                              </button>
                              {tr.status === "in_transit" && canUpdate && (
                                <button
                                  onClick={() => setReceiveTarget(tr)}
                                  className="flex items-center gap-1 px-2.5 h-7 bg-green-700/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 border border-green-700/30 rounded text-xs font-medium transition-all"
                                >
                                  <CheckCircle size={12} />
                                  {isEs ? "Recibir" : "Receive"}
                                </button>
                              )}
                            </div>
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

        {viewShipmentTarget && (
          <ShipmentDetailModal
            shipment={viewShipmentTarget}
            locationName={locationName}
            onReceive={() => {
              setReceiveTarget(viewShipmentTarget);
              setViewShipmentTarget(null);
            }}
            onClose={() => setViewShipmentTarget(null)}
          />
        )}

        {viewTarget && (
          <RequestDetailModal
            request={viewTarget}
            locationName={locationName}
            materialTypeName={getMaterialTypeName}
            userName={getUserName}
            userId={user?._id}
            canUpdate={canUpdate}
            onEdit={() => {
              setEditTarget(viewTarget);
              setViewTarget(null);
            }}
            onCancel={() => void handleCancelRequest(viewTarget._id)}
            onClose={() => setViewTarget(null)}
          />
        )}

        {editTarget && (
          <EditRequestModal
            request={editTarget}
            locations={locations}
            onClose={() => setEditTarget(null)}
            onUpdated={() => {
              setEditTarget(null);
              void loadRequests();
            }}
          />
        )}
      </div>
    </AnimatedPage>
  );
}

export default TransferRequests;
