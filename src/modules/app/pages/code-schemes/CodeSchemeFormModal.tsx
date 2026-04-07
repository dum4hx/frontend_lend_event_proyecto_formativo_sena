import { useState } from "react";
import { Hash, Loader2 } from "lucide-react";
import { Button } from "../../../../components/ui";
import { useLanguage } from "../../../../contexts/useLanguage";
import { useToast } from "../../../../hooks/useToast";
import {
  useCreateCodeScheme,
  useUpdateCodeScheme,
} from "../../../../hooks/queries/useCodeSchemeQueries";
import type { CodeScheme, CodeSchemeEntityType } from "../../../../types/api";
import { EMPTY_FORM, schemeToForm, type SchemeForm } from "./types";
import PatternBuilder from "./PatternBuilder";

interface CodeSchemeFormModalProps {
  /** `null` for create mode, a CodeScheme for edit mode. */
  editingScheme: CodeScheme | null;
  /** Pre-selected entity type when creating a new scheme from a specific tab. */
  defaultEntityType: CodeSchemeEntityType;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Modal form for creating or editing a code scheme.
 * In create mode, entityType is settable via tabs.
 * In edit mode, entityType is locked (API restriction).
 */
export default function CodeSchemeFormModal({
  editingScheme,
  defaultEntityType,
  onClose,
  onSaved,
}: CodeSchemeFormModalProps) {
  const { t, language } = useLanguage();
  const isEs = language === "es";
  const { showToast } = useToast();

  const isEditing = editingScheme !== null;

  const [form, setForm] = useState<SchemeForm>(
    editingScheme ? schemeToForm(editingScheme) : { ...EMPTY_FORM, entityType: defaultEntityType },
  );
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateCodeScheme();
  const updateMutation = useUpdateCodeScheme();
  const submitting = createMutation.isPending || updateMutation.isPending;

  const validate = (): boolean => {
    if (!form.name.trim()) {
      setFormError(t("settings.codeSchemes.validation.nameRequired"));
      return false;
    }
    if (!form.pattern.trim()) {
      setFormError(t("settings.codeSchemes.validation.patternRequired"));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setFormError(null);

    try {
      if (isEditing && editingScheme) {
        await updateMutation.mutateAsync({
          id: editingScheme._id,
          payload: {
            name: form.name.trim(),
            pattern: form.pattern.trim(),
            isActive: form.isActive,
          },
        });
        showToast(
          "success",
          t("settings.codeSchemes.toast.updateSuccess"),
          isEs ? "Éxito" : "Success",
          { duration: 3000 },
        );
      } else {
        await createMutation.mutateAsync({
          entityType: form.entityType,
          name: form.name.trim(),
          pattern: form.pattern.trim(),
          isActive: form.isActive,
          isDefault: form.isDefault,
        });
        showToast(
          "success",
          t("settings.codeSchemes.toast.createSuccess"),
          isEs ? "Éxito" : "Success",
          { duration: 3000 },
        );
      }
      onSaved();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("settings.codeSchemes.toast.error"));
    }
  };

  const entityTypeLabel = (et: CodeSchemeEntityType) =>
    et === "loan" ? t("settings.codeSchemes.tabLoan") : t("settings.codeSchemes.tabLoanRequest");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="bg-[#121212] border border-[#222] rounded-2xl shadow-2xl w-full max-w-lg"
        data-help-id={isEditing ? "code-scheme-form-edit" : "code-scheme-form-create"}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1a1a1a] rounded-xl border border-[#333]">
              <Hash size={18} className="text-[#FFD700]" />
            </div>
            <h2 className="text-lg font-bold text-white">
              {isEditing
                ? t("settings.codeSchemes.editScheme")
                : t("settings.codeSchemes.createScheme")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Entity Type (create only) */}
          {!isEditing ? (
            <div data-help-id="code-scheme-form-entityType">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                {t("settings.codeSchemes.entityType")} *
              </label>
              <div className="flex gap-2">
                {(["loan", "loan_request"] as const).map((et) => (
                  <button
                    key={et}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, entityType: et }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                      form.entityType === et
                        ? "bg-[#FFD700]/10 border-[#FFD700]/40 text-[#FFD700]"
                        : "bg-[#1a1a1a] border-[#333] text-gray-400 hover:border-[#444] hover:text-white"
                    }`}
                  >
                    {entityTypeLabel(et)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                {t("settings.codeSchemes.entityType")}
              </label>
              <span className="text-sm text-gray-300">{entityTypeLabel(form.entityType)}</span>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
              {t("settings.codeSchemes.schemeName")} *
            </label>
            <input
              data-help-id="code-scheme-form-name"
              type="text"
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full bg-[#1a1a1a] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] transition-all placeholder-gray-600"
              placeholder={t("settings.codeSchemes.schemeNamePlaceholder")}
            />
          </div>

          {/* Pattern Builder */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
              {t("settings.codeSchemes.patternBuilder")} *
            </label>
            <PatternBuilder
              value={form.pattern}
              onChange={(pattern) => setForm((f) => ({ ...f, pattern }))}
            />
          </div>

          {/* Active toggle */}
          <div
            className="flex items-center justify-between bg-[#1a1a1a] border border-[#222] rounded-lg px-4 py-3"
            data-help-id="code-scheme-form-isActive"
          >
            <span className="text-sm text-gray-300">{t("settings.codeSchemes.isActive")}</span>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.isActive ? "bg-[#FFD700]" : "bg-[#333]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                  form.isActive ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* Default toggle (create only — in edit use table row action) */}
          {!isEditing && (
            <div
              className="flex items-center justify-between bg-[#1a1a1a] border border-[#222] rounded-lg px-4 py-3"
              data-help-id="code-scheme-form-isDefault"
            >
              <span className="text-sm text-gray-300">{t("settings.codeSchemes.isDefault")}</span>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isDefault: !f.isDefault }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  form.isDefault ? "bg-[#FFD700]" : "bg-[#333]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                    form.isDefault ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          )}

          {/* Form error */}
          {formError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-xs">
              {formError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#222]">
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={submitting}
            data-help-id="code-scheme-form-submit"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isEditing ? (isEs ? "Guardar" : "Save") : isEs ? "Crear" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
