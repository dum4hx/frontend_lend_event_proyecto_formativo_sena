import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useToast } from "../../../../../contexts/ToastContext";
import { useLanguage } from "../../../../../contexts/useLanguage";
import type { CreateMaterialCategoryPayload } from "../../../../../types/api";
import { Button } from "../../../../../components/ui";
import { validateCategoryName, validateCategoryDescription } from "../../../../../utils/validators";
import { useMaterialAttributes } from "../../material-attributes/hooks/useMaterialAttributes";

interface CategoryFormProps {
  onSubmit: (data: CreateMaterialCategoryPayload) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateMaterialCategoryPayload> & { name?: string };
  isEditing?: boolean;
}

type CategoryFormField = "name" | "description";

export const CategoryForm: React.FC<CategoryFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<CreateMaterialCategoryPayload>({
    name: "",
    description: "",
    attributes: [],
  });
  const [touched, setTouched] = useState<Record<CategoryFormField, boolean>>({
    name: false,
    description: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedAttributes, setExpandedAttributes] = useState(false);
  const { showToast } = useToast();
  const { t } = useLanguage();
  const { attributes: availableAttributes, loading: attributesLoading } = useMaterialAttributes();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        attributes: initialData.attributes || [],
      });
    }
  }, [initialData]);

  const fieldErrors = useMemo(() => {
    const errors: Record<CategoryFormField, string | null> = {
      name: null,
      description: null,
    };

    if (touched.name) {
      const validation = validateCategoryName(formData.name);
      if (!validation.isValid) {
        errors.name = validation.message ?? "Invalid category name";
      }
    }

    if (touched.description) {
      const validation = validateCategoryDescription(formData.description);
      if (!validation.isValid) {
        errors.description = validation.message ?? "Invalid description";
      }
    }

    return errors;
  }, [formData, touched]);

  const isFormValid = useMemo(() => {
    const nameValidation = validateCategoryName(formData.name);
    const descriptionValidation = validateCategoryDescription(formData.description);
    return nameValidation.isValid && descriptionValidation.isValid;
  }, [formData]);

  const handleBlur = (field: CategoryFormField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  /**
   * Toggle attribute selection for a category
   */
  const toggleAttribute = (attributeId: string) => {
    setFormData((prev) => {
      const existingAttr = prev.attributes?.find((a) => a.attributeId === attributeId);
      if (existingAttr) {
        return {
          ...prev,
          attributes: prev.attributes?.filter((a) => a.attributeId !== attributeId) || [],
        };
      }
      return {
        ...prev,
        attributes: [...(prev.attributes || []), { attributeId, isRequired: false }],
      };
    });
  };

  /**
   * Toggle required flag for an attribute
   */
  const toggleAttributeRequired = (attributeId: string) => {
    setFormData((prev) => ({
      ...prev,
      attributes: (prev.attributes || []).map((a) =>
        a.attributeId === attributeId ? { ...a, isRequired: !a.isRequired } : a,
      ),
    }));
  };

  const selectedAttributeIds = new Set((formData.attributes || []).map((a) => a.attributeId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      name: true,
      description: true,
    });

    if (!isFormValid) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } catch (error) {
      const err = error as Error;
      showToast("error", err.message || t("materialCategories.toast.saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      data-help-id={isEditing ? "material-categories-form-edit" : "material-categories-form-create"}
    >
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {t("materialCategories.form.categoryName")} <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          data-help-id="material-categories-form-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          onBlur={() => handleBlur("name")}
          maxLength={100}
          className={`w-full px-4 py-3 bg-[#1a1a1a] border rounded-lg text-white focus:outline-none transition-colors ${
            touched.name && fieldErrors.name
              ? "border-red-500 focus:border-red-500"
              : "border-[#333] focus:border-[#FFD700]"
          }`}
          placeholder={t("materialCategories.form.namePlaceholder")}
          disabled={isSubmitting}
        />
        {touched.name && fieldErrors.name && (
          <p className="mt-1 text-sm text-red-400">{fieldErrors.name}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {t("materialCategories.form.charCount", {
            count: String(formData.name.length),
            max: "100",
          })}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {t("materialCategories.form.description")} <span className="text-red-400">*</span>
        </label>
        <textarea
          data-help-id="material-categories-form-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          onBlur={() => handleBlur("description")}
          maxLength={500}
          rows={4}
          className={`w-full px-4 py-3 bg-[#1a1a1a] border rounded-lg text-white focus:outline-none transition-colors resize-none ${
            touched.description && fieldErrors.description
              ? "border-red-500 focus:border-red-500"
              : "border-[#333] focus:border-[#FFD700]"
          }`}
          placeholder={t("materialCategories.form.descriptionPlaceholder")}
          disabled={isSubmitting}
        />
        {touched.description && fieldErrors.description && (
          <p className="mt-1 text-sm text-red-400">{fieldErrors.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {t("materialCategories.form.charCount", {
            count: String((formData.description ?? "").length),
            max: "500",
          })}
        </p>
      </div>

      {/* Attributes Selection Section */}
      <div
        className="border border-[#333] rounded-lg p-4"
        data-help-id="material-categories-form-attributes"
      >
        <button
          type="button"
          onClick={() => setExpandedAttributes(!expandedAttributes)}
          className="w-full flex items-center justify-between text-left hover:bg-[#1a1a1a]/50 p-2 rounded transition-colors"
        >
          <span className="text-sm font-medium text-gray-300">
            {t("materialCategories.form.availableAttributes")}
            {(formData.attributes || []).length > 0 && (
              <span className="ml-2 text-xs bg-[#FFD700] text-black px-2 py-1 rounded">
                {t("materialCategories.form.selectedCount", {
                  count: String((formData.attributes || []).length),
                })}
              </span>
            )}
          </span>
          <ChevronDown
            size={18}
            className={`transition-transform ${expandedAttributes ? "rotate-180" : ""}`}
          />
        </button>

        {expandedAttributes && (
          <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
            {attributesLoading ? (
              <p className="text-sm text-gray-400">
                {t("materialCategories.form.loadingAttributes")}
              </p>
            ) : availableAttributes.length === 0 ? (
              <p className="text-sm text-gray-400">
                {t("materialCategories.form.noAttributesAvailable")}
              </p>
            ) : (
              availableAttributes.map((attribute) => {
                const isSelected = selectedAttributeIds.has(attribute._id);
                const categoryAttr = (formData.attributes || []).find(
                  (a) => a.attributeId === attribute._id,
                );

                return (
                  <div
                    key={attribute._id}
                    className="flex items-center gap-3 p-3 bg-[#111] border border-[#222] rounded hover:border-[#333] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleAttribute(attribute._id)}
                      className="w-4 h-4 rounded cursor-pointer"
                      disabled={isSubmitting}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {attribute.name}
                        {attribute.unit && (
                          <span className="text-gray-500 ml-2">({attribute.unit})</span>
                        )}
                      </p>
                      {attribute.allowedValues && attribute.allowedValues.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t("materialCategories.form.valuesLabel", {
                            values: attribute.allowedValues.join(", "),
                          })}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={categoryAttr?.isRequired ?? false}
                          onChange={() => toggleAttributeRequired(attribute._id)}
                          className="w-4 h-4 rounded cursor-pointer"
                          disabled={isSubmitting}
                          title={t("materialCategories.form.markRequiredTitle")}
                        />
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {t("materialCategories.form.required")}
                        </span>
                      </label>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting || !isFormValid}
          data-help-id="material-categories-form-submit"
          className="flex-1"
        >
          {isSubmitting
            ? isEditing
              ? t("materialCategories.form.updating")
              : t("materialCategories.form.creating")
            : isEditing
              ? t("materialCategories.form.updateCategory")
              : t("materialCategories.form.createCategory")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
          data-help-id="material-categories-form-cancel"
        >
          {t("materialCategories.form.cancel")}
        </Button>
      </div>
    </form>
  );
};
