import { useState, useEffect } from "react";
import { Plus, X, Loader2, AlertCircle } from "lucide-react";
import { useLanguage } from "../../../../contexts/useLanguage";
import { useCurrencyInput } from "../../../../hooks/useCurrencyInput";
import {
  createPackage,
  getMaterialTypes,
  updatePackage,
} from "../../../../services/materialService";
import { normalizeError, logError } from "../../../../utils/errorHandling";
import type {
  PackageMaterialEntry,
  MaterialType,
  CreatePackagePayload,
  Package,
} from "../../../../types/api";
import { DEFAULT_FORM, type PackageFormData } from "./types";

interface CreatePackageModalProps {
  onClose: () => void;
  onSaved: () => void;
  initialPackage?: Package;
}

export default function CreatePackageModal({
  onClose,
  onSaved,
  initialPackage,
}: CreatePackageModalProps) {
  const { t } = useLanguage();
  const isEditMode = Boolean(initialPackage);
  const [form, setForm] = useState<PackageFormData>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!initialPackage) {
      setForm(DEFAULT_FORM);
      return;
    }

    const normalizedEntries = initialPackage.items.length
      ? initialPackage.items.map((entry) => {
          const materialRef = entry.materialTypeId as unknown;
          let materialTypeId = "";

          if (typeof materialRef === "string") {
            materialTypeId = materialRef;
          } else if (
            materialRef &&
            typeof materialRef === "object" &&
            "_id" in materialRef &&
            typeof (materialRef as Record<string, unknown>)._id === "string"
          ) {
            materialTypeId = (materialRef as { _id: string })._id;
          }

          return {
            materialTypeId,
            quantity: Math.max(1, Number(entry.quantity) || 1),
          };
        })
      : DEFAULT_FORM.entries;

    setForm({
      name: initialPackage.name,
      description: initialPackage.description ?? "",
      pricePerDay: initialPackage.pricePerDay != null ? String(initialPackage.pricePerDay) : "",
      entries: normalizedEntries,
    });
  }, [initialPackage]);

  // ── Currency input hook for pricePerDay ───────────────────────────────
  const pricePerDayInput = useCurrencyInput(
    form.pricePerDay ? parseFloat(form.pricePerDay) : "",
    (val) => setForm((p) => ({ ...p, pricePerDay: String(val) })),
  );

  const inputCls =
    "w-full bg-[#0f0f0f] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:border-[#FFD700] focus:outline-none disabled:opacity-50";

  const updateEntry = (idx: number, key: keyof PackageMaterialEntry, value: string | number) =>
    setForm((prev) => {
      const entries = [...prev.entries];
      entries[idx] = { ...entries[idx], [key]: value };
      return { ...prev, entries };
    });

  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setTypesLoading(true);
      try {
        const res = await getMaterialTypes();
        if (!mounted) return;
        const types = res.data?.materialTypes ?? [];
        setMaterialTypes(types);
        if (types.length > 0) {
          setForm((prev) => ({
            ...prev,
            entries: prev.entries.map((e) => ({
              ...e,
              materialTypeId: e.materialTypeId || types[0]._id,
            })),
          }));
        }
      } catch {
        // ignore — leave fields empty and allow manual input fallback
      } finally {
        if (mounted) setTypesLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const addEntry = () =>
    setForm((prev) => ({
      ...prev,
      entries: [...prev.entries, { materialTypeId: "", quantity: 1 }],
    }));

  const removeEntry = (idx: number) =>
    setForm((prev) => ({ ...prev, entries: prev.entries.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validEntries = form.entries.filter((entry) => entry.materialTypeId.trim() !== "");
    if (validEntries.length === 0) {
      setError(t("plans.form.atLeastOneMaterial"));
      return;
    }

    const payload: CreatePackagePayload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      items: validEntries.map((entry) => ({
        materialTypeId: entry.materialTypeId.trim(),
        quantity: Math.max(1, Number(entry.quantity)),
      })),
      pricePerDay: form.pricePerDay !== "" ? parseFloat(form.pricePerDay) : undefined,
    };

    setSubmitting(true);
    try {
      if (initialPackage?._id) {
        await updatePackage(initialPackage._id, payload);
      } else {
        await createPackage(payload);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(normalizeError(err).message);
      logError(err, "CreatePackageModal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] border border-[#333] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#121212] border-b border-[#333] p-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {isEditMode ? t("plans.form.editPackage") : t("plans.form.newPackage")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4"
          data-help-id={isEditMode ? "plans-form-edit" : "plans-form-create"}
        >
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              {t("plans.form.name")} <span className="text-[#FFD700]">*</span>
            </label>
            <input
              required
              data-help-id="plans-form-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={t("plans.form.namePlaceholder")}
              disabled={submitting}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              {t("plans.form.description")}
            </label>
            <textarea
              data-help-id="plans-form-description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              disabled={submitting}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              {t("plans.form.pricePerDay")}{" "}
              <span className="text-gray-600 font-normal">({t("plans.form.priceHint")})</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              data-help-id="plans-form-price-per-day"
              value={pricePerDayInput.displayValue}
              onChange={pricePerDayInput.handleChange}
              placeholder={t("plans.form.pricePlaceholder")}
              disabled={submitting}
              className={inputCls}
            />
          </div>

          <div data-help-id="plans-form-entries">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-400">
                {t("plans.form.materialTypes")} <span className="text-[#FFD700]">*</span>
              </label>
              <button
                type="button"
                onClick={addEntry}
                disabled={submitting}
                className="text-xs text-[#FFD700] hover:text-yellow-300 transition disabled:opacity-50"
              >
                {t("plans.form.addRow")}
              </button>
            </div>
            <div className="space-y-2">
              {form.entries.map((entry, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  {materialTypes.length > 0 ? (
                    <select
                      data-help-id={`plans-form-entry-material-${idx}`}
                      value={entry.materialTypeId}
                      onChange={(e) => updateEntry(idx, "materialTypeId", e.target.value)}
                      disabled={submitting || typesLoading}
                      className={`${inputCls} flex-1`}
                    >
                      <option value="">{t("plans.form.selectMaterial")}</option>
                      {materialTypes.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={entry.materialTypeId}
                      onChange={(e) => updateEntry(idx, "materialTypeId", e.target.value)}
                      placeholder={
                        typesLoading
                          ? t("plans.form.loadingMaterials")
                          : t("plans.form.materialTypeId")
                      }
                      disabled={submitting || typesLoading}
                      className={`${inputCls} flex-1`}
                    />
                  )}
                  <input
                    type="number"
                    min={1}
                    data-help-id={`plans-form-entry-quantity-${idx}`}
                    value={entry.quantity}
                    onChange={(e) =>
                      updateEntry(idx, "quantity", parseInt(e.target.value, 10) || 1)
                    }
                    disabled={submitting}
                    className="w-20 bg-[#0f0f0f] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:border-[#FFD700] focus:outline-none disabled:opacity-50"
                  />
                  {form.entries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEntry(idx)}
                      disabled={submitting}
                      className="px-1 danger-icon-btn disabled:opacity-50"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-[#333]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              data-help-id="plans-form-cancel"
              className="px-4 py-2 border border-[#333] text-gray-300 rounded-lg hover:bg-[#1a1a1a] transition text-sm disabled:opacity-50"
            >
              {t("plans.form.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              data-help-id="plans-form-submit"
              className="flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition text-sm gold-action-btn disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {isEditMode ? t("plans.form.saving") : t("plans.form.creating")}
                </>
              ) : (
                <>
                  <Plus size={14} />
                  {isEditMode ? t("plans.form.save") : t("plans.form.create")}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
