import { useEffect, useState } from "react";
import type {
  CreateMaterialCategoryPayload,
  MaterialCategory,
  UpdateMaterialCategoryPayload,
} from "../../../../../types/api";

interface MaterialModelFormProps {
  initialModel?: MaterialCategory | null;
  isLoading?: boolean;
  onCancel: () => void;
  onSubmit: (
    payload: CreateMaterialCategoryPayload | UpdateMaterialCategoryPayload,
  ) => Promise<void>;
}

export function MaterialModelForm({
  initialModel,
  isLoading = false,
  onCancel,
  onSubmit,
}: MaterialModelFormProps) {
  const [formData, setFormData] = useState<CreateMaterialCategoryPayload>({
    name: "",
    description: "",
    parentId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialModel) {
      setFormData({
        name: initialModel.name,
        description: initialModel.description ?? "",
        parentId: "",
      });
    } else {
      setFormData({ name: "", description: "", parentId: "" });
    }
    setErrors({});
  }, [initialModel]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
          Model Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Electronic"
          className={`w-full px-3 py-2 bg-[#1a1a1a] border rounded text-white focus:outline-none focus:border-[#FFD700] ${
            errors.name ? "border-red-500" : "border-[#333]"
          }`}
        />
        {errors.name && (
          <p className="text-red-400 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      {/* Parent removed from Material Models */}

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
          {isLoading ? "Saving..." : initialModel ? "Update Model" : "Create Model"}
        </button>
      </div>
    </form>
  );
}
