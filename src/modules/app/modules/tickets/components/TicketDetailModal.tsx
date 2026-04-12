import React, { useState, useEffect } from "react";
import { X, Eye, ClipboardCheck, CheckCircle, XCircle, Ban, Package } from "lucide-react";
import { StatusBadge, LoadingSpinner } from "../../../../../components/ui";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { usePermissions } from "../../../../../contexts/usePermissions";
import { useActionPermission } from "../../../../../hooks/useActionPermission";
import { getLocations } from "../../../../../services/warehouseOperatorService";
import { getMaterialTypes } from "../../../../../services/materialService";
import { getTransferRequest, getTransfer } from "../../../../../services/transferService";
import { TicketFulfillmentModal } from "./TicketFulfillmentModal";
import type {
  Ticket,
  TicketTransferRequestPayload,
  TicketIncidentReportPayload,
  TicketMaintenanceRequestPayload,
  TicketInspectionRequestPayload,
  TicketGenericPayload,
} from "../../../../../types/api";

interface TicketDetailModalProps {
  /** The full ticket entity. */
  ticket: Ticket;
  /** Whether the detail is still loading. */
  loading: boolean;
  /** Close the modal. */
  onClose: () => void;
  /** Move ticket to in_review. */
  onReview: (id: string) => Promise<void>;
  /** Open approve flow. */
  onApprove: (ticket: Ticket) => void;
  /** Open reject flow. */
  onReject: (ticket: Ticket) => void;
  /** Cancel the ticket. */
  onCancel: (id: string) => Promise<void>;
}

const STATUS_VARIANT: Record<string, string> = {
  pending: "pending",
  in_review: "acknowledged",
  approved: "approved",
  rejected: "rejected",
  cancelled: "cancelled",
  expired: "expired",
};

/**
 * Detail modal for viewing a single ticket and performing lifecycle actions.
 */
