import React, { useState, useEffect, useMemo } from "react";
import { X, Plus, Info, FolderPlus } from "lucide-react";
import { useToast } from "../../../../../contexts/ToastContext";
import { usePermissions } from "../../../../../contexts/usePermissions";
import { useCurrencyInput } from "../../../../../hooks/useCurrencyInput";
import { useMaterialAttributes } from "../../material-attributes/hooks/useMaterialAttributes";
import { MaterialAttributeForm } from "../../material-attributes/components/AttributeForm";
import { createMaterialCategory } from "../../../../../services/materialService";
import type {
  CreateMaterialAttributePayload,
  CreateMaterialTypePayload,
  MaterialCategory,
  MaterialType,
} from "../../../../../types/api";
import { Button, IconButton, QuickCreateModal } from "../../../../../components/ui";
import { validateMaterialTypeCode, validateCategoryCode } from "../../../../../utils/validators";
import { useLanguage } from "../../../../../contexts/useLanguage";

interface MaterialTypeFormProps {
  categories: MaterialCategory[];
  onSubmit: (data: CreateMaterialTypePayload) => Promise<void>;
  onCancel: () => void;
  initialData?: MaterialType | (Partial<CreateMaterialTypePayload> & { name?: string });
  isEditing?: boolean;
  title?: string;
  /** Called after a category is quick-created so the parent can refresh its list. */
  onCategoryCreated?: (category: MaterialCategory) => void;
  /** Called after an attribute is quick-created so the parent can refresh its list. */
  onAttributeCreated?: () => void;
}

