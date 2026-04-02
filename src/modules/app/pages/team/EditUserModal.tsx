/**
 * EditUserModal — Edit an existing team member's name, role, and locations.
 * Includes owner-promotion safety confirmation.
 */
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { FormModal } from "../../../../components/ui/FormModal";
import { SearchableSelect } from "../../../../components/ui/SearchableSelect";
import { useLanguage } from "../../../../contexts/useLanguage";
import { ApiError } from "../../../../lib/api";
import { updateUser, updateUserRole } from "../../../../services/adminService";
import { getLocations } from "../../../../services/warehouseOperatorService";
import { validateFirstName, validateLastName } from "../../../../utils/validators";
import type { Role } from "../../../../types/api";
import type { WarehouseLocation } from "../../../../services/warehouseOperatorService";
import type { TeamMember } from "./types";

interface EditUserModalProps {
  member: TeamMember | null;
  availableRoles: Role[];
  onClose: () => void;
  onSuccess: () => void;
}

interface EditFormValues {
  firstName: string;
  firstSurname: string;
  roleId: string;
  locations: string[];
}

interface OwnerSecurity {
  acceptedCritical: boolean;
  acceptedIrreversible: boolean;
  confirmEmail: string;
  confirmPhrase: string;
}

const OWNER_PHRASE = "TRANSFER OWNER";