export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  loading,
  onClose,
  onReview,
  onApprove,
  onReject,
  onCancel,
}) => {
  const { t, formatDate, language } = useLanguage();
  const { hasPermission } = usePermissions();
  const { guard, isAllowed } = useActionPermission(language === "es" ? "es" : "en");

  const canReview = hasPermission("tickets:review");
  const canApprove = hasPermission("tickets:approve");
  const canReject = hasPermission("tickets:reject");
  const canCancel = hasPermission("tickets:cancel");
  const canCreateTransfer = hasPermission("transfers:create");

  const [showFulfillmentModal, setShowFulfillmentModal] = useState(false);

  // Local dictionaries for resolving raw IDs if backend payload isn't populated
  const [locationsStore, setLocationsStore] = useState<Record<string, string>>({});
  const [materialsStore, setMaterialsStore] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const loadDictionaries = async () => {
      try {
        const [locRes, mtRes] = await Promise.all([
          getLocations({ limit: 100 }),
          getMaterialTypes({ limit: 100 }),
        ]);
        if (cancelled) return;

        const locMap: Record<string, string> = {};
        for (const loc of locRes.data.items ?? []) {
          locMap[loc._id] = loc.name;
        }

        const mtMap: Record<string, string> = {};
        for (const mt of mtRes.data.materialTypes ?? []) {
          mtMap[mt._id] = mt.code ? `${mt.name} (${mt.code})` : mt.name;
        }

        setLocationsStore(locMap);
        setMaterialsStore(mtMap);
      } catch {
        // Silently ignore dictionary load errors
      }
    };
    loadDictionaries();
    return () => {
      cancelled = true;
    };
  }, []);

  const isTerminal =
    ticket.status === "approved" ||
    ticket.status === "rejected" ||
    ticket.status === "cancelled" ||
    ticket.status === "expired";

  /**
   * Backend may return populated objects instead of plain ID strings.
   * Safely extracts a human-readable string from either a string ID or a
   * populated object { _id, name, code?, firstName?, firstSurname? }.
   */
  const resolveDisplay = (val: unknown, dict?: Record<string, string>): string => {
    if (typeof val === "string") return dict?.[val] || val;
    if (val && typeof val === "object") {
      const obj = val as Record<string, unknown>;
      // User-like object: { name: { firstName, firstSurname } }
      if (obj.name && typeof obj.name === "object") {
        const n = obj.name as Record<string, unknown>;
        if (n.firstName) return `${n.firstName} ${n.firstSurname ?? ""}`;
      }
      // Named entity: { name: string, code?: string }
      if (typeof obj.name === "string") {
        return obj.code ? `${obj.name} (${obj.code})` : obj.name;
      }
      if (typeof obj._id === "string") return dict?.[obj._id] || obj._id;
    }
    return String(val ?? "");
  };

  /**
   * Specifically resolves a populated user and renders their name and email (if present).
   */
  const resolveUserDisplay = (val: unknown): React.ReactNode => {
    const rawStr = resolveDisplay(val);
    let email = "";
    if (val && typeof val === "object") {
      const obj = val as Record<string, unknown>;
      if (typeof obj.email === "string") email = obj.email;
    }

    if (!email) return <span className="font-mono">{rawStr}</span>;

    return (
      <div className="flex flex-col">
        <span>{rawStr}</span>
        <span className="text-xs text-gray-500 font-mono mt-0.5">{email}</span>
      </div>
    );
  };

  const renderPayload = () => {
    switch (ticket.type) {
      case "transfer_request": {
        const p = ticket.payload as TicketTransferRequestPayload;
        return (
          <div className="space-y-2">
            <InfoRow
              label={t("tickets.payload.toLocation")}
              value={resolveDisplay(p.toLocationId, locationsStore)}
              mono
            />
            {p.neededBy && (
              <InfoRow label={t("tickets.payload.neededBy")} value={formatDate(p.neededBy)} />
            )}
            {p.items.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                  {t("tickets.payload.items")}
                </p>
                <div className="space-y-1">
                  {p.items.map((item, i) => (
                    <div
                      key={i}
                      className="text-xs text-gray-300 bg-[#0d0d0d] rounded px-3 py-1.5 flex justify-between"
                    >
                      <span className="font-mono">
                        {resolveDisplay(item.materialTypeId, materialsStore)}
                      </span>
                      <span className="text-white font-semibold">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
      case "incident_report": {
        const p = ticket.payload as TicketIncidentReportPayload;
        return (
          <div className="space-y-2">
            <InfoRow
              label={t("tickets.payload.severity")}
              value={t(`tickets.payload.severity.${p.severity}`)}
            />
            <InfoRow
              label={t("tickets.payload.context")}
              value={t(`tickets.payload.context.${p.context}`)}
            />
            {p.description && (
              <InfoRow label={t("tickets.field.description")} value={p.description} />
            )}
            {p.loanId && <InfoRow label={t("tickets.payload.loan")} value={p.loanId} mono />}
            {p.materialInstanceIds && p.materialInstanceIds.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                  {t("tickets.payload.materialInstances")}
                </p>
                <div className="flex flex-wrap gap-1">
                  {p.materialInstanceIds.map((id) => (
                    <span
                      key={id}
                      className="text-xs font-mono bg-[#0d0d0d] rounded px-2 py-0.5 text-gray-300"
                    >
                      {id.slice(-8).toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
      case "maintenance_request": {
        const p = ticket.payload as TicketMaintenanceRequestPayload;
        return (
          <div className="space-y-2">
            <InfoRow
              label={t("tickets.payload.entryReason")}
              value={t(`tickets.payload.entryReason.${p.entryReason}`)}
            />
            {p.estimatedCost != null && (
              <InfoRow label={t("tickets.payload.estimatedCost")} value={`$${p.estimatedCost}`} />
            )}
            {p.notes && <InfoRow label={t("tickets.payload.notes")} value={p.notes} />}
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                {t("tickets.payload.materialInstances")}
              </p>
              <div className="flex flex-wrap gap-1">
                {p.materialInstanceIds.map((id) => (
                  <span
                    key={id}
                    className="text-xs font-mono bg-[#0d0d0d] rounded px-2 py-0.5 text-gray-300"
                  >
                    {id.slice(-8).toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      }
      case "inspection_request": {
        const p = ticket.payload as TicketInspectionRequestPayload;
        return (
          <div className="space-y-2">
            <InfoRow label={t("tickets.payload.loan")} value={p.loanId} mono />
            {p.notes && <InfoRow label={t("tickets.payload.notes")} value={p.notes} />}
          </div>
        );
      }
      case "generic": {
        const p = ticket.payload as TicketGenericPayload;
        return (
          <div className="space-y-2">
            <InfoRow label={t("tickets.payload.details")} value={p.details} />
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] sticky top-0 bg-[#1a1a1a] z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFD700]/10 rounded-lg">
              <Eye className="w-5 h-5 text-[#FFD700]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t("tickets.viewDetail")}</h2>
              <p className="text-xs text-gray-500 font-mono">
                #{ticket.code || ticket._id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white hover:bg-[#222] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Status + Type badges */}
            <div className="flex flex-wrap gap-3" data-help-id="tickets-detail-badges">
              <StatusBadge
                status={STATUS_VARIANT[ticket.status]}
                label={t(`tickets.status.${ticket.status}`)}
              />
              <span className="text-xs font-semibold text-gray-400 bg-[#0d0d0d] border border-[#222] rounded-full px-3 py-1">
                {t(`tickets.type.${ticket.type}`)}
              </span>
            </div>

            {/* Core fields */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-4 border-b border-[#222] pb-2">
                {t("tickets.field.generalInfo")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label={t("tickets.field.title")} value={ticket.title} />
                <InfoRow
                  label={t("tickets.field.location")}
                  value={resolveDisplay(ticket.locationId, locationsStore)}
                  mono
                />
                {ticket.description && (
                  <InfoRow label={t("tickets.field.description")} value={ticket.description} full />
                )}
                {ticket.responseDeadline && (
                  <InfoRow
                    label={t("tickets.field.responseDeadline")}
                    value={formatDate(ticket.responseDeadline)}
                  />
                )}
              </div>
            </div>

            {/* Tracking / Metadata */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-4 border-b border-[#222] pb-2">
                {t("tickets.field.trackingInfo")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow
                  label={t("tickets.field.creator")}
                  value={resolveUserDisplay(ticket.createdBy)}
                />
                {ticket.assigneeId && (
                  <InfoRow
                    label={t("tickets.field.assignee")}
                    value={resolveUserDisplay(ticket.assigneeId)}
                  />
                )}
                <InfoRow
                  label={t("tickets.field.createdAt")}
                  value={formatDate(ticket.createdAt)}
                />
                <InfoRow
                  label={t("tickets.field.updatedAt")}
                  value={formatDate(ticket.updatedAt)}
                />
                {ticket.reviewedBy && (
                  <InfoRow
                    label={t("tickets.field.reviewedBy")}
                    value={resolveUserDisplay(ticket.reviewedBy)}
                  />
                )}
                {ticket.reviewedAt && (
                  <InfoRow
                    label={t("tickets.field.reviewedAt")}
                    value={formatDate(ticket.reviewedAt)}
                  />
                )}
                {ticket.resolutionNote && (
                  <InfoRow
                    label={t("tickets.field.resolutionNote")}
                    value={ticket.resolutionNote}
                    full
                  />
                )}
              </div>
            </div>

            {/* Payload section */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-4 border-b border-[#222] pb-2">
                {t("tickets.field.payload")}
              </h3>
              {renderPayload()}
            </div>

            {/* Resolution Entities */}
            {ticket.resolutionEntities && ticket.resolutionEntities.length > 0 && (
              <div className="bg-[#111] border border-[#222] rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-4 border-b border-[#222] pb-2">
                  {t("tickets.field.resolutionEntities")}
                </h3>
                <div className="flex flex-col gap-2">
                  {ticket.resolutionEntities.map((entity, idx) => {
                    const idStr = resolveDisplay(entity.entityId);
                    return (
                      <ResolutionEntityRow key={idx} entity={entity} fallbackDisplay={idStr} />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            {!isTerminal ? (
              <div
                className="flex flex-wrap gap-3 border-t border-[#222] pt-4"
                data-help-id="tickets-detail-actions"
              >
                {ticket.status === "pending" && canReview && (
                  <button
                    onClick={guard("tickets:review", () => onReview(ticket._id))}
                    aria-disabled={!isAllowed("tickets:review")}
                    className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors ${!isAllowed("tickets:review") ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <ClipboardCheck size={16} />
                    {t("tickets.action.review")}
                  </button>
                )}
                {ticket.status === "in_review" && canApprove && (
                  <button
                    onClick={guard("tickets:approve", () => onApprove(ticket))}
                    aria-disabled={!isAllowed("tickets:approve")}
                    className={`flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors ${!isAllowed("tickets:approve") ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <CheckCircle size={16} />
                    {t("tickets.action.approve")}
                  </button>
                )}
                {ticket.status === "in_review" && canReject && (
                  <button
                    onClick={guard("tickets:reject", () => onReject(ticket))}
                    aria-disabled={!isAllowed("tickets:reject")}
                    className={`flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors ${!isAllowed("tickets:reject") ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <XCircle size={16} />
                    {t("tickets.action.reject")}
                  </button>
                )}
                {(ticket.status === "pending" || ticket.status === "in_review") && canCancel && (
                  <button
                    onClick={guard("tickets:cancel", () => onCancel(ticket._id))}
                    aria-disabled={!isAllowed("tickets:cancel")}
                    className={`flex items-center gap-2 px-4 py-2 bg-[#222] text-gray-300 text-sm font-semibold rounded-lg hover:bg-[#333] transition-colors ${!isAllowed("tickets:cancel") ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Ban size={16} />
                    {t("tickets.action.cancel")}
                  </button>
                )}
              </div>
            ) : (
              ticket.status === "approved" &&
              ticket.type === "transfer_request" &&
              canCreateTransfer && (
                <div
                  className="flex flex-wrap gap-3 border-t border-[#222] pt-4"
                  data-help-id="tickets-detail-fulfillment-action"
                >
                  <button
                    onClick={guard("transfers:create", () => setShowFulfillmentModal(true))}
                    aria-disabled={!isAllowed("transfers:create")}
                    className={`flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors ${!isAllowed("transfers:create") ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Package size={16} />
                    {t("tickets.action.createTransfer")}
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {showFulfillmentModal && (
        <TicketFulfillmentModal
          ticketId={ticket._id}
          onClose={() => setShowFulfillmentModal(false)}
          onSuccess={() => {
            setShowFulfillmentModal(false);
            onClose();
          }}
        />
      )}
    </div>
  );
};

const ResolutionEntityRow: React.FC<{
  entity: { entityId: string; entityType: string };
  fallbackDisplay: string;
}> = ({ entity, fallbackDisplay }) => {
  const { t } = useLanguage();
  const [code, setCode] = useState<string | null>(null);

  const safeType = String(
    entity.entityType || (entity as Record<string, unknown>).entityModel || "",
  ).toLowerCase();

  useEffect(() => {
    let cancelled = false;
    const fetchCode = async () => {
      try {
        if (safeType === "transferrequest" || safeType === "transfer_request") {
          const res = await getTransferRequest(entity.entityId);
          if (!cancelled && res.request?.code) {
            setCode(res.request.code);
          }
        } else if (safeType === "transfer") {
          const res = await getTransfer(entity.entityId);
          if (!cancelled && res.data?.transfer?.code) {
            setCode(res.data.transfer.code);
          }
        }
      } catch {
        // Ignored
      }
    };
    fetchCode();
    return () => {
      cancelled = true;
    };
  }, [entity.entityId, safeType]);

  const rawKey = `tickets.resolutionEntity.${safeType}`;
  let typeLabel = t(rawKey as Parameters<typeof t>[0]);
  if (typeLabel === rawKey) {
    if (safeType === "transferrequest" || safeType === "transfer_request") {
      const explicitKey = t("tickets.resolutionEntity.transferRequest" as Parameters<typeof t>[0]);
      typeLabel =
        explicitKey !== "tickets.resolutionEntity.transferRequest"
          ? explicitKey
          : "Transfer Request";
    } else if (safeType === "transfer") {
      const explicitKey = t("tickets.resolutionEntity.transfer" as Parameters<typeof t>[0]);
      typeLabel = explicitKey !== "tickets.resolutionEntity.transfer" ? explicitKey : "Transfer";
    } else {
      typeLabel =
        entity.entityType ||
        String((entity as Record<string, unknown>).entityModel || "Unknown Entity");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
        {typeLabel}:
      </span>
      <span className="text-sm text-white font-mono bg-[#222] px-2 py-0.5 rounded">
        {code || fallbackDisplay}
      </span>
    </div>
  );
};

/** Small helper to render a label/value pair. */
const InfoRow: React.FC<{
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  full?: boolean;
}> = ({ label, value, mono, full }) => (
  <div className={full ? "col-span-full" : ""}>
    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">{label}</p>
    <div className={`text-sm text-gray-200 ${mono ? "font-mono" : ""} break-words`}>{value}</div>
  </div>
);
