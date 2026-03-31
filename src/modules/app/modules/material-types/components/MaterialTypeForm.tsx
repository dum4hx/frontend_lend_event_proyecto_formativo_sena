import React, { useState, useEffect, useMemo } from "react";
import { X, Plus, Info } from "lucide-react";
import { useToast } from "../../../../../contexts/ToastContext";
import { useMaterialAttributes } from "../../material-attributes/hooks/useMaterialAttributes";
import { MaterialAttributeForm } from "../../material-attributes/components/AttributeForm";
import type {
  CreateMaterialTypePayload,
  MaterialCategory,
  MaterialType,
} from "../../../../../types/api";
import { Button, IconButton } from "../../../../../components/ui";

interface MaterialTypeFormProps {
  categories: MaterialCategory[];
  onSubmit: (data: CreateMaterialTypePayload) => Promise<void>;
  onCancel: () => void;
  initialData?: MaterialType | (Partial<CreateMaterialTypePayload> & { name?: string });
  isEditing?: boolean;
  title?: string;
}

export const MaterialTypeForm: React.FC<MaterialTypeFormProps> = ({
  categories,
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  title = isEditing ? "Update Material Type" : "Create Material Type",
}) => {
  const [formData, setFormData] = useState<CreateMaterialTypePayload>({
    name: "",
    description: "",
    categoryId: [],
    pricePerDay: 0,
    attributes: [],
  });
  const [priceDisplay, setPriceDisplay] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAttributeForm, setShowAttributeForm] = useState(false);

  const { showToast } = useToast();
  const { attributes: allAttributes } = useMaterialAttributes();

  // Get all selected categories
  const selectedCategories = useMemo(
    () =>
      categories.filter((c) =>
        (Array.isArray(formData.categoryId) ? formData.categoryId : []).includes(c._id),
      ),
    [formData.categoryId, categories],
  );

  const categoryAttributeIds = useMemo(
    () => {
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
    },
    [selectedCategories],
  );

  // Available attributes filtered to only those in the selected categories
  const categoryAttributes = useMemo(
    () =>
      allAttributes
        .filter((attr) => categoryAttributeIds.has(attr._id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allAttributes, categoryAttributeIds],
  );

  const formatCop = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  useEffect(() => {
    if (initialData) {
      let categoryIds: string[] = [];
      
      if (Array.isArray(initialData.categoryId)) {
        categoryIds = initialData.categoryId
          .map((cat) =>
            typeof cat === "string" ? cat : (cat as { _id?: string })?._id,
          )
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
        name: initialData.name || "",
        description: initialData.description || "",
        categoryId: categoryIds,
        pricePerDay: initialData.pricePerDay || 0,
        attributes: (initialData as MaterialType).attributes || [],
      });
      if (initialData.pricePerDay) {
        setPriceDisplay(formatCop(initialData.pricePerDay));
      } else {
        setPriceDisplay("");
      }
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("error", "Material name is required");
      return;
    }
    if (!(formData.description || "").trim()) {
      showToast("error", "Description is required");
      return;
    }
    if (!Array.isArray(formData.categoryId) || formData.categoryId.length === 0) {
      showToast("error", "At least one category is required");
      return;
    }
    if (formData.pricePerDay <= 0) {
      showToast("error", "Price per day must be greater than 0");
      return;
    }

    // Validate required attributes have values
    const requiredAttrs = selectedCategories.flatMap((cat) =>
      cat.attributes?.filter((a) => a.isRequired) || [],
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
        `Required attributes missing values: ${missingRequired.map((a) => attributeNameMap.get(a.attributeId) || a.attributeId).join(", ")}`,
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData as CreateMaterialTypePayload);
    } catch (error) {
      const err = error as Error & { details?: { errors?: Array<{ message: string }> } };
      console.error("Error saving material type:", err);
      const errorMessage =
        err.details?.errors?.[0]?.message || err.message || "Error saving material type";
      showToast("error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAttribute = async () => {
    try {
      // After creating, the attribute is auto-added to the organization
      // Will be available for next category that includes it
      showToast("success", "Attribute created successfully");
      setShowAttributeForm(false);
    } catch (err) {
      showToast("error", (err as Error).message || "Failed to create attribute");
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
              {title.split(" ").slice(0, -2).join(" ")}{" "}
              <span className="text-[#FFD700]">{title.split(" ").slice(-2).join(" ")}</span>
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Configure catalog items, pricing, and dynamic specifications.
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
          <form id="material-type-form" onSubmit={handleSubmit} className="space-y-10">
            {/* Basic Info Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-1 h-6 bg-[#FFD700] rounded-full shadow-[0_0_8px_#FFD700]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                  General Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
                    Categories *
                  </label>
                  <select
                    multiple
                    value={Array.isArray(formData.categoryId) ? formData.categoryId : []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                      setFormData({ ...formData, categoryId: selected });
                    }}
                    className="w-full px-5 py-4 bg-[#1a1a1a] border border-[#222] rounded-xl text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
                    Material Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-4 bg-[#1a1a1a] border border-[#222] rounded-xl text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all"
                    placeholder="e.g., LED Panel 50W"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
                    Daily Price (COP) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={priceDisplay}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        const numericValue = raw ? parseInt(raw, 10) : 0;
                        setFormData({ ...formData, pricePerDay: numericValue });
                        setPriceDisplay(raw ? formatCop(numericValue) : "");
                      }}
                      className="w-full px-5 py-4 bg-[#1a1a1a] border border-[#222] rounded-xl text-[#FFD700] font-mono text-lg focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all"
                      placeholder="$ 0"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-5 py-4 bg-[#1a1a1a] border border-[#222] rounded-xl text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all"
                    placeholder="Brief details about the material..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Attributes Section */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-1 h-6 bg-[#FFD700] rounded-full shadow-[0_0_8px_#FFD700]" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                    Technical Specifications
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAttributeForm(true)}
                  className="bg-[#1a1a1a] border-[#333] text-gray-300 hover:text-white hover:border-[#FFD700] transition-all"
                >
                  <Plus size={16} className="mr-2" />
                  New Attribute
                </Button>
              </div>

              {!Array.isArray(formData.categoryId) || formData.categoryId.length === 0 ? (
                <div className="bg-[#1a1a1a]/50 border border-dashed border-[#333] rounded-2xl p-10 text-center">
                  <Info className="w-10 h-10 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    Select at least one category to manage specific attributes.
                  </p>
                </div>
              ) : categoryAttributes.length === 0 ? (
                <div className="bg-[#1a1a1a]/50 border border-dashed border-[#333] rounded-2xl p-10 text-center">
                  <Info className="w-10 h-10 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    This category has no attributes. Create one or add to the category.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categoryAttributes.map((attr) => {
                    const currentValue = currentAttributeValues.get(attr._id);
                    const isSelected = !!currentValue;
                    
                    // Get all categories that require this attribute
                    const requiringCategories = selectedCategories.filter((cat) =>
                      cat.attributes?.find(
                        (ca) => ca.attributeId === attr._id && ca.isRequired,
                      ),
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
                                    Required
                                  </span>
                                )}
                              </label>
                            </div>

                            {isRequired && requiringCategories.length > 0 && (
                              <p className="text-xs text-gray-400 ml-6 mb-3">
                                Required by: {requiringCategories.map((c) => c.name).join(", ")}
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
                                    <option value="">-- Select value --</option>
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
                                    placeholder={`Enter ${attr.name}...`}
                                    className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#FFD700]"
                                    disabled={isSubmitting}
                                  />
                                )}
                                {isRequired && !currentValue?.value && (
                                  <p className="text-xs text-red-400">This attribute is required</p>
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
            className="px-8 border-[#333] text-gray-400 hover:text-white"
          >
            Discard Changes
          </Button>
          <Button
            form="material-type-form"
            type="submit"
            loading={isSubmitting}
            className="px-10 bg-[#FFD700] text-black font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]"
          >
            {isEditing ? "Update Item" : "Save Entry"}
          </Button>
        </div>
      </div>

      {/* Internal Modal for New Attribute Creation */}
      {showAttributeForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-[#121212] border border-[#FFD700]/30 rounded-2xl max-w-xl w-full p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-xl font-black text-white italic tracking-tighter">
                Quick <span className="text-[#FFD700]">Attribute</span> Setup
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
