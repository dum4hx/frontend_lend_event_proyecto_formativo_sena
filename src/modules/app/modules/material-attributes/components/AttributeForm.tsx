import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { useToast } from "../../../../../contexts/ToastContext";
import type {
  CreateMaterialAttributePayload,
  MaterialAttribute,
  MaterialCategory,
} from "../../../../../types/api";

interface MaterialAttributeFormProps {
  categories: MaterialCategory[];
  onSubmit: (data: CreateMaterialAttributePayload) => Promise<void>;
  onCancel: () => void;
  initialData?: MaterialAttribute;
  isEditing?: boolean;
}

export const MaterialAttributeForm: React.FC<MaterialAttributeFormProps> = ({
  categories,
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<CreateMaterialAttributePayload>({
    name: "",
    unit: "",
    categoryId: "",
    allowedValues: [],
    isRequired: false,
  });
  const [newValue, setNewValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        unit: initialData.unit,
        categoryId: initialData.categoryId || "",
        allowedValues: initialData.allowedValues || [],
        isRequired: initialData.isRequired || false,
      });
    }
  }, [initialData]);

  const handleAddValue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    if (formData.allowedValues?.includes(newValue.trim())) {
      showToast("error", "Value already exists");
      return;
    }
    setFormData({
      ...formData,
      allowedValues: [...(formData.allowedValues || []), newValue.trim()],
    });
    setNewValue("");
  };

  const removeValue = (valueToRemove: string) => {
    setFormData({
      ...formData,
      allowedValues: (formData.allowedValues || []).filter((v: string) => v !== valueToRemove),
    });
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("error", "Attribute name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error saving material attribute";
      showToast("error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Attribute Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
            placeholder="e.g., RAM, Weight, Color"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Unit of Measurement
          </label>
          <input
            type="text"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
            placeholder="e.g., GB, kg, Type (Optional)"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Category (Restricts attribute to this category)
        </label>
        <select
          value={formData.categoryId}
          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
        >
          <option value="">Global (All categories)</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Allowed Values (Leave empty for free text/number)
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddValue(e)}
            className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
            placeholder="Add allowed value..."
          />
          <button
            type="button"
            onClick={handleAddValue}
            className="px-4 py-2 bg-[#333] text-white rounded-lg hover:bg-[#444] transition-all"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-[#121212] border border-[#333] rounded-lg">
          {formData.allowedValues?.map((val: string) => (
            <span
              key={val}
              className="flex items-center gap-1 px-3 py-1 bg-[#222] border border-[#444] text-gray-300 rounded-full text-xs"
            >
              {val}
              <button type="button" onClick={() => removeValue(val)} className="hover:text-red-400">
                <X size={14} />
              </button>
            </span>
          ))}
          {(!formData.allowedValues || formData.allowedValues.length === 0) && (
            <span className="text-gray-600 text-xs italic">No restricted values defined</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isRequired"
          checked={formData.isRequired}
          onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
          className="w-5 h-5 rounded border-[#333] bg-[#1a1a1a] text-[#FFD700] focus:ring-[#FFD700]"
        />
        <label htmlFor="isRequired" className="text-sm font-medium text-gray-300 cursor-pointer">
          Required for material types
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-[#333] text-gray-400 rounded-lg hover:bg-[#121212] transition-all"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-[#FFD700] text-black rounded-lg font-bold hover:bg-[#FFC700] disabled:opacity-50 transition-all flex items-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : isEditing ? "Update Attribute" : "Create Attribute"}
        </button>
      </div>
    </form>
  );
};