export const MaterialTypeForm: React.FC<MaterialTypeFormProps> = ({
  categories,
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  title,
  onCategoryCreated,
  onAttributeCreated,
}) => {
  const [formData, setFormData] = useState<CreateMaterialTypePayload>({
    code: "",
    name: "",
    description: "",
    categoryId: [],
    pricePerDay: 0,
    attributes: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAttributeForm, setShowAttributeForm] = useState(false);
  const [categorySearchInput, setCategorySearchInput] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);

  // Quick-create category modal state
  const [showQuickCreateCategory, setShowQuickCreateCategory] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState("");
  const [quickCategoryDescription, setQuickCategoryDescription] = useState("");
  const [quickCategoryCode, setQuickCategoryCode] = useState("");
  const [quickCategoryLoading, setQuickCategoryLoading] = useState(false);
  /** Locally-appended categories created via QuickCreateModal (merged with prop list). */
  const [localCategories, setLocalCategories] = useState<MaterialCategory[]>([]);

  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const { t } = useLanguage();
  const {
    attributes: allAttributes,
    addAttribute,
    refetch: refetchAttributes,
  } = useMaterialAttributes();

  const canCreateCategory = hasPermission("categories:create");

  // ── Currency input hook for pricePerDay ───────────────────────────────
  const pricePerDayInput = useCurrencyInput(formData.pricePerDay, (val) => {
    setFormData({ ...formData, pricePerDay: val });
  });

  /** Merged category list: prop categories + any quick-created ones not yet in props. */
  const allCategories = useMemo(() => {
    const propIds = new Set(categories.map((c) => c._id));
    return [...categories, ...localCategories.filter((c) => !propIds.has(c._id))];
  }, [categories, localCategories]);

  // Get all selected categories
  const selectedCategories = useMemo(
    () =>
      allCategories.filter((c) =>
        (Array.isArray(formData.categoryId) ? formData.categoryId : []).includes(c._id),
      ),
    [formData.categoryId, allCategories],
  );

  const categoryAttributeIds = useMemo(() => {
    const allAttributeIds = new Map<string, Set<string>>();
    selectedCategories.forEach((cat) => {
      cat.attributes?.forEach((attr) => {
        if (!allAttributeIds.has(attr.attributeId)) {
          allAttributeIds.set(attr.attributeId, new Set());
        }
        allAttributeIds.get(attr.attributeId)!.add(cat._id);
      });
    });
    return allAttributeIds;
  }, [selectedCategories]);

  // Available attributes filtered to only those in the selected categories
  const categoryAttributes = useMemo(
    () =>
      allAttributes
        .filter((attr) => categoryAttributeIds.has(attr._id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allAttributes, categoryAttributeIds],
  );

  useEffect(() => {
    if (initialData) {
      let categoryIds: string[] = [];

      if (Array.isArray(initialData.categoryId)) {
        categoryIds = initialData.categoryId
          .map((cat) => (typeof cat === "string" ? cat : (cat as { _id?: string })?._id))
          .filter((id): id is string => !!id);
      } else if (typeof initialData.categoryId === "string") {
        categoryIds = [initialData.categoryId];
      } else {
        const categoryIdObj = (initialData as { categoryId?: { _id?: string } }).categoryId;
        if (categoryIdObj?._id) {
          categoryIds = [categoryIdObj._id];
        } else {
          const categoryObj = (initialData as { category?: { _id?: string } }).category;
          if (categoryObj?._id) {
            categoryIds = [categoryObj._id];
          }
        }
      }

      setFormData({
        code: (initialData as MaterialType).code || "",
        name: initialData.name || "",
        description: initialData.description || "",
        categoryId: categoryIds,
        pricePerDay: initialData.pricePerDay || 0,
        attributes: (initialData as MaterialType).attributes || [],
      });
    }
  }, [initialData]);

  const handleQuickCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeResult = validateCategoryCode(quickCategoryCode);
    if (!codeResult.isValid) {
      showToast("error", t(codeResult.message!));
      return;
    }
    if (!quickCategoryName.trim() || !quickCategoryDescription.trim()) {
      showToast("error", t("materialTypes.form.validation.nameAndDescRequired"));
      return;
    }
    setQuickCategoryLoading(true);
    try {
      const res = await createMaterialCategory({
        code: quickCategoryCode.trim(),
        name: quickCategoryName.trim(),
        description: quickCategoryDescription.trim(),
      });
      const newCategory = res.data.category;
      setLocalCategories((prev) => [...prev, newCategory]);
      // Auto-select the new category
      setFormData((prev) => ({
        ...prev,
        categoryId: [...(Array.isArray(prev.categoryId) ? prev.categoryId : []), newCategory._id],
      }));
      showToast("success", t("materialTypes.form.toast.categoryCreated", { name: newCategory.name }));
      onCategoryCreated?.(newCategory);
      setShowQuickCreateCategory(false);
      setQuickCategoryName("");
      setQuickCategoryDescription("");
      setQuickCategoryCode("");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("materialTypes.form.toast.categoryCreateError");
      showToast("error", message);
    } finally {
      setQuickCategoryLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeTouched(true);
    if (!isEditing) {
      const codeResult = validateMaterialTypeCode(formData.code);
      if (!codeResult.isValid) {
        showToast("error", t(codeResult.message!));
        return;
      }
    }
    if (!formData.name.trim()) {
      showToast("error", t("materialTypes.form.validation.nameRequired"));
      return;
    }
    if (!(formData.description || "").trim()) {
      showToast("error", t("materialTypes.form.validation.descriptionRequired"));
      return;
    }
    if (!Array.isArray(formData.categoryId) || formData.categoryId.length === 0) {
      showToast("error", t("materialTypes.form.validation.categoryRequired"));
      return;
    }
    if (formData.pricePerDay <= 0) {
      showToast("error", t("materialTypes.form.validation.priceRequired"));
      return;
    }

    // Validate required attributes have values
    const requiredAttrs = selectedCategories.flatMap(
      (cat) => cat.attributes?.filter((a) => a.isRequired) || [],
    );
    const attributeNameMap = new Map(categoryAttributes.map((a) => [a._id, a.name]));
    const missingRequired = requiredAttrs.filter(
      (req) =>
        !(formData.attributes || []).find(
          (attr) => attr.attributeId === req.attributeId && attr.value?.trim(),
        ),
    );

    if (missingRequired.length > 0) {
      showToast(
        "error",
        t("materialTypes.form.validation.requiredAttributesMissing", { attributes: missingRequired.map((a) => attributeNameMap.get(a.attributeId) || a.attributeId).join(", ") }),
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData as CreateMaterialTypePayload);
    } catch (error) {
      const err = error as Error & { details?: { errors?: Array<{ message: string }> } };
      const errorMessage =
        err.details?.errors?.[0]?.message || err.message || t("materialTypes.toast.saveError");
      showToast("error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAttribute = async (data: CreateMaterialAttributePayload) => {
    try {
      await addAttribute(data);
      await refetchAttributes();
      showToast("success", t("materialTypes.form.toast.attributeCreated"));
      setShowAttributeForm(false);
      onAttributeCreated?.();
    } catch (err) {
      showToast("error", (err as Error).message || t("materialTypes.form.toast.attributeCreateError"));
    }
  };

  /**
   * Update an attribute value or required status
   */
  const updateAttributeValue = (attributeId: string, value: string, isRequired?: boolean) => {
    setFormData((prev) => {
      const existing = (prev.attributes || []).find((a) => a.attributeId === attributeId);
      if (existing) {
        return {
          ...prev,
          attributes: (prev.attributes || []).map((a) =>
            a.attributeId === attributeId
              ? {
                  ...a,
                  value,
                  isRequired: isRequired !== undefined ? isRequired : a.isRequired,
                }
              : a,
          ),
        };
      } else {
        return {
          ...prev,
          attributes: [
            ...(prev.attributes || []),
            {
              attributeId,
              value,
              isRequired: isRequired ?? false,
            },
          ],
        };
      }
    });
  };

  /**
   * Remove an attribute value
   */
  const removeAttributeValue = (attributeId: string) => {
    setFormData((prev) => ({
      ...prev,
      attributes: (prev.attributes || []).filter((a) => a.attributeId !== attributeId),
    }));
  };

  const currentAttributeValues = new Map(
    (formData.attributes || []).map((a) => [a.attributeId, a]),
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] border border-[#222] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-[#222] flex items-center justify-between bg-[#1a1a1a] rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {(title ?? (isEditing ? t("materialTypes.page.editTitle") : t("materialTypes.page.createTitle"))).split(" ").slice(0, -2).join(" ")}{" "}
              <span className="text-[#FFD700]">{(title ?? (isEditing ? t("materialTypes.page.editTitle") : t("materialTypes.page.createTitle"))).split(" ").slice(-2).join(" ")}</span>
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {t("materialTypes.form.subtitle")}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-white transition-all p-2 hover:bg-[#333] rounded-xl"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form
            id="material-type-form"
            onSubmit={handleSubmit}
            className="space-y-10"
            data-help-id={isEditing ? "material-types-form-edit" : "material-types-form-create"}
          >
            {/* Basic Info Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-1 h-6 bg-[#FFD700] rounded-full shadow-[0_0_8px_#FFD700]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                  {t("materialTypes.form.sectionGeneral")}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2" data-help-id="material-types-form-categories">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
                    {t("materialTypes.form.categoriesLabel")} *
                  </label>
                  <div className="space-y-3">
                    {/* Category Selector Input */}
                    <div className="flex gap-2">
                      <select
                        data-help-id="material-types-form-category-selector"
                        value={categorySearchInput}
                        onChange={(e) => setCategorySearchInput(e.target.value)}
                        className="flex-1 px-5 py-4 bg-[#1a1a1a] border border-[#222] rounded-xl text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all"
                      >
                        <option value="">{t("materialTypes.form.selectCategoryPlaceholder")}</option>
                        {allCategories
                          .filter(
                            (cat) =>
                              !Array.isArray(formData.categoryId) ||
                              !formData.categoryId.includes(cat._id),
                          )
                          .map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.name}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          if (categorySearchInput.trim()) {
                            const updated = Array.isArray(formData.categoryId)
                              ? formData.categoryId
                              : [];
                            if (!updated.includes(categorySearchInput)) {
                              setFormData({
                                ...formData,
                                categoryId: [...updated, categorySearchInput],
                              });
                              setCategorySearchInput("");
                            }
                          }
                        }}
                        disabled={!categorySearchInput || isSubmitting}
                        data-help-id="material-types-form-add-category"
                        className="px-5 py-4 bg-[#FFD700] hover:bg-[#FFD700]/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all flex items-center justify-center"
                      >
                        <Plus size={20} />
                      </button>
                      {canCreateCategory && (
                        <button
                          type="button"
                          onClick={() => setShowQuickCreateCategory(true)}
                          disabled={isSubmitting}
                          data-help-id="material-types-form-quick-create-category"
                          className="px-4 py-4 bg-[#1a1a1a] border border-[#FFD700]/40 hover:border-[#FFD700] text-[#FFD700] font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                          title={t("materialTypes.form.createCategoryTitle")}
                        >
                          <FolderPlus size={20} />
                        </button>
                      )}
                    </div>

                    {/* Selected Categories List */}
                    {Array.isArray(formData.categoryId) && formData.categoryId.length > 0 ? (
                      <div className="space-y-2">
                        {formData.categoryId.map((catId) => {
                          const cat = allCategories.find((c) => c._id === catId);
                          return (
                            <div
                              key={catId}
                              className="flex items-center justify-between px-5 py-3 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl hover:bg-[#FFD700]/15 transition-all"
                            >
                              <span className="text-white font-medium">{cat?.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    categoryId: formData.categoryId.filter((id) => id !== catId),
                                  });
                                }}
                                disabled={isSubmitting}
                                className="text-gray-400 hover:text-red-400 transition-colors p-1"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">{t("materialTypes.form.noCategoriesSelected")}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
                    {t("materialTypes.form.nameLabel")} *
                  </label>
                  <input
                    type="text"
                    data-help-id="material-types-form-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-4 bg-[#1a1a1a] border border-[#222] rounded-xl text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all"
                    placeholder={t("materialTypes.form.namePlaceholder")}
                    required
                  />
                </div>

                {!isEditing && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
                      {t("materialTypes.form.materialTypeCode")} *
                    </label>
                    <input
                      type="text"
                      data-help-id="material-types-form-code"
                      value={formData.code}
                      onChange={(e) => {
                        const filtered = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                        setFormData({ ...formData, code: filtered });
                        setCodeTouched(true);
                      }}
                      maxLength={10}
                      className={`w-full px-5 py-4 bg-[#1a1a1a] border rounded-xl text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all ${
                        codeTouched && !validateMaterialTypeCode(formData.code).isValid
                          ? "border-red-500 bg-red-500/10"
                          : "border-[#222]"
                      }`}
                      placeholder={t("materialTypes.form.codePlaceholder")}
                      aria-invalid={codeTouched && !validateMaterialTypeCode(formData.code).isValid}
                      aria-describedby={
                        codeTouched && !validateMaterialTypeCode(formData.code).isValid
                          ? "material-type-code-error"
                          : undefined
                      }
                      required
                    />
                    {codeTouched && !validateMaterialTypeCode(formData.code).isValid ? (
                      <p id="material-type-code-error" className="text-red-400 text-xs mt-1">
                        {t(validateMaterialTypeCode(formData.code).message!)}
                      </p>
                    ) : (
                      <p className="text-gray-500 text-xs mt-1">
                        {t("materialTypes.form.codeHint")}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
                    {t("materialTypes.form.priceLabel")} *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      data-help-id="material-types-form-price-per-day"
                      value={pricePerDayInput.displayValue}
                      onChange={pricePerDayInput.handleChange}
                      className="w-full px-5 py-4 bg-[#1a1a1a] border border-[#222] rounded-xl text-[#FFD700] font-mono text-lg focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all"
                      placeholder="$ 0,00"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
                    {t("materialTypes.form.descriptionLabel")} *
                  </label>
                  <input
                    type="text"
                    data-help-id="material-types-form-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-5 py-4 bg-[#1a1a1a] border border-[#222] rounded-xl text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all"
                    placeholder={t("materialTypes.form.descriptionPlaceholder")}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Attributes Section */}
            <div className="space-y-6 pt-4" data-help-id="material-types-form-attributes-section">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-1 h-6 bg-[#FFD700] rounded-full shadow-[0_0_8px_#FFD700]" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                    {t("materialTypes.form.sectionTechnical")}
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAttributeForm(true)}
                  data-help-id="material-types-form-new-attribute"
                  className="bg-[#1a1a1a] border-[#333] text-gray-300 hover:text-white hover:border-[#FFD700] transition-all"
                >
                  <Plus size={16} className="mr-2" />
                  {t("materialTypes.form.newAttribute")}
                </Button>
              </div>

              {!Array.isArray(formData.categoryId) || formData.categoryId.length === 0 ? (
                <div className="bg-[#1a1a1a]/50 border border-dashed border-[#333] rounded-2xl p-10 text-center">
                  <Info className="w-10 h-10 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    {t("materialTypes.form.noCategoryForAttributes")}
                  </p>
                </div>
              ) : categoryAttributes.length === 0 ? (
                <div className="bg-[#1a1a1a]/50 border border-dashed border-[#333] rounded-2xl p-10 text-center">
                  <Info className="w-10 h-10 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    {t("materialTypes.form.noAttributesForCategory")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categoryAttributes.map((attr) => {
                    const currentValue = currentAttributeValues.get(attr._id);
                    const isSelected = !!currentValue;

                    // Get all categories that require this attribute
                    const requiringCategories = selectedCategories.filter((cat) =>
                      cat.attributes?.find((ca) => ca.attributeId === attr._id && ca.isRequired),
                    );
                    const isRequired = requiringCategories.length > 0;

                    return (
                      <div
                        key={attr._id}
                        className={`p-4 rounded-xl border transition-all ${
                          isSelected
                            ? "bg-[#FFD700]/5 border-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.1)]"
                            : "bg-[#1a1a1a] border-[#222]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <label className="flex items-center gap-2 cursor-pointer flex-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      updateAttributeValue(attr._id, "", isRequired);
                                    } else {
                                      removeAttributeValue(attr._id);
                                    }
                                  }}
                                  className="w-4 h-4 rounded cursor-pointer"
                                  disabled={isSubmitting}
                                />
                                <span className="font-medium text-white">{attr.name}</span>
                                {attr.unit && (
                                  <span className="text-xs text-gray-500">({attr.unit})</span>
                                )}
                                {isRequired && (
                                  <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded border border-red-500/40">
                                    {t("materialTypes.form.requiredBadge")}
                                  </span>
                                )}
                              </label>
                            </div>

                            {isRequired && requiringCategories.length > 0 && (
                              <p className="text-xs text-gray-400 ml-6 mb-3">
                                {t("materialTypes.form.requiredBy", { categories: requiringCategories.map((c) => c.name).join(", ") })}
                              </p>
                            )}

                            {isSelected && (
                              <div className="space-y-2 ml-6">
                                {attr.allowedValues && attr.allowedValues.length > 0 ? (
                                  <select
                                    value={currentValue?.value || ""}
                                    onChange={(e) => updateAttributeValue(attr._id, e.target.value)}
                                    className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#FFD700]"
                                    disabled={isSubmitting}
                                  >
                                    <option value="">{t("materialTypes.form.selectValue")}</option>
                                    {attr.allowedValues.map((val) => (
                                      <option key={val} value={val}>
                                        {val}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    value={currentValue?.value || ""}
                                    onChange={(e) => updateAttributeValue(attr._id, e.target.value)}
                                    placeholder={t("materialTypes.form.enterAttributePlaceholder", { name: attr.name })}
                                    className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#FFD700]"
                                    disabled={isSubmitting}
                                  />
                                )}
                                {isRequired && !currentValue?.value && (
                                  <p className="text-xs text-red-400">{t("materialTypes.form.attributeRequiredError")}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#222] bg-[#1a1a1a] rounded-b-2xl flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            data-help-id="material-types-form-cancel"
            className="px-8 border-[#333] text-gray-400 hover:text-white"
          >
            {t("materialTypes.form.discardChanges")}
          </Button>
          <Button
            form="material-type-form"
            type="submit"
            loading={isSubmitting}
            data-help-id="material-types-form-submit"
            className="px-10 bg-[#FFD700] text-black font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]"
          >
            {isEditing ? t("materialTypes.form.updateItem") : t("materialTypes.form.saveEntry")}
          </Button>
        </div>
      </div>

      {/* Quick Create Category Modal */}
      <QuickCreateModal
        open={showQuickCreateCategory}
        onClose={() => {
          setShowQuickCreateCategory(false);
          setQuickCategoryName("");
          setQuickCategoryDescription("");
          setQuickCategoryCode("");
        }}
        title={t("materialTypes.form.quickCategory.title")}
        hint={t("materialTypes.form.quickCategory.hint")}
        onSubmit={handleQuickCreateCategory}
        loading={quickCategoryLoading}
        submitLabel={t("materialTypes.form.quickCategory.submitLabel")}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
              {t("materialTypes.form.quickCategory.nameLabel")} *
            </label>
            <input
              type="text"
              value={quickCategoryName}
              onChange={(e) => setQuickCategoryName(e.target.value)}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#222] rounded-xl text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all"
              placeholder={t("materialTypes.form.quickCategory.namePlaceholder")}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
              {t("materialCategories.form.categoryCode")} *
            </label>
            <input
              type="text"
              value={quickCategoryCode}
              onChange={(e) => {
                const filtered = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                setQuickCategoryCode(filtered);
              }}
              maxLength={10}
              className={`w-full px-4 py-3 bg-[#1a1a1a] border rounded-xl text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all ${
                quickCategoryCode && !validateCategoryCode(quickCategoryCode).isValid
                  ? "border-red-500 bg-red-500/10"
                  : "border-[#222]"
              }`}
              placeholder={t("materialCategories.form.codePlaceholder")}
              required
            />
            {quickCategoryCode && !validateCategoryCode(quickCategoryCode).isValid ? (
              <p className="text-red-400 text-xs mt-1">
                {t(validateCategoryCode(quickCategoryCode).message!)}
              </p>
            ) : (
              <p className="text-gray-500 text-xs mt-1">
                {t("materialCategories.form.codeHint")}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
              {t("materialTypes.form.quickCategory.descriptionLabel")} *
            </label>
            <textarea
              value={quickCategoryDescription}
              onChange={(e) => setQuickCategoryDescription(e.target.value)}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#222] rounded-xl text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all resize-none"
              placeholder={t("materialTypes.form.quickCategory.descriptionPlaceholder")}
              rows={3}
              required
            />
          </div>
        </div>
      </QuickCreateModal>

      {/* Internal Modal for New Attribute Creation */}
      {showAttributeForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-[#121212] border border-[#FFD700]/30 rounded-2xl max-w-xl w-full p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-xl font-black text-white italic tracking-tighter">
                {t("materialTypes.form.quickAttribute.titlePrefix")} <span className="text-[#FFD700]">{t("materialTypes.form.quickAttribute.titleHighlight")}</span> {t("materialTypes.form.quickAttribute.titleSuffix")}
              </h4>
              <IconButton
                icon={X}
                ariaLabel="Close"
                onClick={() => setShowAttributeForm(false)}
                intent="close"
              />
            </div>

            <MaterialAttributeForm
              onCancel={() => setShowAttributeForm(false)}
              onSubmit={handleCreateAttribute}
            />
          </div>
        </div>
      )}
    </div>
  );
};
