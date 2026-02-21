import { useState } from "react";
import { AlertCircle, Loader } from "lucide-react";
import type {
  CreateMaterialTypePayload,
  MaterialCategory,
} from "../../../../../types/api";

interface MaterialFormProps {
  categories: MaterialCategory[];
  onSubmit: (data: CreateMaterialTypePayload) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

export function MaterialForm({
  categories,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false,
}: MaterialFormProps) {
  const [formData, setFormData] = useState({
    categoryId: "",
    name: "",
    pricePerDay: 0,
    replacementCost: 0,
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.categoryId.trim())
      newErrors.categoryId = "Category is required";
    if (!formData.name.trim()) newErrors.name = "Material name is required";
    if (formData.pricePerDay < 0)
      newErrors.pricePerDay = "Price cannot be negative";
    if (formData.replacementCost && formData.replacementCost < 0)
      newErrors.replacementCost = "Replacement cost cannot be negative";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const numValue = type === "number" ? parseFloat(value) || 0 : value;

    setFormData((prev) => ({
      ...prev,
      [name]: numValue,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    try {
      const payload: CreateMaterialTypePayload = {
        categoryId: formData.categoryId,
        name: formData.name,
        pricePerDay: formData.pricePerDay,
        replacementCost: formData.replacementCost || undefined,
        description: formData.description || undefined,
      };

      await onSubmit(payload);
      resetForm();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to save material",
      );
    }
  };

  const resetForm = () => {
    setFormData({
      categoryId: "",
      name: "",
      pricePerDay: 0,
      replacementCost: 0,
      description: "",
    });
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg">
      {submitError && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          name="categoryId"
          value={formData.categoryId}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
            errors.categoryId ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>
        )}
      </div>

      {/* Material Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Material Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Aluminum Frame"
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
            errors.name ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price per Day <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="pricePerDay"
            value={formData.pricePerDay}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
              errors.pricePerDay ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.pricePerDay && (
            <p className="text-red-500 text-sm mt-1">{errors.pricePerDay}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Replacement Cost
          </label>
          <input
            type="number"
            name="replacementCost"
            value={formData.replacementCost}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
              errors.replacementCost ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.replacementCost && (
            <p className="text-red-500 text-sm mt-1">
              {errors.replacementCost}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Detailed description of the material..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end border-t pt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {isLoading && <Loader className="w-4 h-4 animate-spin" />}
          {isLoading
            ? "Saving..."
            : isEditing
              ? "Update Material"
              : "Create Material"}
        </button>
      </div>
    </form>
  );
}
