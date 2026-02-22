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
    pricePerDay: "",
    replacementCost: "",
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formatCop = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 2,
    }).format(value);

  const parseNumberInput = (value: string) => {
    const cleaned = value.replace(/[^0-9.,]/g, "");
    return cleaned.replace(",", ".");
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.categoryId.trim())
      newErrors.categoryId = "Category is required";
    if (!formData.name.trim()) newErrors.name = "Material name is required";
    if (!formData.pricePerDay.trim()) {
      newErrors.pricePerDay = "Price per day is required";
    } else if (Number.parseFloat(formData.pricePerDay) < 0) {
      newErrors.pricePerDay = "Price cannot be negative";
    }
    if (
      formData.replacementCost.trim() &&
      Number.parseFloat(formData.replacementCost) < 0
    ) {
      newErrors.replacementCost = "Replacement cost cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    const nextValue =
      name === "pricePerDay" || name === "replacementCost"
        ? parseNumberInput(value)
        : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
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
        pricePerDay: Number.parseFloat(formData.pricePerDay),
        replacementCost: formData.replacementCost
          ? Number.parseFloat(formData.replacementCost)
          : undefined,
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
      pricePerDay: "",
      replacementCost: "",
      description: "",
    });
    setErrors({});
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-[#121212] border border-[#333] p-6 rounded-lg"
    >
      {submitError && (
        <div className="flex gap-3 p-4 bg-red-900/30 border border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-200 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{submitError}</p>
        </div>
      )}

      {/* Category Selection */}
      <div>
        <label className="block text-gray-400 text-sm font-medium mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          name="categoryId"
          value={formData.categoryId}
          onChange={handleChange}
          className={`w-full px-3 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
            errors.categoryId ? "border-red-500" : "border-[#333]"
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
          <p className="text-red-400 text-sm mt-1">{errors.categoryId}</p>
        )}
      </div>

      {/* Material Name */}
      <div>
        <label className="block text-gray-400 text-sm font-medium mb-2">
          Material Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Aluminum Frame"
          className={`w-full px-3 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
            errors.name ? "border-red-500" : "border-[#333]"
          }`}
        />
        {errors.name && (
          <p className="text-red-400 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-400 text-sm font-medium mb-2">
            Price per Day <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="pricePerDay"
            value={formData.pricePerDay}
            onChange={handleChange}
            placeholder="$ 0"
            inputMode="decimal"
            className={`w-full px-3 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
              errors.pricePerDay ? "border-red-500" : "border-[#333]"
            }`}
          />
          {formData.pricePerDay.trim() && !errors.pricePerDay && (
            <p className="text-gray-500 text-xs mt-1">
              {formatCop(Number.parseFloat(formData.pricePerDay))}
            </p>
          )}
          {errors.pricePerDay && (
            <p className="text-red-400 text-sm mt-1">{errors.pricePerDay}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-400 text-sm font-medium mb-2">
            Replacement Cost
          </label>
          <input
            type="text"
            name="replacementCost"
            value={formData.replacementCost}
            onChange={handleChange}
            placeholder="$ 0"
            inputMode="decimal"
            className={`w-full px-3 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
              errors.replacementCost ? "border-red-500" : "border-[#333]"
            }`}
          />
          {formData.replacementCost.trim() && !errors.replacementCost && (
            <p className="text-gray-500 text-xs mt-1">
              {formatCop(Number.parseFloat(formData.replacementCost))}
            </p>
          )}
          {errors.replacementCost && (
            <p className="text-red-400 text-sm mt-1">
              {errors.replacementCost}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-gray-400 text-sm font-medium mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Detailed description of the material..."
          rows={4}
          className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#FFD700] text-black font-bold rounded hover:bg-yellow-400 transition disabled:opacity-50"
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
