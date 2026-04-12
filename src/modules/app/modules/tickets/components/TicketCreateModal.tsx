import React, { useState, useMemo } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "../../../../../contexts/useLanguage";
import {
  validateTicketTitle,
  validateTicketDescription,
  validateGenericDetails,
  validateEstimatedCost,
  validateTicketNotes,
} from "../../../../../utils/validators";
import type {
  CreateTicketPayload,
  TicketType,
  TicketSeverity,
  TicketIncidentContext,
  TicketMaintenanceEntryReason,
} from "../../../../../types/api";

interface TicketCreateModalProps {
  /** Close the modal. */
  onClose: () => void;
  /** Submit the new ticket. */
  onSave: (payload: CreateTicketPayload) => Promise<void>;
}

const TICKET_TYPES: { value: TicketType; key: string }[] = [
  { value: "transfer_request", key: "tickets.type.transfer_request" },
  { value: "incident_report", key: "tickets.type.incident_report" },
  { value: "maintenance_request", key: "tickets.type.maintenance_request" },
  { value: "inspection_request", key: "tickets.type.inspection_request" },
  { value: "generic", key: "tickets.type.generic" },
];

/**
 * Create modal for new tickets.
 * Dynamically renders payload fields based on the selected ticket type.
 */
export const TicketCreateModal: React.FC<TicketCreateModalProps> = ({ onClose, onSave }) => {
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Core fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TicketType | "">("");
  const [locationId, setLocationId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [responseDeadline, setResponseDeadline] = useState("");

  // Transfer request fields
  const [toLocationId, setToLocationId] = useState("");
  const [transferItems, setTransferItems] = useState<
    Array<{ materialTypeId: string; quantity: number }>
  >([{ materialTypeId: "", quantity: 1 }]);
  const [neededBy, setNeededBy] = useState("");

  // Incident report fields
  const [severity, setSeverity] = useState<TicketSeverity>("low");
  const [incidentContext, setIncidentContext] = useState<TicketIncidentContext>("other");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [incidentLoanId, setIncidentLoanId] = useState("");
  const [incidentInstanceIds, setIncidentInstanceIds] = useState("");

  // Maintenance request fields
  const [maintenanceInstanceIds, setMaintenanceInstanceIds] = useState("");
  const [entryReason, setEntryReason] = useState<TicketMaintenanceEntryReason>("damaged");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [maintenanceNotes, setMaintenanceNotes] = useState("");

  // Inspection request fields
  const [inspectionLoanId, setInspectionLoanId] = useState("");
  const [inspectionNotes, setInspectionNotes] = useState("");

  // Generic fields
  const [genericDetails, setGenericDetails] = useState("");

  // Validation
  const titleError = title ? validateTicketTitle(title).message : undefined;
  const descriptionError = description ? validateTicketDescription(description).message : undefined;

  const isFormValid = useMemo(() => {
    if (!title || validateTicketTitle(title).message) return false;
    if (description && validateTicketDescription(description).message) return false;
    if (!type) return false;
    if (!locationId.trim()) return false;

    switch (type) {
      case "transfer_request":
        if (!toLocationId.trim()) return false;
        if (transferItems.some((i) => !i.materialTypeId.trim() || i.quantity < 1)) return false;
        break;
      case "incident_report":
        break;
      case "maintenance_request":
        if (!maintenanceInstanceIds.trim()) return false;
        if (estimatedCost && validateEstimatedCost(estimatedCost).message) return false;
        if (maintenanceNotes && validateTicketNotes(maintenanceNotes).message) return false;
        break;
      case "inspection_request":
        if (!inspectionLoanId.trim()) return false;
        if (inspectionNotes && validateTicketNotes(inspectionNotes).message) return false;
        break;
      case "generic":
        if (!genericDetails || validateGenericDetails(genericDetails).message) return false;
        break;
    }
    return true;
  }, [
    title,
    description,
    type,
    locationId,
    toLocationId,
    transferItems,
    maintenanceInstanceIds,
    estimatedCost,
    maintenanceNotes,
    inspectionLoanId,
    inspectionNotes,
    genericDetails,
  ]);

  const buildPayload = (): CreateTicketPayload | null => {
    if (!type || !locationId) return null;

    const base: Omit<CreateTicketPayload, "payload"> = {
      locationId,
      type,
      title: title.trim(),
      ...(description.trim() && { description: description.trim() }),
      ...(assigneeId.trim() && { assigneeId: assigneeId.trim() }),
      ...(responseDeadline && { responseDeadline }),
    };

    switch (type) {
      case "transfer_request":
        return {
          ...base,
          payload: {
            toLocationId,
            items: transferItems.filter((i) => i.materialTypeId.trim()),
            ...(neededBy && { neededBy }),
          },
        };
      case "incident_report":
        return {
          ...base,
          payload: {
            severity,
            context: incidentContext,
            ...(incidentDescription.trim() && { description: incidentDescription.trim() }),
            ...(incidentLoanId.trim() && { loanId: incidentLoanId.trim() }),
            ...(incidentInstanceIds.trim() && {
              materialInstanceIds: incidentInstanceIds
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            }),
          },
        };
      case "maintenance_request":
        return {
          ...base,
          payload: {
            materialInstanceIds: maintenanceInstanceIds
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            entryReason,
            ...(estimatedCost && { estimatedCost: Number(estimatedCost) }),
            ...(maintenanceNotes.trim() && { notes: maintenanceNotes.trim() }),
          },
        };
      case "inspection_request":
        return {
          ...base,
          payload: {
            loanId: inspectionLoanId.trim(),
            ...(inspectionNotes.trim() && { notes: inspectionNotes.trim() }),
          },
        };
      case "generic":
        return {
          ...base,
          payload: { details: genericDetails.trim() },
        };
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const payload = buildPayload();
    if (!payload) return;

    setSubmitting(true);
    try {
      await onSave(payload);
    } catch (err) {
      setSubmitError((err as Error).message || t("tickets.toast.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const addTransferItem = () =>
    setTransferItems((prev) => [...prev, { materialTypeId: "", quantity: 1 }]);

  const removeTransferItem = (index: number) =>
    setTransferItems((prev) => prev.filter((_, i) => i !== index));

  const updateTransferItem = (
    index: number,
    field: "materialTypeId" | "quantity",
    value: string | number,
  ) =>
    setTransferItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] sticky top-0 bg-[#1a1a1a] z-10 rounded-t-2xl">
          <h2 className="text-lg font-bold text-white">{t("tickets.create")}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white hover:bg-[#222] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5" data-help-id="tickets-create-form">
          {/* Type */}
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {t("tickets.field.type")} *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TicketType)}
              className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700]"
              required
              data-help-id="tickets-type-select"
            >
              <option value="">{t("tickets.filterByType")}</option>
              {TICKET_TYPES.map(({ value, key }) => (
                <option key={value} value={value}>
                  {t(key)}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {t("tickets.field.title")} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full bg-[#121212] border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] ${titleError ? "border-error bg-error/10" : "border-[#333]"}`}
              placeholder={t("tickets.field.title")}
              aria-invalid={!!titleError}
              aria-describedby={titleError ? "title-error" : undefined}
              data-help-id="tickets-title-input"
            />
            {titleError && (
              <p id="title-error" className="text-error text-sm mt-1">
                {titleError}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {t("tickets.field.description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`w-full bg-[#121212] border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] resize-none ${descriptionError ? "border-error bg-error/10" : "border-[#333]"}`}
              placeholder={t("tickets.field.description")}
              aria-invalid={!!descriptionError}
              data-help-id="tickets-description-input"
            />
            {descriptionError && <p className="text-error text-sm mt-1">{descriptionError}</p>}
          </div>

          {/* Location */}
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {t("tickets.field.location")} *
            </label>
            <input
              type="text"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className={`w-full bg-[#121212] border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] font-mono ${!locationId.trim() && title ? "border-error bg-error/10" : "border-[#333]"}`}
              placeholder="Location ID"
              data-help-id="tickets-location-input"
            />
          </div>

          {/* Assignee (optional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                {t("tickets.field.assignee")}
              </label>
              <input
                type="text"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] font-mono"
                placeholder="Assignee ID"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                {t("tickets.field.responseDeadline")}
              </label>
              <input
                type="datetime-local"
                value={responseDeadline}
                onChange={(e) => setResponseDeadline(e.target.value)}
                className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700]"
              />
            </div>
          </div>

          {/* ── Dynamic payload fields ── */}
          {type === "transfer_request" && (
            <div className="border-t border-[#222] pt-4 space-y-4">
              <h3 className="text-sm font-bold text-white">{t("tickets.type.transfer_request")}</h3>
              <div>
                <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                  {t("tickets.payload.toLocation")} *
                </label>
                <input
                  type="text"
                  value={toLocationId}
                  onChange={(e) => setToLocationId(e.target.value)}
                  className={`w-full bg-[#121212] border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] font-mono ${!toLocationId.trim() ? "border-error bg-error/10" : "border-[#333]"}`}
                  placeholder="Destination location ID"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                  {t("tickets.payload.neededBy")}
                </label>
                <input
                  type="date"
                  value={neededBy}
                  onChange={(e) => setNeededBy(e.target.value)}
                  className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700]"
                />
              </div>
              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {t("tickets.payload.items")} *
                  </label>
                  <button
                    type="button"
                    onClick={addTransferItem}
                    className="flex items-center gap-1 text-xs text-[#FFD700] hover:text-[#e6c200] transition-colors"
                  >
                    <Plus size={14} /> {t("tickets.payload.addItem")}
                  </button>
                </div>
                <div className="space-y-2">
                  {transferItems.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder={t("tickets.payload.materialType")}
                        value={item.materialTypeId}
                        onChange={(e) => updateTransferItem(i, "materialTypeId", e.target.value)}
                        className="flex-1 bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFD700] font-mono"
                      />
                      <input
                        type="number"
                        min={1}
                        placeholder={t("tickets.payload.quantity")}
                        value={item.quantity}
                        onChange={(e) =>
                          updateTransferItem(i, "quantity", parseInt(e.target.value, 10) || 1)
                        }
                        className="w-24 bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFD700]"
                      />
                      {transferItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTransferItem(i)}
                          className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {type === "incident_report" && (
            <div className="border-t border-[#222] pt-4 space-y-4">
              <h3 className="text-sm font-bold text-white">{t("tickets.type.incident_report")}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                    {t("tickets.payload.severity")} *
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as TicketSeverity)}
                    className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700]"
                  >
                    <option value="low">{t("tickets.payload.severity.low")}</option>
                    <option value="medium">{t("tickets.payload.severity.medium")}</option>
                    <option value="high">{t("tickets.payload.severity.high")}</option>
                    <option value="critical">{t("tickets.payload.severity.critical")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                    {t("tickets.payload.context")} *
                  </label>
                  <select
                    value={incidentContext}
                    onChange={(e) => setIncidentContext(e.target.value as TicketIncidentContext)}
                    className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700]"
                  >
                    <option value="transit">{t("tickets.payload.context.transit")}</option>
                    <option value="storage">{t("tickets.payload.context.storage")}</option>
                    <option value="loan">{t("tickets.payload.context.loan")}</option>
                    <option value="maintenance">{t("tickets.payload.context.maintenance")}</option>
                    <option value="other">{t("tickets.payload.context.other")}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                  {t("tickets.field.description")}
                </label>
                <textarea
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                    {t("tickets.payload.loan")}
                  </label>
                  <input
                    type="text"
                    value={incidentLoanId}
                    onChange={(e) => setIncidentLoanId(e.target.value)}
                    className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] font-mono"
                    placeholder="Loan ID"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                    {t("tickets.payload.materialInstances")}
                  </label>
                  <input
                    type="text"
                    value={incidentInstanceIds}
                    onChange={(e) => setIncidentInstanceIds(e.target.value)}
                    className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] font-mono"
                    placeholder="ID1, ID2, ..."
                  />
                </div>
              </div>
            </div>
          )}

          {type === "maintenance_request" && (
            <div className="border-t border-[#222] pt-4 space-y-4">
              <h3 className="text-sm font-bold text-white">
                {t("tickets.type.maintenance_request")}
              </h3>
              <div>
                <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                  {t("tickets.payload.materialInstances")} *
                </label>
                <input
                  type="text"
                  value={maintenanceInstanceIds}
                  onChange={(e) => setMaintenanceInstanceIds(e.target.value)}
                  className={`w-full bg-[#121212] border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] font-mono ${!maintenanceInstanceIds.trim() ? "border-error bg-error/10" : "border-[#333]"}`}
                  placeholder="ID1, ID2, ..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                    {t("tickets.payload.entryReason")} *
                  </label>
                  <select
                    value={entryReason}
                    onChange={(e) => setEntryReason(e.target.value as TicketMaintenanceEntryReason)}
                    className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700]"
                  >
                    <option value="damaged">{t("tickets.payload.entryReason.damaged")}</option>
                    <option value="other">{t("tickets.payload.entryReason.other")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                    {t("tickets.payload.estimatedCost")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className={`w-full bg-[#121212] border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] ${estimatedCost && validateEstimatedCost(estimatedCost).message ? "border-error bg-error/10" : "border-[#333]"}`}
                    placeholder="0.00"
                  />
                  {estimatedCost && validateEstimatedCost(estimatedCost).message && (
                    <p className="text-error text-sm mt-1">
                      {validateEstimatedCost(estimatedCost).message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                  {t("tickets.payload.notes")}
                </label>
                <textarea
                  value={maintenanceNotes}
                  onChange={(e) => setMaintenanceNotes(e.target.value)}
                  rows={2}
                  className={`w-full bg-[#121212] border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] resize-none ${maintenanceNotes && validateTicketNotes(maintenanceNotes).message ? "border-error bg-error/10" : "border-[#333]"}`}
                />
                {maintenanceNotes && validateTicketNotes(maintenanceNotes).message && (
                  <p className="text-error text-sm mt-1">
                    {validateTicketNotes(maintenanceNotes).message}
                  </p>
                )}
              </div>
            </div>
          )}

          {type === "inspection_request" && (
            <div className="border-t border-[#222] pt-4 space-y-4">
              <h3 className="text-sm font-bold text-white">
                {t("tickets.type.inspection_request")}
              </h3>
              <div>
                <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                  {t("tickets.payload.loan")} *
                </label>
                <input
                  type="text"
                  value={inspectionLoanId}
                  onChange={(e) => setInspectionLoanId(e.target.value)}
                  className={`w-full bg-[#121212] border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] font-mono ${!inspectionLoanId.trim() ? "border-error bg-error/10" : "border-[#333]"}`}
                  placeholder="Loan ID"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                  {t("tickets.payload.notes")}
                </label>
                <textarea
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  rows={2}
                  className={`w-full bg-[#121212] border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] resize-none ${inspectionNotes && validateTicketNotes(inspectionNotes).message ? "border-error bg-error/10" : "border-[#333]"}`}
                />
                {inspectionNotes && validateTicketNotes(inspectionNotes).message && (
                  <p className="text-error text-sm mt-1">
                    {validateTicketNotes(inspectionNotes).message}
                  </p>
                )}
              </div>
            </div>
          )}

          {type === "generic" && (
            <div className="border-t border-[#222] pt-4 space-y-4">
              <h3 className="text-sm font-bold text-white">{t("tickets.type.generic")}</h3>
              <div>
                <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                  {t("tickets.payload.details")} *
                </label>
                <textarea
                  value={genericDetails}
                  onChange={(e) => setGenericDetails(e.target.value)}
                  rows={4}
                  className={`w-full bg-[#121212] border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] resize-none ${genericDetails && validateGenericDetails(genericDetails).message ? "border-error bg-error/10" : "border-[#333]"}`}
                  aria-invalid={
                    !!(genericDetails && validateGenericDetails(genericDetails).message)
                  }
                />
                {genericDetails && validateGenericDetails(genericDetails).message && (
                  <p className="text-error text-sm mt-1">
                    {validateGenericDetails(genericDetails).message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Submit error */}
          {submitError && (
            <p className="text-error text-sm bg-error/10 border border-error/30 rounded-lg px-4 py-2">
              {submitError}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-gray-400 hover:text-white bg-[#222] rounded-lg transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={!isFormValid || submitting}
              className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-colors ${
                isFormValid && !submitting
                  ? "bg-[#FFD700] text-black hover:bg-[#e6c200]"
                  : "bg-[#333] text-gray-500 cursor-not-allowed opacity-50"
              }`}
            >
              {submitting ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
