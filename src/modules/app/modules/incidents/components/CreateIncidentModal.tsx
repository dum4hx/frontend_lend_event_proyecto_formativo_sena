import React, { useState, useEffect } from "react";
import { Plus, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { FormModal, SearchableSelect } from "../../../../../components/ui";
import type { SelectOption } from "../../../../../components/ui";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { getLoans } from "../../../../../services/loanService";
import { getMaterialInstances } from "../../../../../services/materialService";
import { getLocations } from "../../../../../services/warehouseOperatorService";
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
  const [actualAmount, setActualAmount] = useState("");
  const [currency, setCurrency] = useState("COP");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [loanOptions, setLoanOptions] = useState<SelectOption[]>([]);
  const [instanceOptions, setInstanceOptions] = useState<SelectOption[]>([]);
  const [locationOptions, setLocationOptions] = useState<SelectOption[]>([]);

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

    getLocations({ limit: 100 })
      .then((res) => {
        const options = (res.data.items ?? []).map((loc) => ({
          value: loc._id,
          label: loc.name,
        }));
        setLocationOptions(options);
      })
      .catch(() => {
        /* fail silently */
      });
  }, []);

  const resetForm = () => {
    setContext("loan");
    setLoanId("");
    setLocationId("");
    setType("damage");
    setSeverity("medium");
    setDescription("");
    setMaterialInstances([]);
    setCurrentInstance("");
    setInstancesExpanded(true);
    setEstimatedAmount("");
    setActualAmount("");
    setCurrency("COP");
    setFormError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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

  const handleSubmit = async () => {
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

    const estimated = parseFloat(estimatedAmount);
    const actual = parseFloat(actualAmount);
    const hasFinancial = (!isNaN(estimated) && estimated > 0) || (!isNaN(actual) && actual > 0);
    if (hasFinancial) {
      payload.financialImpact = {
        ...(!isNaN(estimated) && estimated > 0 ? { estimated } : {}),
        ...(!isNaN(actual) && actual > 0 ? { actual } : {}),
        currency: currency.trim() || "COP",
      };
    }

    setSubmitting(true);
    try {
      await onSave(payload);
      resetForm();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      open={true}
      onClose={handleClose}
      title={t("incidents.reportIncident")}
      onSubmit={handleSubmit}
      loading={submitting}
      submitLabel={t("incidents.report")}
      cancelLabel={t("common.cancel")}
      submitDisabled={context === "loan" && !loanId.trim()}
      size="lg"
    >
      <div className="space-y-4" data-help-id="incidents-create-form">
        {formError && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3">
            <p className="text-red-300 text-sm">{formError}</p>
          </div>
        )}

        {/* Context */}
        <div data-help-id="incidents-context">
          <label className="form-label" htmlFor="incident-context">
            {t("incidents.context")} *
          </label>
          <select
            id="incident-context"
            value={context}
            onChange={(e) => {
              setContext(e.target.value as IncidentContext);
              if (e.target.value !== "loan") {
                setLoanId("");
                setMaterialInstances([]);
              }
            }}
            className="form-input"
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
          <div data-help-id="incidents-loan-select">
            <SearchableSelect
              options={loanOptions}
              value={loanId}
              onChange={setLoanId}
              label={`${t("incidents.loan")} *`}
              placeholder={t("incidents.loanPlaceholder")}
            />
          </div>
        )}

        {/* Location */}
        <div data-help-id="incidents-location">
          <SearchableSelect
            options={locationOptions}
            value={locationId}
            onChange={setLocationId}
            label={t("incidents.location")}
            placeholder={t("incidents.location")}
          />
        </div>

        {/* Type + Severity */}
        <div className="grid grid-cols-2 gap-4" data-help-id="incidents-type-severity">
          <div>
            <label className="form-label" htmlFor="incident-type">
              {t("incidents.type")} *
            </label>
            <select
              id="incident-type"
              value={type}
              onChange={(e) => setType(e.target.value as IncidentType)}
              className="form-input"
            >
              {INCIDENT_TYPES.map((iType) => (
                <option key={iType} value={iType}>
                  {t(`incidents.types.${iType}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="incident-severity">
              {t("incidents.severity")} *
            </label>
            <select
              id="incident-severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
              className="form-input"
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
          <label className="form-label" htmlFor="incident-description">
            {t("incidents.description")}
          </label>
          <textarea
            id="incident-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={t("incidents.descriptionPlaceholder")}
            className="form-input resize-none"
          />
        </div>

        {/* Related Material Instances */}
        <div data-help-id="incidents-material-instances">
          <button
            type="button"
            onClick={() => setInstancesExpanded((prev) => !prev)}
            disabled={context === "loan" && !loanId}
            className="flex items-center gap-2 form-label mb-2 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                  className="btn-primary p-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                </button>
              </div>

              {materialInstances.length > 0 && (
                <div className="space-y-1.5">
                  {materialInstances.map((id) => (
                    <div key={id} className="flex items-center justify-between form-input py-2">
                      <span className="text-xs text-gray-300 truncate">{getInstanceLabel(id)}</span>
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
          <label className="form-label">{t("incidents.financialImpact")}</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label text-xs" htmlFor="incident-estimated-amount">
                {t("incidents.estimatedAmount")}
              </label>
              <input
                id="incident-estimated-amount"
                type="number"
                min="0"
                step="0.01"
                value={estimatedAmount}
                onChange={(e) => setEstimatedAmount(e.target.value)}
                placeholder="0.00"
                className="form-input font-mono"
              />
            </div>
            <div>
              <label className="form-label text-xs" htmlFor="incident-actual-amount">
                {t("incidents.actualAmount")}
              </label>
              <input
                id="incident-actual-amount"
                type="number"
                min="0"
                step="0.01"
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
                placeholder="0.00"
                className="form-input font-mono"
              />
            </div>
            <div>
              <label className="form-label text-xs" htmlFor="incident-currency">
                {t("incidents.currency")}
              </label>
              <input
                id="incident-currency"
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="COP"
                maxLength={10}
                className="form-input"
              />
            </div>
          </div>
        </div>
      </div>
    </FormModal>
  );
};
