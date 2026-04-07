import { useState } from "react";
import { Hash, Info, Loader2 } from "lucide-react";
import { Button } from "../../../../components/ui";
import { useLanguage } from "../../../../contexts/useLanguage";
import type { TranslationKey } from "../../../../i18n/translations";
import { useToast } from "../../../../hooks/useToast";
import {
  useCreateCodeScheme,
  useUpdateCodeScheme,
} from "../../../../hooks/queries/useCodeSchemeQueries";
import { useMaterialTypes } from "../../../../hooks/queries/useMaterialQueries";
import { useMaterialCategories } from "../../../../hooks/queries/useMaterialQueries";
import { validateCodeSchemeName, validateCodeSchemePattern } from "../../../../utils/validators";
import type { CodeScheme, CodeSchemeEntityType } from "../../../../types/api";
import { EMPTY_FORM, getScopeMode, schemeToForm, type SchemeForm, type ScopeMode } from "./types";
import PatternBuilder from "./PatternBuilder";

const ALL_ENTITY_TYPES: CodeSchemeEntityType[] = [
  "loan",
  "loan_request",
  "invoice",
  "inspection",
  "incident",
  "maintenance_batch",
  "material_instance",
];

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
  const [nameError, setNameError] = useState<string | undefined>();
  const [patternError, setPatternError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);

  // Scope state derived from form
  const scopeMode = getScopeMode(form);

  // Material type / category queries (only fetched when material_instance)
  const { data: materialTypesData } = useMaterialTypes();
  const { data: categoriesData } = useMaterialCategories();
  const materialTypes = materialTypesData?.materialTypes ?? [];
  const categories = categoriesData ?? [];

  const createMutation = useCreateCodeScheme();
  const updateMutation = useUpdateCodeScheme();
  const submitting = createMutation.isPending || updateMutation.isPending;

  // ── Real-time validation ──────────────────────────────────────────────

  const handleNameChange = (value: string) => {
    setForm((f) => ({ ...f, name: value }));
    const result = validateCodeSchemeName(value);
    setNameError(result.isValid ? undefined : result.message);
  };

  const handlePatternChange = (value: string) => {
    setForm((f) => ({ ...f, pattern: value }));
    const result = validateCodeSchemePattern(value, form.entityType);
    setPatternError(result.isValid ? undefined : result.message);
  };

  const handleEntityTypeChange = (et: CodeSchemeEntityType) => {
    setForm((f) => ({
      ...f,
      entityType: et,
      materialTypeId: null,
      categoryId: null,
    }));
    // Re-validate pattern for new entity type
    if (form.pattern) {
      const result = validateCodeSchemePattern(form.pattern, et);
      setPatternError(result.isValid ? undefined : result.message);
    }
  };

  const handleScopeChange = (mode: ScopeMode) => {
    setForm((f) => ({
      ...f,
      materialTypeId: null,
      categoryId: null,
    }));
    // scope mode is derived from materialTypeId/categoryId, so "global" is default
    if (mode === "by_type" || mode === "by_category") {
      // Just clear — user will select from dropdown
    }
  };

  const handleMaterialTypeSelect = (typeId: string) => {
    setForm((f) => ({ ...f, materialTypeId: typeId || null, categoryId: null }));
  };

  const handleCategorySelect = (catId: string) => {
    setForm((f) => ({ ...f, categoryId: catId || null, materialTypeId: null }));
  };

  // ── Derived form validity ─────────────────────────────────────────────

  const isFormValid =
    validateCodeSchemeName(form.name).isValid &&
    validateCodeSchemePattern(form.pattern, form.entityType).isValid;

  // ── Submit ────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!isFormValid) return;
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
          ...(form.entityType === "material_instance" && form.materialTypeId
            ? { materialTypeId: form.materialTypeId }
            : {}),
          ...(form.entityType === "material_instance" && form.categoryId
            ? { categoryId: form.categoryId }
            : {}),
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

  const entityTypeLabel = (et: CodeSchemeEntityType): string => {
    const map: Record<CodeSchemeEntityType, string> = {
      loan: t("settings.codeSchemes.tabLoan"),
      loan_request: t("settings.codeSchemes.tabLoanRequest"),
      invoice: t("settings.codeSchemes.tabInvoice"),
      inspection: t("settings.codeSchemes.tabInspection"),
      incident: t("settings.codeSchemes.tabIncident"),
      maintenance_batch: t("settings.codeSchemes.tabMaintenanceBatch"),
      material_instance: t("settings.codeSchemes.tabMaterialInstance"),
    };
    return map[et];
  };

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
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {ALL_ENTITY_TYPES.map((et) => (
                  <button
                    key={et}
                    type="button"
                    onClick={() => handleEntityTypeChange(et)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border whitespace-nowrap shrink-0 ${
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

          {/* Scope selector (material_instance only, create only) */}
          {form.entityType === "material_instance" && !isEditing && (
            <div data-help-id="code-scheme-form-scope">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                {t("settings.codeSchemes.scope")}
              </label>
              <div className="flex items-center gap-1 bg-[#0d0d0d] border border-[#222] rounded-lg p-1 text-xs mb-2">
                <Info size={12} className="text-[#FFD700] shrink-0 ml-2" />
                <span className="text-gray-500 px-2 py-1">
                  {t("settings.codeSchemes.scopeInfo")}
                </span>
              </div>
              <div className="space-y-2">
                {(["global", "by_type", "by_category"] as const).map((mode) => {
                  const labelMap: Record<ScopeMode, string> = {
                    global: t("settings.codeSchemes.scopeGlobal"),
                    by_type: t("settings.codeSchemes.scopeByType"),
                    by_category: t("settings.codeSchemes.scopeByCategory"),
                  };
                  return (
                    <label key={mode} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="scope"
                        checked={scopeMode === mode}
                        onChange={() => handleScopeChange(mode)}
                        className="accent-[#FFD700]"
                      />
                      <span className="text-sm text-gray-300">{labelMap[mode]}</span>
                    </label>
                  );
                })}
              </div>

              {/* Material Type dropdown */}
              {scopeMode === "by_type" && (
                <div className="mt-2">
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                    {t("settings.codeSchemes.scopeTypeName")}
                  </label>
                  <select
                    value={form.materialTypeId ?? ""}
                    onChange={(e) => handleMaterialTypeSelect(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] transition-all"
                  >
                    <option value="">{isEs ? "Seleccionar tipo..." : "Select type..."}</option>
                    {materialTypes.map((mt) => (
                      <option key={mt._id} value={mt._id}>
                        {mt.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category dropdown */}
              {scopeMode === "by_category" && (
                <div className="mt-2">
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                    {t("settings.codeSchemes.scopeCategoryName")}
                  </label>
                  <select
                    value={form.categoryId ?? ""}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] transition-all"
                  >
                    <option value="">
                      {isEs ? "Seleccionar categoría..." : "Select category..."}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
              onChange={(e) => handleNameChange(e.target.value)}
              className={`w-full bg-[#1a1a1a] border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none transition-all placeholder-gray-600 ${
                nameError ? "border-red-500 bg-red-500/5" : "border-[#222] focus:border-[#FFD700]"
              }`}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "name-error" : undefined}
              placeholder={t("settings.codeSchemes.schemeNamePlaceholder")}
            />
            {nameError && (
              <p id="name-error" className="text-red-400 text-xs mt-1">
                {t(nameError as TranslationKey)}
              </p>
            )}
          </div>

          {/* Pattern Builder */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
              {t("settings.codeSchemes.patternBuilder")} *
            </label>
            <PatternBuilder
              value={form.pattern}
              onChange={handlePatternChange}
              entityType={form.entityType}
            />
            {patternError && (
              <p className="text-red-400 text-xs mt-1">{t(patternError as TranslationKey)}</p>
            )}
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
            disabled={submitting || !isFormValid}
            data-help-id="code-scheme-form-submit"
            className={!isFormValid ? "opacity-50 cursor-not-allowed" : ""}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isEditing ? (isEs ? "Guardar" : "Save") : isEs ? "Crear" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
