import React, { useState, useEffect } from "react";
import { X, AlertTriangle, Plus, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { SearchableSelect } from "../../../../../components/ui";
import type { SelectOption } from "../../../../../components/ui";
import { getLoans } from "../../../../../services/loanService";
import { getMaterialInstances } from "../../../../../services/materialService";
import type {
  CreateIncidentPayload,
  IncidentType,
  IncidentSeverity,
} from "../../../../../types/api";

interface CreateIncidentModalProps {
  /** Whether the UI language is Spanish */
  isEs: boolean;
  /** Close the modal */
  onClose: () => void;
  /** Submit the payload — parent handles success toast & close */
  onSave: (payload: CreateIncidentPayload) => Promise<void>;
}

const TYPE_OPTIONS: { value: IncidentType; en: string; es: string }[] = [
  { value: "damage", en: "Damage", es: "Daño" },
  { value: "lost", en: "Lost", es: "Perdido" },
  { value: "overdue", en: "Overdue", es: "Vencido" },
  { value: "issue", en: "Issue", es: "Problema" },
  { value: "replacement", en: "Replacement", es: "Reemplazo" },
  { value: "extended", en: "Extended", es: "Extendido" },
  { value: "other", en: "Other", es: "Otro" },
];

const SEVERITY_OPTIONS: { value: IncidentSeverity; en: string; es: string }[] = [
  { value: "low", en: "Low", es: "Baja" },
  { value: "medium", en: "Medium", es: "Media" },
  { value: "high", en: "High", es: "Alta" },
  { value: "critical", en: "Critical", es: "Crítica" },
];

/**
 * Modal form for creating a new incident report linked to a loan.
 */
export const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  isEs,
  onClose,
  onSave,
}) => {
  const [loanId, setLoanId] = useState("");
  const [type, setType] = useState<IncidentType>("damage");
  const [severity, setSeverity] = useState<IncidentSeverity>("medium");
  const [description, setDescription] = useState("");
  const [materialInstances, setMaterialInstances] = useState<string[]>([]);
  const [currentInstance, setCurrentInstance] = useState("");
  const [instancesExpanded, setInstancesExpanded] = useState(true);
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [loanOptions, setLoanOptions] = useState<SelectOption[]>([]);
  const [instanceOptions, setInstanceOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    getLoans({ limit: 100 })
      .then((res) => {
        const options = res.data.loans.map((loan) => {
          let customerName = "Unknown";
          if (typeof loan.customerId === "object" && loan.customerId !== null) {
            const cust = loan.customerId as unknown as Record<string, unknown>;
            if ("name" in cust) {
              const nm = cust.name as unknown as Record<string, string>;
              customerName = `${nm.firstName}${nm.secondName ? ` ${nm.secondName}` : ""} ${nm.firstSurname}${nm.secondSurname ? ` ${nm.secondSurname}` : ""}`.trim();
            } else if ("_id" in cust) {
              customerName = String(cust._id);
            }
          } else {
            customerName = String(loan.customerId);
          }
          return {
            value: loan._id,
            label: `${loan._id.slice(-6).toUpperCase()} — ${customerName} (${loan.status})`,
          };
        });
        setLoanOptions(options);
      })
      .catch(() => {
        /* fail silently — user can still type */
      });

    getMaterialInstances()
      .then((res) => {
        const options = (res.data.instances ?? []).map((inst) => ({
          value: inst._id,
          label: `${inst.serialNumber} — ${inst.model.name}`,
        }));
        setInstanceOptions(options);
      })
      .catch(() => {
        /* fail silently */
      });
  }, []);

  const addInstance = () => {
    if (!currentInstance || materialInstances.includes(currentInstance)) return;
    setMaterialInstances((prev) => [...prev, currentInstance]);
    setCurrentInstance("");
  };

  const removeInstance = (id: string) => {
    setMaterialInstances((prev) => prev.filter((i) => i !== id));
  };

  const getInstanceLabel = (id: string) =>
    instanceOptions.find((o) => o.value === id)?.label ?? id.slice(-8);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!loanId.trim()) {
      setFormError(isEs ? "El préstamo es obligatorio." : "Loan is required.");
      return;
    }
    if (!description.trim()) {
      setFormError(isEs ? "La descripción es obligatoria." : "Description is required.");
      return;
    }

    const payload: CreateIncidentPayload = {
      loanId: loanId.trim(),
      type,
      severity,
      description: description.trim(),
    };

    if (materialInstances.length > 0) {
      payload.relatedMaterialInstances = materialInstances;
    }

    const amount = parseFloat(estimatedAmount);
    if (!isNaN(amount) && amount > 0) {
      payload.financialImpact = {
        estimated: amount,
        currency: "COP",
      };
    }

    setSubmitting(true);
    try {
      await onSave(payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFD700]/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-[#FFD700]" />
            </div>
            <h2 className="text-lg font-bold text-white">
              {isEs ? "Reportar Novedad" : "Report Incident"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white hover:bg-[#222] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {formError && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3">
              <p className="text-red-300 text-sm">{formError}</p>
            </div>
          )}

          {/* Loan */}
          <SearchableSelect
            options={loanOptions}
            value={loanId}
            onChange={setLoanId}
            label={isEs ? "Préstamo *" : "Loan *"}
            placeholder={isEs ? "Buscar préstamo…" : "Search loan…"}
          />

          {/* Type + Severity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 font-semibold mb-1.5">
                {isEs ? "Tipo *" : "Type *"}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as IncidentType)}
                className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700]"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {isEs ? o.es : o.en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-semibold mb-1.5">
                {isEs ? "Severidad *" : "Severity *"}
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700]"
              >
                {SEVERITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {isEs ? o.es : o.en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-gray-400 font-semibold mb-1.5">
              {isEs ? "Descripción *" : "Description *"}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={
                isEs ? "Describe la novedad en detalle..." : "Describe the incident in detail..."
              }
              className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all resize-none"
            />
          </div>

          {/* Related Material Instances */}
          <div>
            <button
              type="button"
              onClick={() => setInstancesExpanded((prev) => !prev)}
              disabled={!loanId}
              className="flex items-center gap-2 text-xs text-gray-400 font-semibold mb-2 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {instancesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {isEs ? "Instancias de Material" : "Material Instances"}
              {materialInstances.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-[#FFD700]/20 text-[#FFD700] rounded text-[10px] font-bold">
                  {materialInstances.length}
                </span>
              )}
            </button>

            {!loanId && (
              <p className="text-xs text-gray-500 mb-3">
                {isEs ? "Selecciona un préstamo primero para agregar instancias de material." : "Select a loan first to add material instances."}
              </p>
            )}

            {instancesExpanded && loanId && (
              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      options={instanceOptions.filter((o) => !materialInstances.includes(o.value))}
                      value={currentInstance}
                      onChange={setCurrentInstance}
                      placeholder={isEs ? "Buscar instancia…" : "Search instance…"}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addInstance}
                    disabled={!currentInstance}
                    className="p-2.5 bg-[#FFD700] text-black rounded-lg hover:bg-[#e6c200] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title={isEs ? "Agregar" : "Add"}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {materialInstances.length > 0 && (
                  <div className="space-y-1.5">
                    {materialInstances.map((id) => (
                      <div
                        key={id}
                        className="flex items-center justify-between bg-[#121212] border border-[#333] rounded-lg px-3 py-2"
                      >
                        <span className="text-xs text-gray-300 truncate">
                          {getInstanceLabel(id)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeInstance(id)}
                          className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                          title={isEs ? "Eliminar" : "Remove"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Financial Impact */}
          <div>
            <label className="block text-xs text-gray-400 font-semibold mb-1.5">
              {isEs ? "Monto Estimado (COP)" : "Estimated Amount (COP)"}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={estimatedAmount}
              onChange={(e) => setEstimatedAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-[#333] text-gray-400 hover:text-white hover:border-[#444] rounded-lg text-sm font-medium transition-colors"
            >
              {isEs ? "Cancelar" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#FFD700] text-black font-bold rounded-lg text-sm hover:bg-[#e6c200] transition-colors disabled:opacity-60"
            >
              {submitting ? (isEs ? "Enviando..." : "Submitting...") : isEs ? "Reportar" : "Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
