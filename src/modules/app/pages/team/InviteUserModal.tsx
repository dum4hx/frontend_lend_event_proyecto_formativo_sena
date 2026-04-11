/**
 * InviteUserModal — Create / invite a new team member.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FormModal } from "../../../../components/ui/FormModal";
import { SearchableSelect } from "../../../../components/ui/SearchableSelect";
import { useLanguage } from "../../../../contexts/useLanguage";
import { ApiError } from "../../../../lib/api";
import { inviteUser } from "../../../../services/adminService";
import { getLocations } from "../../../../services/warehouseOperatorService";
import {
  validateFirstName,
  validateLastName,
  validateEmail,
  validateRequiredPhone,
} from "../../../../utils/validators";
import type { Role } from "../../../../types/api";
import type { WarehouseLocation } from "../../../../services/warehouseOperatorService";
import type { TranslationKey } from "../../../../i18n/translations";
import {
  TEAM_PHONE_PREFIX,
  formatPhoneDigits,
  isOwnerRoleName,
  toColombianPhone,
  type TeamFormValues,
} from "./types";

interface InviteUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableRoles: Role[];
  /** If omitted, locations are fetched internally. */
  availableLocations?: WarehouseLocation[];
}

type FieldKey = keyof Omit<TeamFormValues, "locations">;

const EMPTY_FORM: TeamFormValues = {
  firstName: "",
  firstSurname: "",
  email: "",
  phone: "",
  roleId: "",
  locations: [],
};

