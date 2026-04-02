import React, { useState, useEffect } from "react";
import { X, AlertTriangle, Plus, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { SearchableSelect } from "../../../../../components/ui";
import type { SelectOption } from "../../../../../components/ui";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { getLoans } from "../../../../../services/loanService";
import { getMaterialInstances } from "../../../../../services/materialService";
import type {
  CreateIncidentPayload,
  IncidentType,
  IncidentSeverity,
  IncidentContext,
} from "../../../../../types/api";

interface CreateIncidentModalProps {
  /** Close the modal */
  onClose: () => void;
  /** Submit the payload — parent handles success toast & close */
  onSave: (payload: CreateIncidentPayload) => Promise<void>;
}

const INCIDENT_TYPES: IncidentType[] = [
  "damage",
  "lost",
  "overdue",
  "issue",
  "replacement",
  "extended",
  "other",
];

const SEVERITIES: IncidentSeverity[] = ["low", "medium", "high", "critical"];

const CONTEXTS: IncidentContext[] = ["loan", "transit", "storage", "maintenance", "other"];

/**
 * Modal form for creating a new incident report.
 * Supports multiple contexts: loan, transit, storage, maintenance, and other.
 */
export const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({ onClose, onSave }) => {
  const { t } = useLanguage();

  const [context, setContext] = useState<IncidentContext>("loan");
  const [loanId, setLoanId] = useState("");
  const [locationId, setLocationId] = useState("");
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
              customerName =
                `${nm.firstName}${nm.secondName ? ` ${nm.secondName}` : ""} ${nm.firstSurname}${nm.secondSurname ? ` ${nm.secondSurname}` : ""}`.trim();
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

    if (context === "loan" && !loanId.trim()) {
      setFormError(t("incidents.loanRequired"));
      return;
    }

    const payload: CreateIncidentPayload = {
      context,
      type,
      severity,
    };

    if (context === "loan" && loanId.trim()) {
      payload.loanId = loanId.trim();
    }

    if (locationId.trim()) {
      payload.locationId = locationId.trim();
    }

    if (description.trim()) {
      payload.description = description.trim();
    }

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
      <div
        className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        data-help-id="incidents-create-form"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFD700]/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-[#FFD700]" />
            </div>
            <h2 className="text-lg font-bold text-white">{t("incidents.reportIncident")}</h2>
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

          {/* Context */}
          <div data-help-id="incidents-context">
            <label className="block text-xs text-gray-400 font-semibold mb-1.5">
              {t("incidents.context")} *
            </label>
            <select
              value={context}
              onChange={(e) => {
                setContext(e.target.value as IncidentContext);
                if (e.target.value !== "loan") {
                  setLoanId("");
                  setMaterialInstances([]);
                }
              }}
              className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700]"
            >
              {CONTEXTS.map((c) => (
                <option key={c} value={c}>
                  {t(`incidents.contexts.${c}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Loan (only when context is loan) */}
          {context === "loan" && (
            <SearchableSelect
              options={loanOptions}
              value={loanId}
              onChange={setLoanId}
              label={`${t("incidents.loan")} *`}
              placeholder={t("incidents.loanPlaceholder")}
              data-help-id="incidents-loan-select"
            />
          )}

          {/* Location */}
          <div data-help-id="incidents-location">
            <label className="block text-xs text-gray-400 font-semibold mb-1.5">
              {t("incidents.location")}
            </label>
            <input
              type="text"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              placeholder={t("incidents.location")}
              className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all"
            />
          </div>

          {/* Type + Severity */}
          <div className="grid grid-cols-2 gap-4" data-help-id="incidents-type-severity">
            <div>
              <label className="block text-xs text-gray-400 font-semibold mb-1.5">
                {t("incidents.type")} *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as IncidentType)}
                className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700]"
              >
                {INCIDENT_TYPES.map((iType) => (
                  <option key={iType} value={iType}>
                    {t(`incidents.types.${iType}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-semibold mb-1.5">
                {t("incidents.severity")} *
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700]"
              >
                {SEVERITIES.map((sev) => (
                  <option key={sev} value={sev}>
                    {t(`incidents.severities.${sev}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div data-help-id="incidents-description">
            <label className="block text-xs text-gray-400 font-semibold mb-1.5">
              {t("incidents.description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t("incidents.descriptionPlaceholder")}
              className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all resize-none"
            />
          </div>

          {/* Related Material Instances */}
          <div>
            <button
              type="button"
              onClick={() => setInstancesExpanded((prev) => !prev)}
              disabled={context === "loan" && !loanId}
              className="flex items-center gap-2 text-xs text-gray-400 font-semibold mb-2 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {instancesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {t("incidents.materialInstances")}
              {materialInstances.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-[#FFD700]/20 text-[#FFD700] rounded text-[10px] font-bold">
                  {materialInstances.length}
                </span>
              )}
            </button>

            {context === "loan" && !loanId && (
              <p className="text-xs text-gray-500 mb-3">{t("incidents.materialInstancesNote")}</p>
            )}

            {instancesExpanded && (context !== "loan" || loanId) && (
              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      options={instanceOptions.filter((o) => !materialInstances.includes(o.value))}
                      value={currentInstance}
                      onChange={setCurrentInstance}
                      placeholder={t("incidents.materialInstances")}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addInstance}
                    disabled={!currentInstance}
                    className="p-2.5 bg-[#FFD700] text-black rounded-lg hover:bg-[#e6c200] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
          <div data-help-id="incidents-financial-impact">
            <label className="block text-xs text-gray-400 font-semibold mb-1.5">
              {t("incidents.estimatedAmount")} (COP)
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
          <div className="flex justify-end gap-3 pt-2" data-help-id="incidents-form-actions">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-[#333] text-gray-400 hover:text-white hover:border-[#444] rounded-lg text-sm font-medium transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#FFD700] text-black font-bold rounded-lg text-sm hover:bg-[#e6c200] transition-colors disabled:opacity-60"
            >
              {submitting ? t("incidents.submitting") : t("incidents.report")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
