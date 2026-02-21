import { useEffect, useState } from "react";
import type {
  CreateMaterialTypePayload,
  MaterialCategory,
  MaterialType,
  UpdateMaterialTypePayload,
} from "../../../../../types/api";

interface MaterialTypeFormProps {
  models: MaterialCategory[];
  initialType?: MaterialType | null;
  isLoading?: boolean;
  onCancel: () => void;
  onSubmit: (
    payload: CreateMaterialTypePayload | UpdateMaterialTypePayload,
  ) => Promise<void>;
}

interface MaterialTypeFormState {
  name: string;
  description: string;
  categoryId: string;
  pricePerDay: number;
  replacementCost: number;
}

export function MaterialTypeForm({
  models,
  initialType,
  isLoading = false,
  onCancel,
  onSubmit,
}: MaterialTypeFormProps) {
  const [formData, setFormData] = useState<MaterialTypeFormState>({
    name: "",
    description: "",
    categoryId: "",
    pricePerDay: 0,
    replacementCost: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialType) {
      setFormData({
        name: initialType.name,
        description: initialType.description ?? "",
        categoryId: initialType.categoryId,
        pricePerDay: initialType.pricePerDay,
        replacementCost: initialType.replacementCost ?? 0,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        categoryId: "",
        pricePerDay: 0,
        replacementCost: 0,
      });
    }
    setErrors({});
  }, [initialType]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.categoryId.trim()) newErrors.categoryId = "Model is required";
    if (formData.pricePerDay < 0) newErrors.pricePerDay = "Price cannot be negative";
    if (formData.replacementCost < 0)
      newErrors.replacementCost = "Replacement cost cannot be negative";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const parsedValue = type === "number" ? parseFloat(value) || 0 : value;
    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[name];
        return nextErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      categoryId: formData.categoryId,
      pricePerDay: formData.pricePerDay,
      replacementCost: formData.replacementCost || undefined,
    };

    await onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-[#121212] border border-[#333] rounded-lg p-6"
    >
      <div>
        <label className="block text-gray-400 text-sm font-medium mb-2">
          Type Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Speaker"
          className={`w-full px-3 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
            errors.name ? "border-red-500" : "border-[#333]"
          }`}
        />
        {errors.name && (
          <p className="text-red-400 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-gray-400 text-sm font-medium mb-2">
          Model <span className="text-red-500">*</span>
        </label>
        <select
          name="categoryId"
          value={formData.categoryId}
          onChange={handleChange}
          className={`w-full px-3 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
            errors.categoryId ? "border-red-500" : "border-[#333]"
          }`}
        >
          <option value="">Select a model</option>
          {models.map((model) => (
            <option key={model._id} value={model._id}>
              {model.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p className="text-red-400 text-sm mt-1">{errors.categoryId}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-400 text-sm font-medium mb-2">
            Price per Day
          </label>
          <input
            type="number"
            name="pricePerDay"
            value={formData.pricePerDay}
            onChange={handleChange}
            step="0.01"
            min="0"
            className={`w-full px-3 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
              errors.pricePerDay ? "border-red-500" : "border-[#333]"
            }`}
          />
          {errors.pricePerDay && (
            <p className="text-red-400 text-sm mt-1">{errors.pricePerDay}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-400 text-sm font-medium mb-2">
            Replacement Cost
          </label>
          <input
            type="number"
            name="replacementCost"
            value={formData.replacementCost}
            onChange={handleChange}
            step="0.01"
            min="0"
            className={`w-full px-3 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
              errors.replacementCost ? "border-red-500" : "border-[#333]"
            }`}
          />
          {errors.replacementCost && (
            <p className="text-red-400 text-sm mt-1">{errors.replacementCost}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-gray-400 text-sm font-medium mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          placeholder="Short description"
          className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white focus:outline-none focus:border-[#FFD700]"
        />
      </div>

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
          className="flex-1 px-4 py-2 bg-[#FFD700] text-black font-bold rounded hover:bg-yellow-400 transition disabled:opacity-50"
        >
          {isLoading ? "Saving..." : initialType ? "Update Type" : "Create Type"}
        </button>
      </div>
    </form>
  );
}
