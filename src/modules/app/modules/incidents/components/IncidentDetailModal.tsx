import React, { useState } from "react";
import { X, AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";
import type { Incident } from "../../../../../types/api";
import { EntityLink, StatusBadge } from "../../../../../components/ui";
import { useLanguage } from "../../../../../contexts/useLanguage";

interface IncidentDetailModalProps {
  /** The incident to display */
  incident: Incident;
  /** Whether the user can perform actions (acknowledge, resolve, dismiss) */
  canUpdate: boolean;
  /** Close the modal */
  onClose: () => void;
  /** Acknowledge the incident */
  onAcknowledge: (id: string) => Promise<void>;
  /** Resolve the incident — requires resolution text */
  onResolve: (id: string, resolution: string) => Promise<void>;
  /** Dismiss the incident — requires resolution text */
  onDismiss: (id: string, resolution: string) => Promise<void>;
}

/**
 * Detail modal for viewing an incident and performing actions.
 */
export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  canUpdate,
  onClose,
  onAcknowledge,
  onResolve,
  onDismiss,
}) => {
  const { t, formatDate, formatCurrency } = useLanguage();
  const [resolution, setResolution] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const handleAction = async (action: "acknowledge" | "resolve" | "dismiss") => {
    setActionError("");

    if ((action === "resolve" || action === "dismiss") && !resolution.trim()) {
      setActionError(t("incidents.resolutionRequired"));
      return;
    }

    setActionLoading(true);
    try {
      if (action === "acknowledge") {
        await onAcknowledge(incident._id);
      } else if (action === "resolve") {
        await onResolve(incident._id, resolution.trim());
      } else {
        await onDismiss(incident._id, resolution.trim());
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  };

  const isTerminal = incident.status === "resolved" || incident.status === "dismissed";

  const loanIdValue =
    incident.loanId == null
      ? undefined
      : typeof incident.loanId === "object"
        ? incident.loanId._id
        : incident.loanId;

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
              <h2 className="text-lg font-bold text-white">{t("incidents.detail")}</h2>
              <p className="text-xs text-gray-500 font-mono">{incident._id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white hover:bg-[#222] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status + Severity + Type + Context badges */}
          <div className="flex flex-wrap gap-3" data-help-id="incidents-detail-badges">
            <StatusBadge status={incident.status} />
            <StatusBadge status={incident.severity} />
            <span className="inline-block px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#444] bg-[#222] text-gray-300">
              {t(`incidents.types.${incident.type}`)}
            </span>
            <StatusBadge status={incident.context} />
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {loanIdValue && <InfoField label={t("incidents.loanId")} value={loanIdValue} mono />}
            {incident.locationId && (
              <InfoField
                label={t("incidents.location")}
                value={
                  typeof incident.locationId === "string"
                    ? incident.locationId
                    : String(incident.locationId)
                }
              />
            )}
            <InfoField
              label={t("incidents.context")}
              value={t(`incidents.contexts.${incident.context}`)}
            />
            <InfoField
              label={t("incidents.sourceType")}
              value={t(`incidents.sourceTypes.${incident.sourceType}`)}
            />
            <InfoField label={t("incidents.created")} value={formatDate(incident.createdAt)} />
            <InfoField label={t("incidents.updated")} value={formatDate(incident.updatedAt)} />
            {incident.resolvedAt && (
              <InfoField
                label={t("incidents.resolvedAt")}
                value={formatDate(incident.resolvedAt)}
              />
            )}
          </div>

          {/* Description */}
          {incident.description && (
            <div>
              <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
                {t("incidents.description")}
              </label>
              <p className="text-sm text-gray-300 bg-[#121212] border border-[#222] rounded-lg p-4">
                {incident.description}
              </p>
            </div>
          )}

          {/* Related Material Instances */}
          {incident.relatedMaterialInstances && incident.relatedMaterialInstances.length > 0 && (
            <div>
              <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
                {t("incidents.materialInstances")}
              </label>
              <div className="flex flex-wrap gap-2">
                {incident.relatedMaterialInstances.map((id) => (
                  <EntityLink
                    key={id}
                    entityType="materialInstance"
                    entityId={id}
                    label={id}
                    className="font-mono"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Financial Impact */}
          {incident.financialImpact && (
            <div>
              <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
                {t("incidents.financialImpact")}
              </label>
              <div className="bg-[#121212] border border-[#222] rounded-lg p-4 grid grid-cols-2 gap-3">
                <InfoField
                  label={t("incidents.estimated")}
                  value={
                    incident.financialImpact.estimated != null
                      ? formatCurrency(incident.financialImpact.estimated)
                      : "-"
                  }
                />
                {incident.financialImpact.actual !== undefined && (
                  <InfoField
                    label={t("incidents.actualAmount")}
                    value={formatCurrency(incident.financialImpact.actual)}
                  />
                )}
                {incident.financialImpact.currency && (
                  <InfoField
                    label={t("incidents.currency")}
                    value={incident.financialImpact.currency}
                  />
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          {incident.metadata && Object.keys(incident.metadata).length > 0 && (
            <div>
              <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
                {t("incidents.metadata")}
              </label>
              <pre className="text-sm text-gray-300 bg-[#121212] border border-[#222] rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-words">
                {JSON.stringify(incident.metadata, null, 2)}
              </pre>
            </div>
          )}

          {/* Resolution */}
          {incident.resolution && (
            <div>
              <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
                {t("incidents.resolution")}
              </label>
              <p className="text-sm text-gray-300 bg-green-900/10 border border-green-500/20 rounded-lg p-4">
                {incident.resolution}
              </p>
            </div>
          )}

          {/* Action Area */}
          {canUpdate && !isTerminal && (
            <div
              className="border-t border-[#222] pt-5 space-y-4"
              data-help-id="incidents-detail-actions"
            >
              {actionError && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3">
                  <p className="text-red-300 text-sm">{actionError}</p>
                </div>
              )}

              {/* Resolution textarea for resolve/dismiss */}
              <div>
                <label className="block text-xs text-gray-400 font-semibold mb-1.5">
                  {t("incidents.resolutionText")}
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={2}
                  placeholder={t("incidents.resolutionPlaceholder")}
                  className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                {incident.status === "open" && (
                  <button
                    onClick={() => handleAction("acknowledge")}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white font-bold rounded-lg text-sm hover:bg-amber-500 transition-colors disabled:opacity-60"
                  >
                    <AlertTriangle size={14} />
                    {t("incidents.action.acknowledge")}
                  </button>
                )}
                <button
                  onClick={() => handleAction("dismiss")}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2.5 border border-[#444] text-gray-300 hover:text-white hover:border-[#555] rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                >
                  <XCircle size={14} />
                  {t("incidents.action.dismiss")}
                </button>
                <button
                  onClick={() => handleAction("resolve")}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white font-bold rounded-lg text-sm hover:bg-green-600 transition-colors disabled:opacity-60"
                >
                  <CheckCircle size={14} />
                  {t("incidents.action.resolve")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* Internal helper */
const InfoField: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <div>
    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-sm text-gray-300 ${mono ? "font-mono" : ""}`}>{value}</p>
  </div>
);