export function InviteUserModal({
  open,
  onClose,
  onSuccess,
  availableRoles,
  availableLocations: locationsProp,
}: InviteUserModalProps) {
  const locationsQuery = useQuery({
    queryKey: ["locations", "invite-modal"],
    queryFn: () => getLocations(),
    select: (res) => res.data.items,
    enabled: locationsProp === undefined,
    staleTime: 1000 * 60 * 5,
  });
  const availableLocations: WarehouseLocation[] = locationsProp ?? locationsQuery.data ?? [];
  const { language, t } = useLanguage();
  const isEs = language === "es";

  const [form, setForm] = useState<TeamFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setForm({ ...EMPTY_FORM, roleId: availableRoles.find((r) => !r.isReadOnly)?._id ?? "" });
    setErrors({});
    setTouched({});
    setFormError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validateField(field: FieldKey, value = form[field] as string): string | undefined {
    switch (field) {
      case "firstName": {
        const r = validateFirstName(value);
        return r.isValid ? undefined : t(r.message as TranslationKey);
      }
      case "firstSurname": {
        const r = validateLastName(value);
        return r.isValid ? undefined : t(r.message as TranslationKey);
      }
      case "email": {
        const r = validateEmail(value);
        return r.isValid ? undefined : t(r.message as TranslationKey);
      }
      case "phone": {
        const r = validateRequiredPhone(toColombianPhone(value));
        return r.isValid ? undefined : t(r.message as TranslationKey);
      }
      default:
        return undefined;
    }
  }

  function handleChange(field: FieldKey, raw: string) {
    const value = field === "phone" ? formatPhoneDigits(raw) : raw;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const msg = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: msg }));
    }
    setFormError(null);
  }

  function handleBlur(field: FieldKey) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const msg = validateField(field);
    setErrors((prev) => ({ ...prev, [field]: msg }));
  }

  const selectedRoleName = useMemo(
    () => availableRoles.find((role) => role._id === form.roleId)?.name ?? "",
    [availableRoles, form.roleId],
  );
  const allowMultipleLocations = isOwnerRoleName(selectedRoleName);

  useEffect(() => {
    if (!allowMultipleLocations && form.locations.length > 1) {
      setForm((prev) => ({ ...prev, locations: prev.locations.slice(0, 1) }));
      setFormError(
        isEs
          ? "Este rol solo puede estar asociado a una sede."
          : "This role can only be associated with one location.",
      );
    }
  }, [allowMultipleLocations, form.locations.length, isEs]);

  function toggleLocation(locId: string) {
    setForm((prev) => ({
      ...prev,
      locations: allowMultipleLocations
        ? prev.locations.includes(locId)
          ? prev.locations.filter((id) => id !== locId)
          : [...prev.locations, locId]
        : prev.locations[0] === locId
          ? []
          : [locId],
    }));
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const fields: FieldKey[] = ["firstName", "firstSurname", "email", "phone"];
    const newErrors: Partial<Record<FieldKey, string>> = {};
    fields.forEach((f) => {
      const msg = validateField(f);
      if (msg) newErrors[f] = msg;
    });
    setTouched({ firstName: true, firstSurname: true, email: true, phone: true });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (!form.roleId) {
      setFormError(isEs ? "Selecciona un rol." : "Please select a role.");
      return;
    }
    if (form.locations.length === 0) {
      setFormError(
        isEs ? "Selecciona al menos una ubicación." : "Please select at least one location.",
      );
      return;
    }

    if (!allowMultipleLocations && form.locations.length > 1) {
      setFormError(
        isEs
          ? "Este rol solo puede estar asociado a una sede."
          : "This role can only be associated with one location.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await inviteUser({
        email: form.email,
        phone: toColombianPhone(form.phone),
        name: { firstName: form.firstName, firstSurname: form.firstSurname },
        locations: allowMultipleLocations ? form.locations : form.locations.slice(0, 1),
        roleId: form.roleId,
      });
      reset();
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "CONFLICT" || err.message.toLowerCase().includes("email")) {
          setErrors((prev) => ({ ...prev, email: err.message }));
          setTouched((prev) => ({ ...prev, email: true }));
        }
        const lowerMessage = err.message.toLowerCase();
        if (lowerMessage.includes("location") || lowerMessage.includes("ubicaci")) {
          setFormError(
            isEs
              ? "No se pudo guardar la asignación de sedes para este rol."
              : "Could not save location assignment for this role.",
          );
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError(
          isEs ? "Error inesperado. Inténtalo de nuevo." : "Unexpected error. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  const roleOptions = availableRoles.map((r) => ({ value: r._id, label: r.name }));

  const inputClass = (field: FieldKey) =>
    `w-full bg-zinc-900 border rounded-xl py-3 px-4 text-sm text-white outline-none transition focus:ring-1 ${
      touched[field] && errors[field]
        ? "border-red-500 focus:ring-red-500/40"
        : "border-zinc-700 focus:border-yellow-400 focus:ring-yellow-400/20"
    }`;

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title={isEs ? "Invitar Nuevo Miembro" : "Invite New Member"}
      onSubmit={handleSubmit}
      loading={submitting}
      submitLabel={isEs ? "Enviar Invitación" : "Send Invitation"}
      cancelLabel={isEs ? "Cancelar" : "Cancel"}
      size="md"
    >
      <div className="flex flex-col gap-5" data-help-id="team-form-create">
        {formError && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">
              {isEs ? "Nombre *" : "First Name *"}
            </label>
            <input
              data-help-id="team-form-first-name"
              className={inputClass("firstName")}
              value={form.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              onBlur={() => handleBlur("firstName")}
              placeholder={isEs ? "Nombre" : "First name"}
            />
            {touched.firstName && errors.firstName && (
              <p className="text-xs text-red-400 mt-1">{errors.firstName}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">
              {isEs ? "Apellido *" : "Last Name *"}
            </label>
            <input
              data-help-id="team-form-last-name"
              className={inputClass("firstSurname")}
              value={form.firstSurname}
              onChange={(e) => handleChange("firstSurname", e.target.value)}
              onBlur={() => handleBlur("firstSurname")}
              placeholder={isEs ? "Apellido" : "Last name"}
            />
            {touched.firstSurname && errors.firstSurname && (
              <p className="text-xs text-red-400 mt-1">{errors.firstSurname}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">
            {isEs ? "Correo Electrónico *" : "Email Address *"}
          </label>
          <input
            type="email"
            data-help-id="team-form-email"
            className={inputClass("email")}
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            placeholder="name@company.com"
          />
          {touched.email && errors.email && (
            <p className="text-xs text-red-400 mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">
            {isEs ? "Teléfono *" : "Phone *"}
          </label>
          <div className="flex items-center gap-2">
            <span className="px-3 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-400 shrink-0">
              {TEAM_PHONE_PREFIX}
            </span>
            <input
              type="tel"
              inputMode="numeric"
              data-help-id="team-form-phone"
              className={`flex-1 bg-zinc-900 border rounded-xl py-3 px-4 text-sm text-white outline-none transition focus:ring-1 ${
                touched.phone && errors.phone
                  ? "border-red-500 focus:ring-red-500/40"
                  : "border-zinc-700 focus:border-yellow-400 focus:ring-yellow-400/20"
              }`}
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              onBlur={() => handleBlur("phone")}
              placeholder="3001234567"
            />
          </div>
          {touched.phone && errors.phone && (
            <p className="text-xs text-red-400 mt-1">{errors.phone}</p>
          )}
        </div>

        <div data-help-id="team-form-role">
          <label className="block text-xs text-zinc-400 mb-1.5">{isEs ? "Rol *" : "Role *"}</label>
          <SearchableSelect
            options={roleOptions}
            value={form.roleId}
            onChange={(v) => {
              setForm((prev) => ({ ...prev, roleId: v }));
              setFormError(null);
            }}
            placeholder={isEs ? "Seleccionar rol" : "Select role"}
          />
        </div>

        {availableLocations.length > 0 && (
          <div data-help-id="team-form-locations">
            <label className="block text-xs text-zinc-400 mb-2">
              {allowMultipleLocations
                ? isEs
                  ? "Ubicaciones *"
                  : "Locations *"
                : isEs
                  ? "Ubicación *"
                  : "Location *"}
            </label>
            <p className="text-[11px] text-zinc-500 mb-2">
              {allowMultipleLocations
                ? isEs
                  ? "El rol Dueño puede asociarse a múltiples sedes."
                  : "Owner role can be associated with multiple locations."
                : isEs
                  ? "Este rol solo puede estar asociado a una sede. Si eliges otra, reemplazará la actual."
                  : "This role can only be associated with one location. Selecting another will replace the current one."}
            </p>
            <div className="flex flex-wrap gap-2">
              {availableLocations.map((loc) => {
                const selected = form.locations.includes(loc._id);
                return (
                  <button
                    key={loc._id}
                    type="button"
                    onClick={() => toggleLocation(loc._id)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                      selected
                        ? "bg-yellow-400/10 border-yellow-400/40 text-yellow-400"
                        : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                    }`}
                  >
                    {loc.name}
                  </button>
                );
              })}
            </div>
            {((!allowMultipleLocations && form.locations.length > 1) || form.locations.length === 0) &&
              (formError?.toLowerCase().includes("location") ||
                formError?.toLowerCase().includes("ubicación")) && (
              <p className="text-xs text-red-400 mt-1">
                {isEs
                  ? form.locations.length === 0
                    ? "Selecciona al menos una ubicación."
                    : "Este rol solo puede estar asociado a una sede."
                  : form.locations.length === 0
                    ? "Select at least one location."
                    : "This role can only be associated with one location."}
              </p>
              )}
          </div>
        )}
      </div>
    </FormModal>
  );
}
