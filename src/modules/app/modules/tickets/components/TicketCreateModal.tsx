import React, { useState, useEffect, useMemo, useCallback } from "react";
import { X, Plus, Trash2, Loader2, CheckCircle, UserCheck } from "lucide-react";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { useAuth } from "../../../../../contexts/useAuth";
import { SearchableSelect } from "../../../../../components/ui";
import type { SelectOption } from "../../../../../components/ui/SearchableSelect";
import {
  validateTicketTitle,
  validateTicketDescription,
  validateFutureDate,
} from "../../../../../utils/validators";
import { getLocations } from "../../../../../services/warehouseOperatorService";
import { getMaterialTypes } from "../../../../../services/materialService";
import { getCapableUsers, updateTicket } from "../../../../../services/ticketService";
import type { CreateTicketPayload, Ticket, TicketType } from "../../../../../types/api";

const TICKET_TYPES: { value: TicketType; key: string }[] = [
  { value: "transfer_request", key: "tickets.type.transfer_request" },
];

interface TicketCreateModalProps {
  /** Close the modal. */
  onClose: () => void;
  /** Submit the new ticket. Returns the created Ticket entity. */
  onSave: (payload: CreateTicketPayload) => Promise<Ticket>;
}

/**
 * Two-step create modal for transfer request tickets.
 *
 * Step 1 — form: collects all ticket details and creates the ticket.
 * Step 2 — assign: calls GET /tickets/:id/capable-users to populate an
 *   optional assignee dropdown so the creator can hand off the ticket
 *   immediately after creation.
 */
