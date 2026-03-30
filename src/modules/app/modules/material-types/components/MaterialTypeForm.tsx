import React, { useState, useEffect } from "react";
import { X, Plus, Info } from "lucide-react";
import { useToast } from "../../../../../contexts/ToastContext";
import { useMaterialAttributes } from "../../material-attributes/hooks/useMaterialAttributes";
import { MaterialAttributeForm } from "../../material-attributes/components/AttributeForm";
import type {
  CreateMaterialTypePayload,
  MaterialCategory,
  CreateMaterialAttributePayload,
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
    categoryId: "",
    pricePerDay: 0,
  });
  const [priceDisplay, setPriceDisplay] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAttributeForm, setShowAttributeForm] = useState(false);

  // Local state for related attributes (since API integration placeholder is requested)
  const [relatedAttributes, setRelatedAttributes] = useState<
    Array<{
      attributeId: string;
      isRequired: boolean;
    }>
  >([]);

  const { showToast } = useToast();
  const {
    attributes,
    addAttribute,
    loading: loadingAttrs,
  } = useMaterialAttributes(formData.categoryId);

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
      const categoryIdFromArray = Array.isArray(initialData.categoryId)
        ? (initialData.categoryId[0] as { _id?: string } | undefined)?._id
        : undefined;
      const categoryIdValue =
        typeof initialData.categoryId === "string"
          ? initialData.categoryId
          : categoryIdFromArray ||
            (initialData as { categoryId?: { _id?: string } }).categoryId?._id ||
            (initialData as { category?: { _id?: string } }).category?._id ||
            "";

      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        categoryId: categoryIdValue,
        pricePerDay: initialData.pricePerDay || 0,
      });
      if (initialData.pricePerDay) {
        setPriceDisplay(formatCop(initialData.pricePerDay));
      } else {
        setPriceDisplay("");
      }

      // Load existing attributes if any (Placeholder for when initialData has them)
      const dataAsType = initialData as MaterialType;
      // Note: Backend might not return isRequired in the materialType.attributes array,
      // but we use it for the local UI state.
      if (dataAsType && dataAsType.attributes) {
        setRelatedAttributes(
          dataAsType.attributes.map((a) => ({
            attributeId: a.attributeId,
            isRequired: (a as { isRequired?: boolean }).isRequired ?? false,
          })),
        );
      }
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("error", "Material name is required");
      return;
    }
    if (!formData.categoryId) {
      showToast("error", "Category is required");
      return;
    }
    if (formData.pricePerDay <= 0) {
      showToast("error", "Price per day must be greater than 0");
      return;
    }

    try {
      setIsSubmitting(true);

      // Integration Placeholder:
      // The API payload might need to include relatedAttributes
      const finalPayload = {
        ...formData,
        // attributes: relatedAttributes, // Uncomment when API supports this
      };

      console.log("Submitting material type:", finalPayload);
      await onSubmit(finalPayload as CreateMaterialTypePayload);
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

  const handleCreateAttribute = async (attrPayload: CreateMaterialAttributePayload) => {
    try {
      // Ensure attribute is linked to the current category if not already
      const payload = { ...attrPayload, categoryId: formData.categoryId };
      const newAttr = await addAttribute(payload);

      // Auto-relate the newly created attribute
      setRelatedAttributes((prev) => [
        ...prev,
        { attributeId: newAttr._id, isRequired: !!newAttr.isRequired },
      ]);

      setShowAttributeForm(false);
      showToast("success", "Attribute created and linked successfully");
    } catch (err) {
      showToast("error", (err as Error).message || "Failed to create attribute");
    }
  };

  const toggleAttributeRelation = (attrId: string) => {
    setRelatedAttributes((prev) => {
      const exists = prev.find((a) => a.attributeId === attrId);
      if (exists) {
        return prev.filter((a) => a.attributeId !== attrId);
      } else {
        const attr = attributes.find((a) => a._id === attrId);
        return [...prev, { attributeId: attrId, isRequired: !!attr?.isRequired }];
      }
    });
  };

  const toggleAttributeRequired = (attrId: string) => {
    setRelatedAttributes((prev) =>
      prev.map((a) => (a.attributeId === attrId ? { ...a, isRequired: !a.isRequired } : a)),
    );
  };

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
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-5 py-4 bg-[#1a1a1a] border border-[#222] rounded-xl text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all"
                    required
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
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
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-5 py-4 bg-[#1a1a1a] border border-[#222] rounded-xl text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all"
                    placeholder="Brief details about the material..."
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
                  disabled={!formData.categoryId}
                  className="bg-[#1a1a1a] border-[#333] text-gray-300 hover:text-white hover:border-[#FFD700] transition-all"
                >
                  <Plus size={16} className="mr-2" />
                  New Attribute
                </Button>
              </div>

              {!formData.categoryId ? (
                <div className="bg-[#1a1a1a]/50 border border-dashed border-[#333] rounded-2xl p-10 text-center">
                  <Info className="w-10 h-10 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    Select a category first to manage specific attributes.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {attributes.map((attr) => {
                    const relation = relatedAttributes.find((ra) => ra.attributeId === attr._id);
                    const isSelected = !!relation;

                    return (
                      <div
                        key={attr._id}
                        onClick={() => toggleAttributeRelation(attr._id)}
                        className={`group cursor-pointer p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? "bg-[#FFD700]/5 border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.05)]"
                            : "bg-[#1a1a1a] border-[#222] hover:border-[#444]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold transition-colors ${isSelected ? "text-[#FFD700]" : "text-gray-400 group-hover:text-gray-200"}`}
                          >
                            {attr.name}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              isSelected ? "bg-[#FFD700] border-[#FFD700]" : "border-[#444]"
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                          </div>
                        </div>

                        {isSelected && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAttributeRequired(attr._id);
                            }}
                            className="flex items-center space-x-2 pt-2 border-t border-[#FFD700]/20"
                          >
                            <div
                              className={`w-3 h-3 rounded-sm border transition-all ${relation.isRequired ? "bg-[#FFD700] border-[#FFD700]" : "border-[#444]"}`}
                            />
                            <span className="text-[10px] text-gray-500 uppercase tracking-tighter">
                              Mark as Required
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {attributes.length === 0 && !loadingAttrs && (
                    <div className="col-span-full py-6 text-center text-gray-500 text-xs italic">
                      No attributes found for this category.
                    </div>
                  )}
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
              categories={categories.filter((c) => c._id === formData.categoryId)}
              onCancel={() => setShowAttributeForm(false)}
              onSubmit={handleCreateAttribute}
            />
          </div>
        </div>
      )}
    </div>
  );
};