export function EditUserModal({ member, availableRoles, onClose, onSuccess }: EditUserModalProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  const locationsQuery = useQuery({
    queryKey: ["locations", "edit-modal"],
    queryFn: () => getLocations(),
    select: (res) => res.data.items,
    enabled: !!member,
    staleTime: 1000 * 60 * 5,
  });
  const availableLocations: WarehouseLocation[] = locationsQuery.data ?? [];

  const [form, setForm] = useState<EditFormValues>({ firstName: "", firstSurname: "", roleId: "", locations: [] });
  const [errors, setErrors] = useState<
    Partial<Record<keyof Omit<EditFormValues, "roleId" | "locations">, string>>
  >({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof Omit<EditFormValues, "roleId" | "locations">, boolean>>
  >({});
  const [ownerSecurity, setOwnerSecurity] = useState<OwnerSecurity>({
    acceptedCritical: false,
    acceptedIrreversible: false,
    confirmEmail: "",
    confirmPhrase: "",
  });
  const [ownerErrors, setOwnerErrors] = useState<Partial<Record<keyof OwnerSecurity, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!member) return;
    setForm({
      firstName: member.firstName,
      firstSurname: member.lastName,
      roleId: member.roleId,
      locations: member.locations ?? [],
    });
    setErrors({});
    setTouched({});
    setOwnerSecurity({
      acceptedCritical: false,
      acceptedIrreversible: false,
      confirmEmail: "",
      confirmPhrase: "",
    });
    setOwnerErrors({});
    setFormError(null);
  }, [member]);

  const selectedRoleName = availableRoles.find((r) => r._id === form.roleId)?.name ?? "";
  const isOwnerPromotion = !!member && member.roleName !== "owner" && selectedRoleName === "owner";

  const validateOwnerSecurity = useCallback((): Partial<Record<keyof OwnerSecurity, string>> => {
    const errs: Partial<Record<keyof OwnerSecurity, string>> = {};
    if (!ownerSecurity.acceptedCritical)
      errs.acceptedCritical = isEs ? "Debes aceptar este riesgo." : "You must accept this risk.";
    if (!ownerSecurity.acceptedIrreversible)
      errs.acceptedIrreversible = isEs
        ? "Reconoce el cambio irreversible."
        : "Acknowledge the irreversible change.";
    if (!ownerSecurity.confirmEmail)
      errs.confirmEmail = isEs ? "Confirma el correo del miembro." : "Confirm the member email.";
    else if (ownerSecurity.confirmEmail.trim().toLowerCase() !== member?.email.toLowerCase())
      errs.confirmEmail = isEs ? "El correo no coincide." : "Email does not match.";
    if (!ownerSecurity.confirmPhrase)
      errs.confirmPhrase = isEs ? `Escribe "${OWNER_PHRASE}".` : `Type "${OWNER_PHRASE}".`;
    else if (ownerSecurity.confirmPhrase.trim().toUpperCase() !== OWNER_PHRASE)
      errs.confirmPhrase = isEs
        ? `La frase debe ser: ${OWNER_PHRASE}`
        : `Phrase must be: ${OWNER_PHRASE}`;
    return errs;
  }, [ownerSecurity, member, isEs]);

  function handleChange(field: keyof Omit<EditFormValues, "roleId" | "locations">, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const msg =
        field === "firstName"
          ? validateFirstName(value).isValid
            ? undefined
            : validateFirstName(value).message
          : validateLastName(value).isValid
            ? undefined
            : validateLastName(value).message;
      setErrors((prev) => ({ ...prev, [field]: msg }));
    }
    setFormError(null);
  }

  function handleBlur(field: keyof Omit<EditFormValues, "roleId" | "locations">) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = form[field] as string;
    const msg =
      field === "firstName"
        ? validateFirstName(value).isValid
          ? undefined
          : validateFirstName(value).message
        : validateLastName(value).isValid
          ? undefined
          : validateLastName(value).message;
    setErrors((prev) => ({ ...prev, [field]: msg }));
  }

  function toggleLocation(locId: string) {
    setForm((prev) => ({
      ...prev,
      locations: prev.locations.includes(locId)
        ? prev.locations.filter((l) => l !== locId)
        : [...prev.locations, locId],
    }));
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!member) return;

    // Validate name fields
    const firstErr = validateFirstName(form.firstName);
    const lastErr = validateLastName(form.firstSurname);
    if (!firstErr.isValid || !lastErr.isValid) {
      setErrors({
        firstName: firstErr.isValid ? undefined : firstErr.message,
        firstSurname: lastErr.isValid ? undefined : lastErr.message,
      });
      setTouched({ firstName: true, firstSurname: true });
      return;
    }

    if (isOwnerPromotion) {
      const secErrs = validateOwnerSecurity();
      setOwnerErrors(secErrs);
      if (Object.keys(secErrs).length > 0) {
        setFormError(
          isEs
            ? "Completa todas las verificaciones de seguridad."
            : "Complete all security checks.",
        );
        return;
      }
    }

    if (form.locations.length === 0) {
      setFormError(
        isEs
          ? "Selecciona al menos una ubicación."
          : "Please select at least one location.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await updateUser(member.id, {
        name: { firstName: form.firstName, firstSurname: form.firstSurname },
        locations: form.locations,
      });
      if (form.roleId !== member.roleId) {
        await updateUserRole(member.id, { roleId: form.roleId });
      }
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError(isEs ? "Error inesperado." : "Unexpected error.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const roleOptions = availableRoles.map((r) => ({ value: r._id, label: r.name }));

  const inputClass = (hasError: boolean) =>
    `w-full bg-zinc-900 border rounded-xl py-3 px-4 text-sm text-white outline-none transition focus:ring-1 ${
      hasError
        ? "border-red-500 focus:ring-red-500/40"
        : "border-zinc-700 focus:border-yellow-400 focus:ring-yellow-400/20"
    }`;

  return (
    <FormModal
      open={!!member}
      onClose={onClose}
      title={isEs ? "Editar Miembro" : "Edit Member"}
      onSubmit={handleSubmit}
      loading={submitting}
      submitLabel={isEs ? "Guardar Cambios" : "Save Changes"}
      cancelLabel={isEs ? "Cancelar" : "Cancel"}
      size="md"
    >
      <div className="flex flex-col gap-5" data-help-id="team-form-edit">
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
              className={inputClass(!!(touched.firstName && errors.firstName))}
              value={form.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              onBlur={() => handleBlur("firstName")}
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
              className={inputClass(!!(touched.firstSurname && errors.firstSurname))}
              value={form.firstSurname}
              onChange={(e) => handleChange("firstSurname", e.target.value)}
              onBlur={() => handleBlur("firstSurname")}
            />
            {touched.firstSurname && errors.firstSurname && (
              <p className="text-xs text-red-400 mt-1">{errors.firstSurname}</p>
            )}
          </div>
        </div>

        <div data-help-id="team-form-role">
          <label className="block text-xs text-zinc-400 mb-1.5">{isEs ? "Rol" : "Role"}</label>
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

        {/* Locations */}
        {availableLocations.length > 0 && (
          <div data-help-id="team-form-locations">
            <label className="block text-xs text-zinc-400 mb-2">
              {isEs ? "Ubicaciones *" : "Locations *"}
            </label>
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
            {form.locations.length === 0 && formError?.toLowerCase().includes("location") && (
              <p className="text-xs text-red-400 mt-1">
                {isEs ? "Selecciona al menos una ubicación." : "Select at least one location."}
              </p>
            )}
          </div>
        )}

        {/* Owner promotion confirmation */}
        {isOwnerPromotion && (
          <div
            className="flex flex-col gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20"
            data-help-id="team-form-owner-security"
          >
            <p className="text-sm font-semibold text-red-400">
              {isEs ? "⚠️ Transferencia de Propiedad" : "⚠️ Ownership Transfer"}
            </p>
            <p className="text-xs text-zinc-400">
              {isEs
                ? "Esto le otorga acceso administrativo total. Esta acción es sensible e irreversible sin ayuda del soporte."
                : "This grants full administrative access. This action is sensitive and irreversible without support."}
            </p>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ownerSecurity.acceptedCritical}
                onChange={(e) =>
                  setOwnerSecurity((p) => ({ ...p, acceptedCritical: e.target.checked }))
                }
                className="mt-0.5 accent-yellow-400"
              />
              <span className="text-xs text-zinc-300">
                {isEs
                  ? "Entiendo que este usuario tendrá acceso administrativo completo."
                  : "I understand this user will have full administrative access."}
              </span>
            </label>
            {ownerErrors.acceptedCritical && (
              <p className="text-xs text-red-400 -mt-2">{ownerErrors.acceptedCritical}</p>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ownerSecurity.acceptedIrreversible}
                onChange={(e) =>
                  setOwnerSecurity((p) => ({ ...p, acceptedIrreversible: e.target.checked }))
                }
                className="mt-0.5 accent-yellow-400"
              />
              <span className="text-xs text-zinc-300">
                {isEs
                  ? "Reconozco que este cambio de propietario es sensible."
                  : "I acknowledge this ownership change is sensitive."}
              </span>
            </label>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                {isEs ? "Confirmar correo del miembro" : "Confirm member email"}
              </label>
              <input
                data-help-id="team-form-owner-confirm-email"
                className={inputClass(!!ownerErrors.confirmEmail)}
                placeholder={member?.email ?? ""}
                value={ownerSecurity.confirmEmail}
                onChange={(e) => setOwnerSecurity((p) => ({ ...p, confirmEmail: e.target.value }))}
              />
              {ownerErrors.confirmEmail && (
                <p className="text-xs text-red-400 mt-1">{ownerErrors.confirmEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                {isEs ? `Escribe "${OWNER_PHRASE}"` : `Type "${OWNER_PHRASE}"`}
              </label>
              <input
                data-help-id="team-form-owner-confirm-phrase"
                className={inputClass(!!ownerErrors.confirmPhrase)}
                placeholder={OWNER_PHRASE}
                value={ownerSecurity.confirmPhrase}
                onChange={(e) => setOwnerSecurity((p) => ({ ...p, confirmPhrase: e.target.value }))}
              />
              {ownerErrors.confirmPhrase && (
                <p className="text-xs text-red-400 mt-1">{ownerErrors.confirmPhrase}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </FormModal>
  );
}
