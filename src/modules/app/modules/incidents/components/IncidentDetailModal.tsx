import React, { useState } from "react";
import { X, AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";
import type { Incident, IncidentType } from "../../../../../types/api";

interface IncidentDetailModalProps {
  /** The incident to display */
  incident: Incident;
  /** Whether the UI language is Spanish */
  isEs: boolean;
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

const TYPE_LABELS: Record<IncidentType, { en: string; es: string }> = {
  damage: { en: "Damage", es: "Daño" },
  lost: { en: "Lost", es: "Perdido" },
  overdue: { en: "Overdue", es: "Vencido" },
  issue: { en: "Issue", es: "Problema" },
  replacement: { en: "Replacement", es: "Reemplazo" },
  extended: { en: "Extended", es: "Extendido" },
  other: { en: "Other", es: "Otro" },
};

const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-blue-900/30 text-blue-300 border-blue-500/30",
  medium: "bg-amber-900/30 text-amber-300 border-amber-500/30",
  high: "bg-orange-900/30 text-orange-300 border-orange-500/30",
  critical: "bg-red-900/30 text-red-300 border-red-500/30",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-red-900/30 text-red-300 border-red-500/30",
  acknowledged: "bg-amber-900/30 text-amber-300 border-amber-500/30",
  resolved: "bg-green-900/30 text-green-300 border-green-500/30",
  dismissed: "bg-gray-800/30 text-gray-400 border-gray-600/30",
};

/**
 * Detail modal for viewing an incident and performing actions.
 */
export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  isEs,
  canUpdate,
  onClose,
  onAcknowledge,
  onResolve,
  onDismiss,
}) => {
  const [resolution, setResolution] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const handleAction = async (action: "acknowledge" | "resolve" | "dismiss") => {
    setActionError("");

    if ((action === "resolve" || action === "dismiss") && !resolution.trim()) {
      setActionError(
        isEs
          ? "La resolución es obligatoria para esta acción."
          : "Resolution text is required for this action.",
      );
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

  const formatDate = (date: string) =>
    new Date(date).toLocaleString(isEs ? "es-CO" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const isTerminal = incident.status === "resolved" || incident.status === "dismissed";

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
              <h2 className="text-lg font-bold text-white">
                {isEs ? "Detalle de Novedad" : "Incident Detail"}
              </h2>
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
          {/* Status + Severity + Type badges */}
          <div className="flex flex-wrap gap-3">
            <span
              className={`inline-block px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_STYLES[incident.status]}`}
            >
              {incident.status}
            </span>
            <span
              className={`inline-block px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${SEVERITY_STYLES[incident.severity]}`}
            >
              {incident.severity}
            </span>
            <span className="inline-block px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#444] bg-[#222] text-gray-300">
              {isEs ? TYPE_LABELS[incident.type].es : TYPE_LABELS[incident.type].en}
            </span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <InfoField
              label={isEs ? "ID del Préstamo" : "Loan ID"}
              value={typeof incident.loanId === "object" ? incident.loanId._id : incident.loanId}
              mono
            />
            <InfoField
              label={isEs ? "Tipo de Origen" : "Source Type"}
              value={incident.sourceType}
            />
            <InfoField label={isEs ? "Creado" : "Created"} value={formatDate(incident.createdAt)} />
            <InfoField
              label={isEs ? "Actualizado" : "Updated"}
              value={formatDate(incident.updatedAt)}
            />
            {incident.resolvedAt && (
              <InfoField
                label={isEs ? "Resuelto" : "Resolved"}
                value={formatDate(incident.resolvedAt)}
              />
            )}
          </div>

          {/* Description */}
          {incident.description && (
            <div>
              <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
                {isEs ? "Descripción" : "Description"}
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
                {isEs ? "Instancias de Material" : "Material Instances"}
              </label>
              <div className="flex flex-wrap gap-2">
                {incident.relatedMaterialInstances.map((id) => (
                  <span
                    key={id}
                    className="px-2.5 py-1 bg-[#121212] border border-[#333] rounded-lg text-xs text-gray-400 font-mono"
                  >
                    {id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Financial Impact */}
          {incident.financialImpact && (
            <div>
              <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
                {isEs ? "Impacto Financiero" : "Financial Impact"}
              </label>
              <div className="bg-[#121212] border border-[#222] rounded-lg p-4 grid grid-cols-2 gap-3">
                <InfoField
                  label={isEs ? "Estimado" : "Estimated"}
                  value={`${incident.financialImpact.currency ?? ""} ${incident.financialImpact.estimated?.toLocaleString() ?? "-"}`}
                />
                {incident.financialImpact.actual !== undefined && (
                  <InfoField
                    label={isEs ? "Real" : "Actual"}
                    value={`${incident.financialImpact.currency ?? ""} ${incident.financialImpact.actual.toLocaleString()}`}
                  />
                )}
              </div>
            </div>
          )}

          {/* Resolution */}
          {incident.resolution && (
            <div>
              <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
                {isEs ? "Resolución" : "Resolution"}
              </label>
              <p className="text-sm text-gray-300 bg-green-900/10 border border-green-500/20 rounded-lg p-4">
                {incident.resolution}
              </p>
            </div>
          )}

          {/* Action Area */}
          {canUpdate && !isTerminal && (
            <div className="border-t border-[#222] pt-5 space-y-4">
              {actionError && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3">
                  <p className="text-red-300 text-sm">{actionError}</p>
                </div>
              )}

              {/* Resolution textarea for resolve/dismiss */}
              <div>
                <label className="block text-xs text-gray-400 font-semibold mb-1.5">
                  {isEs ? "Texto de resolución" : "Resolution text"}
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={2}
                  placeholder={
                    isEs
                      ? "Ingrese la resolución para resolver o descartar..."
                      : "Enter resolution to resolve or dismiss..."
                  }
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
                    {isEs ? "Reconocer" : "Acknowledge"}
                  </button>
                )}
                <button
                  onClick={() => handleAction("dismiss")}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2.5 border border-[#444] text-gray-300 hover:text-white hover:border-[#555] rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                >
                  <XCircle size={14} />
                  {isEs ? "Descartar" : "Dismiss"}
                </button>
                <button
                  onClick={() => handleAction("resolve")}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white font-bold rounded-lg text-sm hover:bg-green-600 transition-colors disabled:opacity-60"
                >
                  <CheckCircle size={14} />
                  {isEs ? "Resolver" : "Resolve"}
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