export const TicketCreateModal: React.FC<TicketCreateModalProps> = ({ onClose, onSave }) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  // ── Step tracking ──────────────────────────────────────────────────────
  type ModalStep = 1 | 2;
  const [step, setStep] = useState<ModalStep>(1);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  // ── Global loading/error ───────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  // ── Step 1 dropdown options ────────────────────────────────────────────
  const [locationOptions, setLocationOptions] = useState<SelectOption[]>([]);
  const [materialTypeOptions, setMaterialTypeOptions] = useState<SelectOption[]>([]);

  // ── Step 1 fields ──────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationId, setLocationId] = useState("");
  const [responseDeadline, setResponseDeadline] = useState("");

  // Transfer request sub-fields
  const [toLocationId, setToLocationId] = useState("");
  const [transferItems, setTransferItems] = useState<
    Array<{ materialTypeId: string; quantity: number }>
  >([{ materialTypeId: "", quantity: 1 }]);
  const [neededBy, setNeededBy] = useState("");

  // ── Step 2 — capable-users assignment ─────────────────────────────────
  const [loadingCapable, setLoadingCapable] = useState(false);
  const [capableOptions, setCapableOptions] = useState<SelectOption[]>([]);
  const [capableAssigneeId, setCapableAssigneeId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");

  // ── Step 1 validation ──────────────────────────────────────────────────
  const titleError = title ? validateTicketTitle(title).message : undefined;
  const descriptionError = description ? validateTicketDescription(description).message : undefined;
  const deadlineError = responseDeadline ? validateFutureDate(responseDeadline).message : undefined;
  const neededByError = neededBy ? validateFutureDate(neededBy).message : undefined;

  // ── Fetch locations and material types on mount ────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingData(true);
      try {
        const userLocationIds = user?.locations ?? [];

        const [locRes, mtRes] = await Promise.all([
          getLocations({ limit: 100 }),
          getMaterialTypes({ limit: 100 }),
        ]);

        if (cancelled) return;

        const allLocations = locRes.data.items ?? [];
        const userLocations =
          userLocationIds.length > 0
            ? allLocations.filter((loc) => userLocationIds.includes(loc._id))
            : allLocations;

        const locOpts: SelectOption[] = userLocations.map((loc) => ({
          value: loc._id,
          label: loc.name,
        }));
        setLocationOptions(locOpts);

        if (locOpts.length === 1) {
          setLocationId(locOpts[0].value);
        }

        const types = mtRes.data.materialTypes ?? [];
        setMaterialTypeOptions(
          types.map((mt) => ({ value: mt._id, label: `${mt.name} (${mt.code})` })),
        );
      } catch {
        // Silently fail — user can still proceed
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.locations]);

  // Destination location options: all user locations (same origin allowed)
  const toLocationOptions = locationOptions;

  const isFormValid = useMemo(() => {
    if (!title || validateTicketTitle(title).message) return false;
    if (description && validateTicketDescription(description).message) return false;
    if (!locationId) return false;
    if (responseDeadline && validateFutureDate(responseDeadline).message) return false;
    if (!toLocationId) return false;
    if (transferItems.some((i) => !i.materialTypeId || i.quantity < 1)) return false;
    if (neededBy && validateFutureDate(neededBy).message) return false;
    return true;
  }, [title, description, locationId, responseDeadline, toLocationId, transferItems, neededBy]);

  const buildPayload = (): CreateTicketPayload | null => {
    if (!locationId || !toLocationId) return null;

    return {
      locationId,
      type: "transfer_request" as const,
      title: title.trim(),
      ...(description.trim() && { description: description.trim() }),
      ...(responseDeadline && { responseDeadline: new Date(responseDeadline).toISOString() }),
      payload: {
        toLocationId,
        items: transferItems.filter((i) => i.materialTypeId),
        ...(neededBy && { neededBy: new Date(neededBy).toISOString() }),
      },
    };
  };

  // ── Step 1 submit → create ticket → transition to step 2 ──────────────
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const payload = buildPayload();
    if (!payload) return;

    setSubmitting(true);
    try {
      const ticket = await onSave(payload);
      setCreatedTicket(ticket);
      setStep(2);
      // Fetch capable users in background
      setLoadingCapable(true);
      try {
        const res = await getCapableUsers(ticket._id);
        const users = res.data.users ?? [];
        setCapableOptions(
          users.map((u) => ({
            value: u._id,
            label: `${u.name.firstName} ${u.name.firstSurname}`,
          })),
        );
      } catch {
        setCapableOptions([]);
      } finally {
        setLoadingCapable(false);
      }
    } catch (err) {
      setSubmitError((err as Error).message || t("tickets.toast.error"));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 2: assign the ticket then close ──────────────────────────────
  const handleAssign = async () => {
    if (!createdTicket || !capableAssigneeId) return;
    setAssigning(true);
    setAssignError("");
    try {
      await updateTicket(createdTicket._id, { assigneeId: capableAssigneeId });
      onClose();
    } catch (err) {
      setAssignError((err as Error).message || t("tickets.assign.error"));
    } finally {
      setAssigning(false);
    }
  };

  // ── Transfer item helpers ──────────────────────────────────────────────
  const addTransferItem = useCallback(
    () => setTransferItems((prev) => [...prev, { materialTypeId: "", quantity: 1 }]),
    [],
  );

  const removeTransferItem = useCallback(
    (index: number) => setTransferItems((prev) => prev.filter((_, i) => i !== index)),
    [],
  );

  const updateTransferItem = useCallback(
    (index: number, field: "materialTypeId" | "quantity", value: string | number) =>
      setTransferItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
      ),
    [],
  );

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* ── STEP 1: Create ticket ── */}
        {step === 1 && (
          <>
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

            {loadingData ? (
              <div className="flex items-center justify-center gap-2 p-12 text-gray-400">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">{t("tickets.loadingData")}</span>
              </div>
            ) : (
              <form
                onSubmit={handleStep1Submit}
                className="p-6 space-y-5"
                data-help-id="tickets-create-form"
              >
                {/* Type */}
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                    {t("tickets.field.type")} *
                  </label>
                  <select
                    value="transfer_request"
                    disabled
                    className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700]"
                    data-help-id="tickets-type-select"
                  >
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
                      {t(titleError)}
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
                  {descriptionError && (
                    <p className="text-error text-sm mt-1">{t(descriptionError)}</p>
                  )}
                </div>

                {/* Location */}
                {locationOptions.length > 1 && (
                  <div data-help-id="tickets-location-select">
                    <SearchableSelect
                      label={`${t("tickets.field.location")} *`}
                      options={locationOptions}
                      value={locationId}
                      onChange={setLocationId}
                      placeholder={t("tickets.selectLocation")}
                      searchPlaceholder={t("tickets.searchLocation")}
                      noResultsText={t("tickets.noLocations")}
                    />
                  </div>
                )}
                {locationOptions.length === 1 && (
                  <div>
                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                      {t("tickets.field.location")}
                    </label>
                    <p className="text-sm text-white bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5">
                      {locationOptions[0].label}
                    </p>
                  </div>
                )}

                {/* Response deadline */}
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                    {t("tickets.field.responseDeadline")}
                  </label>
                  <input
                    type="datetime-local"
                    value={responseDeadline}
                    onChange={(e) => setResponseDeadline(e.target.value)}
                    className={`w-full bg-[#121212] border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] ${deadlineError ? "border-error bg-error/10" : "border-[#333]"}`}
                    aria-invalid={!!deadlineError}
                    data-help-id="tickets-deadline-input"
                  />
                  {deadlineError && <p className="text-error text-sm mt-1">{t(deadlineError)}</p>}
                </div>

                {/* ── Transfer request payload ── */}
                <div className="border-t border-[#222] pt-4 space-y-4">
                  <h3 className="text-sm font-bold text-white">
                    {t("tickets.type.transfer_request")}
                  </h3>

                  {/* Destination location */}
                  <div data-help-id="tickets-to-location-select">
                    <SearchableSelect
                      label={`${t("tickets.payload.toLocation")} *`}
                      options={toLocationOptions}
                      value={toLocationId}
                      onChange={setToLocationId}
                      placeholder={t("tickets.selectDestination")}
                      searchPlaceholder={t("tickets.searchLocation")}
                      noResultsText={t("tickets.noLocations")}
                    />
                  </div>

                  {/* Needed by */}
                  <div>
                    <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                      {t("tickets.payload.neededBy")}
                    </label>
                    <input
                      type="datetime-local"
                      value={neededBy}
                      onChange={(e) => setNeededBy(e.target.value)}
                      className={`w-full bg-[#121212] border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] ${neededByError ? "border-error bg-error/10" : "border-[#333]"}`}
                      aria-invalid={!!neededByError}
                    />
                    {neededByError && <p className="text-error text-sm mt-1">{t(neededByError)}</p>}
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
                    <div className="space-y-3">
                      {transferItems.map((item, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <div className="flex-1">
                            <SearchableSelect
                              options={materialTypeOptions}
                              value={item.materialTypeId}
                              onChange={(val) => updateTransferItem(i, "materialTypeId", val)}
                              placeholder={t("tickets.selectMaterialType")}
                              searchPlaceholder={t("tickets.searchMaterialType")}
                              noResultsText={t("tickets.noMaterialTypes")}
                            />
                          </div>
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
                              className="p-2 text-gray-500 hover:text-red-400 transition-colors mt-0.5"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

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
            )}
          </>
        )}

        {/* ── STEP 2: Assign to capable user (optional) ── */}
        {step === 2 && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] sticky top-0 bg-[#1a1a1a] z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white">{t("tickets.assign.title")}</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-white hover:bg-[#222] rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6" data-help-id="tickets-assign-form">
              {/* Success indicator */}
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                <CheckCircle size={20} className="text-green-400 shrink-0" />
                <p className="text-sm text-green-300">{t("tickets.toast.created")}</p>
              </div>

              {/* Assignee picker */}
              <div>
                <p className="text-sm text-gray-400 mb-4">{t("tickets.assign.description")}</p>
                {loadingCapable ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm">{t("tickets.loadingData")}</span>
                  </div>
                ) : (
                  <div data-help-id="tickets-capable-user-select">
                    <SearchableSelect
                      label={t("tickets.assign.label")}
                      options={capableOptions}
                      value={capableAssigneeId}
                      onChange={setCapableAssigneeId}
                      placeholder={t("tickets.assign.placeholder")}
                      searchPlaceholder={t("tickets.searchAssignee")}
                      noResultsText={t("tickets.assign.noUsers")}
                    />
                  </div>
                )}

                {assignError && (
                  <p className="text-error text-sm mt-2 bg-error/10 border border-error/30 rounded-lg px-3 py-2">
                    {assignError}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm text-gray-400 hover:text-white bg-[#222] rounded-lg transition-colors"
                >
                  {t("tickets.assign.skip")}
                </button>
                <button
                  type="button"
                  disabled={!capableAssigneeId || assigning || loadingCapable}
                  onClick={handleAssign}
                  className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-colors ${
                    capableAssigneeId && !assigning
                      ? "bg-[#FFD700] text-black hover:bg-[#e6c200]"
                      : "bg-[#333] text-gray-500 cursor-not-allowed opacity-50"
                  }`}
                >
                  {assigning ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <UserCheck size={14} />
                  )}
                  {t("tickets.assign.confirm")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
